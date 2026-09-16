import { NextRequest, NextResponse } from 'next/server'
import SpotCertificate from '@/conference-backend-core/lib/models/SpotCertificate'
import { requireCertificateStaff } from '@/conference-backend-core/lib/certificates/auth'

export const dynamic = 'force-dynamic'

/** Most recent spot certificate attempts, newest first, with overall totals. */
export async function GET(request: NextRequest) {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error
  try {
    const requested = Number(new URL(request.url).searchParams.get('limit'))
    const limit = Number.isFinite(requested) && requested > 0 ? Math.min(500, Math.round(requested)) : 100

    const [rows, sent, failed] = await Promise.all([
      SpotCertificate.find({}).sort({ createdAt: -1 }).limit(limit).lean(),
      SpotCertificate.countDocuments({ status: 'sent' }),
      SpotCertificate.countDocuments({ status: 'failed' }),
    ])

    return NextResponse.json({
      success: true,
      totals: { sent, failed },
      data: rows.map((r: any) => ({
        id: String(r._id),
        templateId: String(r.templateId),
        templateName: r.templateName,
        name: r.name,
        email: r.email,
        values: r.values ?? {},
        status: r.status,
        error: r.error ?? '',
        source: r.source,
        sentByEmail: r.sentByEmail ?? '',
        createdAt: new Date(r.createdAt).toISOString(),
      })),
    })
  } catch (error) {
    console.error('Spot certificate log error:', error)
    return NextResponse.json({ success: false, message: 'Failed to load the send log' }, { status: 500 })
  }
}
