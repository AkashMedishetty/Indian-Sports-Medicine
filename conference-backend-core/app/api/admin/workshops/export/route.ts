import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const workshopId = searchParams.get('workshopId')

    if (!workshopId) {
      return NextResponse.json(
        { success: false, message: "Workshop ID is required" },
        { status: 400 }
      )
    }

    // Get participants for the specific workshop
    const participants = await User.find({
      'registration.workshopSelections': workshopId,
      'registration.status': { $in: ['confirmed', 'paid', 'pending'] }
    }).select('email profile registration paymentInfo')

    // Create CSV content
    const csvHeaders = [
      'Registration ID',
      'Name',
      'Email',
      'Phone',
      'Institution',
      'City',
      'State',
      'Country',
      'Registration Status',
      'Registration Date',
      'Payment Date',
      'Payment Amount',
      'Dietary Requirements',
      'Special Needs'
    ]

    const csvRows = participants.map(user => [
      user.registration.registrationId,
      `${user.profile.title} ${user.profile.firstName} ${user.profile.lastName}`,
      user.email,
      user.profile.phone,
      user.profile.institution,
      user.profile.address?.city || '',
      user.profile.address?.state || '',
      user.profile.address?.country || '',
      user.registration.status,
      new Date(user.registration.registrationDate).toLocaleDateString(),
      user.registration.paymentDate ? new Date(user.registration.paymentDate).toLocaleDateString() : '',
      user.paymentInfo ? `${user.paymentInfo.currency} ${user.paymentInfo.amount}` : '',
      user.profile.dietaryRequirements || '',
      user.profile.specialNeeds || ''
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="workshop-${workshopId}-participants.csv"`
      }
    })

  } catch (error) {
    console.error("Workshop export error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}