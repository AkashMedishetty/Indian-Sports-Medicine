import { NextResponse } from 'next/server'
import { seedInitialConfiguration } from '@/lib/seed/initialConfig'

export async function POST() {
  try {
    const success = await seedInitialConfiguration()
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Database seeded successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to seed database'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}