import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import  connectDB  from "@/lib/mongodb"
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

    // If it's just a status update
    if (body.status && Object.keys(body).length === 1) {
      const updateData: any = {
        'registration.status': body.status
      }

      if (body.status === 'paid') {
        updateData['registration.paymentDate'] = new Date().toISOString()
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      )

      if (!user) {
        return NextResponse.json(
          { success: false, message: "Registration not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Status updated successfully",
        data: user
      })
    }

    // Full registration update
    const user = await User.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Registration not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Registration updated successfully",
      data: user
    })

  } catch (error) {
    console.error("Update registration error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { 'registration.status': 'cancelled' } },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Registration not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Registration cancelled successfully",
      data: user
    })

  } catch (error) {
    console.error("Cancel registration error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}