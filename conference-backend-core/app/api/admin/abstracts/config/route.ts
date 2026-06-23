import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import AbstractsConfig from '@/conference-backend-core/lib/models/AbstractsConfig'
import Configuration from '@/lib/models/Configuration'
import { logAction } from '@/conference-backend-core/lib/audit/service'

// GET - Fetch abstracts config
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    await connectDB()
    
    let config = await AbstractsConfig.findOne({})
    
    if (!config) {
      // Create default config
      config = await AbstractsConfig.create({
        isEnabled: true,
        submissionOpenDate: new Date(),
        submissionCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        topics: [],
        presentationCategories: [],
        guidelines: {
          general: '',
          freePaper: { enabled: true, title: 'Free Paper', wordLimit: 250, requirements: [], format: '' },
          poster: { enabled: true, title: 'Poster', wordLimit: 250, requirements: [], format: '' },
          finalSubmission: { enabled: true, title: 'Final Submission', instructions: '', requirements: [] }
        },
        fileRequirements: { maxSizeKB: 5120, allowedFormats: ['.doc', '.docx', '.pdf'] },
        emailTemplates: {
          acceptance: {
            enabled: true,
            subject: 'Congratulations! Your Abstract Has Been Accepted',
            body: `Dear {name},

Congratulations! We are pleased to inform you that your abstract titled "{title}" (ID: {abstractId}) has been ACCEPTED for presentation at our conference.

Presentation Type: {approvedFor}

Next Steps:
1. Please submit your final presentation by the deadline
2. Follow the guidelines provided in your dashboard
3. Download the presentation template if available

You can access your dashboard to submit your final presentation at: {dashboardUrl}

If you have any questions, please contact us.

Best regards,
The Scientific Committee`
          },
          rejection: {
            enabled: true,
            subject: 'Abstract Review Decision',
            body: `Dear {name},

Thank you for submitting your abstract titled "{title}" (ID: {abstractId}) to our conference.

After careful review by our scientific committee, we regret to inform you that your abstract has not been selected for presentation at this time.

We appreciate your interest in our conference and encourage you to submit again in the future.

Best regards,
The Scientific Committee`
          },
          finalSubmissionReminder: {
            enabled: true,
            subject: 'Reminder: Final Presentation Submission Deadline',
            body: `Dear {name},

This is a reminder that the deadline for submitting your final presentation for abstract "{title}" (ID: {abstractId}) is approaching.

Please ensure you submit your final presentation before the deadline.

You can access your dashboard at: {dashboardUrl}

Best regards,
The Scientific Committee`
          }
        },
        notifications: { confirmationEmail: true, reviewStatusEmail: true, reminderEmails: false }
      })
    }

    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('Error fetching abstracts config:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update abstracts config
export async function PUT(request: NextRequest) {
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

    const updates = await request.json()
    
    await connectDB()
    
    let config = await AbstractsConfig.findOne({})
    
    if (!config) {
      config = await AbstractsConfig.create(updates)
    } else {
      Object.assign(config, updates)
      await config.save()
    }

    // Sync submissionWindow to the Configuration collection so the public API can read it
    if (updates.submissionWindow) {
      await Configuration.findOneAndUpdate(
        { type: 'abstracts', key: 'settings' },
        { 
          $set: { 
            'value.submissionWindow': updates.submissionWindow,
            'value.enableAbstractsWithoutRegistration': updates.enableAbstractsWithoutRegistration ?? false,
            'value.submittingForOptions': updates.submittingForOptions,
            'value.submissionCategories': updates.submissionCategories,
            'value.topicsBySpecialty': updates.topicsBySpecialty,
            'value.maxAbstractsPerUser': updates.maxAbstractsPerUser,
          }
        },
        { upsert: true }
      )
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
      action: 'config.abstracts_updated',
      resourceType: 'config',
      resourceId: 'abstracts',
      resourceName: 'Abstracts Configuration',
      metadata: { ip, userAgent },
      changes: { before: {}, after: { updated: true } },
      description: 'Admin updated abstracts configuration'
    })

    return NextResponse.json({ 
      success: true, 
      data: config,
      message: 'Abstracts configuration updated successfully'
    })
  } catch (error) {
    console.error('Error updating abstracts config:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
