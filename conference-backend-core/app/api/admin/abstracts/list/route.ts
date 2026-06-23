import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import Review from '@/conference-backend-core/lib/models/Review'
import User from '@/lib/models/User'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    await connectDB()
    const userId = (session.user as any).id
    const user = await User.findById(userId)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    // Fetch all abstracts with user details
    const abstracts = await Abstract.find({})
      .populate({
        path: 'userId',
        select: 'firstName lastName email registration.registrationId profile'
      })
      .sort({ submittedAt: -1 })
      .lean()

    // Fetch all reviews and map them to abstracts
    const abstractIds = abstracts.map(a => a._id)
    const reviews = await Review.find({ abstractId: { $in: abstractIds } })
      .populate({
        path: 'reviewerId',
        select: 'firstName lastName email'
      })
      .lean()

    // Create a map of abstractId to reviews
    const reviewsMap = new Map<string, any[]>()
    for (const review of reviews) {
      const abstractIdStr = review.abstractId.toString()
      if (!reviewsMap.has(abstractIdStr)) {
        reviewsMap.set(abstractIdStr, [])
      }
      reviewsMap.get(abstractIdStr)!.push(review)
    }

    // Attach reviews to abstracts
    const abstractsWithReviews = abstracts.map(abstract => {
      const abstractReviews = reviewsMap.get(abstract._id.toString()) || []
      
      // Calculate average score from reviews
      let averageScore = abstract.averageScore
      // Prefer abstract's own approvedFor (set by admin), fallback to review's approvedFor
      let approvedFor = (abstract as any).approvedFor || null
      
      if (abstractReviews.length > 0) {
        const totalScores = abstractReviews
          .filter(r => r.scores?.total)
          .map(r => r.scores.total)
        
        if (totalScores.length > 0) {
          averageScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length
        }
        
        // Get approvedFor from the most recent review with approval (if not set on abstract)
        if (!approvedFor) {
          const approvedReview = abstractReviews.find(r => r.decision === 'approve' && r.approvedFor)
          if (approvedReview) {
            approvedFor = approvedReview.approvedFor
          }
        }
      }

      return {
        ...abstract,
        averageScore,
        approvedFor,
        reviews: abstractReviews.map(r => ({
          _id: r._id,
          reviewerId: r.reviewerId,
          decision: r.decision,
          approvedFor: r.approvedFor,
          rejectionComment: r.rejectionComment,
          scores: r.scores,
          submittedAt: r.submittedAt
        }))
      }
    })

    return NextResponse.json({ success: true, data: abstractsWithReviews })

  } catch (error) {
    console.error('Error fetching abstracts:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
