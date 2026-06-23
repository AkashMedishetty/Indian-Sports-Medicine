import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ProgramConfig from '@/lib/models/ProgramConfig'

// Public endpoint - no auth required
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const config = await ProgramConfig.findOne()
    
    if (!config || !config.isEnabled) {
      return NextResponse.json({ 
        success: true, 
        data: {
          isEnabled: false,
          mode: 'brochure-only'
        }
      })
    }

    // Calculate current session if event is happening
    const now = new Date()
    let currentSession = null
    let currentDay = null

    if (config.mode === 'full-program' && config.program.enabled) {
      for (const day of config.program.days) {
        const dayDate = new Date(day.date)
        const isToday = dayDate.toDateString() === now.toDateString()
        
        if (isToday) {
          currentDay = day
          for (const session of day.sessions) {
            const [startHour, startMin] = session.startTime.split(':').map(Number)
            const [endHour, endMin] = session.endTime.split(':').map(Number)
            
            const sessionStart = new Date(dayDate)
            sessionStart.setHours(startHour, startMin, 0)
            
            const sessionEnd = new Date(dayDate)
            sessionEnd.setHours(endHour, endMin, 0)
            
            if (now >= sessionStart && now <= sessionEnd) {
              currentSession = session
              break
            }
          }
          break
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...config.toObject(),
        currentSession,
        currentDay,
        isLive: !!currentSession
      }
    })
  } catch (error) {
    console.error('Program config fetch error:', error)
    return NextResponse.json({ 
      success: true, 
      data: { isEnabled: false, mode: 'brochure-only' }
    })
  }
}
