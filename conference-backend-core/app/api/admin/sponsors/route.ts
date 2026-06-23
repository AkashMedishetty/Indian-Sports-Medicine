import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import { generateRegistrationId } from '@/lib/utils/generateId'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { logSponsorAction } from '@/conference-backend-core/lib/audit/service'

// Generate a random password
function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// GET - List all sponsors
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const query: any = { role: 'sponsor' }
    
    if (status) {
      query['sponsorProfile.status'] = status
    }
    if (category) {
      query['sponsorProfile.category'] = category
    }
    if (search) {
      // Escape special regex characters to prevent invalid regex patterns
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.$or = [
        { 'sponsorProfile.companyName': { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
        { 'sponsorProfile.contactPerson': { $regex: escapedSearch, $options: 'i' } }
      ]
    }

    const sponsors = await User.find(query)
      .select('-password')
      .sort({ 'sponsorProfile.companyName': 1 })

    // Calculate stats
    const stats = {
      total: sponsors.length,
      active: sponsors.filter(s => s.sponsorProfile?.status === 'active').length,
      inactive: sponsors.filter(s => s.sponsorProfile?.status === 'inactive').length,
      totalAllocation: sponsors.reduce((sum, s) => sum + (s.sponsorProfile?.allocation?.total || 0), 0),
      usedAllocation: sponsors.reduce((sum, s) => sum + (s.sponsorProfile?.allocation?.used || 0), 0)
    }

    return NextResponse.json({
      success: true,
      sponsors: sponsors.map(s => ({
        _id: s._id,
        email: s.email,
        companyName: s.sponsorProfile?.companyName,
        contactPerson: s.sponsorProfile?.contactPerson,
        category: s.sponsorProfile?.category,
        allocation: s.sponsorProfile?.allocation,
        status: s.sponsorProfile?.status,
        lastActivity: s.sponsorProfile?.lastActivity,
        createdAt: s.createdAt
      })),
      stats
    })
  } catch (error) {
    console.error('Error fetching sponsors:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch sponsors'
    }, { status: 500 })
  }
}

// POST - Create new sponsor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { email, companyName, contactPerson, category, allocation, password } = body

    // Validate required fields
    if (!email || !companyName || !contactPerson || !category || !allocation) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: email, companyName, contactPerson, category, allocation'
      }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'A user with this email already exists'
      }, { status: 409 })
    }

    // Use provided password or generate one
    const plainPassword = password || generatePassword()
    const hashedPassword = await bcrypt.hash(plainPassword, 12)
    const registrationId = await generateRegistrationId()
    
    // If admin provides password, don't force change
    const mustChangePassword = !password

    // Create sponsor user
    // Note: Sponsors don't need all profile fields, so we provide defaults
    const sponsor = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'sponsor',
      profile: {
        title: 'Mr.',
        firstName: contactPerson.split(' ')[0] || contactPerson,
        lastName: contactPerson.split(' ').slice(1).join(' ') || 'Sponsor',
        phone: body.phone || '0000000000',
        designation: 'Consultant',
        institution: companyName,
        mciNumber: 'SPONSOR',
        address: {
          city: '',
          state: '',
          country: 'India'
        }
      },
      registration: {
        registrationId,
        type: 'complimentary',
        status: 'confirmed',
        paymentType: 'complimentary'
      },
      sponsorProfile: {
        companyName,
        contactPerson,
        category,
        allocation: {
          total: allocation,
          used: 0
        },
        status: 'active',
        mustChangePassword: mustChangePassword,
        phone: body.phone || '',
        address: body.address || ''
      },
      isActive: true
    })

    // Log the action
    await logSponsorAction(
      { userId: sessionUser.id, email: sessionUser.email, role: 'admin' },
      'sponsor.created',
      sponsor._id.toString(),
      companyName,
      { ip: request.headers.get('x-forwarded-for') || 'unknown', userAgent: request.headers.get('user-agent') || '' },
      { before: {}, after: { companyName, category, allocation }, fields: ['companyName', 'category', 'allocation'] }
    )

    // Send welcome email with credentials
    await sendEmailWithHistory({
      to: email,
      subject: 'Welcome to ISSH Midterm CME 2026 - Sponsor Portal Access',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d;">Welcome to ISSH 2026 Sponsor Portal</h1>
          <p>Dear ${contactPerson},</p>
          <p>Your sponsor account for <strong>${companyName}</strong> has been created.</p>
          
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${plainPassword}</p>
            <p style="color: #e53e3e; font-size: 14px;">⚠️ You will be required to change your password on first login.</p>
          </div>
          
          <div style="background: #ebf8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Sponsor Details</h3>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Delegate Allocation:</strong> ${allocation} delegates</p>
          </div>
          
          <p>You can access the sponsor portal to:</p>
          <ul>
            <li>Register delegates individually or via CSV upload</li>
            <li>View your registered delegates</li>
            <li>Track your allocation usage</li>
          </ul>
          
          <p>Best regards,<br>ISSH 2026 Team</p>
        </div>
      `,
      text: `Welcome to ISSH 2026 Sponsor Portal\n\nYour account for ${companyName} has been created.\n\nEmail: ${email}\nTemporary Password: ${plainPassword}\n\nYou will be required to change your password on first login.\n\nCategory: ${category}\nDelegate Allocation: ${allocation}`,
      userId: sponsor._id,
      userName: contactPerson,
      templateName: 'sponsor-welcome',
      templateData: { companyName, contactPerson, category, allocation },
      category: 'sponsor'
    })

    return NextResponse.json({
      success: true,
      message: 'Sponsor created successfully',
      sponsor: {
        _id: sponsor._id,
        email: sponsor.email,
        companyName,
        contactPerson,
        category,
        allocation: { total: allocation, used: 0 },
        status: 'active'
      },
      // Include password so admin can share manually if email fails
      temporaryPassword: plainPassword
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating sponsor:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create sponsor'
    }, { status: 500 })
  }
}
