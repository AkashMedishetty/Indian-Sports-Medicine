import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export interface CertificateStaff {
  _id: unknown
  email: string
  role: string
}

type StaffCheck = { user: CertificateStaff; error?: undefined } | { user?: undefined; error: NextResponse }

/**
 * Admins and managers can issue spot certificates. The role is read from the
 * database, not the session: the JWT role is set at sign-in and never refreshed.
 */
export async function requireCertificateStaff(): Promise<StaffCheck> {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) }
  }

  await connectDB()
  const user = (await User.findById(userId).select('email role').lean()) as CertificateStaff | null
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return { error: NextResponse.json({ success: false, message: 'Admin or manager access required' }, { status: 403 }) }
  }
  return { user }
}
