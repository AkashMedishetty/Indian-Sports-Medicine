import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ErrorLog from '@/conference-backend-core/lib/models/ErrorLog'
import { logAction } from '@/conference-backend-core/lib/audit/service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { notes } = await request.json()

    const error = await ErrorLog.findById(id)
    if (!error) {
      return NextResponse.json({ success: false, message: 'Error not found' }, { status: 404 })
    }

    error.resolved = true
    error.resolvedBy = sessionUser.email
    error.resolvedAt = new Date()
    error.resolutionNotes = notes || ''
    await error.save()

    await logAction({
      actor: { userId: sessionUser.id, email: sessionUser.email, role: 'admin' },
      action: 'error.resolved',
      resourceType: 'error',
      resourceId: error._id.toString(),
      metadata: { 
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || ''
      },
      description: `Error ${error.errorId} resolved${notes ? `: ${notes}` : ''}`
    })

    return NextResponse.json({ success: true, message: 'Error marked as resolved' })
  } catch (error) {
    console.error('Error resolving error log:', error)
    return NextResponse.json({ success: false, message: 'Failed to resolve error' }, { status: 500 })
  }
}
