import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Abstract from '@/lib/models/Abstract'
import Configuration from '@/lib/models/Configuration'
import bcrypt from 'bcryptjs'
import { generateRegistrationId, generateAbstractId } from '@/lib/utils/generateId'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { logAbstractAction, logAction } from '@/conference-backend-core/lib/audit/service'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export async function POST(request: NextRequest) {
  // UNIQUE IDENTIFIER - If you see this in logs, the correct route is being hit
  console.log('=== SUBMIT-UNREGISTERED-V4 ROUTE HIT ===')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Request URL:', request.url)
  
  try {
    await connectDB()
    console.log('DB connected successfully')

    // Check if feature is enabled from database config
    const abstractsConfig = await Configuration.findOne({ type: 'abstracts', key: 'settings' })
    const enableAbstractsWithoutRegistration = abstractsConfig?.value?.enableAbstractsWithoutRegistration ?? 
      conferenceConfig.abstracts.enableAbstractsWithoutRegistration
    
    console.log('Feature enabled:', enableAbstractsWithoutRegistration)
    
    if (!enableAbstractsWithoutRegistration) {
      console.log('Feature disabled - returning 403')
      return NextResponse.json({ 
        success: false, 
        message: 'Abstract submission without registration is not enabled' 
      }, { status: 403 })
    }

    // Parse JSON body (file already uploaded to Vercel Blob by client)
    let body
    try {
      body = await request.json()
      console.log('JSON body parsed successfully')
    } catch (parseError: any) {
      console.error('Failed to parse JSON:', parseError.message)
      return NextResponse.json({ 
        success: false, 
        message: `Failed to parse request body: ${parseError.message}` 
      }, { status: 400 })
    }
    
    // Debug: log received data
    console.log('=== REQUEST DATA RECEIVED ===')
    console.log('Keys:', Object.keys(body))
    
    // Extract personal information
    const email = body.email?.toLowerCase().trim()
    const title = body.title || 'Dr.'
    const firstName = body.firstName?.trim()
    const lastName = body.lastName?.trim()
    const phone = body.phone?.trim()
    const age = body.age
    const designation = body.designation || 'Consultant'
    const institution = body.institution?.trim()
    const mciNumber = body.mciNumber?.trim()
    const password = body.password
    
    // Extract address
    const address = body.address || ''
    const city = body.city?.trim()
    const state = body.state?.trim()
    const country = body.country || 'India'
    const pincode = body.pincode || ''
    
    // Extract registration details
    const registrationType = body.registrationType
    const dietaryRequirements = body.dietaryRequirements || ''
    const specialNeeds = body.specialNeeds || ''
    
    // Extract abstract details
    const submissionCategory = body.submissionCategory
    const abstractTitle = body.abstractTitle?.trim()
    const authors = body.authors
    const abstractContent = body.abstractContent || ''
    const keywords = body.keywords || ''
    
    // File info from Vercel Blob upload
    const blobUrl = body.blobUrl
    const fileName = body.fileName
    const fileSize = body.fileSize
    const fileType = body.fileType

    // Validate required fields - with detailed logging
    const missingFields: string[] = []
    if (!email) missingFields.push('email')
    if (!firstName) missingFields.push('firstName')
    if (!lastName) missingFields.push('lastName')
    if (!phone) missingFields.push('phone')
    if (!institution) missingFields.push('institution')
    if (!mciNumber) missingFields.push('mciNumber')
    
    if (missingFields.length > 0) {
      console.log('Missing personal fields:', missingFields)
      return NextResponse.json({ 
        success: false, 
        message: `Missing required personal information: ${missingFields.join(', ')}` 
      }, { status: 400 })
    }
    
    if (!password || password.length < 8) {
      return NextResponse.json({ 
        success: false, 
        message: 'Password must be at least 8 characters' 
      }, { status: 400 })
    }
    
    if (!city || !state) {
      const missingAddr = []
      if (!city) missingAddr.push('city')
      if (!state) missingAddr.push('state')
      console.log('Missing address fields:', missingAddr)
      return NextResponse.json({ 
        success: false, 
        message: `Missing required address fields: ${missingAddr.join(', ')}` 
      }, { status: 400 })
    }
    
    if (!registrationType) {
      return NextResponse.json({ 
        success: false, 
        message: 'Registration type is required' 
      }, { status: 400 })
    }
    
    const missingAbstractFields: string[] = []
    if (!submissionCategory) missingAbstractFields.push('submissionCategory')
    if (!abstractTitle) missingAbstractFields.push('abstractTitle')
    if (!authors) missingAbstractFields.push('authors')
    
    if (missingAbstractFields.length > 0) {
      console.log('Missing abstract fields:', missingAbstractFields)
      return NextResponse.json({ 
        success: false, 
        message: `Missing required abstract fields: ${missingAbstractFields.join(', ')}` 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email format' 
      }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'This email is already registered. Please login to submit abstracts.' 
      }, { status: 409 })
    }

    // Generate registration ID and hash password
    const registrationId = await generateRegistrationId()
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user with pending-payment status
    // Source must be one of: 'normal', 'sponsor-managed', 'admin-created', 'bulk-upload'
    const user = await User.create({
      email,
      password: hashedPassword,
      role: 'user',
      profile: {
        title,
        firstName,
        lastName,
        phone,
        age: age ? parseInt(age) : undefined,
        designation,
        institution,
        mciNumber,
        address: { street: address, city, state, country, pincode }
      },
      registration: {
        registrationId,
        type: registrationType,
        status: 'pending-payment',
        paymentType: 'pending',
        registrationDate: new Date(),
        source: 'normal',
        dietaryRequirements,
        specialNeeds
      },
      isActive: true
    })

    // Log registration creation - note in description that it came from abstract submission
    await logAction({
      actor: { userId: user._id.toString(), email, role: 'user' },
      action: 'registration.created',
      resourceType: 'registration',
      resourceId: user._id.toString(),
      resourceName: registrationId,
      metadata: { 
        ip: request.headers.get('x-forwarded-for') || 'unknown', 
        userAgent: request.headers.get('user-agent') || ''
      },
      description: 'Registration created via abstract submission (pending payment)'
    })

    // Create abstract using the same ID format as login submission
    const abstractId = await generateAbstractId()
    
    // Map submission category to model enum values
    const categoryMap: Record<string, string> = {
      'award-paper': 'award-paper',
      'free-paper': 'free-paper',
      'e-poster': 'poster-presentation',
      'poster-presentation': 'poster-presentation'
    }
    const mappedCategory = categoryMap[submissionCategory] || submissionCategory
    
    const abstract = await Abstract.create({
      abstractId,
      userId: user._id,
      registrationId,
      title: abstractTitle,
      submissionCategory: mappedCategory,
      keywords: keywords ? keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : [],
      authors: authors.split(',').map((author: string) => author.trim()).filter((a: string) => a),
      status: 'submitted',
      submittedAt: new Date(),
      initial: {
        file: blobUrl ? {
          originalName: fileName || 'abstract-file',
          mimeType: fileType || 'application/octet-stream',
          fileSizeBytes: fileSize || 0,
          storagePath: blobUrl,
          blobUrl: blobUrl,
          uploadedAt: new Date()
        } : undefined,
        notes: abstractContent || undefined
      }
    })

    // Log abstract submission
    await logAbstractAction(
      { userId: user._id.toString(), email, role: 'user' },
      'abstract.submitted',
      abstract._id.toString(),
      abstractTitle,
      { ip: request.headers.get('x-forwarded-for') || 'unknown', userAgent: request.headers.get('user-agent') || '' }
    )

    // Send confirmation email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Registration & Abstract Submitted!</h2>
        <p>Dear ${title} ${firstName} ${lastName},</p>
        <p>Thank you for registering for <strong>${conferenceConfig.shortName}</strong>.</p>
        <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Registration Details</h3>
          <p><strong>Registration ID:</strong> ${registrationId}</p>
          <p><strong>Type:</strong> ${registrationType}</p>
          <p><strong>Status:</strong> <span style="color: #d69e2e;">Pending Payment</span></p>
        </div>
        <div style="background: #ebf8ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Abstract Details</h3>
          <p><strong>Abstract ID:</strong> ${abstractId}</p>
          <p><strong>Title:</strong> ${abstractTitle}</p>
          <p><strong>Category:</strong> ${submissionCategory}</p>
        </div>
        <div style="background: #faf5ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Login to Check Status</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> The password you created</p>
          <p><a href="${conferenceConfig.contact.website}/login" style="background: #4c51bf; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Login & Complete Payment</a></p>
        </div>
        <p style="color: #c05621;"><strong>⚠️ Payment Required:</strong> Please login to complete payment.</p>
        <p>Best regards,<br>${conferenceConfig.shortName} Team</p>
      </div>
    `

    await sendEmailWithHistory({
      to: email,
      subject: `${conferenceConfig.shortName} - Registration & Abstract Submitted`,
      html: emailHtml,
      text: `Registration ID: ${registrationId}. Abstract ID: ${abstractId}. Login at ${conferenceConfig.contact.website}/login to complete payment.`,
      userId: user._id,
      userName: `${firstName} ${lastName}`,
      templateName: 'registration-abstract-pending',
      category: 'registration'
    })

    return NextResponse.json({
      success: true,
      message: 'Registration and abstract submitted successfully',
      registrationId,
      abstractId
    }, { status: 201 })
  } catch (error: any) {
    console.error('=== SUBMIT-UNREGISTERED ERROR ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Error code:', error.code)
    
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Email already registered.' }, { status: 409 })
    }
    return NextResponse.json({ 
      success: false, 
      message: `Failed to submit: ${error.message}` 
    }, { status: 500 })
  }
}
