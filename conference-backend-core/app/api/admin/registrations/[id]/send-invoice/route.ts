import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import Payment from "@/lib/models/Payment"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params

        const user = await User.findById(id)
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Registration not found" },
                { status: 404 }
            )
        }

        // Get payment information
        let payment = await Payment.findOne({ userId: user._id }).sort({ createdAt: -1 })

        // Fallback to embedded bank-transfer payment on user document
        const useEmbedded = !payment && user.payment && typeof user.payment.amount === 'number'
        if (!payment && !useEmbedded) {
            return NextResponse.json(
                { success: false, message: "No payment found for this registration" },
                { status: 404 }
            )
        }

        // Send invoice email
        try {
            const { EmailService } = await import('@/lib/email/service')

            if (useEmbedded) {
                // Fetch registration type label from conference config
                const { conferenceConfig } = await import('@/conference-backend-core/config/conference.config')
                const registrationCategory = conferenceConfig.registration.categories.find(
                    (cat: any) => cat.key === user.registration.type
                )
                const registrationTypeLabel = registrationCategory?.label || user.registration.type
                
                await EmailService.sendPaymentConfirmation({
                    userId: user._id.toString(),
                    email: user.email,
                    name: `${user.profile.firstName} ${user.profile.lastName}`,
                    registrationId: user.registration.registrationId,
                    amount: user.payment.amount,
                    currency: 'INR',
                    transactionId: user.payment.bankTransferUTR || user.payment.transactionId || 'BANK-TRANSFER',
                    paymentDate: (user.payment.paymentDate || new Date()).toLocaleDateString('en-IN'),
                    breakdown: {
                        registrationType: user.registration.type,
                        registrationTypeLabel: registrationTypeLabel,
                        baseAmount: user.payment.amount,
                        registration: user.payment.amount,
                        workshopFees: [],
                        workshops: 0,
                        accompanyingPersonCount: 0,
                        accompanyingPersonDetails: [],
                        accompanyingPersons: 0,
                        accompanyingPersonFees: 0,
                        discount: 0,
                        discountsApplied: [],
                        paymentMethod: 'bank_transfer'
                    }
                })
            } else if (payment) {
                // Use stored breakdown from Payment record
                // Fetch registration type label from conference config
                const { conferenceConfig } = await import('@/conference-backend-core/config/conference.config')
                const registrationCategory = conferenceConfig.registration.categories.find(
                    (cat: any) => cat.key === user.registration.type
                )
                const registrationTypeLabel = registrationCategory?.label || payment.breakdown?.registrationTypeLabel || user.registration.type
                
                await EmailService.sendPaymentConfirmation({
                    userId: user._id.toString(),
                    email: user.email,
                    name: `${user.profile.firstName} ${user.profile.lastName}`,
                    registrationId: user.registration.registrationId,
                    amount: payment.amount.total,
                    currency: payment.amount.currency,
                    transactionId: payment.razorpayPaymentId || payment.razorpayOrderId || 'N/A',
                    paymentDate: payment.transactionDate ? payment.transactionDate.toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
                    breakdown: {
                        ...payment.breakdown,
                        registrationTypeLabel: registrationTypeLabel,
                        registration: payment.amount.registration,
                        workshops: payment.amount.workshops,
                        accompanyingPersons: payment.amount.accompanyingPersons,
                        discount: payment.amount.discount
                    }
                })
            }

            return NextResponse.json({
                success: true,
                message: "Invoice sent successfully"
            })

        } catch (emailError) {
            console.error('Invoice sending error:', emailError)
            return NextResponse.json(
                { success: false, message: "Failed to send invoice" },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error("Send invoice error:", error)
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        )
    }
}