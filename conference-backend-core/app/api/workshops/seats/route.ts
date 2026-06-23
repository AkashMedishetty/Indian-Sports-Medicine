import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import  connectDB  from "@/lib/mongodb"
import Workshop from "@/lib/models/Workshop"
import User from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    const { workshopIds, action } = await request.json()
    
    if (!workshopIds || !Array.isArray(workshopIds)) {
      return NextResponse.json(
        { success: false, message: "Invalid workshop IDs" },
        { status: 400 }
      )
    }

    const user = await User.findById((session.user as any).id)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    if (action === 'reserve') {
      // Reserve seats temporarily (for unpaid registrations)
      const workshops = await Workshop.find({ id: { $in: workshopIds } })
      
      for (const workshop of workshops) {
        if (workshop.bookedSeats >= workshop.maxSeats) {
          return NextResponse.json(
            { success: false, message: `Workshop "${workshop.name}" is full` },
            { status: 400 }
          )
        }
      }

      // Update user's workshop selections
      user.registration.workshopSelections = workshopIds
      await user.save()

      return NextResponse.json({
        success: true,
        message: "Workshop selections updated (seats reserved temporarily)"
      })

    } else if (action === 'confirm') {
      // Confirm seats (after payment)
      const workshops = await Workshop.find({ id: { $in: workshopIds } })
      
      for (const workshop of workshops) {
        if (workshop.bookedSeats >= workshop.maxSeats) {
          return NextResponse.json(
            { success: false, message: `Workshop "${workshop.name}" is full` },
            { status: 400 }
          )
        }
        
        // Increment booked seats
        await Workshop.findByIdAndUpdate(
          workshop._id,
          { $inc: { bookedSeats: 1 } }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Workshop seats confirmed"
      })

    } else if (action === 'release') {
      // Release seats (when user changes selection or cancels)
      const workshops = await Workshop.find({ id: { $in: workshopIds } })
      
      for (const workshop of workshops) {
        if (workshop.bookedSeats > 0) {
          await Workshop.findByIdAndUpdate(
            workshop._id,
            { $inc: { bookedSeats: -1 } }
          )
        }
      }

      return NextResponse.json({
        success: true,
        message: "Workshop seats released"
      })
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Workshop seat management error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}