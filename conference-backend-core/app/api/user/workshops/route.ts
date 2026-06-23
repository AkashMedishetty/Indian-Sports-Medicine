import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB  from "@/lib/mongodb"
import Workshop from "@/lib/models/Workshop"
import User from "@/lib/models/User"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    console.log('Workshop API - Received body:', JSON.stringify(body, null, 2))
    
    // Support both workshopSelections (PUT) and workshopIds (POST from frontend)
    const workshopSelections = body.workshopSelections || body.workshopIds
    console.log('Workshop API - Parsed selections:', workshopSelections)
    
    if (!Array.isArray(workshopSelections)) {
      console.log('Workshop API - ERROR: Not an array, received:', typeof workshopSelections, workshopSelections)
      return NextResponse.json(
        { success: false, message: "Invalid workshop selections. Expected an array." },
        { status: 400 }
      )
    }

    const user = await User.findById((session.user as any).id)
    if (!user) {
      console.log('Workshop API - ERROR: User not found, ID:', (session.user as any).id)
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    console.log('Workshop API - User found:', user.email, 'Status:', user.registration.status)

    // Workshops are addons - can be added/modified anytime
    // No need to check payment status since workshops are separate addon purchases

    // Check for duplicate workshops - prevent user from adding same workshop twice
    const existingSelections = user.registration.workshopSelections || []
    const duplicates = workshopSelections.filter(id => existingSelections.includes(id))
    if (duplicates.length > 0) {
      console.log('Workshop API - ERROR: Duplicate workshops detected:', duplicates)
      return NextResponse.json(
        { success: false, message: `You have already registered for: ${duplicates.join(', ')}` },
        { status: 400 }
      )
    }

    // Check workshop availability
    const workshops = await Workshop.find({ id: { $in: workshopSelections } })
    console.log('Workshop API - Found workshops:', workshops.length, 'for IDs:', workshopSelections)
    
    for (const workshopId of workshopSelections) {
      const workshop = workshops.find(w => w.id === workshopId)
      if (!workshop) {
        console.log('Workshop API - ERROR: Workshop not found, ID:', workshopId)
        return NextResponse.json(
          { success: false, message: `Workshop with ID "${workshopId}" not found` },
          { status: 404 }
        )
      }
      
      console.log(`Workshop API - Checking "${workshop.name}": ${workshop.bookedSeats}/${workshop.maxSeats} seats`)
      
      if (workshop.bookedSeats >= workshop.maxSeats) {
        console.log('Workshop API - ERROR: Workshop full')
        return NextResponse.json(
          { success: false, message: `Workshop "${workshop.name}" is full` },
          { status: 400 }
        )
      }

      // Check if registration is open
      const now = new Date()
      if (now < workshop.registrationStart || now > workshop.registrationEnd) {
        console.log('Workshop API - ERROR: Registration not open. Now:', now, 'Start:', workshop.registrationStart, 'End:', workshop.registrationEnd)
        return NextResponse.json(
          { success: false, message: `Registration for "${workshop.name}" is not open` },
          { status: 400 }
        )
      }
    }

    // DO NOT add workshops to user selections here - only after payment confirmation
    // Workshop selections will be updated in payment verification callback
    
    console.log('Workshop API - SUCCESS: Payment record will be created for user:', user.email)

    // Import Payment model if not already imported
    const Payment = (await import('@/lib/models/Payment')).default

    // Calculate total workshop amount
    const totalWorkshopAmount = workshops.reduce((sum, workshop) => {
      if (workshopSelections.includes(workshop.id)) {
        return sum + workshop.price
      }
      return sum
    }, 0)

    // Create payment record for workshop addon
    // NOTE: razorpayOrderId will be added when user initiates payment
    // Seats will be updated in the payment verification webhook after successful payment
    if (totalWorkshopAmount > 0) {
      const payment = new Payment({
        userId: user._id,
        registrationId: user.registration.registrationId,
        type: 'workshop-addon',
        workshopIds: workshopSelections,
        workshops: workshops.map(w => ({
          workshopId: w.id,
          workshopName: w.name,
          price: w.price
        })),
        amount: {
          registration: 0,
          workshops: totalWorkshopAmount,
          accompanyingPersons: 0,
          discount: 0,
          total: totalWorkshopAmount,
          currency: workshops[0]?.currency || 'INR'
        },
        breakdown: {
          registrationType: user.registration.type,
          baseAmount: 0,
          workshopFees: workshops.map(w => ({
            name: w.name,
            amount: w.price
          })),
          accompanyingPersonFees: 0,
          discountsApplied: []
        },
        status: 'pending',
        paymentMethod: 'pending'
        // razorpayOrderId: will be added when payment is initiated
        // razorpayPaymentId: will be added after payment completion
        // razorpaySignature: will be added after payment completion
      })

      await payment.save()
      console.log('Workshop API - Payment record created (pending):', payment._id, 'Amount:', totalWorkshopAmount)

      return NextResponse.json({
        success: true,
        message: "Workshops reserved. Please complete payment to confirm registration.",
        data: {
          workshopsReserved: workshopSelections,  // Workshops pending payment
          paymentRequired: true,
          paymentAmount: totalWorkshopAmount,
          currency: workshops[0]?.currency || 'INR',
          paymentId: payment._id
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Workshop selections updated successfully",
      data: {
        workshopSelections: user.registration.workshopSelections,
        paymentRequired: false
      }
    })

  } catch (error) {
    console.error("Update workshop selections error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST method - same as PUT for updating workshop selections
export async function POST(request: NextRequest) {
  return PUT(request)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findById((session.user as any).id)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    // Get workshop details for user's selections
    const workshops = await Workshop.find({ 
      id: { $in: user.registration.workshopSelections },
      isActive: true 
    })

    return NextResponse.json({
      success: true,
      data: {
        workshopSelections: user.registration.workshopSelections,
        workshops: workshops,
        canEdit: true  // Always allow adding workshops (they are addons)
      }
    })

  } catch (error) {
    console.error("Get workshop selections error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}