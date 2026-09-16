import crypto from 'crypto'
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import CertificateDeskSettings from '@/conference-backend-core/lib/models/CertificateDeskSettings'

/**
 * Desk sessions for volunteers who have no admin account.
 *
 * A desk enters a shared code once, gets an HMAC-signed token, and sends it on
 * every scan. The token carries the code VERSION, so rotating the code in the
 * admin panel invalidates every desk in one write without touching the tokens.
 *
 * The desk token deliberately grants LESS than an admin login: it can scan,
 * undo its OWN scans, and read counts. It cannot read the roster or export,
 * because those carry delegate emails — those stay behind requireCertificateStaff.
 */

const TOKEN_TTL_MS = 3 * 24 * 60 * 60 * 1000 // a conference weekend
const SETTINGS_TTL_MS = 5000 // so a rotation propagates across serverless instances quickly

/** Unambiguous alphabet: no I/O/0/1, which are misread when written on a sign. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET is not set — desk tokens cannot be signed')
  return s
}

const b64url = (b: Buffer) => b.toString('base64url')
const normalise = (code: string) => String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')

export function generateDeskCode(): string {
  const bytes = crypto.randomBytes(10)
  const body = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
  // Grouped for readability when read aloud or written on a card.
  return `${body.slice(0, 5)}-${body.slice(5, 10)}`
}

function hashCode(code: string, salt: string): string {
  return crypto.scryptSync(normalise(code), salt, 32).toString('hex')
}

/* ------------------------------------------------------------- settings */

let cache: { at: number; doc: any } | null = null

export async function getDeskSettings(force = false) {
  if (!force && cache && Date.now() - cache.at < SETTINGS_TTL_MS) return cache.doc
  await connectDB()
  const doc = await CertificateDeskSettings.findOneAndUpdate(
    { singleton: 'desk' },
    { $setOnInsert: { singleton: 'desk' } },
    { new: true, upsert: true }
  ).lean()
  cache = { at: Date.now(), doc }
  return doc
}

/** Returns the plain code ONCE. It is never recoverable afterwards. */
export async function rotateDeskCode(rotatedBy: string): Promise<string> {
  await connectDB()
  const code = generateDeskCode()
  const salt = crypto.randomBytes(16).toString('hex')
  await CertificateDeskSettings.findOneAndUpdate(
    { singleton: 'desk' },
    {
      $set: {
        codeHash: hashCode(code, salt),
        codeSalt: salt,
        codeHint: normalise(code).slice(-2),
        enabled: true,
        rotatedAt: new Date(),
        rotatedBy,
      },
      $inc: { codeVersion: 1 },
    },
    { new: true, upsert: true }
  )
  cache = null
  return code
}

export async function setDeskEnabled(enabled: boolean) {
  await connectDB()
  await CertificateDeskSettings.findOneAndUpdate({ singleton: 'desk' }, { $set: { enabled } }, { upsert: true })
  cache = null
}

/* ---------------------------------------------------------------- tokens */

interface TokenPayload {
  desk: string
  v: number
  iat: number
}

export function signDeskToken(deskName: string, codeVersion: number): string {
  const payload: TokenPayload = { desk: deskName, v: codeVersion, iat: Date.now() }
  const body = b64url(Buffer.from(JSON.stringify(payload)))
  const sig = b64url(crypto.createHmac('sha256', secret()).update(body).digest())
  return `${body}.${sig}`
}

function readToken(token: string): TokenPayload | null {
  const [body, sig] = String(token ?? '').split('.')
  if (!body || !sig) return null
  const expected = b64url(crypto.createHmac('sha256', secret()).update(body).digest())
  // Constant-time compare; lengths must match first or timingSafeEqual throws.
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload
    if (!payload?.desk || typeof payload.v !== 'number') return null
    if (Date.now() - payload.iat > TOKEN_TTL_MS) return null
    return payload
  } catch {
    return null
  }
}

/* -------------------------------------------------------------- join/guard */

/** Slow a wrong code down without any shared infrastructure. */
const failures = new Map<string, { n: number; at: number }>()

export async function verifyDeskCode(code: string, ip: string): Promise<{ ok: true; version: number } | { ok: false; message: string }> {
  const settings = await getDeskSettings(true)
  if (!settings?.codeHash) return { ok: false, message: 'No desk code has been set yet — ask the admin to generate one' }
  if (!settings.enabled) return { ok: false, message: 'Desk scanning is currently disabled' }

  const rec = failures.get(ip)
  if (rec && Date.now() - rec.at < 60_000 && rec.n >= 5) {
    return { ok: false, message: 'Too many wrong codes — wait a minute and try again' }
  }

  const candidate = hashCode(code, settings.codeSalt)
  const stored = settings.codeHash
  const match = candidate.length === stored.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(stored))
  if (!match) {
    failures.set(ip, { n: (rec && Date.now() - rec.at < 60_000 ? rec.n : 0) + 1, at: Date.now() })
    return { ok: false, message: 'That code is not right' }
  }
  failures.delete(ip)
  return { ok: true, version: settings.codeVersion }
}

export type DeskAuth = { desk: string; error?: undefined } | { desk?: undefined; error: NextResponse }

const deny = (message: string, status = 401) =>
  NextResponse.json({ success: false, message, deskAuth: 'required' }, { status })

/** Guard for every desk-facing route. Reads the token from x-desk-token. */
export async function requireDesk(request: Request): Promise<DeskAuth> {
  const payload = readToken(request.headers.get('x-desk-token') ?? '')
  if (!payload) return { error: deny('Desk session expired — enter the desk code again') }

  const settings = await getDeskSettings()
  if (!settings?.enabled) return { error: deny('Desk scanning has been disabled', 403) }
  if (payload.v !== settings.codeVersion) {
    return { error: deny('The desk code has changed — enter the new code') }
  }
  return { desk: payload.desk }
}
