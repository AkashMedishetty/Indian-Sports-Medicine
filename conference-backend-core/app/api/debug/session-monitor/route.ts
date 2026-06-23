import { NextRequest, NextResponse } from 'next/server'
import { sessionMonitor } from '@/lib/utils/session-monitor'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const minutes = parseInt(url.searchParams.get('minutes') || '30')
    
    const recentEvents = sessionMonitor.getRecentEvents(minutes)
    const stats = sessionMonitor.getStats()
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      timeWindow: `${minutes} minutes`,
      stats,
      events: recentEvents,
      analysis: {
        hasConflicts: stats.conflictCount > 0,
        highErrorRate: stats.errorRate > 20,
        multipleUsers: stats.uniqueUsers > 1,
        recommendations: generateRecommendations(stats)
      }
    })
  } catch (error) {
    console.error('Session monitor API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function generateRecommendations(stats: any): string[] {
  const recommendations: string[] = []
  
  if (stats.errorRate > 20) {
    recommendations.push('High error rate detected - check JWT configuration and NEXTAUTH_SECRET')
  }
  
  if (stats.conflictCount > 0) {
    recommendations.push('Session conflicts detected - multiple users may be interfering with each other')
  }
  
  if (stats.uniqueUsers > 3) {
    recommendations.push('Multiple concurrent users - ensure session isolation is working properly')
  }
  
  if (stats.errorCount > 10) {
    recommendations.push('Frequent errors - consider implementing session recovery mechanisms')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Session monitoring looks healthy')
  }
  
  return recommendations
}

export async function DELETE() {
  try {
    sessionMonitor.clear()
    return NextResponse.json({
      success: true,
      message: 'Session monitor events cleared',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}