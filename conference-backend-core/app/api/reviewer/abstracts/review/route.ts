import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import Review from '@/lib/models/Review'
import User from '@/lib/models/User'
import ReviewerConfig, { defaultReviewerConfig } from '@/conference-backend-core/lib/models/ReviewerConfig'
import AbstractsConfig from '@/conference-backend-core/lib/models/AbstractsConfig'
import { EmailService } from '@/lib/email/service'
import { logAction } from '@/conference-backend-core/lib/audit/service'

// Helper to replace placeholders in email templates
function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '')
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    const { 
      abstractId, 
      decision, 
      approvedFor, 
      rejectionComment, 
      scores,
      comments // Legacy support
    } = await request.json()

    if (!abstractId || !decision) {
      return NextResponse.json({ success: false, message: 'Abstract ID and decision are required' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(decision)) {
      return NextResponse.json({ success: false, message: 'Decision must be either "approve" or "reject"' }, { status: 400 })
    }

    // Validate scores
    if (scores) {
      const scoreKeys = ['originality', 'levelOfEvidence', 'scientificImpact', 'socialSignificance', 'qualityOfManuscript']
      for (const key of scoreKeys) {
        if (scores[key] !== undefined && (scores[key] < 1 || scores[key] > 10)) {
          return NextResponse.json({ success: false, message: `Score for ${key} must be between 1 and 10` }, { status: 400 })
        }
      }
    }

    // Validate approval type if approved
    if (decision === 'approve' && !approvedFor) {
      return NextResponse.json({ success: false, message: 'Approved for type is required when approving' }, { status: 400 })
    }

    await connectDB()

    // Check if user is a reviewer or admin
    const user = await User.findById(userId)
    if (!user || (user.role !== 'reviewer' && user.role !== 'admin')) {
      return NextResponse.json({ success: false, message: 'Reviewer access required' }, { status: 403 })
    }

    // Find the abstract
    const abstract = await Abstract.findById(abstractId)
    if (!abstract) {
      return NextResponse.json({ success: false, message: 'Abstract not found' }, { status: 404 })
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      abstractId: abstract._id,
      reviewerId: userId
    })

    if (existingReview) {
      return NextResponse.json({ success: false, message: 'You have already reviewed this abstract' }, { status: 400 })
    }

    // Calculate total score
    let totalScore = 0
    if (scores) {
      totalScore = (scores.originality || 0) + 
                   (scores.levelOfEvidence || 0) + 
                   (scores.scientificImpact || 0) + 
                   (scores.socialSignificance || 0) + 
                   (scores.qualityOfManuscript || 0)
    }

    // Create the review
    const review = await Review.create({
      abstractId: abstract._id,
      abstractCode: abstract.abstractId,
      reviewerId: userId,
      track: abstract.track || abstract.submittingFor || 'N/A',
      category: abstract.submissionCategory || abstract.category,
      subcategory: abstract.submissionTopic || abstract.subcategory,
      scores: scores ? {
        ...scores,
        total: totalScore
      } : {},
      decision,
      approvedFor: decision === 'approve' ? approvedFor : undefined,
      rejectionComment: decision === 'reject' ? rejectionComment : undefined,
      comments: comments || rejectionComment || ''
    })

    // Update abstract status
    if (abstract.status === 'submitted') {
      abstract.status = 'under-review'
      await abstract.save()
    }

    // Check if all assigned reviewers have submitted
    const allReviews = await Review.find({ abstractId: abstract._id })
    const assignedReviewerCount = abstract.assignedReviewerIds?.length || 1
    
    if (allReviews.length >= assignedReviewerCount) {
      // Calculate consensus
      const approveCount = allReviews.filter(r => r.decision === 'approve').length
      const rejectCount = allReviews.filter(r => r.decision === 'reject').length
      
      if (approveCount > rejectCount) {
        abstract.status = 'accepted'
      } else {
        abstract.status = 'rejected'
      }
      await abstract.save()
    }

    // Log the review action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    
    await logAction({
      actor: {
        userId,
        email: session.user.email || '',
        role: userRole,
        name: session.user.name || ''
      },
      action: 'abstract.reviewed',
      resourceType: 'abstract',
      resourceId: abstract.abstractId,
      resourceName: abstract.title,
      metadata: { ip, userAgent },
      changes: {
        before: {},
        after: {
          decision,
          approvedFor,
          scores,
          totalScore
        }
      },
      description: `Reviewer ${decision === 'approve' ? 'approved' : 'rejected'} abstract "${abstract.title}"${approvedFor ? ` for ${approvedFor}` : ''}`
    })

    // Get reviewer config to check email notification mode
    let reviewerConfig = await ReviewerConfig.findOne()
    if (!reviewerConfig) {
      // Create default config if it doesn't exist
      reviewerConfig = await ReviewerConfig.create(defaultReviewerConfig)
    }

    // Get abstracts config for email templates
    const abstractsConfig = await AbstractsConfig.findOne()

    // Send email notification based on config
    if (decision === 'approve') {
      try {
        const abstractWithUser = await Abstract.findById(abstract._id).populate('userId')
        
        if (abstractWithUser && abstractWithUser.userId) {
          const authorUser = abstractWithUser.userId as any
          const authorName = `${authorUser.profile?.firstName || authorUser.firstName || ''} ${authorUser.profile?.lastName || authorUser.lastName || ''}`.trim() || authorUser.email
          
          // Check if we should send immediately or queue
          if (reviewerConfig.emailNotificationMode === 'immediate') {
            // Check if custom template exists
            if (abstractsConfig?.emailTemplates?.acceptance?.enabled && abstractsConfig?.emailTemplates?.acceptance?.body) {
              const template = abstractsConfig.emailTemplates.acceptance
              const dashboardUrl = `${process.env.APP_URL || process.env.NEXTAUTH_URL}/dashboard/abstracts`
              
              const emailBody = replacePlaceholders(template.body, {
                name: authorName,
                title: abstractWithUser.title,
                abstractId: abstractWithUser.abstractId,
                approvedFor: approvedFor || 'presentation',
                dashboardUrl
              })
              
              const emailSubject = replacePlaceholders(template.subject, {
                title: abstractWithUser.title,
                abstractId: abstractWithUser.abstractId
              })
              
              await EmailService.sendCustomMessage({
                userId: authorUser._id.toString(),
                email: authorUser.email,
                recipientName: authorName,
                subject: emailSubject,
                content: emailBody
              })
            } else {
              // Use default acceptance email
              await EmailService.sendAbstractAcceptance({
                userId: authorUser._id.toString(),
                email: authorUser.email,
                name: authorName,
                registrationId: authorUser.registration?.registrationId || 'N/A',
                abstractId: abstractWithUser.abstractId,
                title: abstractWithUser.title,
                track: abstractWithUser.track || abstractWithUser.submittingFor || 'N/A',
                authors: abstractWithUser.authors,
                reviewedAt: new Date().toISOString(),
                approvedFor: approvedFor
              })
            }
            
            console.log(`✅ Acceptance email sent to ${authorUser.email} for abstract ${abstractWithUser.abstractId}`)
          } else {
            // Queue the email for later
            await ReviewerConfig.findOneAndUpdate(
              {},
              { 
                $push: { 
                  pendingEmails: { 
                    abstractId: abstractWithUser.abstractId, 
                    type: 'acceptance',
                    createdAt: new Date()
                  } 
                } 
              },
              { upsert: true }
            )
            console.log(`📧 Acceptance email queued for ${authorUser.email} for abstract ${abstractWithUser.abstractId}`)
          }
        }
      } catch (emailError) {
        console.error('Failed to send/queue acceptance email:', emailError)
      }
    } else if (decision === 'reject') {
      // Handle rejection emails
      try {
        const abstractWithUser = await Abstract.findById(abstract._id).populate('userId')
        
        if (abstractWithUser && abstractWithUser.userId) {
          const authorUser = abstractWithUser.userId as any
          const authorName = `${authorUser.profile?.firstName || authorUser.firstName || ''} ${authorUser.profile?.lastName || authorUser.lastName || ''}`.trim() || authorUser.email
          
          if (reviewerConfig.emailNotificationMode === 'immediate') {
            // Check if custom template exists
            if (abstractsConfig?.emailTemplates?.rejection?.enabled && abstractsConfig?.emailTemplates?.rejection?.body) {
              const template = abstractsConfig.emailTemplates.rejection
              
              const emailBody = replacePlaceholders(template.body, {
                name: authorName,
                title: abstractWithUser.title,
                abstractId: abstractWithUser.abstractId
              })
              
              const emailSubject = replacePlaceholders(template.subject, {
                title: abstractWithUser.title,
                abstractId: abstractWithUser.abstractId
              })
              
              await EmailService.sendCustomMessage({
                userId: authorUser._id.toString(),
                email: authorUser.email,
                recipientName: authorName,
                subject: emailSubject,
                content: emailBody
              })
              
              console.log(`✅ Rejection email sent to ${authorUser.email} for abstract ${abstractWithUser.abstractId}`)
            }
          } else {
            // Queue the rejection email
            await ReviewerConfig.findOneAndUpdate(
              {},
              { 
                $push: { 
                  pendingEmails: { 
                    abstractId: abstractWithUser.abstractId, 
                    type: 'rejection',
                    createdAt: new Date()
                  } 
                } 
              },
              { upsert: true }
            )
            console.log(`📧 Rejection email queued for ${authorUser.email} for abstract ${abstractWithUser.abstractId}`)
          }
        }
      } catch (emailError) {
        console.error('Failed to send/queue rejection email:', emailError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: review,
      message: `Abstract ${decision === 'approve' ? 'approved' : 'rejected'} successfully` 
    })

  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
