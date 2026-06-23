import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Workshop from '@/lib/models/Workshop'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    const workshops = await Workshop.find({})
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: workshops
    })

  } catch (error) {
    console.error('Admin workshops fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      id,
      name,
      description,
      instructor,
      duration,
      price,
      currency,
      maxSeats,
      registrationStart,
      registrationEnd,
      workshopDate,
      workshopTime,
      venue,
      prerequisites,
      materials,
      isActive
    } = body

    // Validate required fields (only truly required ones)
    if (!id || !name || price === undefined || price === null || !maxSeats) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: id, name, price, maxSeats'
      }, { status: 400 })
    }

    // Validate dates if provided
    let regStart: Date | null = null
    let regEnd: Date | null = null
    
    if (registrationStart && registrationEnd) {
      regStart = new Date(registrationStart)
      regEnd = new Date(registrationEnd)

      if (regStart >= regEnd) {
        return NextResponse.json({
          success: false,
          message: 'Registration start date must be before end date'
        }, { status: 400 })
      }
    }

    // Only validate workshop date if both workshop date and registration end are provided
    if (workshopDate && regEnd) {
      const wsDate = new Date(workshopDate)
      if (regEnd > wsDate) {
        return NextResponse.json({
          success: false,
          message: 'Registration end date must be before workshop date'
        }, { status: 400 })
      }
    }

    // Check if workshop ID already exists
    const existingWorkshop = await Workshop.findOne({ id })
    if (existingWorkshop) {
      return NextResponse.json({
        success: false,
        message: 'Workshop ID already exists'
      }, { status: 409 })
    }

    const workshop = new Workshop({
      id,
      name,
      description: description || '',
      instructor: instructor || '',
      duration: duration || '',
      price: parseFloat(price) || 0,
      currency: currency || 'INR',
      maxSeats: parseInt(maxSeats),
      bookedSeats: 0,
      registrationStart: regStart || undefined,
      registrationEnd: regEnd || undefined,
      workshopDate: workshopDate ? new Date(workshopDate) : undefined,
      workshopTime: workshopTime || '',
      venue: venue || '',
      prerequisites: prerequisites || '',
      materials: materials || '',
      isActive: isActive !== false,
      canRegister: body.canRegister !== false
    })

    await workshop.save()

    return NextResponse.json({
      success: true,
      message: 'Workshop created successfully',
      data: workshop
    })

  } catch (error) {
    console.error('Workshop creation error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { workshopId, ...updateData } = body

    if (!workshopId) {
      return NextResponse.json({
        success: false,
        message: 'Workshop ID is required'
      }, { status: 400 })
    }

    // Validate dates if provided
    if (updateData.registrationStart && updateData.registrationEnd) {
      const regStart = new Date(updateData.registrationStart)
      const regEnd = new Date(updateData.registrationEnd)

      if (regStart >= regEnd) {
        return NextResponse.json({
          success: false,
          message: 'Registration start date must be before end date'
        }, { status: 400 })
      }
    }

    const workshop = await Workshop.findOneAndUpdate(
      { id: workshopId },
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!workshop) {
      return NextResponse.json({
        success: false,
        message: 'Workshop not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Workshop updated successfully',
      data: workshop
    })

  } catch (error) {
    console.error('Workshop update error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { workshopId } = body

    if (!workshopId) {
      return NextResponse.json({
        success: false,
        message: 'Workshop ID is required'
      }, { status: 400 })
    }

    // Check if workshop has any registrations
    const registrationCount = await User.countDocuments({
      'registration.workshopSelections': workshopId
    })

    if (registrationCount > 0) {
      return NextResponse.json({
        success: false,
        message: `Cannot delete workshop. ${registrationCount} user(s) have registered for this workshop.`
      }, { status: 400 })
    }

    const workshop = await Workshop.findOneAndDelete({ id: workshopId })

    if (!workshop) {
      return NextResponse.json({
        success: false,
        message: 'Workshop not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Workshop deleted successfully'
    })

  } catch (error) {
    console.error('Workshop deletion error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}