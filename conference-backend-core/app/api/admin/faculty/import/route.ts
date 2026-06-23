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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const admin = await User.findById((session.user as any).id)
    if (!admin || admin.role !== 'admin') return NextResponse.json({ success: false, message: 'Admin required' }, { status: 403 })

    const { faculty, sendEmails } = await request.json()

    if (!Array.isArray(faculty) || faculty.length === 0) {
      return NextResponse.json({ success: false, message: 'Provide an array of faculty members' }, { status: 400 })
    }

    const results: Array<{ email: string; status: string; registrationId?: string; error?: string }> = []

    for (const member of faculty) {
      try {
        const email = member.email?.toLowerCase().trim()
        if (!email || !member.firstName || !member.lastName) {
          results.push({ email: email || 'unknown', status: 'skipped', error: 'Missing required fields' })
          continue
        }

        const existing = await User.findOne({ email })
        if (existing) {
          results.push({ email, status: 'skipped', error: 'Already registered' })
          continue
        }

        const registrationId = await generateRegistrationId()
        const tempPassword = `Faculty@${Math.random().toString(36).slice(-6)}`
        const hashedPassword = await bcrypt.hash(tempPassword, 12)

        const user = await User.create({
          email,
          password: hashedPassword,
          role: 'user',
          profile: {
            title: member.title || 'Dr.',
            firstName: member.firstName.trim(),
            lastName: member.lastName.trim(),
            phone: member.phone || '',
            designation: 'Faculty',
            specialization: member.specialization || '',
            institution: member.institution || '',
            mciNumber: member.mciNumber || 'FACULTY',
            address: { street: '', city: member.city || '', state: member.state || '', country: 'India', pincode: '' }
          },
          registration: {
            registrationId,
            type: 'faculty',
            status: 'confirmed',
            paymentType: 'complimentary',
            registrationDate: new Date(),
            source: 'bulk-upload',
            accompanyingPersons: []
          },
          isActive: true
        })

        if (sendEmails) {
          const fullName = `${member.title || 'Dr.'} ${member.firstName} ${member.lastName}`.trim()
          await sendEmailWithHistory({
            to: email,
            subject: `${conferenceConfig.shortName} - Faculty Registration`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#1a365d;">Welcome, Faculty!</h2>
              <p>Dear ${fullName},</p>
              <p>You have been registered as Faculty for ${conferenceConfig.shortName}.</p>
              <p><strong>Registration ID:</strong> ${registrationId}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p><a href="${conferenceConfig.contact.website}/auth/login" style="background:#1a365d;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px;">Login Now</a></p>
              <p>Best regards,<br>${conferenceConfig.shortName} Team</p>
            </div>`,
            text: `Faculty Registration: ${registrationId}. Login: ${email} / ${tempPassword}`,
            userId: user._id,
            userName: fullName,
            templateName: 'faculty-bulk-import',
            category: 'registration'
          })
        }

        results.push({ email, status: 'created', registrationId })
      } catch (err: any) {
        results.push({ email: member.email || 'unknown', status: 'error', error: err.message })
      }
    }

    await logAction({
      actor: { userId: admin._id.toString(), email: admin.email, role: 'admin' },
      action: 'faculty.bulk-import',
      resourceType: 'registration',
      resourceId: 'bulk',
      resourceName: `${results.filter(r => r.status === 'created').length} faculty imported`,
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || ''
      },
      description: `Bulk faculty import: ${results.filter(r => r.status === 'created').length} created, ${results.filter(r => r.status === 'skipped').length} skipped, ${results.filter(r => r.status === 'error').length} errors`
    })

    return NextResponse.json({
      success: true,
      message: `Imported ${results.filter(r => r.status === 'created').length} of ${faculty.length} faculty members`,
      data: results
    })
  } catch (error) {
    console.error('Faculty import error:', error)
    return NextResponse.json({ success: false, message: 'Import failed' }, { status: 500 })
  }
}
