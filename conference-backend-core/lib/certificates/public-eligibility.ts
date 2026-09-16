/**
 * Who can download which certificate from the public /certificates page, and who
 * receives the thank-you email. Dependency-free so the bulk-mail script and the
 * API routes apply exactly the same rules.
 */

export const CERTIFICATE_KINDS = ['participation', 'poster', 'paper'] as const
export type CertificateKind = (typeof CERTIFICATE_KINDS)[number]

export const isCertificateKind = (value: unknown): value is CertificateKind =>
  typeof value === 'string' && (CERTIFICATE_KINDS as readonly string[]).includes(value)

export const CERTIFICATE_LABELS: Record<CertificateKind, string> = {
  participation: 'Participation Certificate',
  poster: 'Poster Presentation Certificate',
  paper: 'Paper Presentation Certificate',
}

/** Spot Certificates template (matched by name, case-insensitive) used for each kind. */
export const TEMPLATE_NAME_BY_KIND: Record<CertificateKind, string> = {
  participation: 'Participation',
  poster: 'Poster',
  paper: 'Paper',
}

/**
 * paid / confirmed are completed registrations. pending is how complimentary
 * registrations (Organising Committee, FOC, Faculty) were entered by the office.
 * pending-payment is an abandoned online checkout and cancelled is cancelled, so
 * neither qualifies.
 */
export const ELIGIBLE_REGISTRATION_STATUSES = ['paid', 'confirmed', 'pending']

/** Staff, reviewer and sponsor logins carry registration numbers but are not delegates. */
export const DELEGATE_ROLE = 'user'

// Everyone who submitted an abstract gets their presentation certificate,
// regardless of the review outcome.
export const ELIGIBLE_ABSTRACT_STATUSES = ['submitted', 'under-review', 'accepted', 'final-submitted', 'rejected']

export interface RegistrantLike {
  role?: string
  registration?: { status?: string } | null
}

export function isEligibleRegistrant(user: RegistrantLike): boolean {
  return user.role === DELEGATE_ROLE && ELIGIBLE_REGISTRATION_STATUSES.includes(user.registration?.status ?? '')
}

/** Name as printed on certificates: "Dr. First Last", without doubling a title already in firstName. */
export function certificateName(profile: any, fallback = ''): string {
  const title = String(profile?.title ?? '').trim()
  const first = String(profile?.firstName ?? '').trim()
  const last = String(profile?.lastName ?? '').trim()
  const parts = title && !first.toLowerCase().startsWith(title.toLowerCase()) ? [title, first, last] : [first, last]
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || fallback
}

/** Certificate kinds a registrant holds, in display order. Maps the IASMCON
 *  abstract tracks ("Free Paper" / "E-Poster") to certificate kinds. */
export function kindsFor(abstracts: Array<{ track?: string }>): CertificateKind[] {
  const kinds = new Set<CertificateKind>()
  for (const a of abstracts) {
    const t = String(a.track ?? '').toLowerCase()
    if (t.includes('poster')) kinds.add('poster')
    else if (t.includes('paper')) kinds.add('paper')
  }
  return CERTIFICATE_KINDS.filter((kind) => kind === 'participation' || kinds.has(kind))
}
