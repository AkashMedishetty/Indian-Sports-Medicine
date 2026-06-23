import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function PUT(
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
    const body = await request.json()
    const { paymentType, sponsorName, sponsorCategory, paymentRemarks, status } = body

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Registration not found" },
        { status: 404 }
      )
    }

    // Update registration with special payment information
    const updateData: any = {
      'registration.paymentType': paymentType,
      'registration.paymentRemarks': paymentRemarks
    }

    if (status) {
      updateData['registration.status'] = status
      if (status === 'paid') {
        updateData['registration.paymentDate'] = new Date()
      }
    }

    // Add sponsor information if payment type is sponsored
    if (paymentType === 'sponsored') {
      updateData['registration.sponsorName'] = sponsorName
      updateData['registration.sponsorCategory'] = sponsorCategory
      
      // Also update registration type to sponsored if not already
      updateData['registration.type'] = 'sponsored'
      
      // Set amount to zero for sponsored registrations
      updateData['paymentInfo.amount'] = 0
      updateData['paymentInfo.status'] = 'paid'
    } else if (paymentType === 'complementary') {
      // Update registration type to complimentary if not already
      updateData['registration.type'] = 'complimentary'
      // Clear sponsor fields for complementary
      updateData['registration.sponsorName'] = ''
      updateData['registration.sponsorCategory'] = ''
      
      // Set amount to zero for complementary registrations
      updateData['paymentInfo.amount'] = 0
      updateData['paymentInfo.status'] = 'paid'
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "Failed to update registration" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Registration payment status updated successfully",
      data: updatedUser
    })

  } catch (error) {
    console.error("Special payment update error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}