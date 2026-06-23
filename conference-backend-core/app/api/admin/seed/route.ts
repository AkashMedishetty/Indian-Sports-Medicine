import { NextRequest, NextResponse } from 'next/server'
import { seedInitialConfiguration } from '@/lib/seed/initialConfig'

export async function POST(request: NextRequest) {
  try {
    // In production, you might want to add authentication here
    // For now, we'll allow seeding for development
    
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
    console.error('Seed API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}