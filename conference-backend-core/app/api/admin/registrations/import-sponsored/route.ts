import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import { generateRegistrationId } from '@/lib/utils/generateId'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { logAction } from '@/conference-backend-core/lib/audit/service'

interface CSVRow {
  sponsorname: string
  title?: string
  firstname: string
  lastname: string
  email: string
  phone: string
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
  const lines = text.trim().split('\n')
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
      row[h] = values[idx] || ''
    })
    rows.push(row)
  }
  
  return rows
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || !['admin', 'manager'].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const testMode = formData.get('testMode') === 'true'
    
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'No data rows found in CSV' }, { status: 400 })
    }

    // Get all sponsors for lookup
    const sponsors = await User.find({ role: 'sponsor' }).select('_id email sponsorProfile')
    const sponsorMap = new Map<string, any>()
    
    sponsors.forEach(s => {
      const name = s.sponsorProfile?.companyName?.toLowerCase().trim()
      if (name) {
        sponsorMap.set(name, s)
      }
    })

    const findSponsor = (name: string) => {
      if (!name) return null
      const normalizedName = name.toLowerCase().trim()
      
      // Exact match
      if (sponsorMap.has(normalizedName)) {
        return sponsorMap.get(normalizedName)
      }
      
      // Partial match
      for (const [key, sponsor] of sponsorMap.entries()) {
        if (key.includes(normalizedName) || normalizedName.includes(key)) {
          return sponsor
        }
      }
      
      return null
    }

    const result = {
      success: 0,
      failed: 0,
      claimed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>,
      registered: [] as Array<{ email: string; registrationId: string; sponsorName: string }>
    }

    // Track sponsor allocation updates
    const sponsorUpdates = new Map<string, number>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Account for header row and 0-index

      // Find sponsor
      const sponsor = findSponsor(row.sponsorname)
      if (!sponsor) {
        result.errors.push({ row: rowNum, email: row.email || 'N/A', error: `Sponsor "${row.sponsorname}" not found` })
        result.failed++
        continue
      }

      // Validate required fields
      if (!row.email || !row.firstname || !row.lastname || !row.phone || !row.institution) {
        result.errors.push({ row: rowNum, email: row.email || 'N/A', error: 'Missing required fields (firstName, lastName, email, phone, institution)' })
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

      // Validate pincode format if provided (6 digits)
      let cleanPincode = ''
      if (row.pincode) {
        cleanPincode = row.pincode.replace(/\D/g, '')
        if (cleanPincode.length !== 6) {
          result.errors.push({ row: rowNum, email: row.email, error: 'Pincode must be 6 digits' })
          result.failed++
          continue
        }
      }

      // Check sponsor allocation
      const currentUsed = sponsor.sponsorProfile.allocation.used + (sponsorUpdates.get(sponsor._id.toString()) || 0)
      const remaining = sponsor.sponsorProfile.allocation.total - currentUsed
      
      if (remaining <= 0) {
        result.errors.push({ row: rowNum, email: row.email, error: `Sponsor "${sponsor.sponsorProfile.companyName}" has no remaining allocation` })
        result.failed++
        continue
      }

      // Test mode - don't actually create anything
      if (testMode) {
        result.success++
        result.registered.push({ 
          email: row.email, 
          registrationId: 'TEST-' + (i + 1).toString().padStart(4, '0'),
          sponsorName: sponsor.sponsorProfile.companyName
        })
        sponsorUpdates.set(sponsor._id.toString(), (sponsorUpdates.get(sponsor._id.toString()) || 0) + 1)
        continue
      }

      try {
        const email = row.email.toLowerCase()
        const existingUser = await User.findOne({ email })

        if (existingUser) {
          // Check if can be claimed
          if (existingUser.registration?.status === 'pending-payment') {
            existingUser.registration.status = 'confirmed'
            existingUser.registration.type = 'sponsored'
            existingUser.registration.paymentType = 'sponsored'
            existingUser.registration.sponsorId = sponsor._id
            existingUser.registration.sponsorName = sponsor.sponsorProfile.companyName
            existingUser.registration.sponsorCategory = sponsor.sponsorProfile.category
            existingUser.registration.confirmedDate = new Date()
            await existingUser.save()

            result.claimed++
            result.registered.push({ 
              email, 
              registrationId: existingUser.registration.registrationId,
              sponsorName: sponsor.sponsorProfile.companyName
            })
            sponsorUpdates.set(sponsor._id.toString(), (sponsorUpdates.get(sponsor._id.toString()) || 0) + 1)

            // Send confirmation email
            await sendEmailWithHistory({
              to: email,
              subject: 'ISSH Midterm CME 2026 - Registration Confirmed by Sponsor',
              html: `<p>Dear ${existingUser.profile?.firstName},</p><p>Your registration has been confirmed by <strong>${sponsor.sponsorProfile.companyName}</strong>.</p><p>Registration ID: ${existingUser.registration.registrationId}</p>`,
              text: `Your registration has been confirmed by ${sponsor.sponsorProfile.companyName}. Registration ID: ${existingUser.registration.registrationId}`,
              userId: existingUser._id,
              userName: `${existingUser.profile?.firstName} ${existingUser.profile?.lastName}`,
              templateName: 'sponsor-claimed',
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
        const passwordToUse = cleanPhone
        const hashedPassword = await bcrypt.hash(passwordToUse, 12)

        const delegate = await User.create({
          email,
          password: hashedPassword,
          role: 'user',
          profile: {
            title: row.title || 'Dr.',
            firstName: row.firstname,
            lastName: row.lastname,
            phone: cleanPhone,
            designation: row.designation || 'Consultant',
            institution: row.institution,
            mciNumber: row.mcinumber || '',
            address: {
              street: row.address || '',
              city: row.city || '',
              state: row.state || '',
              country: 'India',
              pincode: cleanPincode
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
            source: 'admin-sponsored-import'
          },
          isActive: true
        })

        result.success++
        result.registered.push({ 
          email, 
          registrationId,
          sponsorName: sponsor.sponsorProfile.companyName
        })
        sponsorUpdates.set(sponsor._id.toString(), (sponsorUpdates.get(sponsor._id.toString()) || 0) + 1)

        // Send welcome email with phone as password
        await sendEmailWithHistory({
          to: email,
          subject: 'Welcome to ISSH Midterm CME 2026 - Sponsored Registration',
          html: `
            <p>Dear ${row.title || 'Dr.'} ${row.firstname} ${row.lastname},</p>
            <p>You have been registered for ISSH Midterm CME 2026 by <strong>${sponsor.sponsorProfile.companyName}</strong>.</p>
            <hr/>
            <p><strong>Your Login Details:</strong></p>
            <ul>
              <li><strong>Registration ID:</strong> ${registrationId}</li>
              <li><strong>Login Email:</strong> ${email}</li>
              <li><strong>Password:</strong> Your mobile number (${cleanPhone})</li>
            </ul>
            <p>Please login at <a href="${process.env.NEXTAUTH_URL}/login">${process.env.NEXTAUTH_URL}/login</a> and change your password after first login.</p>
            <hr/>
            <p><strong>Event Details:</strong></p>
            <ul>
              <li><strong>Event:</strong> ISSH Midterm CME 2026</li>
              <li><strong>Date:</strong> April 25-26, 2026</li>
              <li><strong>Venue:</strong> HICC Novotel, Hyderabad</li>
            </ul>
            <p>We look forward to seeing you at the conference!</p>
            <p>Best regards,<br/>ISSH 2026 Team</p>
          `,
          text: `You have been registered for ISSH Midterm CME 2026 by ${sponsor.sponsorProfile.companyName}. Registration ID: ${registrationId}. Login with your email and mobile number as password.`,
          userId: delegate._id,
          userName: `${row.firstname} ${row.lastname}`,
          templateName: 'sponsor-delegate-welcome',
          category: 'registration'
        })
      } catch (error: any) {
        result.errors.push({ row: rowNum, email: row.email, error: error.message || 'Unknown error' })
        result.failed++
      }
    }

    // Update sponsor allocations (only if not test mode)
    if (!testMode) {
      for (const [sponsorId, count] of sponsorUpdates.entries()) {
        await User.findByIdAndUpdate(sponsorId, {
          $inc: { 'sponsorProfile.allocation.used': count }
        })
      }

      // Log the action
      await logAction({
        actor: {
          userId: sessionUser.id,
          email: sessionUser.email || '',
          role: sessionUser.role,
          name: sessionUser.name || ''
        },
        action: 'admin.sponsored_import',
        resourceType: 'registration',
        resourceId: 'bulk-import',
        resourceName: 'Sponsored Import',
        metadata: { 
          ip: request.headers.get('x-forwarded-for') || 'unknown', 
          userAgent: request.headers.get('user-agent') || '' 
        },
        changes: {
          before: {},
          after: { 
            success: result.success, 
            claimed: result.claimed, 
            failed: result.failed,
            sponsors: Array.from(sponsorUpdates.entries()).map(([id, count]) => ({ id, count }))
          }
        },
        description: `Admin imported ${result.success} sponsored registrations (${result.claimed} claimed, ${result.failed} failed)`
      })
    }

    return NextResponse.json({ 
      success: true, 
      result,
      testMode
    })
  } catch (error) {
    console.error('Error processing sponsored import:', error)
    return NextResponse.json({ success: false, message: 'Failed to process import' }, { status: 500 })
  }
}
