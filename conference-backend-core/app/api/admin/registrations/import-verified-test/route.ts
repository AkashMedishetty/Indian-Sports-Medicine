import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { generateRegistrationId } from "@/lib/utils/generateId"
import csv from 'csv-parser'
import { Readable } from 'stream'
import bcrypt from 'bcryptjs'

/**
 * TEST MODE - Import verified registrations (DRY RUN)
 * This endpoint simulates the import process WITHOUT:
 * - Creating actual user accounts
 * - Sending real emails
 * - Saving to database
 * 
 * Use this to test CSV format and validation safely
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || (session.user as any).role !== 'admin') {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            )
        }

        await connectDB()

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
        let processed = 0
        let errors: string[] = []
        const simulatedImports: any[] = []

        return new Promise<NextResponse>((resolve) => {
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    console.log('🧪 TEST MODE - Processing CSV data (no database changes)')
                    
                    for (const row of results) {
                        try {
                            if (!row['Email'] || !row['Name']) {
                                errors.push(`Row missing required fields (Email or Name): ${JSON.stringify(row)}`)
                                continue
                            }

                            // Generate unique registration ID for each user (simulate uniqueness in test mode)
                            let registrationId = await generateRegistrationId()
                            let attempts = 0
                            
                            // In test mode, we need to track generated IDs since we're not saving to DB
                            const usedIds = simulatedImports.map(imp => imp.registrationId)
                            
                            while (attempts < 10) {
                                // Check both database (real check) and our simulated list (test mode check)
                                const existingReg = await User.findOne({ 'registration.registrationId': registrationId })
                                const alreadyUsedInTest = usedIds.includes(registrationId)
                                
                                if (!existingReg && !alreadyUsedInTest) break
                                
                                registrationId = await generateRegistrationId()
                                attempts++
                            }

                            // Parse name (split into first and last name)
                            const fullName = row['Name'].trim()
                            const nameParts = fullName.split(' ')
                            let firstName = fullName
                            let lastName = ''
                            
                            if (nameParts.length > 1) {
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

                            const registrationType = mapRegistrationType(row['Registration Type'] || 'consultant')
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

                            // Check if user already exists
                            const existingUser = await User.findOne({ email: row['Email'].toLowerCase().trim() })

                            if (existingUser) {
                                errors.push(`User with email ${row['Email']} already exists`)
                                continue
                            }

                            // Parse accompanying persons count
                            const accompanyingCount = parseInt(row['Accompanying Persons'] || '0') || 0
                            const accompanyingPersons: any[] = []
                            
                            // If there are accompanying person names, parse them (match your schema structure)
                            if (accompanyingCount > 0 && row['Accompanying Person Names']) {
                                const names = row['Accompanying Person Names'].split(',')
                                names.forEach((name: string, index: number) => {
                                    if (name.trim() && index < accompanyingCount) {
                                        accompanyingPersons.push({
                                            name: name.trim(),
                                            dietaryRequirements: "", // Match your schema
                                            relationship: "friend" // Match your schema default
                                            // Note: Removed age field as it's not in your schema
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

                            // Create complete user data structure that matches your database schema
                            const userData = {
                                email: row['Email'].toLowerCase().trim(),
                                password: `[WOULD_HASH: ${generatedPassword}]`, // Would be bcrypt hashed
                                generatedPassword: generatedPassword, // Store for logging and email
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
                                    mciNumber: mciNumber, // Note: mciNumber is at profile level, not address
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
                                    status: 'paid', // Match your schema: 'paid' not 'confirmed'
                                    tier: 'Standard', // Add tier field
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
                                    // Note: Removed bankTransferUTR, transactionId, verifiedBy, verificationDate as they're not in your schema
                                },
                                role: 'user',
                                isActive: true,
                                activeSessions: [] // Initialize empty sessions array
                            }

                            // 🧪 DETAILED LOGGING - Show exactly what would be stored
                            console.log(`\n🧪 === WOULD CREATE USER ${processed + 1} ===`)
                            console.log(`📧 Email: ${userData.email}`)
                            console.log(`👤 Name: ${userData.profile.firstName} ${userData.profile.lastName}`)
                            console.log(`🎫 Registration ID: ${userData.registration.registrationId}`)
                            console.log(`🔑 Generated Password: ${userData.generatedPassword} (${phone ? 'RegID + phone last 4' : 'RegID + RegID last 4'})`)
                            console.log(`📋 Type: ${userData.registration.type}`)
                            console.log(`💰 Amount: ₹${userData.payment.amount}`)
                            console.log(`🏦 Transaction ID: ${transactionId || 'Not provided'}`)
                            console.log(`📱 Phone: ${userData.profile.phone}`)
                            console.log(`🏥 Institution: ${userData.profile.institution}`)
                            console.log(`🆔 MCI Number: ${userData.profile.mciNumber}`)
                            console.log(`📍 Location: ${userData.profile.address.city}, ${userData.profile.address.state}, ${userData.profile.address.country}`)
                            console.log(`👥 Accompanying Persons: ${userData.registration.accompanyingPersons.length}`)
                            if (userData.registration.accompanyingPersons.length > 0) {
                                userData.registration.accompanyingPersons.forEach((person, idx) => {
                                    console.log(`   ${idx + 1}. ${person.name} (${person.relationship}) - Diet: ${person.dietaryRequirements || 'None'}`)
                                })
                            }
                            console.log(`✅ Registration Status: ${userData.registration.status}`)
                            console.log(`🎯 Registration Tier: ${userData.registration.tier}`)
                            console.log(`💳 Payment Status: ${userData.payment.status}`)
                            console.log(`💸 Payment Method: ${userData.payment.method}`)
                            console.log(`🔐 Role: ${userData.role}`)
                            console.log(`🟢 Active: ${userData.isActive}`)
                            console.log(`📅 Registration Date: ${userData.registration.registrationDate}`)
                            console.log(`💸 Payment Date: ${userData.payment.paymentDate}`)
                            console.log(`📝 Payment Remarks: ${userData.payment.remarks}`)
                            console.log(`🧪 === END USER ${processed + 1} ===\n`)

                            processed++

                            simulatedImports.push({
                                email: userData.email,
                                name: `${userData.profile.firstName} ${userData.profile.lastName}`,
                                registrationId: userData.registration.registrationId,
                                registrationType: userData.registration.type,
                                amount: userData.payment.amount,
                                transactionId: (userData.payment as any).transactionId || (userData.payment as any).bankTransferUTR,
                                phone: userData.profile.phone,
                                mciNumber: userData.profile.mciNumber,
                                accompanyingPersons: userData.registration.accompanyingPersons,
                                fullUserData: userData // Include complete data structure
                            })

                        } catch (error) {
                            console.error('Test import row error:', error)
                            errors.push(`Error processing row: ${row['Email'] || 'unknown'} - ${error instanceof Error ? error.message : 'Unknown error'}`)
                        }
                    }

                    // 🧪 SIMULATE - Don't actually send emails
                    console.log(`🧪 Would send ${simulatedImports.length} acceptance emails with QR codes`)

                    resolve(NextResponse.json({
                        success: true,
                        testMode: true,
                        processed: processed,
                        wouldImport: simulatedImports.length,
                        wouldSendEmails: simulatedImports.length,
                        errors: errors.length > 0 ? errors : undefined,
                        simulatedData: simulatedImports.slice(0, 5), // Show first 5 for preview
                        message: `🧪 TEST MODE: Successfully processed ${processed} rows. Would import ${simulatedImports.length} registrations and send ${simulatedImports.length} emails${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
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
        console.error("Test import error:", error)
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        )
    }
}
