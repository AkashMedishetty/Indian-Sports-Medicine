import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import { generateRegistrationId } from '@/lib/utils/generateId'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { getRegistrationAcceptanceTemplate } from '@/conference-backend-core/lib/email/templates'
import { logSponsorAction } from '@/conference-backend-core/lib/audit/service'

interface CSVRow {
  title?: string
  firstname: string
  lastname: string
  email: string
  phone: string
  age?: string
  designation?: string
  institution: string
  mcinumber?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  dietaryrequirements?: string
}

function parseCSV(text: string): CSVRow[] {
  // Remove BOM if present and normalize line endings
  const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  const lines = cleanText.split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''))
  const rows: CSVRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    // Handle CSV with quoted values
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    
    const row: any = {}
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim()
    })
    rows.push(row)
  }
  
  return rows
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'sponsor') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Get sponsor and check allocation
    const sponsor = await User.findById(sessionUser.id)
    if (!sponsor || !sponsor.sponsorProfile) {
      return NextResponse.json({ success: false, message: 'Sponsor not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'No data rows found in CSV' }, { status: 400 })
    }

    const result = {
      success: 0,
      failed: 0,
      claimed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>,
      registered: [] as Array<{ email: string; registrationId: string }>
    }

    let { total, used } = sponsor.sponsorProfile.allocation
    const remaining = total - used

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Account for header row and 0-index

      // Validate required fields (address and pincode are now optional)
      if (!row.email || !row.firstname || !row.lastname || !row.phone || !row.institution || !row.city || !row.state) {
        result.errors.push({ row: rowNum, email: row.email || 'N/A', error: 'Missing required fields (firstName, lastName, email, phone, institution, city, state)' })
        result.failed++
        continue
      }

      // Validate phone format (10 digits)
      const cleanPhone = row.phone.replace(/\D/g, '')
      if (cleanPhone.length !== 10) {
        result.errors.push({ row: rowNum, email: row.email, error: 'Phone must be 10 digits' })
        result.failed++
        continue
      }

      // Validate pincode format (6 digits) - only if provided
      const cleanPincode = row.pincode ? row.pincode.replace(/\D/g, '') : ''
      if (cleanPincode && cleanPincode.length !== 6) {
        result.errors.push({ row: rowNum, email: row.email, error: 'Pincode must be 6 digits' })
        result.failed++
        continue
      }

      // Check allocation
      if (result.success + result.claimed >= remaining) {
        result.errors.push({ row: rowNum, email: row.email, error: 'Allocation limit reached' })
        result.failed++
        continue
      }

      try {
        const email = row.email.toLowerCase()
        const existingUser = await User.findOne({ email })

        if (existingUser) {
          // Check if can be claimed
          if (existingUser.registration?.status === 'pending-payment') {
            existingUser.registration.status = 'confirmed'
            existingUser.registration.paymentType = 'sponsored'
            existingUser.registration.sponsorId = sponsor._id
            existingUser.registration.sponsorName = sponsor.sponsorProfile.companyName
            existingUser.registration.sponsorCategory = sponsor.sponsorProfile.category
            existingUser.registration.confirmedDate = new Date()
            await existingUser.save()

            result.claimed++
            result.registered.push({ email, registrationId: existingUser.registration.registrationId })

            // Generate QR code
            let qrCodeDataURL: string | undefined
            let qrCodeBuffer: Buffer | undefined
            try {
              const { QRCodeGenerator } = await import('@/lib/utils/qrcode-generator')
              qrCodeDataURL = await QRCodeGenerator.generateRegistrationQR({ registrationId: existingUser.registration.registrationId, name: `${existingUser.profile?.firstName} ${existingUser.profile?.lastName}`, email, type: 'sponsored' })
              qrCodeBuffer = await QRCodeGenerator.generateRegistrationQRBuffer({ registrationId: existingUser.registration.registrationId, name: `${existingUser.profile?.firstName} ${existingUser.profile?.lastName}`, email, type: 'sponsored' })
            } catch (qrErr) { console.error('QR generation failed:', qrErr) }

            // Send confirmation email using standard template
            const claimedHtml = getRegistrationAcceptanceTemplate({
              name: `${existingUser.profile?.title || 'Dr.'} ${existingUser.profile?.firstName} ${existingUser.profile?.lastName}`,
              email,
              registrationId: existingUser.registration.registrationId,
              registrationType: `Sponsored by ${sponsor.sponsorProfile.companyName}`,
              amount: 0,
              currency: 'INR',
              qrCodeDataURL
            })

            const claimedAttachments: Array<{ filename: string; content: Buffer; contentType: string; cid?: string }> = []
            if (qrCodeBuffer) {
              claimedAttachments.push({ filename: 'qr-code-embedded.png', content: qrCodeBuffer, contentType: 'image/png', cid: 'qr-code-embedded' })
            }

            await sendEmailWithHistory({
              to: email,
              subject: 'ISSH Midterm CME 2026 - Registration Confirmed (Sponsored)',
              html: claimedHtml,
              text: `Your registration for ISSH Midterm CME 2026 has been confirmed. Sponsored by ${sponsor.sponsorProfile.companyName}. Registration ID: ${existingUser.registration.registrationId}`,
              attachments: claimedAttachments,
              userId: existingUser._id,
              userName: `${existingUser.profile?.firstName} ${existingUser.profile?.lastName}`,
              templateName: 'registration-confirmed',
              category: 'registration'
            })
          } else {
            result.errors.push({ row: rowNum, email, error: 'Email already registered' })
            result.failed++
          }
          continue
        }

        // Create new delegate - use phone number as password
        const registrationId = await generateRegistrationId()
        const passwordToUse = cleanPhone // Use phone number as password
        const hashedPassword = await bcrypt.hash(passwordToUse, 12)

        // Normalize title - convert to proper case
        const normalizeTitle = (title: string): string => {
          const t = (title || '').trim().toLowerCase()
          if (t.includes('dr')) return 'Dr.'
          if (t.includes('prof')) return 'Prof.'
          if (t.includes('mr.') || t === 'mr') return 'Mr.'
          if (t.includes('mrs')) return 'Mrs.'
          if (t.includes('ms')) return 'Ms.'
          return 'Dr.' // Default
        }

        // Normalize designation - convert to valid enum value
        const normalizeDesignation = (designation: string): string => {
          const d = (designation || '').trim().toLowerCase()
          if (d.includes('consultant') || d.includes('senior') || d.includes('professor') || d.includes('hod')) return 'Consultant'
          if (d.includes('pg') || d.includes('student') || d.includes('resident') || d.includes('intern')) return 'PG/Student'
          return 'Consultant' // Default
        }

        const delegate = await User.create({
          email,
          password: hashedPassword,
          role: 'user',
          profile: {
            title: normalizeTitle(row.title || ''),
            firstName: row.firstname,
            lastName: row.lastname,
            phone: cleanPhone,
            age: row.age ? parseInt(row.age) : undefined,
            designation: normalizeDesignation(row.designation || ''),
            institution: row.institution,
            mciNumber: row.mcinumber || 'N/A',
            address: {
              street: row.address || '',
              city: row.city || '',
              state: row.state || '',
              country: 'India',
              pincode: cleanPincode || ''
            },
            dietaryRequirements: row.dietaryrequirements || 'none'
          },
          registration: {
            registrationId,
            type: 'sponsored',
            status: 'confirmed',
            paymentType: 'sponsored',
            sponsorId: sponsor._id,
            sponsorName: sponsor.sponsorProfile.companyName,
            sponsorCategory: sponsor.sponsorProfile.category,
            registrationDate: new Date(),
            confirmedDate: new Date(),
            source: 'bulk-upload'
          },
          isActive: true
        })

        result.success++
        result.registered.push({ email, registrationId })

        // Generate QR code
        const normalizedTitle = normalizeTitle(row.title || '')
        let qrDataURL: string | undefined
        let qrBuffer: Buffer | undefined
        try {
          const { QRCodeGenerator } = await import('@/lib/utils/qrcode-generator')
          qrDataURL = await QRCodeGenerator.generateRegistrationQR({ registrationId, name: `${row.firstname} ${row.lastname}`, email, type: 'sponsored' })
          qrBuffer = await QRCodeGenerator.generateRegistrationQRBuffer({ registrationId, name: `${row.firstname} ${row.lastname}`, email, type: 'sponsored' })
        } catch (qrErr) { console.error('QR generation failed:', qrErr) }

        // Send welcome email using standard template with sponsor info
        const welcomeHtml = getRegistrationAcceptanceTemplate({
          name: `${normalizedTitle} ${row.firstname} ${row.lastname}`,
          email,
          registrationId,
          registrationType: `Sponsored by ${sponsor.sponsorProfile.companyName}`,
          amount: 0,
          currency: 'INR',
          password: cleanPhone,
          qrCodeDataURL: qrDataURL
        })

        const welcomeAttachments: Array<{ filename: string; content: Buffer; contentType: string; cid?: string }> = []
        if (qrBuffer) {
          welcomeAttachments.push({ filename: 'qr-code-embedded.png', content: qrBuffer, contentType: 'image/png', cid: 'qr-code-embedded' })
        }

        await sendEmailWithHistory({
          to: email,
          subject: 'ISSH Midterm CME 2026 - Registration Confirmed (Sponsored)',
          html: welcomeHtml,
          text: `Your registration for ISSH Midterm CME 2026 has been confirmed. Sponsored by ${sponsor.sponsorProfile.companyName}. Registration ID: ${registrationId}. Login with your email and mobile number as password.`,
          attachments: welcomeAttachments,
          userId: delegate._id,
          userName: `${row.firstname} ${row.lastname}`,
          templateName: 'registration-welcome',
          category: 'registration'
        })
      } catch (error: any) {
        result.errors.push({ row: rowNum, email: row.email, error: error.message || 'Unknown error' })
        result.failed++
      }
    }

    // Update sponsor allocation
    sponsor.sponsorProfile.allocation.used += result.success + result.claimed
    await sponsor.save()

    // Log the action
    await logSponsorAction(
      { userId: sessionUser.id, email: sessionUser.email, role: 'sponsor' },
      'sponsor.bulk_upload',
      sponsor._id.toString(),
      sponsor.sponsorProfile.companyName,
      { ip: request.headers.get('x-forwarded-for') || 'unknown', userAgent: request.headers.get('user-agent') || '' },
      { before: {}, after: { success: result.success, claimed: result.claimed, failed: result.failed }, fields: [] }
    )

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error processing bulk upload:', error)
    return NextResponse.json({ success: false, message: 'Failed to process upload' }, { status: 500 })
  }
}
