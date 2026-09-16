import { NextResponse } from 'next/server'
import { requireCertificateStaff } from '@/conference-backend-core/lib/certificates/auth'
import { buildCertificateWorkbook } from '@/conference-backend-core/lib/certificate-desk/export'

export const dynamic = 'force-dynamic'
/** exceljs needs node APIs; it cannot run on the edge runtime. */
export const runtime = 'nodejs'

/**
 * Download the distribution workbook.
 *
 * Admin/manager only, not desk-token: the pending sheets carry every delegate's
 * email, which is more than a shared desk code should unlock.
 */
export async function GET() {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error

  try {
    const buffer = await buildCertificateWorkbook()
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="TGASICON2026_Certificates_${stamp}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[certificate-desk] export error:', error)
    return NextResponse.json({ success: false, message: 'Export failed' }, { status: 500 })
  }
}
