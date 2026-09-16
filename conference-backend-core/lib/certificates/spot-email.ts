import { getBaseTemplate } from '../email/templates'
import { conferenceConfig } from '../../config/conference.config'
import {
  DEFAULT_EMAIL_BODY,
  DEFAULT_EMAIL_SUBJECT,
  fillPlaceholders,
  SPOT_FIELD_KEYS,
  type SpotValues,
} from './spot-fields'

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/** Subject, branded HTML and plain-text body for one recipient. */
export function buildSpotEmail(subjectTemplate: string, bodyTemplate: string, values: SpotValues) {
  const conference = conferenceConfig.shortName
  const subjectTpl = subjectTemplate?.trim() || DEFAULT_EMAIL_SUBJECT
  const bodyTpl = bodyTemplate?.trim() || DEFAULT_EMAIL_BODY

  const subject = fillPlaceholders(subjectTpl, values, conference).replace(/\s+/g, ' ').trim()
  const text = fillPlaceholders(bodyTpl, values, conference)

  // Escape the template first, then insert escaped values, so neither can inject markup.
  const safeValues: SpotValues = {}
  for (const key of SPOT_FIELD_KEYS) if (values[key]) safeValues[key] = escapeHtml(values[key] as string)
  const bodyHtml = fillPlaceholders(escapeHtml(bodyTpl), safeValues, escapeHtml(conference))
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 14px; line-height:1.6;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return { subject, text, html: getBaseTemplate(`<div style="font-size:15px; color:#1f2937;">${bodyHtml}</div>`) }
}

/** A filesystem- and mail-client-safe attachment name. */
export function certificateFileName(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N} .'-]+/gu, '').replace(/\s+/g, ' ').trim().slice(0, 80)
  return cleaned ? `Certificate - ${cleaned}.pdf` : 'Certificate.pdf'
}
