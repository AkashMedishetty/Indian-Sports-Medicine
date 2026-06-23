import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/conference-backend-core/lib/models/User'
import { logAction } from '@/conference-backend-core/lib/audit/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(userId).select('-password')
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch user'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { email, registration, profile, payment, adminNotes } = body

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    // Build update object and track changes
    const updateObj: any = {}
    const changes: { before: any, after: any, fields: string[] } = {
      before: {},
      after: {},
      fields: []
    }

    // Update email
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email, _id: { $ne: userId } })
      if (existingUser) {
        return NextResponse.json({
          success: false,
          message: 'Email already in use'
        }, { status: 400 })
      }
      updateObj['email'] = email
      changes.before['email'] = user.email
      changes.after['email'] = email
      changes.fields.push('email')
    }

    // Update profile fields
    if (profile) {
      const profileFields = ['title', 'firstName', 'lastName', 'phone', 'institution', 'designation', 'specialization', 'mciNumber', 'dietaryRequirements', 'specialNeeds']
      for (const field of profileFields) {
        if (profile[field] !== undefined && profile[field] !== user.profile?.[field]) {
          updateObj[`profile.${field}`] = profile[field]
          changes.before[`profile.${field}`] = user.profile?.[field]
          changes.after[`profile.${field}`] = profile[field]
          changes.fields.push(`profile.${field}`)
        }
      }
      
      // Handle address fields
      if (profile.address) {
        const addressFields = ['city', 'state', 'country', 'street', 'pincode']
        for (const field of addressFields) {
          if (profile.address[field] !== undefined && profile.address[field] !== user.profile?.address?.[field]) {
            updateObj[`profile.address.${field}`] = profile.address[field]
            changes.before[`profile.address.${field}`] = user.profile?.address?.[field]
            changes.after[`profile.address.${field}`] = profile.address[field]
            changes.fields.push(`profile.address.${field}`)
          }
        }
      }
    }

    // Update registration fields
    if (registration) {
      const regFields = ['type', 'status', 'paymentType', 'membershipNumber', 'sponsorId', 'sponsorName']
      for (const field of regFields) {
        if (registration[field] !== undefined && registration[field] !== user.registration?.[field]) {
          updateObj[`registration.${field}`] = registration[field]
          changes.before[`registration.${field}`] = user.registration?.[field]
          changes.after[`registration.${field}`] = registration[field]
          changes.fields.push(`registration.${field}`)
        }
      }
      
      // Handle workshop selections
      if (registration.workshopSelections) {
        const currentWorkshops = user.registration?.workshopSelections || []
        const newWorkshops = registration.workshopSelections
        if (JSON.stringify(currentWorkshops) !== JSON.stringify(newWorkshops)) {
          updateObj['registration.workshopSelections'] = newWorkshops
          changes.before['registration.workshopSelections'] = currentWorkshops
          changes.after['registration.workshopSelections'] = newWorkshops
          changes.fields.push('registration.workshopSelections')
        }
      }

      // Handle accommodation
      if (registration.accommodation !== undefined) {
        const currentAccom = user.registration?.accommodation || {}
        const newAccom = registration.accommodation
        if (JSON.stringify(currentAccom) !== JSON.stringify(newAccom)) {
          updateObj['registration.accommodation'] = newAccom
          changes.before['registration.accommodation'] = currentAccom
          changes.after['registration.accommodation'] = newAccom
          changes.fields.push('registration.accommodation')
        }
      }
    }

    // Update payment fields
    if (payment) {
      const paymentFields = ['method', 'status', 'amount']
      for (const field of paymentFields) {
        if (payment[field] !== undefined && payment[field] !== '' && payment[field] !== user.payment?.[field]) {
          updateObj[`payment.${field}`] = payment[field]
          changes.before[`payment.${field}`] = user.payment?.[field]
          changes.after[`payment.${field}`] = payment[field]
          changes.fields.push(`payment.${field}`)
        }
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes to save'
      })
    }

    // Apply updates
    await User.findByIdAndUpdate(userId, updateObj)

    // Log the action
    await logAction({
      actor: {
        userId: sessionUser.id,
        email: sessionUser.email,
        role: 'admin'
      },
      action: 'user.updated',
      resourceType: 'user',
      resourceId: userId,
      changes,
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      description: adminNotes || undefined
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update user'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const userName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim()
    const userEmail = user.email
    const registrationId = user.registration?.registrationId

    // If user had workshop bookings, decrement booked seats
    if (user.registration?.workshopSelections?.length > 0) {
      try {
        const Workshop = (await import('@/lib/models/Workshop')).default
        for (const workshopId of user.registration.workshopSelections) {
          await Workshop.findOneAndUpdate(
            { id: workshopId, bookedSeats: { $gt: 0 } },
            { $inc: { bookedSeats: -1 } }
          )
        }
      } catch (e) {
        console.error('Error releasing workshop seats:', e)
      }
    }

    // If sponsored, decrement sponsor allocation
    if (user.registration?.sponsorId) {
      try {
        await User.findByIdAndUpdate(user.registration.sponsorId, {
          $inc: { 'sponsorProfile.allocation.used': -1 }
        })
      } catch (e) {
        console.error('Error updating sponsor allocation:', e)
      }
    }

    // Delete the user
    await User.findByIdAndDelete(userId)

    // Log the action
    await logAction({
      actor: {
        userId: sessionUser.id,
        email: sessionUser.email,
        role: 'admin'
      },
      action: 'user.deleted',
      resourceType: 'user',
      resourceId: userId,
      resourceName: userName,
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      description: `Deleted registration for ${userName} (${userEmail}, ${registrationId})`
    })

    return NextResponse.json({
      success: true,
      message: `Registration for ${userName} has been deleted`
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete registration' }, { status: 500 })
  }
}
