import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { EmailService } from '@/lib/email/service'
import jwt from 'jsonwebtoken'
import csv from 'csv-parser'
import { Readable } from 'stream'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const stream = Readable.from(buffer)

    const results: any[] = []
    const created: string[] = []
    const updated: string[] = []
    const errors: string[] = []

    return new Promise<NextResponse>((resolve) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          for (const row of results) {
            try {
              const email = String(row['Email'] || row['email'] || '').toLowerCase()
              if (!email) { errors.push('Missing email in row'); continue }
              const expertise = String(row['Expertise'] || row['expertise'] || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
              const maxConcurrentAssignments = Number(row['Capacity'] || row['Max'] || 5)

              const baseProfile = {
                title: String(row['Title'] || 'Dr.'),
                firstName: String(row['First Name'] || row['FirstName'] || 'Reviewer'),
                lastName: String(row['Last Name'] || row['LastName'] || 'Invite'),
                phone: String(row['Phone'] || ''),
                designation: (String(row['Designation'] || 'Consultant') as 'Consultant' | 'PG/Student'),
                institution: String(row['Institution'] || 'Invited Reviewer'),
                address: { street: '', city: String(row['City'] || ''), state: String(row['State'] || ''), country: String(row['Country'] || 'India'), pincode: '' },
                dietaryRequirements: '',
                specialNeeds: ''
              }

              let user = await User.findOne({ email })
              if (!user) {
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
                  reviewer: { expertise, maxConcurrentAssignments, notes: '' },
                  isActive: true
                })
                created.push(email)
              } else {
                user.role = 'reviewer'
                user.profile = { ...baseProfile, ...user.profile }
                user.reviewer = {
                  expertise: expertise.length ? expertise : user.reviewer?.expertise || [],
                  maxConcurrentAssignments: Number.isFinite(maxConcurrentAssignments) && maxConcurrentAssignments > 0
                    ? maxConcurrentAssignments
                    : user.reviewer?.maxConcurrentAssignments || 5,
                  notes: user.reviewer?.notes || ''
                }
                await user.save()
                updated.push(email)
              }

              const token = jwt.sign({ userId: user._id, email: user.email }, process.env.NEXTAUTH_SECRET!, { expiresIn: '7d' })
              const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`
              await EmailService.sendPasswordReset({
                userId: user._id.toString(),
                email: user.email,
                name: `${user.profile.title || ''} ${user.profile.firstName} ${user.profile.lastName}`.trim(),
                resetLink,
                expiryTime: '7 days'
              })
            } catch (e) {
              errors.push(`Row error: ${e instanceof Error ? e.message : 'Unknown error'}`)
            }
          }

          resolve(NextResponse.json({ success: true, createdCount: created.length, updatedCount: updated.length, errors: errors.length ? errors : undefined }))
        })
        .on('error', (error) => {
          console.error('CSV parsing error (reviewers):', error)
          resolve(NextResponse.json({ success: false, message: 'Error parsing CSV' }, { status: 400 }))
        })
    })
  } catch (error) {
    console.error('Import reviewers error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}


