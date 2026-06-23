import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({
        success: false,
        message: 'Invalid JSON in request body'
      }, { status: 400 })
    }
    
    console.log('Email check request body:', body)
    
    const { email } = body

    if (!email) {
      console.log('Email check failed: No email provided')
      return NextResponse.json({
        success: false,
        message: 'Email is required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Email check failed: Invalid email format:', email)
      return NextResponse.json({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 })
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    })

    // Treat pending-payment users as available (they abandoned the gateway)
    const isAvailable = !existingUser || existingUser.registration?.status === 'pending-payment'

    console.log('Email check result:', { email, available: isAvailable, status: existingUser?.registration?.status })
    
    return NextResponse.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Email available' : 'Email already registered'
    })

  } catch (error) {
    console.error('Email check error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}