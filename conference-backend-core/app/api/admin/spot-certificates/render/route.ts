import { NextRequest, NextResponse } from 'next/server'
import { requireCertificateStaff } from '@/conference-backend-core/lib/certificates/auth'
import { renderSpotCertificate, TemplateError, toBytes } from '@/conference-backend-core/lib/certificates/spot-render'
import { certificateFileName } from '@/conference-backend-core/lib/certificates/spot-email'
import { cleanValues, sanitizeFields } from '@/conference-backend-core/lib/certificates/spot-fields'
import { loadTemplateWithPdf, toTemplateDTO } from '@/conference-backend-core/lib/certificates/templates'

export const dynamic = 'force-dynamic'

/**
 * Render a certificate PDF for preview or download. Optional `fields` lets the
 * editor preview unsaved layout changes. Layout warnings are returned in the
 * X-Certificate-Warnings header as URI-encoded JSON.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error
  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 })
    }

    const template = await loadTemplateWithPdf(String(body?.templateId ?? ''))
    if (!template) return NextResponse.json({ success: false, message: 'Template not found' }, { status: 404 })

    const fields =
      body.fields !== undefined
        ? sanitizeFields(body.fields, template.pageWidth, template.pageHeight)
        : toTemplateDTO(template.toObject()).fields
    const values = cleanValues(body.values)
    const { bytes, warnings } = await renderSpotCertificate(toBytes(template.pdf), fields, values)

    const fileName = certificateFileName(values.name ?? '')
    const asciiName = fileName.replace(/[^\x20-\x7e]/g, '').replace(/"/g, '') || 'Certificate.pdf'
    return new NextResponse(Buffer.from(bytes) as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'X-Certificate-Warnings': encodeURIComponent(JSON.stringify(warnings)),
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    if (error instanceof TemplateError) return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    console.error('Spot certificate render error:', error)
    return NextResponse.json({ success: false, message: 'Failed to render the certificate' }, { status: 500 })
  }
}
