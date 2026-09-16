/**
 * Shared, dependency-free definitions for spot certificates.
 *
 * Imported by both the admin UI and the server, so it must not pull in
 * mongoose, pdf-lib or any Node-only module.
 *
 * Coordinates are PDF points measured from the TOP-LEFT of the page's crop
 * box (the visible area). The renderer converts to pdf-lib's bottom-left origin.
 */

export const SPOT_FIELD_KEYS = ['name', 'title', 'abstractId', 'role'] as const
export type SpotFieldKey = (typeof SPOT_FIELD_KEYS)[number]

export const SPOT_FIELD_LABELS: Record<SpotFieldKey, string> = {
  name: 'Name',
  title: 'Presentation title',
  abstractId: 'Abstract ID',
  role: 'Role / designation',
}

/** pdf-lib's 14 standard fonts, minus Symbol/ZapfDingbats (no Latin text). */
export const SPOT_FONTS = [
  'Times-Roman',
  'Times-Bold',
  'Times-Italic',
  'Times-BoldItalic',
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
  'Courier',
  'Courier-Bold',
] as const
export type SpotFont = (typeof SPOT_FONTS)[number]

export type SpotAlign = 'left' | 'center' | 'right'

export interface SpotField {
  key: SpotFieldKey
  label: string
  enabled: boolean
  /** Left edge of the text box, in points from the page's left edge. */
  x: number
  /** Top edge of the text box, in points from the page's top edge. */
  y: number
  /** Box width in points. Text is aligned inside it and shrunk to fit. */
  width: number
  fontSize: number
  font: SpotFont
  color: string
  align: SpotAlign
  /** Lines the text may wrap onto before it is shrunk further. */
  maxLines: number
  uppercase: boolean
}

export type SpotValues = Partial<Record<SpotFieldKey, string>>

/** Closest browser font for the on-screen editor; the PDF uses the real standard font. */
export function fontCss(font: SpotFont): { fontFamily: string; fontWeight: number; fontStyle: string } {
  const fontFamily = font.startsWith('Times')
    ? '"Times New Roman", Times, serif'
    : font.startsWith('Courier')
      ? '"Courier New", Courier, monospace'
      : 'Helvetica, Arial, sans-serif'
  return {
    fontFamily,
    fontWeight: font.includes('Bold') ? 700 : 400,
    fontStyle: /Italic|Oblique/.test(font) ? 'italic' : 'normal',
  }
}

export const DEFAULT_EMAIL_SUBJECT = 'Your {conference} certificate'
export const DEFAULT_EMAIL_BODY = [
  'Dear {name},',
  '',
  'Thank you for being part of {conference}. Your certificate is attached to this email as a PDF.',
  '',
  'Warm regards,',
  '{conference} Organising Committee',
].join('\n')

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const MAX_VALUE_LENGTH = 300
export const MAX_RECIPIENTS_PER_REQUEST = 25

/** Keep only known field values, collapsed to single spaces and length-capped. */
export function cleanValues(input: unknown): SpotValues {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const out: SpotValues = {}
  for (const key of SPOT_FIELD_KEYS) {
    const raw = src[key]
    if (raw == null) continue
    const value = String(raw).replace(/\s+/g, ' ').trim().slice(0, MAX_VALUE_LENGTH)
    if (value) out[key] = value
  }
  return out
}

export function fillPlaceholders(template: string, values: SpotValues, conference: string): string {
  return template.replace(/\{(name|title|abstractId|role|conference)\}/g, (_, key: string) =>
    key === 'conference' ? conference : values[key as SpotFieldKey] ?? ''
  )
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function defaultFields(pageWidth: number, pageHeight: number): SpotField[] {
  const width = round2(pageWidth * 0.7)
  const x = round2((pageWidth - width) / 2)
  const base = { x, width, color: '#1a1a1a', align: 'center' as SpotAlign, uppercase: false }
  return [
    { ...base, key: 'name', label: SPOT_FIELD_LABELS.name, enabled: true, y: round2(pageHeight * 0.42), fontSize: Math.max(14, Math.round(pageHeight * 0.055)), font: 'Times-Bold', maxLines: 1 },
    { ...base, key: 'title', label: SPOT_FIELD_LABELS.title, enabled: false, y: round2(pageHeight * 0.55), fontSize: Math.max(10, Math.round(pageHeight * 0.028)), font: 'Times-Italic', maxLines: 2 },
    { ...base, key: 'abstractId', label: SPOT_FIELD_LABELS.abstractId, enabled: false, y: round2(pageHeight * 0.66), fontSize: Math.max(9, Math.round(pageHeight * 0.022)), font: 'Helvetica', maxLines: 1 },
    { ...base, key: 'role', label: SPOT_FIELD_LABELS.role, enabled: false, y: round2(pageHeight * 0.73), fontSize: Math.max(9, Math.round(pageHeight * 0.025)), font: 'Helvetica-Bold', maxLines: 1 },
  ]
}

function clampNum(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return round2(Math.min(max, Math.max(min, n)))
}

/**
 * Normalise a field list from the client: exactly one entry per known key,
 * numbers clamped to the page, unknown fonts/colours replaced. The name field
 * is always enabled — a certificate without a name is never what we want.
 */
export function sanitizeFields(input: unknown, pageWidth: number, pageHeight: number): SpotField[] {
  const list = Array.isArray(input) ? input : []
  return defaultFields(pageWidth, pageHeight).map((def) => {
    const f = (list.find((item: any) => item && item.key === def.key) ?? {}) as Partial<SpotField>
    return {
      key: def.key,
      label: SPOT_FIELD_LABELS[def.key],
      enabled: def.key === 'name' ? true : Boolean(f.enabled ?? def.enabled),
      x: clampNum(f.x, def.x, 0, Math.max(0, pageWidth - 10)),
      y: clampNum(f.y, def.y, 0, Math.max(0, pageHeight - 4)),
      width: clampNum(f.width, def.width, 10, pageWidth),
      fontSize: clampNum(f.fontSize, def.fontSize, 4, 200),
      font: (SPOT_FONTS as readonly string[]).includes(String(f.font)) ? (f.font as SpotFont) : def.font,
      color: /^#[0-9a-f]{6}$/i.test(String(f.color)) ? String(f.color) : def.color,
      align: f.align === 'left' || f.align === 'center' || f.align === 'right' ? f.align : def.align,
      maxLines: Math.round(clampNum(f.maxLines, def.maxLines, 1, 4)),
      uppercase: Boolean(f.uppercase ?? def.uppercase),
    }
  })
}

/* ------------------------------------------------------------------ CSV paste */

export interface RecipientRow {
  line: number
  name: string
  email: string
  title: string
  abstractId: string
  role: string
  error?: string
}

type Column = 'name' | 'email' | 'title' | 'abstractId' | 'role'

const HEADER_ALIASES: Record<Column, string[]> = {
  name: ['name', 'full name', 'participant', 'participant name', 'delegate', 'delegate name'],
  email: ['email', 'e-mail', 'email address', 'email id', 'mail'],
  title: ['title', 'presentation title', 'paper title', 'poster title', 'topic'],
  abstractId: ['abstract id', 'abstractid', 'abstract', 'abstract no', 'abstract number'],
  role: ['role', 'designation', 'category'],
}

/** Split one line on a delimiter, honouring double quotes (titles often contain commas). */
function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') { cell += '"'; i++ } else quoted = false
      } else cell += c
    } else if (c === '"') quoted = true
    else if (c === delimiter) { cells.push(cell); cell = '' }
    else cell += c
  }
  cells.push(cell)
  return cells.map((s) => s.replace(/\s+/g, ' ').trim())
}

/**
 * Parse pasted rows. Accepts CSV or tab-separated (a paste from Excel/Sheets),
 * with an optional header row. Without a header the order is:
 * name, email, title, abstract ID, role.
 */
export function parseRecipientRows(text: string): RecipientRow[] {
  const lines = text.split(/\r?\n/).map((l, i) => ({ raw: l, line: i + 1 })).filter((l) => l.raw.trim())
  if (!lines.length) return []

  const delimiter = lines.some((l) => l.raw.includes('\t')) ? '\t' : ','
  let order: Column[] = ['name', 'email', 'title', 'abstractId', 'role']
  let start = 0

  const header = splitLine(lines[0].raw, delimiter).map((h) => h.toLowerCase())
  const mapped = header.map((h) => (Object.keys(HEADER_ALIASES) as Column[]).find((col) => HEADER_ALIASES[col].includes(h)))
  if (mapped.includes('email') && mapped.includes('name')) {
    order = mapped as Column[]
    start = 1
  }

  const seen = new Set<string>()
  return lines.slice(start).map(({ raw, line }) => {
    const cells = splitLine(raw, delimiter)
    const row: RecipientRow = { line, name: '', email: '', title: '', abstractId: '', role: '' }
    order.forEach((col, i) => { if (col && cells[i]) row[col] = cells[i].slice(0, MAX_VALUE_LENGTH) })

    // Headerless paste with the columns swapped: email first, name second.
    if (start === 0 && EMAIL_RE.test(row.name) && !EMAIL_RE.test(row.email)) {
      ;[row.name, row.email] = [row.email, row.name]
    }
    row.email = row.email.toLowerCase()

    if (!row.name) row.error = 'Name is missing'
    else if (!row.email) row.error = 'Email is missing'
    else if (!EMAIL_RE.test(row.email)) row.error = 'Email looks invalid'
    else {
      const key = `${row.email}|${row.name.toLowerCase()}|${row.title.toLowerCase()}|${row.abstractId.toLowerCase()}`
      if (seen.has(key)) row.error = 'Duplicate of an earlier row'
      seen.add(key)
    }
    return row
  })
}
