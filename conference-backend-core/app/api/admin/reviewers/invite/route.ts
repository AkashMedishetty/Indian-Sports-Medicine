import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'
import { EmailService } from '@/lib/email/service'

type ReviewerInput = {
  email: string
  title?: string
  firstName?: string
  lastName?: string
  phone?: string
  designation?: 'Consultant' | 'PG/Student'
  institution?: string
  expertise?: string[]
  maxConcurrentAssignments?: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json().catch(() => ({}))
    const reviewers: ReviewerInput[] = Array.isArray(body?.reviewers)
      ? body.reviewers
      : body?.email
      ? [{ email: body.email, ...body }]
      : []

    if (reviewers.length === 0) {
      return NextResponse.json({ success: false, message: 'No reviewers provided' }, { status: 400 })
    }

    const created: string[] = []
    const updated: string[] = []
    const errors: string[] = []

    for (const r of reviewers) {
      try {
        const email = (r.email || '').toLowerCase().trim()
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push(`Invalid email: ${r.email}`)
          continue
        }

        let user = await User.findOne({ email })
        const baseProfile = {
          title: r.title || 'Dr.',
          firstName: r.firstName || 'Reviewer',
          lastName: r.lastName || 'Invite',
          phone: r.phone || '+91-0000000000',
          designation: r.designation || 'Consultant',
          institution: r.institution || 'Invited Reviewer',
          address: { street: '', city: '', state: '', country: 'India', pincode: '' },
          dietaryRequirements: '',
          specialNeeds: ''
        }

        if (!user) {
          // Minimal registration block needed by schema; these accounts will set password via invite link
          user = await User.create({
            email,
            password: 'TempPassword123!',
            profile: baseProfile,
            registration: {
              registrationId: `INV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              type: 'complimentary',
              status: 'pending',
              membershipNumber: '',
              workshopSelections: [],
              accompanyingPersons: [],
              registrationDate: new Date(),
              paymentType: 'regular'
            },
            role: 'reviewer',
            reviewer: {
              expertise: Array.isArray(r.expertise) ? r.expertise : [],
              maxConcurrentAssignments: r.maxConcurrentAssignments ?? 5,
              notes: ''
            },
            isActive: true
          })
          created.push(email)
        } else {
          // Ensure role and reviewer fields updated
          user.role = 'reviewer'
          user.profile = { ...baseProfile, ...user.profile }
          user.reviewer = {
            expertise: Array.isArray(r.expertise) ? r.expertise : user.reviewer?.expertise || [],
            maxConcurrentAssignments: r.maxConcurrentAssignments ?? user.reviewer?.maxConcurrentAssignments ?? 5,
            notes: user.reviewer?.notes || ''
          }
          await user.save()
          updated.push(email)
        }

        // Generate a password set/reset link
        const resetToken = jwt.sign(
          { userId: user._id, email: user.email },
          process.env.NEXTAUTH_SECRET!,
          { expiresIn: '7d' }
        )
        const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

        // Send invite email using reset template
        await EmailService.sendPasswordReset({
          userId: user._id.toString(),
          email: user.email,
          name: `${user.profile.title || ''} ${user.profile.firstName} ${user.profile.lastName}`.trim(),
          resetLink,
          expiryTime: '7 days'
        })
      } catch (e) {
        errors.push(`Failed to invite ${r.email}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({ success: true, created, updated, errors: errors.length ? errors : undefined })
  } catch (error) {
    console.error('Invite reviewers error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}


