import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ProgramConfig from '@/lib/models/ProgramConfig'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    await connectDB()
    let config = await ProgramConfig.findOne()
    
    if (!config) {
      // Create default config
      config = await ProgramConfig.create({
        isEnabled: false,
        mode: 'brochure-only',
        brochure: {
          enabled: false,
          title: 'Conference Program',
          description: ''
        },
        program: {
          enabled: false,
          title: 'Conference Program',
          days: [],
          venues: [],
          guidelines: []
        },
        settings: {
          showLiveIndicator: true,
          highlightCurrentSession: true,
          showSpeakerPhotos: true,
          allowDownload: true
        }
      })
    }

    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('Program config fetch error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    await connectDB()

    const updated = await ProgramConfig.findOneAndUpdate(
      {},
      body,
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Program config update error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
