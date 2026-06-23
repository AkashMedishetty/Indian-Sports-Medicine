import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import Review from '@/lib/models/Review'
import User from '@/lib/models/User'

// GET: List abstracts assigned to the reviewer with existing reviews
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    // Check if user is a reviewer
    const user = await User.findById((session.user as any).id)
    if (!user || user.role !== 'reviewer') {
      return NextResponse.json({ success: false, message: 'Reviewer access required' }, { status: 403 })
    }

    // Get ALL abstracts (not just assigned ones) - single reviewer sees everything
    const abstracts = await Abstract.find({
      status: { $in: ['submitted', 'under-review', 'accepted', 'rejected', 'final-submitted'] }
    })
      .populate({
        path: 'userId',
        select: 'firstName lastName email registration profile'
      })
      .lean()

    console.log(`Reviewer ${(session.user as any).id} viewing ${abstracts.length} total abstracts`)

    // Get existing reviews for these abstracts by this reviewer
    const abstractIds = abstracts.map(a => a._id)
    const existingReviews = await Review.find({
      abstractId: { $in: abstractIds },
      reviewerId: (session.user as any).id
    }).lean()

    // Combine abstracts with their reviews
    const abstractsWithReviews = abstracts.map(abstract => {
      const review = existingReviews.find(r => r.abstractId.toString() === abstract._id.toString())
      
      // Map to expected format with new ISSH 2026 fields
      return {
        _id: abstract._id,
        abstractId: abstract.abstractId,
        title: abstract.title,
        track: abstract.track || abstract.submissionCategory || '', // Fallback to new field
        submittingFor: abstract.submittingFor,
        submissionCategory: abstract.submissionCategory,
        submissionTopic: abstract.submissionTopic,
        authors: abstract.authors || [],
        status: abstract.status,
        submittedAt: abstract.submittedAt,
        userId: abstract.userId,
        registrationId: abstract.registrationId,
        initial: abstract.initial,
        final: abstract.final,
        wordCount: abstract.wordCount,
        existingReview: review ? {
          decision: review.decision || review.recommendation, // Use decision field, fallback to recommendation
          approvedFor: review.approvedFor,
          scores: review.scores,
          comments: review.comments || review.rejectionComment,
          rejectionComment: review.rejectionComment,
          reviewedAt: (review as any).createdAt || review.submittedAt
        } : null
      }
    })

    // Sort: Unreviewed abstracts first (by submission date desc), then reviewed abstracts (by review date desc)
    const sortedAbstracts = abstractsWithReviews.sort((a, b) => {
      // If one has review and other doesn't, unreviewed comes first
      if (a.existingReview && !b.existingReview) return 1
      if (!a.existingReview && b.existingReview) return -1
      
      // If both have reviews or both don't have reviews, sort by date (newest first)
      if (a.existingReview && b.existingReview) {
        return new Date(b.existingReview.reviewedAt).getTime() - new Date(a.existingReview.reviewedAt).getTime()
      } else {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      }
    })

    return NextResponse.json({ success: true, data: sortedAbstracts })

  } catch (error) {
    console.error('Error fetching reviewer abstracts:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}


