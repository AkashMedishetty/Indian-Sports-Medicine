import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Workshop from '@/lib/models/Workshop'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Build query
    const query: any = {}
    if (!includeInactive) {
      query.isActive = true
    }

    const workshops = await Workshop.find(query)
      .sort({ registrationStart: 1, name: 1 })
      .lean()

    // Add computed fields
    const now = new Date()
    const workshopsWithStatus = workshops.map(workshop => ({
      ...workshop,
      availableSeats: workshop.maxSeats === 0 ? 999999 : (workshop.maxSeats - workshop.bookedSeats),
      isUnlimited: workshop.maxSeats === 0,
      registrationStatus: getRegistrationStatus(workshop, now),
      canRegister: canRegisterForWorkshop(workshop, now)
    }))

    return NextResponse.json({
      success: true,
      data: workshopsWithStatus
    })

  } catch (error) {
    console.error('Workshops fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getRegistrationStatus(workshop: any, now: Date): string {
  if (now < new Date(workshop.registrationStart)) return 'not-started'
  if (now > new Date(workshop.registrationEnd)) return 'closed'
  if (workshop.maxSeats > 0 && workshop.bookedSeats >= workshop.maxSeats) return 'full'
  return 'open'
}

function canRegisterForWorkshop(workshop: any, now: Date): boolean {
  const seatsAvailable = workshop.maxSeats === 0 || workshop.bookedSeats < workshop.maxSeats
  return workshop.isActive && 
         now >= new Date(workshop.registrationStart) && 
         now <= new Date(workshop.registrationEnd) && 
         seatsAvailable
}