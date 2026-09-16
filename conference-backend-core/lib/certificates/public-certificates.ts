import crypto from 'crypto'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Abstract from '@/lib/models/Abstract'
import CertificateTemplate from '../models/CertificateTemplate'
import { conferenceConfig } from '../../config/conference.config'
import { parseScan } from '../certificate-desk/ids'
import { renderSpotCertificate, toBytes } from './spot-render'
import { toTemplateDTO, type TemplateDTO } from './templates'
import {
  CERTIFICATE_KINDS,
  CERTIFICATE_LABELS,
  ELIGIBLE_ABSTRACT_STATUSES,
  TEMPLATE_NAME_BY_KIND,
  certificateName,
  isCertificateKind,
  isEligibleRegistrant,
  type CertificateKind,
} from './public-eligibility'

const USER_FIELDS = 'email role profile.title profile.firstName profile.lastName registration.registrationId registration.status'

const NOT_FOUND_MESSAGE = `We couldn't find certificates for that registration ID or email. Check that it matches your registration, or write to ${conferenceConfig.contact.email}.`

/* -------------------------------------------------------------- templates */

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Template layouts rarely change; re-read them at most once a minute per instance.
const META_TTL_MS = 60_000
const metaCache = new Map<CertificateKind, { at: number; template: TemplateDTO | null }>()
// PDF bytes keyed by id + updatedAt, so an edited template is fetched fresh.
const pdfCache = new Map<string, Uint8Array>()

async function templateFor(kind: CertificateKind): Promise<TemplateDTO | null> {
  const hit = metaCache.get(kind)
  if (hit && Date.now() - hit.at < META_TTL_MS) return hit.template
  const doc = await CertificateTemplate.findOne({
    name: { $regex: `^\\s*${escapeRegex(TEMPLATE_NAME_BY_KIND[kind])}\\s*$`, $options: 'i' },
  })
    .sort({ updatedAt: -1 })
    .lean()
  const template = doc ? toTemplateDTO(doc) : null
  metaCache.set(kind, { at: Date.now(), template })
  return template
}

async function templatePdf(template: TemplateDTO): Promise<Uint8Array | null> {
  const key = `${template.id}:${template.updatedAt}`
  const cached = pdfCache.get(key)
  if (cached) return cached
  const doc = await CertificateTemplate.findById(template.id).select('+pdf')
  if (!doc?.pdf) return null
  const bytes = toBytes(doc.pdf)
  for (const k of pdfCache.keys()) if (k.startsWith(`${template.id}:`)) pdfCache.delete(k)
  pdfCache.set(key, bytes)
  return bytes
}

/** Poster and paper templates that print the abstract title or ID yield one certificate per abstract. */
const printsAbstract = (template: TemplateDTO) =>
  template.fields.some((f) => f.enabled && (f.key === 'title' || f.key === 'abstractId'))

/* ----------------------------------------------------------------- tokens */

// Long enough that a page left open over lunch still downloads.
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000

interface DownloadToken {
  u: string // user id
  k: CertificateKind
  a: string // abstract id, '' when the certificate isn't per abstract
  e: number // expiry, epoch ms
}

function tokenKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is not configured')
  return crypto.createHash('sha256').update(`${secret}:public-certificate-download`).digest()
}

const hmac = (body: string) => crypto.createHmac('sha256', tokenKey()).update(body).digest('base64url')

function signDownload(payload: Omit<DownloadToken, 'e'>): string {
  const body = Buffer.from(JSON.stringify({ ...payload, e: Date.now() + TOKEN_TTL_MS })).toString('base64url')
  return `${body}.${hmac(body)}`
}

type TokenCheck = { payload: DownloadToken; expired?: undefined } | { payload?: undefined; expired: boolean }

function readDownload(token: string): TokenCheck {
  const [body, signature] = String(token ?? '').slice(0, 1024).split('.')
  if (!body || !signature) return { expired: false }
  const expected = Buffer.from(hmac(body))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return { expired: false }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as DownloadToken
    if (!mongoose.isValidObjectId(payload.u) || !isCertificateKind(payload.k) || typeof payload.a !== 'string') return { expired: false }
    return payload.e > Date.now() ? { payload } : { expired: true }
  } catch {
    return { expired: false }
  }
}

/* ----------------------------------------------------------------- lookup */

export interface PublicCertificate {
  kind: CertificateKind
  label: string
  abstractId: string
  title: string
  url: string
}

export type LookupResult =
  | { ok: true; name: string; registrationId: string; certificates: PublicCertificate[] }
  | { ok: false; status: number; message: string }

// IASMCON abstract tracks are "Free Paper" / "E-Poster"; map to certificate kinds.
const abstractKind = (track: unknown): CertificateKind | null => {
  const t = String(track ?? '').toLowerCase()
  if (t.includes('poster')) return 'poster'
  if (t.includes('paper')) return 'paper'
  return null
}

async function eligibleAbstracts(userId: unknown, kinds: CertificateKind[]) {
  const all = (await Abstract.find({ userId, status: { $in: ELIGIBLE_ABSTRACT_STATUSES } })
    .select('abstractId title track')
    .sort({ abstractId: 1 })
    .lean()) as any[]
  return all.filter((a) => {
    const k = abstractKind(a.track)
    return k !== null && kinds.includes(k)
  })
}

const abstractKey = (a: any) => String(a.abstractId || a._id)

export async function lookupCertificates(query: string): Promise<LookupResult> {
  const parsed = parseScan(String(query ?? '').slice(0, 300))
  if (parsed.kind === 'invalid') {
    return { ok: false, status: 400, message: 'Enter your registration ID (for example IASMCON2026-123) or the email address you registered with.' }
  }

  await connectDB()
  const filter = parsed.kind === 'id' ? { 'registration.registrationId': { $in: parsed.variants } } : { email: parsed.email }
  const user = (await User.findOne(filter).select(USER_FIELDS).lean()) as any
  if (!user || !isEligibleRegistrant(user)) return { ok: false, status: 404, message: NOT_FOUND_MESSAGE }

  const [abstracts, ...templates] = await Promise.all([
    eligibleAbstracts(user._id, ['poster', 'paper']),
    ...CERTIFICATE_KINDS.map((kind) => templateFor(kind)),
  ])

  const userId = String(user._id)
  const item = (kind: CertificateKind, abstract?: any): PublicCertificate => ({
    kind,
    label: CERTIFICATE_LABELS[kind],
    abstractId: abstract ? abstractKey(abstract) : '',
    title: abstract?.title ?? '',
    url: `/api/certificates/download?t=${signDownload({ u: userId, k: kind, a: abstract ? abstractKey(abstract) : '' })}`,
  })

  const certificates: PublicCertificate[] = []
  CERTIFICATE_KINDS.forEach((kind, i) => {
    const template = templates[i]
    if (!template) return
    if (kind === 'participation') return void certificates.push(item(kind))
    const mine = abstracts.filter((a) => abstractKind(a.track) === kind)
    if (!mine.length) return
    if (printsAbstract(template)) mine.forEach((a) => certificates.push(item(kind, a)))
    else certificates.push(item(kind))
  })

  return {
    ok: true,
    name: certificateName(user.profile, user.email),
    registrationId: user.registration?.registrationId ?? '',
    certificates,
  }
}

/* --------------------------------------------------------------- download */

export type DownloadResult =
  | { ok: true; bytes: Uint8Array; fileName: string }
  | { ok: false; reason: 'expired' | 'unavailable' }

const safeFilePart = (s: string) => s.replace(/[^\p{L}\p{N} .'-]+/gu, '').replace(/\s+/g, ' ').trim().slice(0, 80)

export async function renderDownload(token: string): Promise<DownloadResult> {
  const check = readDownload(token)
  if (!check.payload) return { ok: false, reason: check.expired ? 'expired' : 'unavailable' }
  const { u, k: kind, a } = check.payload

  await connectDB()
  const user = (await User.findById(u).select(USER_FIELDS).lean()) as any
  // Re-checked at download time, so a registration cancelled after lookup stops working.
  if (!user || !isEligibleRegistrant(user)) return { ok: false, reason: 'unavailable' }

  const template = await templateFor(kind)
  if (!template) return { ok: false, reason: 'unavailable' }

  const name = certificateName(user.profile, user.email)
  let abstract: any = null
  if (kind !== 'participation') {
    const mine = await eligibleAbstracts(user._id, [kind])
    abstract = a ? mine.find((x) => abstractKey(x) === a) : mine[0]
    if (!abstract) return { ok: false, reason: 'unavailable' }
  }

  const pdf = await templatePdf(template)
  if (!pdf) return { ok: false, reason: 'unavailable' }

  const { bytes } = await renderSpotCertificate(
    pdf,
    template.fields,
    { name, title: abstract?.title ?? '', abstractId: abstract?.abstractId ?? '' },
    { title: `${conferenceConfig.shortName} — ${CERTIFICATE_LABELS[kind]}` },
  )

  const suffix = a && abstract?.abstractId ? ` - ${safeFilePart(abstract.abstractId)}` : ''
  const fileName = `${conferenceConfig.shortName} ${CERTIFICATE_LABELS[kind]} - ${safeFilePart(name) || 'Delegate'}${suffix}.pdf`
  return { ok: true, bytes, fileName }
}
