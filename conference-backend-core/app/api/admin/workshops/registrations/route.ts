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

    if (workshopId) {
      // Get participants for a specific workshop
      const participants = await User.find({
        'registration.workshopSelections': workshopId,
        'registration.status': { $in: ['confirmed', 'paid'] }
      }).select('email profile registration paymentInfo')

      const formattedParticipants = participants.map(user => ({
        _id: user._id,
        email: user.email,
        name: `${user.profile.title} ${user.profile.firstName} ${user.profile.lastName}`,
        institution: user.profile.institution,
        phone: user.profile.phone,
        registrationId: user.registration.registrationId,
        registrationStatus: user.registration.status,
        registrationDate: user.registration.registrationDate,
        paymentDate: user.registration.paymentDate
      }))

      return NextResponse.json({
        success: true,
        data: {
          workshopId,
          registrations: formattedParticipants
        }
      })
    }

    // Get workshop registration summary
    const workshops = [
      {
        id: "joint-replacement",
        name: "Advanced Joint Replacement Techniques",
        instructor: "Dr. Sarah Johnson",
        maxSeats: 30
      },
      {
        id: "spinal-injury",
        name: "Spinal Cord Injury Management",
        instructor: "Dr. Michael Chen",
        maxSeats: 25
      },
      {
        id: "pediatric-orthopaedics",
        name: "Pediatric Orthopaedics",
        instructor: "Dr. Emily Rodriguez",
        maxSeats: 20
      },
      {
        id: "minimally-invasive",
        name: "Minimally Invasive Neurosurgery",
        instructor: "Dr. James Wilson",
        maxSeats: 35
      },
      {
        id: "orthopaedic-rehab",
        name: "Orthopaedic Rehabilitation",
        instructor: "Dr. Lisa Thompson",
        maxSeats: 40
      },
      {
        id: "trauma-surgery",
        name: "Orthopaedic Trauma Surgery",
        instructor: "Dr. Robert Davis",
        maxSeats: 30
      }
    ]

    const workshopStats = await Promise.all(
      workshops.map(async (workshop) => {
        const totalRegistrations = await User.countDocuments({
          'registration.workshopSelections': workshop.id,
          'registration.status': { $in: ['confirmed', 'paid', 'pending'] }
        })

        const paidRegistrations = await User.countDocuments({
          'registration.workshopSelections': workshop.id,
          'registration.status': 'paid'
        })

        const pendingRegistrations = await User.countDocuments({
          'registration.workshopSelections': workshop.id,
          'registration.status': { $in: ['confirmed', 'pending'] }
        })

        const availableSeats = workshop.maxSeats - totalRegistrations
        const registrationStatus = availableSeats <= 0 ? 'full' : 
                                 availableSeats <= 5 ? 'limited' : 'open'

        return {
          workshopId: workshop.id,
          workshopName: workshop.name,
          instructor: workshop.instructor,
          maxSeats: workshop.maxSeats,
          bookedSeats: totalRegistrations,
          totalRegistrations,
          paidRegistrations,
          pendingRegistrations,
          availableSeats: Math.max(0, availableSeats),
          registrationStatus
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: workshopStats
    })

  } catch (error) {
    console.error("Workshop registrations fetch error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}