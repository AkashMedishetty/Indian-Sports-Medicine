import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/conference-backend-core/lib/middleware/rateLimiter'
import { renderDownload } from '@/conference-backend-core/lib/certificates/public-certificates'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Public: render one certificate PDF from a signed link issued by the lookup
 * route. A plain GET link, so it downloads in every browser and in-app webview.
 * `view=1` opens the PDF inline instead of saving it.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const backToPage = (notice: string) => NextResponse.redirect(new URL(`/certificates?notice=${notice}`, url.origin), 303)

  const limit = await rateLimit(request, { windowMs: 10 * 60 * 1000, max: 60 })
  if (!limit.success) return backToPage('busy')

  try {
    const result = await renderDownload(url.searchParams.get('t') ?? '')
    if (!result.ok) return backToPage(result.reason)

    const disposition = url.searchParams.get('view') === '1' ? 'inline' : 'attachment'
    const asciiName = result.fileName.replace(/[^\x20-\x7e]/g, '').replace(/"/g, '') || 'Certificate.pdf'
    return new NextResponse(Buffer.from(result.bytes) as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch (error) {
    console.error('Public certificate download error:', error)
    return backToPage('error')
  }
}
