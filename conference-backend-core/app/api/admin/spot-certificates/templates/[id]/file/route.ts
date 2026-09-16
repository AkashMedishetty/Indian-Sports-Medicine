import { NextRequest, NextResponse } from 'next/server'
import { requireCertificateStaff } from '@/conference-backend-core/lib/certificates/auth'
import { toBytes } from '@/conference-backend-core/lib/certificates/spot-render'
import { loadTemplateWithPdf } from '@/conference-backend-core/lib/certificates/templates'

export const dynamic = 'force-dynamic'

/** Raw template PDF, used by the editor to draw the page behind the draggable fields. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error
  const { id } = await params
  const template = await loadTemplateWithPdf(id)
  if (!template) return NextResponse.json({ success: false, message: 'Template not found' }, { status: 404 })
  return new NextResponse(Buffer.from(toBytes(template.pdf)) as unknown as BodyInit, {
    headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'private, no-store' },
  })
}
