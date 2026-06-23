import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { getErrorsForUser } from '@/conference-backend-core/lib/errors/service'

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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')
    const category = searchParams.get('category') || undefined
    const severity = searchParams.get('severity') || undefined
    const resolved = searchParams.get('resolved')

    const result = await getErrorsForUser(userId, {
      limit,
      skip,
      category: category as any,
      severity: severity as any,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined
    })

    // Transform for frontend
    const errors = result.errors.map(error => ({
      errorId: error.errorId,
      message: error.message,
      severity: error.severity,
      category: error.category,
      lastOccurrence: error.lastOccurrence,
      occurrences: error.occurrences,
      resolved: error.resolved,
      device: error.device ? {
        browser: error.device.browser,
        os: error.device.os,
        ip: error.device.ip
      } : undefined
    }))

    return NextResponse.json({
      success: true,
      errors,
      total: result.total
    })
  } catch (error) {
    console.error('Error fetching user errors:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch error logs'
    }, { status: 500 })
  }
}
