import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import { logAction } from '@/conference-backend-core/lib/audit/service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const { abstractIds, action, status } = await request.json()

    if (!abstractIds || !Array.isArray(abstractIds) || abstractIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Abstract IDs are required' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ success: false, message: 'Action is required' }, { status: 400 })
    }

    await connectDB()

    let updatedCount = 0
    const errors: string[] = []

    switch (action) {
      case 'update-status':
        if (!status) {
          return NextResponse.json({ success: false, message: 'Status is required for update-status action' }, { status: 400 })
        }
        
        const validStatuses = ['submitted', 'under-review', 'accepted', 'rejected', 'final-submitted']
        if (!validStatuses.includes(status)) {
          return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 })
        }

        const result = await Abstract.updateMany(
          { _id: { $in: abstractIds } },
          { 
            $set: { 
              status,
              ...(status === 'accepted' || status === 'rejected' ? { decisionAt: new Date() } : {})
            } 
          }
        )
        updatedCount = result.modifiedCount
        break

      case 'delete':
        const deleteResult = await Abstract.deleteMany({ _id: { $in: abstractIds } })
        updatedCount = deleteResult.deletedCount
        break

      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
    }

    // Log the action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    
    await logAction({
      actor: {
        userId,
        email: session.user.email || '',
        role: userRole,
        name: session.user.name || ''
      },
      action: `abstracts.bulk_${action}`,
      resourceType: 'abstract',
      resourceId: 'bulk',
      resourceName: `${abstractIds.length} abstracts`,
      metadata: { ip, userAgent },
      changes: {
        before: { count: abstractIds.length },
        after: { action, status, updatedCount }
      },
      description: `Admin performed bulk ${action} on ${abstractIds.length} abstracts${status ? ` (status: ${status})` : ''}`
    })

    return NextResponse.json({ 
      success: true, 
      updatedCount,
      message: `${updatedCount} abstracts updated successfully`
    })

  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
