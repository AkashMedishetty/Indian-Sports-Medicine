/**
 * Normalise whatever a scanner hands us into a registration id.
 *
 * Several QR formats are in circulation for TGASICON 2026 and the desk cannot
 * tell them apart, so the portal accepts all of them rather than asking a
 * delegate to prove which email they received:
 *
 *   1. bare id            "TGASI-971"          <- what the platform emits
 *   2. JSON envelope      {"id":"TGASI-971","name":"...","event":"..."}
 *                                              <- 431 welcome emails sent
 *                                                 2026-09-11 carry this
 *   3. zero-padded id     "TGASI-001"          <- printed badges use padding,
 *                                                 the database does not
 *   4. URL form           ".../check-in?id=TGASI-971"
 *   5. bare digits        "971"                <- some hand-held readers strip
 *                                                 the non-numeric prefix
 *
 * Returns null when nothing id-shaped is present, so a caller can reject
 * clearly instead of running a garbage query.
 */

const ID_RE = /TGASI[-\s_]?0*(\d{1,6})/i

/** Canonical form used by the database: TGASI-<unpadded number>. */
export function canonicalRegistrationId(n: string | number): string {
  return `TGASI-${String(n).replace(/^0+/, '') || '0'}`
}

export function normalizeScannedId(raw: string | null | undefined): string | null {
  if (!raw) return null
  let s = String(raw).trim()
  if (!s) return null

  // 2. JSON envelope — take the first id-ish field rather than assuming a name.
  if (s.startsWith('{') || s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s)
      const obj = Array.isArray(parsed) ? parsed[0] : parsed
      const candidate =
        obj?.id ?? obj?.regId ?? obj?.registrationId ?? obj?.registration_id
      if (candidate != null) s = String(candidate).trim()
    } catch {
      // Malformed JSON still often contains the id verbatim; fall through to
      // the regex, which will find it inside the braces.
    }
  }

  // 4. URL form — pull a likely query parameter, else let the regex scan it.
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s)
      const q =
        u.searchParams.get('id') ||
        u.searchParams.get('regId') ||
        u.searchParams.get('registrationId')
      if (q) s = q.trim()
    } catch {
      /* fall through */
    }
  }

  // 1 + 3. Anything containing a TGASI number, padded or not.
  const m = s.match(ID_RE)
  if (m) return canonicalRegistrationId(m[1])

  // 5. Bare digits only.
  if (/^\d{1,6}$/.test(s)) return canonicalRegistrationId(s)

  return null
}

/**
 * True when the input looked like a scan rather than a typed name — used to
 * decide whether to search broadly or jump straight to one registration.
 */
export function looksLikeScan(raw: string | null | undefined): boolean {
  return normalizeScannedId(raw) !== null
}
