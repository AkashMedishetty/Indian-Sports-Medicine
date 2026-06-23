import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'
import { generateAbstractId } from '@/lib/utils/generateId'
import Configuration from '@/lib/models/Configuration'
import { loadReviewerAssignments, findRuleFor, chooseReviewersLoadBased, chooseReviewersRoundRobin } from '@/lib/utils/reviewAssignments'
import { defaultAbstractsSettings } from '@/lib/config/abstracts'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

// Helper function to check if abstract submission is open
const isAbstractSubmissionOpen = (): boolean => {
  // First check if the feature is enabled in admin settings
  if (!conferenceConfig.features.abstractSubmission) return false
  
  const config = conferenceConfig.abstracts
  if (!config.enabled) return false
  
  if (!config.submissionWindow?.enabled) return true
  
  const today = new Date()
  const start = new Date(config.submissionWindow.start)
  const end = new Date(config.submissionWindow.end)
  
  return today >= start && today <= end
}

// GET: List current user's abstracts
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const userId = (session.user as any).id
    const abstracts = await Abstract.find({ userId }).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, data: abstracts })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create initial abstract (no file upload yet; separate endpoint will handle files)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    await connectDB()

    // FIRST: Check if abstract submission feature is enabled in admin panel
    const featureConfig = await Configuration.findOne({ type: 'features', key: 'abstractSubmission' })
    const isFeatureEnabled = featureConfig?.value ?? conferenceConfig.features.abstractSubmission
    
    if (!isFeatureEnabled) {
      return NextResponse.json({ 
        success: false, 
        message: 'Abstract submission is currently disabled by admin' 
      }, { status: 403 })
    }

    // Check if submission window is open (static config check)
    if (!isAbstractSubmissionOpen()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Abstract submission is currently closed' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { title, track, category, subcategory, authors = [], keywords = [] } = body
    if (!title || !track) {
      return NextResponse.json({ success: false, message: 'Title and track are required' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Load admin-configured settings
    const cfg = await Configuration.findOne({ type: 'abstracts', key: 'settings' })
    const settings = cfg?.value || defaultAbstractsSettings

    // Enforce submission window
    if (settings.submissionWindow?.enabled) {
      const now = new Date()
      const start = new Date(settings.submissionWindow.start)
      const end = new Date(settings.submissionWindow.end)
      if (now < start || now > end) {
        return NextResponse.json({ success: false, message: 'Submission window is closed' }, { status: 400 })
      }
    }

    // Enforce allowed track
    const trackConfig = (settings.tracks || []).find((t: any) => t.key === track)
    if (!trackConfig || trackConfig.enabled === false) {
      return NextResponse.json({ success: false, message: 'Track not available' }, { status: 400 })
    }

    // Enforce per-user submission limit
    const maxPerUser = settings.maxAbstractsPerUser
    const count = await Abstract.countDocuments({ userId: user._id })
    if (count >= maxPerUser) {
      return NextResponse.json({ success: false, message: 'Submission limit reached' }, { status: 400 })
    }

    const abstractId = await generateAbstractId()

    const doc = await Abstract.create({
      abstractId,
      userId: user._id,
      registrationId: user.registration.registrationId,
      track,
      category,
      subcategory,
      title,
      authors,
      keywords,
      status: 'submitted',
      initial: {}
    })

    // Auto-assign reviewers based on admin rules
    const rules = await loadReviewerAssignments()
    const rule = findRuleFor(track, category, subcategory, rules)

    // Select reviewers based on policy
    let reviewerIds: string[] = []
    const policy = settings.assignmentPolicy || 'load-based'
    const defaultCount = settings.reviewersPerAbstractDefault || 2
    if (policy === 'load-based') {
      reviewerIds = await chooseReviewersLoadBased(rule, defaultCount)
    } else {
      const cursorCfg = await Configuration.findOne({ type: 'abstracts', key: 'rr_cursor' })
      const start = (cursorCfg?.value?.[rule?.track || ''] || 0) as number
      const { ids, nextCursor } = chooseReviewersRoundRobin(rule, start, defaultCount)
      reviewerIds = ids
      await Configuration.findOneAndUpdate(
        { type: 'abstracts', key: 'rr_cursor' },
        { $set: { [`value.${rule?.track || ''}`]: nextCursor } },
        { upsert: true }
      )
    }
    if (reviewerIds.length > 0) {
      // Let Mongoose cast string IDs to ObjectId
      doc.assignedReviewerIds = reviewerIds as any
      doc.status = 'under-review'
      await doc.save()
    }

    return NextResponse.json({ success: true, data: doc })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}


