import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    await connectDB()

    // Check if user is admin
    const user = await User.findById(userId)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const { abstractIds, reviewerIds, action } = await request.json()

    if (!abstractIds || !Array.isArray(abstractIds) || abstractIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Abstract IDs are required' }, { status: 400 })
    }

    if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Reviewer IDs are required' }, { status: 400 })
    }

    // Validate reviewers exist and have reviewer role
    const reviewers = await User.find({
      _id: { $in: reviewerIds },
      role: 'reviewer'
    })

    if (reviewers.length !== reviewerIds.length) {
      return NextResponse.json({ success: false, message: 'Some reviewer IDs are invalid' }, { status: 400 })
    }

    // Find abstracts
    const abstracts = await Abstract.find({
      _id: { $in: abstractIds }
    })

    if (abstracts.length !== abstractIds.length) {
      return NextResponse.json({ success: false, message: 'Some abstract IDs are invalid' }, { status: 400 })
    }

    let updatedCount = 0

    if (action === 'assign') {
      // Assign reviewers to abstracts
      for (const abstract of abstracts) {
        let updated = false
        
        for (const reviewerId of reviewerIds) {
          if (!abstract.assignedReviewerIds) {
            abstract.assignedReviewerIds = []
          }
          
          if (!abstract.assignedReviewerIds.includes(reviewerId)) {
            abstract.assignedReviewerIds.push(reviewerId)
            updated = true
          }
        }
        
        if (updated) {
          await abstract.save()
          updatedCount++
        }
      }
    } else if (action === 'unassign') {
      // Remove reviewers from abstracts
      for (const abstract of abstracts) {
        let updated = false
        
        if (abstract.assignedReviewerIds) {
          const originalLength = abstract.assignedReviewerIds.length
          abstract.assignedReviewerIds = abstract.assignedReviewerIds.filter(
            id => !reviewerIds.includes(id.toString())
          )
          
          if (abstract.assignedReviewerIds.length !== originalLength) {
            updated = true
          }
        }
        
        if (updated) {
          await abstract.save()
          updatedCount++
        }
      }
    } else {
      return NextResponse.json({ success: false, message: 'Action must be "assign" or "unassign"' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}ed ${updatedCount} abstracts`,
      data: {
        updatedCount,
        action,
        abstractIds,
        reviewerIds
      }
    })

  } catch (error) {
    console.error('Error assigning reviewers:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// GET: Auto-assign all unassigned abstracts to available reviewers
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    await connectDB()

    // Check if user is admin
    const user = await User.findById(userId)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    // Find all reviewers
    const reviewers = await User.find({ role: 'reviewer', isActive: true })
    
    if (reviewers.length === 0) {
      return NextResponse.json({ success: false, message: 'No active reviewers found' }, { status: 400 })
    }

    // Find unassigned abstracts
    const unassignedAbstracts = await Abstract.find({
      $or: [
        { assignedReviewerIds: { $exists: false } },
        { assignedReviewerIds: { $size: 0 } }
      ],
      status: { $in: ['submitted', 'under-review'] }
    })

    let assignedCount = 0

    // Simple round-robin assignment
    for (let i = 0; i < unassignedAbstracts.length; i++) {
      const abstract = unassignedAbstracts[i]
      const reviewer = reviewers[i % reviewers.length] // Round-robin

      abstract.assignedReviewerIds = [reviewer._id]
      await abstract.save()
      assignedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Auto-assigned ${assignedCount} abstracts to ${reviewers.length} reviewers`,
      data: {
        assignedCount,
        reviewerCount: reviewers.length,
        unassignedCount: unassignedAbstracts.length
      }
    })

  } catch (error) {
    console.error('Error auto-assigning reviewers:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
