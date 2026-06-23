import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import NotificationEmail from '@/lib/models/NotificationEmail'
import { notificationSubscriptionSchema } from '@/lib/validation/schemas'

// Using imported validation schema

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate input
    const validationResult = notificationSubscriptionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }
    
    const { email, source } = validationResult.data
    
    // Check if email already exists for this source
    const existingSubscription = await NotificationEmail.findOne({ 
      email, 
      source,
      isActive: true 
    })
    
    if (existingSubscription) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'You are already subscribed to notifications for this section.',
          data: {
            email,
            source,
            subscribedAt: existingSubscription.subscribedAt
          }
        },
        { status: 200 }
      )
    }
    
    // Create new subscription
    const newSubscription = await NotificationEmail.create({
      email,
      source,
      isActive: true,
      subscribedAt: new Date()
    })
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully subscribed to notifications!',
        data: {
          email: newSubscription.email,
          source: newSubscription.source,
          subscribedAt: newSubscription.subscribedAt
        }
      },
      { status: 201 }
    )
    
  } catch (error: any) {
    console.error('Notification subscription error:', error)
    
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'You are already subscribed to notifications for this section.' 
        },
        { status: 200 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to subscribe to notifications. Please try again.' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve subscriptions (for admin)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = { isActive: true }
    if (source && ['program', 'abstracts', 'venue'].includes(source)) {
      query.source = source
    }
    
    // Get subscriptions with pagination
    const [subscriptions, total] = await Promise.all([
      NotificationEmail.find(query)
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('email source subscribedAt notifiedAt')
        .lean(),
      NotificationEmail.countDocuments(query)
    ])
    
    // Get counts by source
    const counts = await NotificationEmail.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ])
    
    const countsBySource = counts.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        counts: {
          total,
          bySource: countsBySource
        }
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch notification subscriptions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subscriptions' 
      },
      { status: 500 }
    )
  }
}