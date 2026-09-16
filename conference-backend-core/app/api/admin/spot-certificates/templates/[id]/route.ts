import { NextRequest, NextResponse } from 'next/server'
import CertificateTemplate from '@/conference-backend-core/lib/models/CertificateTemplate'
import { requireCertificateStaff } from '@/conference-backend-core/lib/certificates/auth'
import { sanitizeFields } from '@/conference-backend-core/lib/certificates/spot-fields'
import { isValidTemplateId, toTemplateDTO } from '@/conference-backend-core/lib/certificates/templates'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const notFound = () => NextResponse.json({ success: false, message: 'Template not found' }, { status: 404 })

export async function GET(_request: NextRequest, { params }: Ctx) {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error
  const { id } = await params
  if (!isValidTemplateId(id)) return notFound()
  const template = await CertificateTemplate.findById(id).lean()
  return template ? NextResponse.json({ success: true, data: toTemplateDTO(template) }) : notFound()
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error
  try {
    const { id } = await params
    if (!isValidTemplateId(id)) return notFound()

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 })
    }

    const existing = await CertificateTemplate.findById(id).select('pageWidth pageHeight').lean<{ pageWidth: number; pageHeight: number }>()
    if (!existing) return notFound()

    const update: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim().slice(0, 120)
    if (body.fields !== undefined) update.fields = sanitizeFields(body.fields, existing.pageWidth, existing.pageHeight)
    if (typeof body.emailSubject === 'string') update.emailSubject = body.emailSubject.slice(0, 300)
    if (typeof body.emailBody === 'string') update.emailBody = body.emailBody.slice(0, 5000)

    const saved = await CertificateTemplate.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()
    return saved ? NextResponse.json({ success: true, data: toTemplateDTO(saved) }) : notFound()
  } catch (error) {
    console.error('Spot certificate template update error:', error)
    return NextResponse.json({ success: false, message: 'Failed to save the template' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error
  const { id } = await params
  if (!isValidTemplateId(id)) return notFound()
  // The send log keeps templateName, so history stays readable after deletion.
  const deleted = await CertificateTemplate.findByIdAndDelete(id).lean()
  return deleted ? NextResponse.json({ success: true }) : notFound()
}
