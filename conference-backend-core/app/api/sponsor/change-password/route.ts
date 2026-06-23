import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import { logAction } from '@/conference-backend-core/lib/audit/service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'sponsor') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const user = await User.findById(sessionUser.id)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 12)
    user.sponsorProfile!.mustChangePassword = false
    await user.save()

    // Log the action
    await logAction({
      actor: { userId: sessionUser.id, email: sessionUser.email, role: 'sponsor' },
      action: 'user.password_changed',
      resourceType: 'user',
      resourceId: sessionUser.id,
      metadata: { 
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || ''
      },
      description: 'Sponsor changed password'
    })

    return NextResponse.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ success: false, message: 'Failed to change password' }, { status: 500 })
  }
}
