import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/lib/models/Payment'

/**
 * Admin endpoint to fix existing payments that don't have a type field
 * This is a one-time migration script
 * 
 * Usage: GET /api/admin/fix-payment-types
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Find all payments without a type field or with null/undefined type
    const paymentsWithoutType = await Payment.find({
      $or: [
        { type: { $exists: false } },
        { type: null },
        { type: undefined }
      ]
    })

    console.log(`Found ${paymentsWithoutType.length} payments without type field`)

    let fixed = 0
    for (const payment of paymentsWithoutType) {
      // If it has workshops array and no registration amount, it's a workshop addon
      if (payment.workshops && payment.workshops.length > 0 && payment.amount.registration === 0) {
        payment.type = 'workshop-addon'
      } else {
        // Otherwise, it's a registration payment
        payment.type = 'registration'
      }
      await payment.save()
      fixed++
    }

    return NextResponse.json({ 
      success: true,
      message: `Fixed ${fixed} payment records`,
      details: {
        found: paymentsWithoutType.length,
        fixed
      }
    })
  } catch (error: any) {
    console.error('Error fixing payment types:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
