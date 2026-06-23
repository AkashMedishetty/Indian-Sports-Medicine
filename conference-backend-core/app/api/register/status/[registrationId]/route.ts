import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const { registrationId } = await params
    
    await connectDB()

    // Find user by registration ID
    const user = await User.findOne({
      'registration.registrationId': registrationId
    }).select({
      email: 1,
      'profile.title': 1,
      'profile.firstName': 1,
      'profile.lastName': 1,
      'profile.institution': 1,
      'registration.registrationId': 1,
      'registration.status': 1,
      'registration.type': 1,
      'registration.registrationDate': 1,
      'registration.paymentDate': 1,
      'registration.workshopSelections': 1,
      'payment.status': 1,
      'payment.amount': 1,
      'payment.paymentDate': 1
    }).lean() as any

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Registration not found. Please check your registration ID.'
      }, { status: 404 })
    }

    const registration = {
      registrationId: user.registration?.registrationId,
      status: user.registration?.status,
      type: user.registration?.type,
      name: `${user.profile?.title || ''} ${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
      email: user.email,
      institution: user.profile?.institution,
      registrationDate: user.registration?.registrationDate,
      paymentStatus: user.payment?.status,
      paymentDate: user.payment?.paymentDate || user.registration?.paymentDate,
      paymentAmount: user.payment?.amount,
      workshopSelections: user.registration?.workshopSelections
    }

    return NextResponse.json({
      success: true,
      registration
    })
  } catch (error) {
    console.error('Error fetching registration status:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch registration status'
    }, { status: 500 })
  }
}
