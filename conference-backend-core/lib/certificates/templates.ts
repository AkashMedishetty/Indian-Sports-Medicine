import mongoose from 'mongoose'
import CertificateTemplate from '../models/CertificateTemplate'
import type { SpotField } from './spot-fields'

export interface TemplateDTO {
  id: string
  name: string
  fileName: string
  pageWidth: number
  pageHeight: number
  fields: SpotField[]
  emailSubject: string
  emailBody: string
  updatedAt: string
}

/** Plain JSON view of a template. Never includes the PDF bytes. */
export function toTemplateDTO(doc: any): TemplateDTO {
  return {
    id: String(doc._id),
    name: doc.name,
    fileName: doc.fileName,
    pageWidth: doc.pageWidth,
    pageHeight: doc.pageHeight,
    fields: (doc.fields ?? []).map((f: SpotField) => ({
      key: f.key, label: f.label, enabled: f.enabled, x: f.x, y: f.y, width: f.width,
      fontSize: f.fontSize, font: f.font, color: f.color, align: f.align, maxLines: f.maxLines, uppercase: f.uppercase,
    })),
    emailSubject: doc.emailSubject ?? '',
    emailBody: doc.emailBody ?? '',
    updatedAt: new Date(doc.updatedAt ?? Date.now()).toISOString(),
  }
}

export const isValidTemplateId = (id: string) => mongoose.isValidObjectId(id)

/** Load a template document including its PDF bytes (excluded by default). */
export async function loadTemplateWithPdf(id: string) {
  if (!isValidTemplateId(id)) return null
  return CertificateTemplate.findById(id).select('+pdf')
}
