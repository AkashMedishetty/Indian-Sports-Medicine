import { PDFDocument, PDFFont, PDFName, StandardFonts, rgb } from 'pdf-lib'
import type { SpotField, SpotFont, SpotValues } from './spot-fields'

/** A problem with the uploaded file that the admin can fix and re-upload. */
export class TemplateError extends Error {}

const FONT_MAP: Record<SpotFont, StandardFonts> = {
  'Times-Roman': StandardFonts.TimesRoman,
  'Times-Bold': StandardFonts.TimesRomanBold,
  'Times-Italic': StandardFonts.TimesRomanItalic,
  'Times-BoldItalic': StandardFonts.TimesRomanBoldItalic,
  Helvetica: StandardFonts.Helvetica,
  'Helvetica-Bold': StandardFonts.HelveticaBold,
  'Helvetica-Oblique': StandardFonts.HelveticaOblique,
  'Helvetica-BoldOblique': StandardFonts.HelveticaBoldOblique,
  Courier: StandardFonts.Courier,
  'Courier-Bold': StandardFonts.CourierBold,
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Mongoose may hand back a Buffer or a BSON Binary depending on how it was loaded. */
export function toBytes(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value
  const inner = (value as { buffer?: unknown } | null)?.buffer
  if (inner instanceof Uint8Array) return inner
  if (inner instanceof ArrayBuffer) return new Uint8Array(inner)
  throw new Error('Template file data is missing or unreadable')
}

async function loadPdf(bytes: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes)
  } catch (err) {
    if (/encrypt/i.test(String((err as Error)?.message))) {
      throw new TemplateError('This PDF is password-protected or encrypted. Export it again without security settings.')
    }
    throw new TemplateError('Could not read this file as a PDF.')
  }
}

/** Validate an uploaded template and return its first page's visible (crop box) size. */
export async function inspectTemplate(bytes: Uint8Array): Promise<{ pageWidth: number; pageHeight: number }> {
  const doc = await loadPdf(bytes)
  if (doc.getPageCount() < 1) throw new TemplateError('The PDF has no pages.')
  const page = doc.getPage(0)
  const rotation = ((page.getRotation().angle % 360) + 360) % 360
  if (rotation !== 0) {
    throw new TemplateError(`The certificate page is rotated ${rotation}°. Export it without page rotation and upload again.`)
  }
  const crop = page.getCropBox()
  return { pageWidth: round2(crop.width), pageHeight: round2(crop.height) }
}

function canEncode(font: PDFFont, text: string): boolean {
  try {
    font.encodeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Standard PDF fonts only cover WinAnsi (Latin-1 plus a few extras). Keep what
 * they can draw, fall back to the unaccented letter where possible, and drop
 * the rest so one stray glyph can't fail the whole certificate.
 */
function toEncodable(font: PDFFont, text: string): string {
  let out = ''
  for (const ch of text.normalize('NFC')) {
    if (canEncode(font, ch)) out += ch
    else {
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (base && canEncode(font, base)) out += base
    }
  }
  return out.replace(/\s+/g, ' ').trim()
}

function wrapWords(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word
    if (!line || font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

interface Layout {
  size: number
  lines: string[]
  truncated: boolean
}

/** Largest size (down to 6pt) at which the text fits the box within maxLines; else ellipsize. */
export function layoutField(font: PDFFont, text: string, field: SpotField): Layout {
  const maxLines = Math.max(1, Math.min(4, Math.round(field.maxLines || 1)))
  const minSize = Math.min(6, field.fontSize)
  const fits = (lines: string[], size: number) => lines.every((l) => font.widthOfTextAtSize(l, size) <= field.width)

  for (let size = field.fontSize; size >= minSize; size = round2(size - 0.5)) {
    const lines = maxLines === 1 ? [text] : wrapWords(font, text, size, field.width)
    if (lines.length <= maxLines && fits(lines, size)) return { size, lines, truncated: false }
  }

  const size = minSize
  let lines = maxLines === 1 ? [text] : wrapWords(font, text, size, field.width)
  if (lines.length > maxLines) lines = [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(' ')]
  const last = lines.length - 1
  let tail = lines[last]
  while (tail.length > 1 && font.widthOfTextAtSize(`${tail}…`, size) > field.width) tail = tail.slice(0, -1).trimEnd()
  lines[last] = `${tail}…`
  return { size, lines, truncated: true }
}

function hexToRgb(hex: string) {
  const match = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim())
  const n = match ? parseInt(match[1], 16) : 0x1a1a1a
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

export interface RenderResult {
  bytes: Uint8Array
  /** Human-readable notes, e.g. a long name that had to be shrunk. */
  warnings: string[]
}

export interface RenderMeta {
  /** Document title. Browsers show this as the tab name when the certificate opens inline. */
  title?: string
}

/** Draw the enabled fields onto page 1 of the template. Extra pages are dropped. */
export async function renderSpotCertificate(
  templateBytes: Uint8Array,
  fields: SpotField[],
  values: SpotValues,
  meta: RenderMeta = {}
): Promise<RenderResult> {
  const doc = await loadPdf(templateBytes)
  while (doc.getPageCount() > 1) doc.removePage(doc.getPageCount() - 1)

  const page = doc.getPage(0)
  const crop = page.getCropBox()
  const fonts = new Map<SpotFont, PDFFont>()
  const warnings: string[] = []

  for (const field of fields) {
    if (!field.enabled) continue
    const raw = (values[field.key] ?? '').trim()
    if (!raw) continue

    const fontName: SpotFont = FONT_MAP[field.font] ? field.font : 'Times-Bold'
    let font = fonts.get(fontName)
    if (!font) {
      font = await doc.embedFont(FONT_MAP[fontName])
      fonts.set(fontName, font)
    }

    const wanted = (field.uppercase ? raw.toUpperCase() : raw).replace(/\s+/g, ' ').trim()
    const text = toEncodable(font, wanted)
    if (!text) {
      warnings.push(`${field.label}: none of its characters can be drawn in ${fontName}, so it was left blank`)
      continue
    }
    if (text !== wanted) warnings.push(`${field.label}: some characters aren't supported by ${fontName} and were simplified or removed`)

    const { size, lines, truncated } = layoutField(font, text, field)
    if (truncated) warnings.push(`${field.label} is too long for its box and was cut off — widen the box or allow more lines`)
    else if (size < field.fontSize) warnings.push(`${field.label} was shrunk from ${field.fontSize}pt to ${size}pt to fit`)

    const ascent = font.heightAtSize(size, { descender: false })
    const lineHeight = size * 1.2
    const color = hexToRgb(field.color)

    lines.forEach((line, i) => {
      const lineWidth = font!.widthOfTextAtSize(line, size)
      const offset =
        field.align === 'center' ? (field.width - lineWidth) / 2 : field.align === 'right' ? field.width - lineWidth : 0
      page.drawText(line, {
        x: crop.x + field.x + offset,
        // Field y is measured down from the top of the visible page; PDF y runs up from the bottom.
        y: crop.y + crop.height - field.y - ascent - i * lineHeight,
        size,
        font: font!,
        color,
      })
    })
  }

  // The uploaded template PDFs keep the title their design tool wrote (an
  // unrelated event's name, in one case), which browsers show as the tab name
  // when a certificate opens inline. Overwrite the document metadata, and drop
  // any XMP stream so viewers fall back to the info dictionary set here.
  const title = (meta.title ?? '').trim() || 'IASMCON 2026 Certificate'
  doc.setTitle(title)
  doc.setSubject('IASMCON 2026 Certificate')
  doc.setAuthor('IASMCON 2026')
  doc.setCreator('IASMCON 2026')
  doc.setProducer('IASMCON 2026')
  doc.setKeywords([])
  doc.catalog.delete(PDFName.of('Metadata'))

  return { bytes: await doc.save(), warnings }
}
