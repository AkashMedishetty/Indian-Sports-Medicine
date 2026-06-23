import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { generateRegistrationId } from "@/lib/utils/generateId"
import { EmailService } from "@/lib/email/service"
import csv from 'csv-parser'
import { Readable } from 'stream'
import bcrypt from 'bcryptjs'

/**
 * Import verified registrations with payment information
 * This endpoint automatically:
 * - Generates registration IDs
 * - Creates user accounts
 * - Marks payments as verified
 * - Sets registration status to confirmed
 * - Sends acceptance emails with invoices
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            )
        }

        const userRole = (session.user as any)?.role
        if (!['admin', 'manager'].includes(userRole)) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            )
        }

        await connectDB()

        // Get admin user for verification tracking
        const adminUser = await User.findOne({ email: session.user.email })
        const adminUserId = adminUser?._id?.toString() || 'admin'

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { success: false, message: "No file provided" },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const stream = Readable.from(buffer)

        const results: any[] = []
        let imported = 0
        let errors: string[] = []
        const successfulImports: any[] = []

        return new Promise<NextResponse>((resolve) => {
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    for (const row of results) {
                        try {
                            // Validate required fields
                            if (!row['Email'] || !row['Name']) {
                                errors.push(`Row missing required fields (Email or Name): ${JSON.stringify(row)}`)
                                continue
                            }

                            // Generate unique registration ID
                            let registrationId = await generateRegistrationId()
                            let attempts = 0
                            while (attempts < 10) {
                                const existingReg = await User.findOne({ 'registration.registrationId': registrationId })
                                if (!existingReg) break
                                registrationId = await generateRegistrationId()
                                attempts++
                            }

                            // Parse name (split into first and last name)
                            const fullName = row['Name'].trim()
                            const nameParts = fullName.split(' ')
                            let firstName = fullName
                            let lastName = ''
                            
                            if (nameParts.length > 1) {
                                // Last word is last name, rest is first name
                                lastName = nameParts[nameParts.length - 1]
                                firstName = nameParts.slice(0, -1).join(' ')
                            }

                            // Map registration types
                            const mapRegistrationType = (type: string) => {
                                const typeMap: { [key: string]: string } = {
                                    'consultant': 'consultant',
                                    'postgraduate': 'postgraduate',
                                    'pg': 'postgraduate',
                                    'pg-student': 'postgraduate',
                                    'pg student': 'postgraduate',
                                    'student': 'postgraduate',
                                    'complimentary': 'complimentary',
                                    'sponsored': 'sponsored'
                                }
                                return typeMap[type?.toLowerCase()?.trim()] || 'consultant'
                            }

                            const registrationType = mapRegistrationType(row['Registration Type'] || 'member')
                            const amount = parseFloat(row['Amount'] || '0')
                            const transactionId = row['Transaction ID'] || row['UTR'] || ''
                            const phone = row['Phone'] || row['Phone Number'] || ''
                            const mciNumber = row['MCI Number'] || row['Registration Number'] || registrationId

                            // Generate password: registrationId + last 4 digits of phone
                            let generatedPassword = ''
                            if (phone && phone.length >= 4) {
                                // Format: ISCSG2026-030-3210
                                generatedPassword = `${registrationId}-${phone.slice(-4)}`
                            } else {
                                // Fallback: registrationId + last 4 chars of registration ID
                                generatedPassword = `${registrationId}-${registrationId.slice(-4)}`
                            }

                            // Parse accompanying persons count
                            const accompanyingCount = parseInt(row['Accompanying Persons'] || '0') || 0
                            const accompanyingPersons: any[] = []
                            
                            // If there are accompanying person names, parse them (match database schema)
                            if (accompanyingCount > 0 && row['Accompanying Person Names']) {
                                const names = row['Accompanying Person Names'].split(',')
                                names.forEach((name: string, index: number) => {
                                    if (name.trim() && index < accompanyingCount) {
                                        accompanyingPersons.push({
                                            name: name.trim(),
                                            dietaryRequirements: "", // Match database schema
                                            relationship: "friend" // Match database schema default
                                        })
                                    }
                                })
                            }

                            // Fill remaining slots if count is higher than names provided
                            while (accompanyingPersons.length < accompanyingCount) {
                                accompanyingPersons.push({
                                    name: `Companion ${accompanyingPersons.length + 1}`,
                                    dietaryRequirements: "",
                                    relationship: "friend"
                                })
                            }

                            // Hash the generated password
                            const tempPassword = await bcrypt.hash(generatedPassword, 10)

                            const userData = {
                                email: row['Email'].toLowerCase().trim(),
                                password: tempPassword,
                                profile: {
                                    title: row['Title'] || 'Dr.',
                                    firstName: firstName,
                                    lastName: lastName,
                                    phone: phone,
                                    designation: registrationType === 'pg-student' ? 'PG/Student' : 'Consultant',
                                    institution: row['Institution'] || '',
                                    address: {
                                        street: row['Street'] || '',
                                        city: row['City'] || '',
                                        state: row['State'] || '',
                                        country: row['Country'] || 'India',
                                        pincode: row['Pincode'] || ''
                                    },
                                    dietaryRequirements: row['Dietary Requirements'] || '',
                                    mciNumber: mciNumber, // At profile level, not address
                                    specialNeeds: row['Special Needs'] || ''
                                },
                                reviewer: {
                                    expertise: [],
                                    maxConcurrentAssignments: 5,
                                    notes: ""
                                },
                                registration: {
                                    registrationId,
                                    type: registrationType,
                                    status: 'paid', // Match database schema: 'paid' not 'confirmed'
                                    tier: 'Standard', // Add tier field from schema
                                    membershipNumber: row['Membership Number'] || '',
                                    workshopSelections: [],
                                    accompanyingPersons: accompanyingPersons,
                                    registrationDate: new Date(),
                                    paymentType: 'regular',
                                    paymentDate: new Date(),
                                    paymentRemarks: row['Payment Remarks'] || ''
                                },
                                payment: {
                                    method: 'bank-transfer' as const,
                                    status: 'verified' as const,
                                    amount: amount,
                                    paymentDate: new Date(),
                                    remarks: row['Payment Remarks'] || 'Imported and auto-verified by admin'
                                    // Removed fields not in database schema: bankTransferUTR, transactionId, verifiedBy, verificationDate
                                },
                                role: 'user',
                                isActive: true,
                                activeSessions: [] // Initialize empty sessions array
                            }

                            // Check if user already exists
                            const existingUser = await User.findOne({ email: userData.email })

                            if (existingUser) {
                                errors.push(`User with email ${userData.email} already exists`)
                                continue
                            }

                            // Create new user
                            console.log(`\n💾 === CREATING USER IN DATABASE ===`)
                            console.log(`📧 Email: ${userData.email}`)
                            console.log(`👤 Name: ${userData.profile.firstName} ${userData.profile.lastName}`)
                            console.log(`🎫 Registration ID: ${userData.registration.registrationId}`)
                            console.log(`📋 Type: ${userData.registration.type}`)
                            console.log(`💰 Amount: ₹${userData.payment.amount}`)
                            console.log(`👥 Accompanying Persons: ${userData.registration.accompanyingPersons.length}`)
                            if (userData.registration.accompanyingPersons.length > 0) {
                                userData.registration.accompanyingPersons.forEach((person, idx) => {
                                    console.log(`   ${idx + 1}. ${person.name} (${person.relationship}) - Diet: ${person.dietaryRequirements || 'None'}`)
                                })
                            }
                            
                            const newUser = await User.create(userData)
                            console.log(`✅ User created successfully with ID: ${newUser._id}`)
                            console.log(`🔍 Stored Registration ID: ${newUser.registration.registrationId}`)
                            console.log(`🔍 Stored Email: ${newUser.email}`)
                            console.log(`🔍 Stored Payment Status: ${newUser.payment?.status}`)
                            console.log(`🔍 Stored Registration Status: ${newUser.registration.status}`)
                            console.log(`🔍 Stored Accompanying Persons: ${newUser.registration.accompanyingPersons.length}`)
                            console.log(`💾 === USER STORED SUCCESSFULLY ===\n`)
                            
                            imported++

                            successfulImports.push({
                                userId: newUser._id.toString(),
                                email: newUser.email,
                                name: `${newUser.profile.firstName} ${newUser.profile.lastName}`,
                                registrationId: newUser.registration.registrationId,
                                registrationType: newUser.registration.type,
                                amount: newUser.payment?.amount || 0,
                                transactionId: transactionId,
                                password: generatedPassword
                            })

                        } catch (error) {
                            console.error('Import row error:', error)
                            errors.push(`Error importing row: ${row['Email'] || 'unknown'} - ${error instanceof Error ? error.message : 'Unknown error'}`)
                        }
                    }

                    // Send acceptance emails to all successfully imported users
                    let emailsSent = 0
                    let emailErrors = 0

                    for (const userInfo of successfulImports) {
                        try {
                            console.log(`\n📧 === SENDING EMAIL ===`)
                            console.log(`📧 To: ${userInfo.email}`)
                            console.log(`👤 Name: ${userInfo.name}`)
                            console.log(`🎫 Registration ID: ${userInfo.registrationId}`)
                            console.log(`💰 Amount: ₹${userInfo.amount}`)
                            
                            await EmailService.sendRegistrationAcceptance({
                                userId: userInfo.userId,
                                email: userInfo.email,
                                name: userInfo.name,
                                registrationId: userInfo.registrationId,
                                registrationType: userInfo.registrationType,
                                amount: userInfo.amount,
                                currency: 'INR',
                                transactionId: userInfo.transactionId,
                                workshopSelections: [],
                                accompanyingPersons: 0,
                                password: userInfo.password
                            })
                            
                            console.log(`✅ Email sent successfully to ${userInfo.email}`)
                            console.log(`📧 === EMAIL SENT ===\n`)
                            emailsSent++
                        } catch (emailError) {
                            console.error(`❌ Failed to send acceptance email to ${userInfo.email}:`, emailError)
                            emailErrors++
                            // Don't fail the import if email fails
                        }
                    }

                    resolve(NextResponse.json({
                        success: true,
                        imported,
                        emailsSent,
                        emailErrors,
                        errors: errors.length > 0 ? errors : undefined,
                        message: `Successfully imported ${imported} verified registrations. Sent ${emailsSent} acceptance emails${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
                    }))
                })
                .on('error', (error) => {
                    console.error('CSV parsing error:', error)
                    resolve(NextResponse.json(
                        { success: false, message: "Error parsing CSV file" },
                        { status: 400 }
                    ))
                })
        })

    } catch (error) {
        console.error("Import verified registrations error:", error)
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        )
    }
}
