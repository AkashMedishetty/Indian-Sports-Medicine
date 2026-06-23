import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import Review from '@/lib/models/Review'
import User from '@/lib/models/User'
import { logAction } from '@/conference-backend-core/lib/audit/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    // Allow both reviewers and admins
    if (userRole !== 'reviewer' && userRole !== 'admin') {
      return NextResponse.json({ success: false, message: 'Reviewer access required' }, { status: 403 })
    }

    await connectDB()

    const abstract = await Abstract.findById(id)
      .populate({
        path: 'userId',
        select: 'email profile registration'
      })
      .lean()

    if (!abstract) {
      return NextResponse.json({ success: false, message: 'Abstract not found' }, { status: 404 })
    }

    // Check if reviewer has an existing review for this abstract
    const existingReview = await Review.findOne({
      abstractId: abstract._id,
      reviewerId: userId
    }).lean()

    // Log the view action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    
    await logAction({
      actor: {
        userId,
        email: session.user.email || '',
        role: userRole,
        name: session.user.name || ''
      },
      action: 'abstract.viewed',
      resourceType: 'abstract',
      resourceId: abstract.abstractId,
      resourceName: abstract.title,
      metadata: { ip, userAgent },
      description: `Reviewer viewed abstract "${abstract.title}"`
    })

    // Transform the response
    const response = {
      ...abstract,
      existingReview: existingReview ? {
        decision: existingReview.decision || (existingReview.recommendation === 'accept' ? 'approve' : 'reject'),
        approvedFor: existingReview.approvedFor,
        rejectionComment: existingReview.rejectionComment,
        scores: existingReview.scores,
        reviewedAt: existingReview.submittedAt
      } : null
    }

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error('Error fetching abstract:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
