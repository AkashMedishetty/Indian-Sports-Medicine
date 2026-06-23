import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Abstract from '@/lib/models/Abstract'
import Review from '@/lib/models/Review'

// GET: list reviewers with workload stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const reviewers = await User.find({ role: 'reviewer', isActive: true })
      .select('email profile reviewer role')
      .lean()

    const reviewerIds = reviewers.map(r => r._id)

    // Assigned counts per reviewer (abstracts not yet completed across submitted/under-review)
    const assignedAgg = await Abstract.aggregate([
      { $match: { assignedReviewerIds: { $exists: true, $ne: [] }, status: { $in: ['submitted', 'under-review'] } } },
      { $unwind: '$assignedReviewerIds' },
      { $match: { assignedReviewerIds: { $in: reviewerIds } } },
      { $group: { _id: '$assignedReviewerIds', assignedCount: { $sum: 1 } } }
    ])
    const assignedMap = new Map<string, number>()
    assignedAgg.forEach((d: any) => assignedMap.set(String(d._id), d.assignedCount))

    // Completed reviews per reviewer
    const completedAgg = await Review.aggregate([
      { $match: { reviewerId: { $in: reviewerIds } } },
      { $group: { _id: '$reviewerId', completedCount: { $sum: 1 } } }
    ])
    const completedMap = new Map<string, number>()
    completedAgg.forEach((d: any) => completedMap.set(String(d._id), d.completedCount))

    const data = reviewers.map(r => ({
      id: String(r._id),
      email: r.email,
      name: `${(r as any).profile?.firstName || ''} ${(r as any).profile?.lastName || ''}`.trim(),
      role: (r as any).role,
      expertise: (r as any).reviewer?.expertise || [],
      maxConcurrentAssignments: (r as any).reviewer?.maxConcurrentAssignments ?? 5,
      assignedCount: assignedMap.get(String(r._id)) || 0,
      completedReviews: completedMap.get(String(r._id)) || 0
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('List reviewers error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// PUT: update reviewer role/expertise/capacity
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, role, expertise, maxConcurrentAssignments } = body || {}
    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 })
    }

    await connectDB()
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    if (role && ['user', 'admin', 'reviewer'].includes(role)) {
      user.role = role
    }

    user.reviewer = user.reviewer || { expertise: [], maxConcurrentAssignments: 5, notes: '' }
    if (Array.isArray(expertise)) {
      user.reviewer.expertise = expertise
    }
    if (typeof maxConcurrentAssignments === 'number' && maxConcurrentAssignments > 0) {
      user.reviewer.maxConcurrentAssignments = maxConcurrentAssignments
    }

    await user.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update reviewer error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}


