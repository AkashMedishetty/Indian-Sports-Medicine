import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { contactFormSchema } from '@/lib/validation/schemas'
import connectDB from '@/lib/mongodb'
import ContactMessage from '@/lib/models/ContactMessage'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Log the incoming data for debugging
    console.log('Contact form data received:', body)
    
    // Validate input
    const validationResult = contactFormSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.issues)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid input data',
          errors: validationResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
        },
        { status: 400 }
      )
    }

    const { name, email, phone, subject, message } = validationResult.data

    // Save contact message to database
    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone: phone || undefined,
      subject,
      message,
      status: 'new',
      priority: 'medium'
    })

    console.log('Contact message saved:', contactMessage._id)

    // TODO: In production, implement email notification to admin
    // This would notify admin about new contact message

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
      messageId: contactMessage._id
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send message. Please try again later.' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve contact messages (for admin)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (status && ['new', 'read', 'replied', 'resolved'].includes(status)) {
      query.status = status
    }
    
    // Get messages with pagination
    const [messages, total] = await Promise.all([
      ContactMessage.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContactMessage.countDocuments(query)
    ])
    
    // Get counts by status
    const counts = await ContactMessage.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
    
    const countsByStatus = counts.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        counts: {
          total,
          byStatus: countsByStatus
        }
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch contact messages:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch messages' 
      },
      { status: 500 }
    )
  }
}