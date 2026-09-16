import { NextRequest, NextResponse } from 'next/server'
import User from '@/lib/models/User'
import Abstract from '@/lib/models/Abstract'
import { requireCertificateStaff } from '@/conference-backend-core/lib/certificates/auth'
import { normalizeScannedId } from '@/conference-backend-core/lib/utils/qr-payload'

export const dynamic = 'force-dynamic'

const STATUS_ORDER = ['final-submitted', 'accepted', 'under-review', 'submitted', 'rejected']
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function displayName(profile: any, email: string): string {
  const title = String(profile?.title ?? '').trim()
  const first = String(profile?.firstName ?? '').trim()
  const last = String(profile?.lastName ?? '').trim()
  // Some records already carry the title inside firstName ("Dr. Ramesh"); don't print "Dr. Dr.".
  const withTitle = title && !first.toLowerCase().startsWith(title.toLowerCase()) ? [title, first, last] : [first, last]
  return withTitle.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || email
}

/** Find registrants by name, email, phone, registration ID or a scanned badge QR, with their abstracts. */
export async function GET(request: NextRequest) {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error
  try {
    const q = (new URL(request.url).searchParams.get('q') ?? '').trim()
    if (q.length < 2) return NextResponse.json({ success: true, data: [] })

    const scanned = normalizeScannedId(q)
    let filter: Record<string, unknown>
    if (scanned) {
      const num = scanned.replace(/^TGASI-/i, '')
      filter = {
        $or: [
          { 'registration.registrationId': scanned },
          { 'registration.registrationId': { $regex: `^TGASI-0*${num}$`, $options: 'i' } },
        ],
      }
    } else {
      const tokens = q.split(/\s+/).filter(Boolean).slice(0, 5).map(escapeRegex)
      filter = {
        $and: tokens.map((t) => ({
          $or: [
            { email: { $regex: t, $options: 'i' } },
            { 'profile.firstName': { $regex: t, $options: 'i' } },
            { 'profile.lastName': { $regex: t, $options: 'i' } },
            { 'registration.registrationId': { $regex: t, $options: 'i' } },
            { 'profile.phone': { $regex: t, $options: 'i' } },
          ],
        })),
      }
    }

    const users = (await User.find(filter)
      .select('email profile.title profile.firstName profile.lastName registration.registrationId registration.status')
      .limit(10)
      .lean()) as any[]

    const abstracts = users.length
      ? ((await Abstract.find({ userId: { $in: users.map((u) => u._id) } })
          .select('userId abstractId title track status')
          .lean()) as any[])
      : []

    const data = users.map((u) => ({
      userId: String(u._id),
      name: displayName(u.profile, u.email),
      email: u.email,
      registrationId: u.registration?.registrationId ?? '',
      registrationStatus: u.registration?.status ?? '',
      abstracts: abstracts
        .filter((a) => String(a.userId) === String(u._id))
        .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
        .map((a) => ({ abstractId: a.abstractId ?? '', title: a.title ?? '', track: a.track ?? '', status: a.status ?? '' })),
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Spot certificate lookup error:', error)
    return NextResponse.json({ success: false, message: 'Lookup failed' }, { status: 500 })
  }
}
