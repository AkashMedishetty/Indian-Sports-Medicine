import { NextRequest, NextResponse } from 'next/server'
import CertificateTemplate from '@/conference-backend-core/lib/models/CertificateTemplate'
import { requireCertificateStaff } from '@/conference-backend-core/lib/certificates/auth'
import { inspectTemplate, TemplateError } from '@/conference-backend-core/lib/certificates/spot-render'
import { DEFAULT_EMAIL_BODY, DEFAULT_EMAIL_SUBJECT, defaultFields } from '@/conference-backend-core/lib/certificates/spot-fields'
import { toTemplateDTO } from '@/conference-backend-core/lib/certificates/templates'

export const dynamic = 'force-dynamic'

// Vercel caps request bodies at 4.5 MB; keep headroom for multipart overhead.
const MAX_BYTES = 4 * 1024 * 1024

export async function GET() {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error
  try {
    const templates = await CertificateTemplate.find({}).sort({ updatedAt: -1 }).lean()
    return NextResponse.json({ success: true, data: templates.map(toTemplateDTO) })
  } catch (error) {
    console.error('Spot certificate template list error:', error)
    return NextResponse.json({ success: false, message: 'Failed to load templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error
  try {
    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return NextResponse.json({ success: false, message: 'Upload the template as a file' }, { status: 400 })
    }

    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'Choose a PDF file to upload' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, message: `Templates must be under 4 MB (this one is ${(file.size / 1048576).toFixed(1)} MB). Compress the PDF and try again.` },
        { status: 413 }
      )
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    // Check the PDF signature (allowed anywhere in the first 1024 bytes) instead of trusting the browser's MIME type.
    if (!Buffer.from(bytes.subarray(0, 1024)).toString('latin1').includes('%PDF-')) {
      return NextResponse.json(
        { success: false, message: 'That file is not a PDF. Export the certificate design as a PDF and try again.' },
        { status: 400 }
      )
    }

    const { pageWidth, pageHeight } = await inspectTemplate(bytes)
    const rawName = String(form.get('name') ?? '').trim()

    const created = await CertificateTemplate.create({
      name: (rawName || file.name.replace(/\.pdf$/i, '') || 'Certificate').slice(0, 120),
      fileName: file.name || 'template.pdf',
      pdf: Buffer.from(bytes),
      pageWidth,
      pageHeight,
      fields: defaultFields(pageWidth, pageHeight),
      emailSubject: DEFAULT_EMAIL_SUBJECT,
      emailBody: DEFAULT_EMAIL_BODY,
      createdBy: auth.user._id,
    })

    return NextResponse.json({ success: true, data: toTemplateDTO(created.toObject()) }, { status: 201 })
  } catch (error) {
    if (error instanceof TemplateError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    console.error('Spot certificate template upload error:', error)
    return NextResponse.json({ success: false, message: 'Failed to save the template' }, { status: 500 })
  }
}
