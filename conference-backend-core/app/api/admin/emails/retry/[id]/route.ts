import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmailQueue from '@/conference-backend-core/lib/models/EmailQueue'
import { logAction } from '@/conference-backend-core/lib/audit/service'

export async function POST(
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

    const email = await EmailQueue.findById(id)
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email not found' }, { status: 404 })
    }

    if (!['failed', 'dead'].includes(email.status)) {
      return NextResponse.json({ success: false, message: 'Can only retry failed or dead emails' }, { status: 400 })
    }

    // Reset for retry
    email.status = 'queued'
    email.attempts = 0
    email.error = undefined
    email.nextRetry = new Date()
    await email.save()

    await logAction({
      actor: { userId: sessionUser.id, email: sessionUser.email, role: 'admin' },
      action: 'email.resent',
      resourceType: 'email',
      resourceId: email._id.toString(),
      metadata: { 
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || ''
      },
      description: `Email ${email.emailId} queued for retry`
    })

    return NextResponse.json({ success: true, message: 'Email queued for retry' })
  } catch (error) {
    console.error('Error retrying email:', error)
    return NextResponse.json({ success: false, message: 'Failed to retry email' }, { status: 500 })
  }
}
