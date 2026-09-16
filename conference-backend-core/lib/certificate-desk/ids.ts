/**
 * Turn whatever a handheld scanner (or a typing operator) produces into
 * something we can look a registration up by.
 *
 * Formats in circulation for TGASICON 2026:
 *   bare id          TGASI-971
 *   JSON envelope    {"id":"TGASI-971","name":"...","event":"TGASICON 2026"}   <- welcome emails
 *   zero-padded id   TGASI-001            <- 95 of 631 rows in the DB are padded
 *   URL              https://api.onsite-atlas.com/qr/TGASI-971
 *   digits only      971                  <- some readers strip the prefix
 *   an email address <- manual fallback when a delegate has no badge
 *
 * Why VARIANTS and not a regex: `registration.registrationId` is indexed, and a
 * case-insensitive $regex cannot use that index. 95 of 631 ids are stored
 * zero-padded (TGASI-001) while the canonical form is unpadded (TGASI-1), so an
 * exact match on either spelling alone silently misses part of the room. We
 * therefore build the small closed set of spellings and hand Mongo an $in,
 * which is index-backed and exact.
 */

/** Canonical stored form. */
export const ID_PREFIX = 'TGASI'

/** <prefix><sep><digits>, tolerating any separator a mangled scan may produce. */
const ID_ANYWHERE = new RegExp(`${ID_PREFIX}[^A-Za-z0-9]?0*(\\d{1,6})`, 'i')
const DIGITS_ONLY = /^\d{1,6}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ParsedScan =
  | { kind: 'id'; canonical: string; number: number; variants: string[] }
  | { kind: 'email'; email: string }
  | { kind: 'invalid'; reason: string }

/**
 * Every spelling of this registration number that could be stored, so an $in
 * hits the index. Padded to six digits covers TGASI-1 .. TGASI-000001.
 */
export function idVariants(n: number): string[] {
  const out = new Set<string>()
  const digits = String(n)
  for (let width = digits.length; width <= 6; width++) {
    const body = digits.padStart(width, '0')
    out.add(`${ID_PREFIX}-${body}`)
    // Lowercase spellings are not present today (verified 0 rows), but cost
    // nothing to include and remove a whole class of silent miss.
    out.add(`${ID_PREFIX.toLowerCase()}-${body}`)
  }
  return [...out]
}

/** Pull an id or email out of a raw scan. */
export function parseScan(raw: string | null | undefined): ParsedScan {
  let s = String(raw ?? '').trim()
  if (!s) return { kind: 'invalid', reason: 'Nothing scanned' }

  // A payload may arrive double-encoded, i.e. quoted JSON with escaped quotes.
  if (/^"[\s\S]*"$/.test(s) && s.includes('\\"')) {
    try {
      const once = JSON.parse(s)
      if (typeof once === 'string') s = once.trim()
    } catch {
      /* keep the original */
    }
  }
  // Some scanner firmware and copy-paste routes substitute typographic quotes,
  // which makes JSON.parse fail on an otherwise good payload.
  if (/[\u201C\u201D\u2018\u2019]/.test(s)) {
    s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'")
  }

  // JSON envelope. The regex below would also find the id, but parsing first
  // means a payload whose id field disagrees with other digits in the blob
  // (a phone number, a year) still resolves to the right field.
  if (s.startsWith('{') || s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s)
      const obj = Array.isArray(parsed) ? parsed[0] : parsed
      const cand = obj?.id ?? obj?.regId ?? obj?.registrationId ?? obj?.registration_id
      if (cand != null) s = String(cand).trim()
    } catch {
      // Single-quoted or unquoted-key JSON: salvage the value directly.
      const m = s.match(/['"]?(?:id|regId|registrationId|registration_id)['"]?\s*:\s*['"]?([^'",}\s]+)['"]?/i)
      if (m) s = m[1].trim()
    }
  }

  // URL form: prefer an explicit query param, else the last path segment, which
  // is what the onsite Registration model builds (.../qr/<registrationId>).
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s)
      const q = u.searchParams.get('id') || u.searchParams.get('regId') || u.searchParams.get('registrationId')
      s = (q || u.pathname.split('/').filter(Boolean).pop() || s).trim()
    } catch {
      /* fall through to the regex */
    }
  }

  const m = s.match(ID_ANYWHERE)
  if (m) {
    const n = Number(m[1])
    if (n > 0) return { kind: 'id', canonical: `${ID_PREFIX}-${n}`, number: n, variants: idVariants(n) }
  }

  if (DIGITS_ONLY.test(s)) {
    const n = Number(s)
    if (n > 0) return { kind: 'id', canonical: `${ID_PREFIX}-${n}`, number: n, variants: idVariants(n) }
  }

  if (EMAIL.test(s)) return { kind: 'email', email: s.toLowerCase() }

  return {
    kind: 'invalid',
    reason: `Could not read "${s.slice(0, 40)}" as a registration ID — scan the badge, or type an ID or email`,
  }
}
