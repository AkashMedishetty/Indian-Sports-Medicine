import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ReviewerConfig, { defaultReviewerConfig } from '@/conference-backend-core/lib/models/ReviewerConfig'

// GET - Fetch reviewer config
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    let config = await ReviewerConfig.findOne({})
    
    // If no config exists, create default
    if (!config) {
      config = await ReviewerConfig.create(defaultReviewerConfig)
    }

    // Convert to object and merge with defaults to fill any missing fields
    const configObj = config.toObject()
    const mergedConfig = {
      ...defaultReviewerConfig,
      ...configObj,
      // Ensure emailNotificationMode has a value (for old documents without this field)
      emailNotificationMode: configObj.emailNotificationMode || 'immediate',
      pendingEmailsCount: config.pendingEmails?.length || 0,
      pendingEmails: config.pendingEmails || []
    }

    console.log('Fetched reviewer config:', {
      emailNotificationMode: mergedConfig.emailNotificationMode,
      blindReview: mergedConfig.blindReview,
      pendingEmailsCount: mergedConfig.pendingEmailsCount
    })

    return NextResponse.json({ 
      success: true, 
      data: mergedConfig
    })
  } catch (error) {
    console.error('Error fetching reviewer config:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update reviewer config (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const updates = await request.json()
    
    console.log('Received updates:', JSON.stringify(updates, null, 2))
    console.log('emailNotificationMode from request:', updates.emailNotificationMode)
    
    // Remove fields that shouldn't be overwritten
    delete updates._id
    delete updates.__v
    delete updates.createdAt
    delete updates.updatedAt
    delete updates.pendingEmailsCount // This is a computed field, not stored
    
    await connectDB()
    
    // Build the update object explicitly to ensure emailNotificationMode is included
    const updateData: Record<string, any> = {}
    
    // Copy all valid fields
    if (updates.blindReview !== undefined) updateData.blindReview = updates.blindReview
    if (updates.reviewerLayout !== undefined) updateData.reviewerLayout = updates.reviewerLayout
    if (updates.approvalOptions !== undefined) updateData.approvalOptions = updates.approvalOptions
    if (updates.scoringCriteria !== undefined) updateData.scoringCriteria = updates.scoringCriteria
    if (updates.requireRejectionComment !== undefined) updateData.requireRejectionComment = updates.requireRejectionComment
    if (updates.allowReviewEdit !== undefined) updateData.allowReviewEdit = updates.allowReviewEdit
    if (updates.showTotalScore !== undefined) updateData.showTotalScore = updates.showTotalScore
    if (updates.emailNotificationMode !== undefined) updateData.emailNotificationMode = updates.emailNotificationMode
    // Email templates
    if (updates.acceptanceEmailSubject !== undefined) updateData.acceptanceEmailSubject = updates.acceptanceEmailSubject
    if (updates.acceptanceEmailBody !== undefined) updateData.acceptanceEmailBody = updates.acceptanceEmailBody
    if (updates.rejectionEmailSubject !== undefined) updateData.rejectionEmailSubject = updates.rejectionEmailSubject
    if (updates.rejectionEmailBody !== undefined) updateData.rejectionEmailBody = updates.rejectionEmailBody
    
    console.log('Update data to save:', JSON.stringify(updateData, null, 2))
    
    // Use findOneAndUpdate with upsert for reliable updates
    const config = await ReviewerConfig.findOneAndUpdate(
      {},
      { $set: updateData },
      { 
        new: true, // Return the updated document
        upsert: true, // Create if doesn't exist
        setDefaultsOnInsert: true,
        runValidators: true
      }
    )

    console.log('Saved reviewer config:', {
      emailNotificationMode: config.emailNotificationMode,
      blindReview: config.blindReview
    })

    return NextResponse.json({ 
      success: true, 
      data: {
        ...config.toObject(),
        pendingEmailsCount: config.pendingEmails?.length || 0
      },
      message: 'Reviewer configuration updated successfully'
    })
  } catch (error) {
    console.error('Error updating reviewer config:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
