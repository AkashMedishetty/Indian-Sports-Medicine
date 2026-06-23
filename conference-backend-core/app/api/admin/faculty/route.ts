import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import { generateRegistrationId } from '@/lib/utils/generateId'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { logAction } from '@/conference-backend-core/lib/audit/service'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

async function requireAdmin(session: any) {
  if (!session?.user || !(session.user as any).id) return null
  await connectDB()
  const user = await User.findById((session.user as any).id)
  if (!user || !['admin', 'manager'].includes(user.role)) return null
  return user
}

// GET - List all faculty registrations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const admin = await requireAdmin(session)
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const query: any = {
      'registration.type': 'faculty',
      role: 'user'
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.$or = [
        { email: { $regex: escaped, $options: 'i' } },
        { 'profile.firstName': { $regex: escaped, $options: 'i' } },
        { 'profile.lastName': { $regex: escaped, $options: 'i' } },
        { 'registration.registrationId': { $regex: escaped, $options: 'i' } },
        { 'profile.institution': { $regex: escaped, $options: 'i' } }
      ]
    }

    const faculty = await User.find(query)
      .select('-password')
      .sort({ 'registration.registrationDate': -1 })
      .lean()

    return NextResponse.json({ success: true, data: faculty, total: faculty.length })
  } catch (error) {
    console.error('Faculty list error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Admin creates a faculty member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const admin = await requireAdmin(session)
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { email, firstName, lastName, phone, institution, mciNumber, title, specialization, sendEmail: shouldSendEmail } = body

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ success: false, message: 'Email, first name, and last name are required' }, { status: 400 })
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 409 })
    }

    const registrationId = await generateRegistrationId()
    const tempPassword = `Faculty@${Math.random().toString(36).slice(-6)}`
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      profile: {
        title: title || 'Dr.',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone || '',
        designation: 'Faculty',
        specialization: specialization || '',
        institution: institution || '',
        mciNumber: mciNumber || 'FACULTY',
        address: { street: '', city: '', state: '', country: 'India', pincode: '' }
      },
      registration: {
        registrationId,
        type: 'faculty',
        status: 'confirmed',
        paymentType: 'complimentary',
        registrationDate: new Date(),
        source: 'admin-created',
        accompanyingPersons: []
      },
      isActive: true
    })

    await logAction({
      actor: { userId: admin._id.toString(), email: admin.email, role: 'admin' },
      action: 'registration.created',
      resourceType: 'registration',
      resourceId: user._id.toString(),
      resourceName: registrationId,
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || ''
      },
      description: `Faculty member added by admin: ${firstName} ${lastName}`
    })

    // Send welcome email if requested
    if (shouldSendEmail !== false) {
      const fullName = `${title || 'Dr.'} ${firstName} ${lastName}`.trim()
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Welcome, Faculty!</h2>
          <p>Dear ${fullName},</p>
          <p>You have been registered as <strong>Faculty</strong> for <strong>${conferenceConfig.shortName}</strong>.</p>
          <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #bbf7d0;">
            <p><strong>Registration ID:</strong> ${registrationId}</p>
            <p><strong>Type:</strong> Faculty (Invited) — Complimentary</p>
            <p><strong>Status:</strong> <span style="color: #16a34a;">Confirmed</span></p>
          </div>
          <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p style="color: #e53e3e;">Please change your password after first login.</p>
            <p><a href="${conferenceConfig.contact.website}/auth/login" style="background: #1a365d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Login Now</a></p>
          </div>
          <p>Best regards,<br>${conferenceConfig.shortName} Team</p>
        </div>
      `

      await sendEmailWithHistory({
        to: email.toLowerCase(),
        subject: `${conferenceConfig.shortName} - Faculty Registration`,
        html: emailHtml,
        text: `Faculty Registration ID: ${registrationId}. Login: ${email} / ${tempPassword}`,
        userId: user._id,
        userName: fullName,
        templateName: 'faculty-admin-created',
        category: 'registration'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Faculty member added successfully',
      data: { registrationId, email: user.email, name: `${firstName} ${lastName}` }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Admin faculty create error:', error)
    if (error.code === 11000) return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 409 })
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// DELETE - Remove a faculty member
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const admin = await requireAdmin(session)
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 })

    const user = await User.findById(userId)
    if (!user || user.registration?.type !== 'faculty') {
      return NextResponse.json({ success: false, message: 'Faculty member not found' }, { status: 404 })
    }

    await User.findByIdAndDelete(userId)

    await logAction({
      actor: { userId: admin._id.toString(), email: admin.email, role: 'admin' },
      action: 'registration.deleted',
      resourceType: 'registration',
      resourceId: userId,
      resourceName: user.registration.registrationId,
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || ''
      },
      description: `Faculty member removed: ${user.profile.firstName} ${user.profile.lastName}`
    })

    return NextResponse.json({ success: true, message: 'Faculty member removed' })
  } catch (error) {
    console.error('Faculty delete error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
