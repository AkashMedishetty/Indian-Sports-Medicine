import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import User from '@/conference-backend-core/lib/models/User'
import Abstract from '@/conference-backend-core/lib/models/Abstract'
import CertificateCollection from '@/conference-backend-core/lib/models/CertificateCollection'
import { parseScan, phoneMatchRegex } from './ids'
import {
  CERT_TYPES,
  TRACK_FOR_TYPE,
  type AbstractChoice,
  type CertType,
  type DeskPerson,
  type DeskRecord,
  type DeskStats,
  type ScanProgress,
  type ScanResult,
} from './types'

/** An abstract carries a certificate once it has been accepted. */
export const ELIGIBLE_ABSTRACT_STATUSES = ['accepted', 'final-submitted']
export const PAID_STATUSES = ['paid', 'confirmed']
/** Staff accounts also hold a registration number; they are not delegates. */
export const NON_DELEGATE_ROLES = ['admin', 'reviewer', 'manager', 'sponsor', 'client']

const USER_FIELDS =
  'email role profile.title profile.firstName profile.lastName profile.institution registration.registrationId registration.status'

/* -------------------------------------------------------------- bootstrap */

let indexesReady: Promise<unknown> | null = null

/**
 * Build the unique index BEFORE the first write. mongoose's autoIndex runs in the
 * background, so on a cold start two desks scanning the same badge could both
 * insert before the index exists. Memoised per instance; a failure clears the
 * memo so the next request retries rather than caching a broken state.
 */
async function ready() {
  await connectDB()
  if (!indexesReady) {
    indexesReady = CertificateCollection.createIndexes().catch((err) => {
      indexesReady = null
      throw err
    })
  }
  await indexesReady
}

/* ---------------------------------------------------------------- mapping */

export function displayName(profile: any, email: string): string {
  const title = String(profile?.title ?? '').trim()
  const first = String(profile?.firstName ?? '').trim()
  const last = String(profile?.lastName ?? '').trim()
  // Some records already carry the title inside firstName ("Dr. Ramesh").
  const parts =
    title && !first.toLowerCase().startsWith(title.toLowerCase()) ? [title, first, last] : [first, last]
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || email
}

function toPerson(user: any): DeskPerson {
  return {
    userId: String(user._id),
    name: displayName(user.profile, user.email ?? ''),
    email: user.email ?? '',
    registrationId: user.registration?.registrationId ?? '',
    registrationStatus: user.registration?.status ?? '',
    institution: user.profile?.institution ?? '',
  }
}

const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : '')

export function toRecord(doc: any): DeskRecord {
  return {
    id: String(doc._id),
    type: doc.type,
    userId: String(doc.userId),
    name: doc.name ?? '',
    email: doc.email ?? '',
    registrationId: doc.registrationId ?? '',
    institution: doc.institution ?? '',
    abstractId: doc.abstractId ?? '',
    abstractTitle: doc.abstractTitle ?? '',
    override: Boolean(doc.override),
    overrideReason: doc.overrideReason ?? '',
    deskName: doc.deskName ?? '',
    collectedAt: iso(doc.collectedAt),
    active: doc.active !== false,
    undoneAt: doc.undoneAt ? iso(doc.undoneAt) : null,
    undoneBy: doc.undoneBy ?? '',
  }
}

export const collectionKey = (type: CertType, userId: string, abstractId: string) =>
  `${type}:${userId}:${abstractId || '-'}`

const isDuplicateKeyError = (err: unknown) => (err as { code?: number })?.code === 11000

/* ------------------------------------------------------------------- scan */

export interface ScanInput {
  type: CertType
  deskName: string
  /** Raw scanner text. Ignored when userId is set (a follow-up request). */
  raw?: string
  userId?: string
  abstractId?: string
  override?: boolean
  overrideReason?: string
}

async function findRegistrant(input: ScanInput): Promise<{ user: any } | { result: ScanResult }> {
  // Follow-up requests (choose-abstract, override) name the person by id, so the
  // raw scan is never re-parsed and cannot resolve to somebody else.
  if (input.userId) {
    if (!mongoose.isValidObjectId(input.userId)) {
      return { result: { outcome: 'invalid', message: 'Invalid person reference' } }
    }
    const user = await User.findById(input.userId).select(USER_FIELDS).lean()
    return user ? { user } : { result: { outcome: 'not-found', message: 'That registration no longer exists' } }
  }

  const parsed = parseScan(input.raw)
  if (parsed.kind === 'invalid') return { result: { outcome: 'invalid', message: parsed.reason } }

  // $in over the closed set of id spellings: index-backed and exact.
  const filter =
    parsed.kind === 'id'
      ? { 'registration.registrationId': { $in: parsed.variants } }
      : parsed.kind === 'phone'
        ? { 'profile.phone': { $regex: phoneMatchRegex(parsed.phone) } }
        : { email: parsed.email }
  const user = await User.findOne(filter).select(USER_FIELDS).lean()
  if (!user) {
    const what = parsed.kind === 'id' ? parsed.canonical : parsed.kind === 'phone' ? parsed.label : parsed.email
    return { result: { outcome: 'not-found', message: `No registration found for ${what}` } }
  }
  return { user }
}

export async function scan(input: ScanInput): Promise<ScanResult> {
  if (!CERT_TYPES.includes(input.type)) return { outcome: 'invalid', message: 'Unknown certificate type' }
  await ready()

  const found = await findRegistrant(input)
  if ('result' in found) return found.result
  const user = found.user
  const person = toPerson(user)

  // Reasons block a scan but never hard-fail it: the desk may override.
  const reasons: string[] = []
  if (NON_DELEGATE_ROLES.includes(user.role)) reasons.push(`This is a ${user.role} account, not a delegate`)
  if (!PAID_STATUSES.includes(person.registrationStatus)) {
    reasons.push(`Registration is ${person.registrationStatus || 'incomplete'}, not paid`)
  }

  let abstractId = ''
  let abstractTitle = ''
  let progress: ScanProgress | undefined

  const track = TRACK_FOR_TYPE[input.type]
  if (track) {
    const [abstracts, collected] = (await Promise.all([
      Abstract.find({ userId: user._id, track, status: { $in: ELIGIBLE_ABSTRACT_STATUSES } })
        .select('abstractId title')
        .sort({ abstractId: 1 })
        .lean(),
      CertificateCollection.find({ userId: user._id, type: input.type, active: true }).lean(),
    ])) as [any[], any[]]

    const eligible = abstracts.map((a) => ({ abstractId: String(a.abstractId || a._id), title: a.title ?? '' }))
    const collectedById = new Map(collected.map((c) => [c.abstractId, c]))

    if (!eligible.length) {
      reasons.push(`No accepted ${input.type} abstract`)
      // An override with no abstract still issues one certificate for the person.
    } else if (input.abstractId) {
      const pick = eligible.find((a) => a.abstractId === input.abstractId)
      if (!pick) {
        return { outcome: 'invalid', message: `That abstract is not an accepted ${input.type} for ${person.name}` }
      }
      abstractId = pick.abstractId
      abstractTitle = pick.title
    } else {
      const remaining = eligible.filter((a) => !collectedById.has(a.abstractId))
      if (!remaining.length) {
        const records = eligible
          .map((a) => collectedById.get(a.abstractId))
          .filter(Boolean)
          .map(toRecord)
        return { outcome: 'duplicate', person, records, progress: { collected: records.length, total: eligible.length } }
      }
      if (remaining.length > 1) {
        const choices: AbstractChoice[] = eligible.map((a) => {
          const c = collectedById.get(a.abstractId)
          return {
            abstractId: a.abstractId,
            title: a.title,
            collected: c ? { at: iso(c.collectedAt), deskName: c.deskName ?? '' } : null,
          }
        })
        return { outcome: 'choose-abstract', person, choices, reasons }
      }
      // Exactly one left — hand that one over without asking the desk.
      abstractId = remaining[0].abstractId
      abstractTitle = remaining[0].title
    }

    if (eligible.length) progress = { collected: collectedById.size, total: eligible.length }
  }

  const key = collectionKey(input.type, person.userId, abstractId)

  if (reasons.length && !input.override) {
    // Say "already collected" rather than "not eligible" when both are true.
    const existing = await CertificateCollection.findOne({ key, active: true }).lean()
    if (existing) return { outcome: 'duplicate', person, records: [toRecord(existing)], progress }
    return { outcome: 'needs-override', person, reasons, abstractId, abstractTitle }
  }

  try {
    const created = await CertificateCollection.create({
      key,
      type: input.type,
      active: true,
      userId: user._id,
      registrationId: person.registrationId,
      name: person.name,
      email: person.email,
      institution: person.institution,
      abstractId,
      abstractTitle,
      override: reasons.length > 0,
      overrideReason: reasons.length
        ? [String(input.overrideReason ?? '').trim().slice(0, 200), ...reasons].filter(Boolean).join(' · ')
        : '',
      deskName: input.deskName,
      collectedAt: new Date(),
    })
    return {
      outcome: 'recorded',
      person,
      record: toRecord(created.toObject()),
      progress: progress ? { collected: progress.collected + 1, total: progress.total } : undefined,
    }
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err
    // Another desk (or a double trigger of the same scanner) got there first.
    const existing = await CertificateCollection.findOne({ key, active: true }).lean()
    return { outcome: 'duplicate', person, records: existing ? [toRecord(existing)] : [], progress }
  }
}

/* ------------------------------------------------------------------- undo */

/**
 * Soft-undo a hand-over. Passing deskName restricts a desk to its own scans;
 * admins pass undefined to undo anything.
 */
export async function undoCollection(id: string, undoneBy: string, deskName?: string): Promise<DeskRecord | null> {
  if (!mongoose.isValidObjectId(id)) return null
  await ready()
  const filter: Record<string, unknown> = { _id: id, active: true }
  if (deskName !== undefined) filter.deskName = deskName
  const doc = await CertificateCollection.findOneAndUpdate(
    filter,
    { $set: { active: false, undoneAt: new Date(), undoneBy } },
    { new: true }
  ).lean()
  return doc ? toRecord(doc) : null
}

/* ----------------------------------------------------------- stats + feeds */

const STATS_TTL_MS = 3000
let statsCache: { at: number; value: DeskStats } | null = null

/** Live totals for every open desk. Cached briefly since desks poll this. */
export async function getStats(): Promise<DeskStats> {
  if (statsCache && Date.now() - statsCache.at < STATS_TTL_MS) return statsCache.value
  await ready()

  const [byType, participationEligible, abstractEligible, byDesk] = await Promise.all([
    CertificateCollection.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$type', collected: { $sum: 1 }, overrides: { $sum: { $cond: ['$override', 1, 0] } } } },
    ]),
    User.countDocuments({
      'registration.status': { $in: PAID_STATUSES },
      role: { $nin: NON_DELEGATE_ROLES },
      'registration.registrationId': { $exists: true, $ne: '' },
    }),
    Abstract.aggregate([
      { $match: { track: { $in: ['poster', 'paper'] }, status: { $in: ELIGIBLE_ABSTRACT_STATUSES } } },
      { $group: { _id: '$track', n: { $sum: 1 } } },
    ]),
    CertificateCollection.aggregate([
      { $match: { active: true } },
      { $group: { _id: { desk: '$deskName', type: '$type' }, n: { $sum: 1 } } },
    ]),
  ])

  const eligibleByTrack = new Map<string, number>((abstractEligible as any[]).map((a) => [a._id, a.n]))
  const types = Object.fromEntries(
    CERT_TYPES.map((t) => {
      const row = (byType as any[]).find((r) => r._id === t)
      return [
        t,
        {
          collected: row?.collected ?? 0,
          overrides: row?.overrides ?? 0,
          eligible: t === 'participation' ? participationEligible : eligibleByTrack.get(t) ?? 0,
        },
      ]
    })
  ) as DeskStats['types']

  const desks = new Map<string, { deskName: string; total: number; byType: Partial<Record<CertType, number>> }>()
  for (const row of byDesk as any[]) {
    const name = row._id.desk || 'Unnamed desk'
    const entry = desks.get(name) ?? {
      deskName: name,
      total: 0,
      byType: {} as Partial<Record<CertType, number>>,
    }
    entry.total += row.n
    entry.byType[row._id.type as CertType] = row.n
    desks.set(name, entry)
  }

  const value: DeskStats = {
    generatedAt: new Date().toISOString(),
    types,
    desks: [...desks.values()].sort((a, b) => b.total - a.total),
  }
  statsCache = { at: Date.now(), value }
  return value
}

export async function recentCollections(opts: {
  limit?: number
  deskName?: string
  search?: string
  type?: CertType
  includeUndone?: boolean
}): Promise<DeskRecord[]> {
  await ready()
  const filter: Record<string, unknown> = {}
  if (!opts.includeUndone) filter.active = true
  if (opts.deskName !== undefined) filter.deskName = opts.deskName
  if (opts.type) filter.type = opts.type
  const q = (opts.search ?? '').trim()
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100)
    filter.$or = ['name', 'email', 'registrationId', 'abstractId', 'deskName'].map((f) => ({
      [f]: { $regex: safe, $options: 'i' },
    }))
  }
  const limit = Math.min(500, Math.max(1, Math.round(opts.limit ?? 50)))
  const docs = await CertificateCollection.find(filter).sort({ collectedAt: -1 }).limit(limit).lean()
  return (docs as any[]).map(toRecord)
}
