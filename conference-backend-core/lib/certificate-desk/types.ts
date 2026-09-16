/**
 * Shared types for the certificate collection desk.
 *
 * Client-safe: importing this pulls in no server code, so the scanner UI can use
 * the certificate-type constants without dragging mongoose into the bundle.
 */

export const CERT_TYPES = ['participation', 'poster', 'paper'] as const
export type CertType = (typeof CERT_TYPES)[number]

export const CERT_LABEL: Record<CertType, string> = {
  participation: 'Participation',
  poster: 'Poster Presentation',
  paper: 'Paper Presentation',
}

/** Abstract tracks that carry a certificate. `participation` has no abstract. */
export const TRACK_FOR_TYPE: Record<CertType, string | null> = {
  participation: null,
  poster: 'poster',
  paper: 'paper',
}

export interface DeskPerson {
  userId: string
  name: string
  email: string
  registrationId: string
  registrationStatus: string
  institution: string
}

export interface DeskRecord {
  id: string
  type: CertType
  userId: string
  name: string
  email: string
  registrationId: string
  institution: string
  /** Empty for participation certificates. */
  abstractId: string
  abstractTitle: string
  override: boolean
  overrideReason: string
  deskName: string
  collectedAt: string
  active: boolean
  undoneAt: string | null
  undoneBy: string
}

export interface AbstractChoice {
  abstractId: string
  title: string
  /** Non-null when this abstract's certificate has already been handed over. */
  collected: { at: string; deskName: string } | null
}

/** How many of this person's certificates of this type are done. */
export interface ScanProgress {
  collected: number
  total: number
}

/**
 * Discriminated result of one scan. The desk UI switches on `outcome`:
 *   recorded        - green, certificate handed over
 *   duplicate       - amber, already collected (never counted twice)
 *   choose-abstract - person holds several uncollected abstracts, desk picks
 *   needs-override  - not eligible; desk may hand over anyway with a reason
 *   not-found       - the badge resolved to an id with no registration
 *   invalid         - the scan could not be read as an id or email at all
 */
export type ScanResult =
  | { outcome: 'recorded'; person: DeskPerson; record: DeskRecord; progress?: ScanProgress }
  | { outcome: 'duplicate'; person: DeskPerson; records: DeskRecord[]; progress?: ScanProgress }
  | { outcome: 'choose-abstract'; person: DeskPerson; choices: AbstractChoice[]; reasons: string[] }
  | { outcome: 'needs-override'; person: DeskPerson; reasons: string[]; abstractId: string; abstractTitle: string }
  | { outcome: 'not-found'; message: string }
  | { outcome: 'invalid'; message: string }

export interface DeskTypeStats {
  collected: number
  overrides: number
  eligible: number
}

export interface DeskStats {
  generatedAt: string
  types: Record<CertType, DeskTypeStats>
  desks: Array<{ deskName: string; total: number; byType: Partial<Record<CertType, number>> }>
}
