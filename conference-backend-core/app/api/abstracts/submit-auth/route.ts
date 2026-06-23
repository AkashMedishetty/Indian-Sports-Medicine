import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'
import { EmailService } from '@/lib/email/service'

// Generate unique abstract ID in format: RegID-ABS-XX
async function generateAbstractId(registrationId: string): Promise<string> {
  const randomNum = Math.floor(Math.random() * 90) + 10 // 10-99
  const baseId = `${registrationId}-ABS-${randomNum.toString().padStart(2, '0')}`
  
  const existing = await Abstract.findOne({ abstractId: baseId })
  if (existing) {
    const newRandomNum = Math.floor(Math.random() * 90) + 10
    return `${registrationId}-ABS-${newRandomNum.toString().padStart(2, '0')}`
  }
  
  return baseId
}

function getSubmissionCategoryLabel(value: string): string {
  const labels: Record<string, string> = {
    'award-paper': 'Award Paper',
    'free-paper': 'Free Paper',
    'poster-presentation': 'E-Poster',
    'e-poster': 'E-Poster'
  }
  return labels[value] || value
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'You must be logged in to submit abstracts' },
        { status: 401 }
      )
    }

    await connectDB()

    const userId = (session.user as any).id
    const user = await User.findById(userId)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has a valid registration (allow pending-payment users to submit)
    const validStatuses = ['completed', 'paid', 'confirmed', 'pending-payment', 'pending']
    if (!validStatuses.includes(user.registration?.status)) {
      return NextResponse.json(
        { success: false, message: 'You must complete registration before submitting abstracts' },
        { status: 403 }
      )
    }

    // Accept JSON body with blob URL (file already uploaded via client upload)
    const body = await request.json()
    
    console.log('📋 Abstract submit-auth body:', JSON.stringify({
      submissionCategory: body.submissionCategory,
      title: body.title ? body.title.substring(0, 50) : null,
      authors: body.authors ? 'provided' : null,
      abstract: body.abstract ? `${body.abstract.split(/\s+/).length} words` : null,
      keywords: body.keywords ? 'provided' : null,
      blobUrl: body.blobUrl ? 'provided' : null,
      fileName: body.fileName,
      registrationStatus: user.registration?.status,
      userId: user._id.toString()
    }))

    const {
      submissionCategory,
      title,
      authors: authorsStr,
      abstract: abstractContent,
      keywords: keywordsStr,
      // File info from client upload
      blobUrl,
      fileName,
      fileSize,
      fileType
    } = body

    // Validate required fields
    if (!submissionCategory) {
      return NextResponse.json(
        { success: false, message: 'Please select a Submission Category' },
        { status: 400 }
      )
    }

    if (!title || !authorsStr) {
      return NextResponse.json(
        { success: false, message: 'Title and Authors are required' },
        { status: 400 }
      )
    }

    // File is mandatory - must have blob URL from client upload
    if (!blobUrl) {
      return NextResponse.json(
        { success: false, message: 'Abstract file upload is required (.doc, .docx, or .pdf)' },
        { status: 400 }
      )
    }

    // Validate submissionCategory (accept both legacy and new keys)
    const validCategories = ['award-paper', 'free-paper', 'poster-presentation', 'e-poster']
    if (!validCategories.includes(submissionCategory)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Submission Category selection' },
        { status: 400 }
      )
    }

    // Normalize category key
    const normalizedCategory = submissionCategory === 'e-poster' ? 'poster-presentation' : submissionCategory

    // Validate word count if provided
    if (abstractContent && abstractContent.trim()) {
      const wordCount = abstractContent.trim().split(/\s+/).filter((word: string) => word.length > 0).length
      if (wordCount > 250) {
        return NextResponse.json(
          { success: false, message: 'Abstract content must not exceed 250 words' },
          { status: 400 }
        )
      }
    }

    // Check submission limits - one per category
    const existingAbstracts = await Abstract.find({ userId: user._id })
    const existingInCategory = existingAbstracts.find(
      abs => abs.submissionCategory === normalizedCategory
    )
    if (existingInCategory) {
      return NextResponse.json(
        { success: false, message: `You already have a ${getSubmissionCategoryLabel(normalizedCategory)} submission with ID: ${existingInCategory.abstractId}` },
        { status: 400 }
      )
    }

    // Generate unique abstract ID
    const abstractId = await generateAbstractId(user.registration.registrationId)

    // File data from client upload
    const fileData = {
      originalName: fileName || 'abstract-file',
      mimeType: fileType || 'application/octet-stream',
      fileSizeBytes: fileSize || 0,
      storagePath: blobUrl,
      blobUrl: blobUrl,
      uploadedAt: new Date()
    }

    // Parse authors and keywords
    const authors = authorsStr.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0)
    const keywords = keywordsStr ? keywordsStr.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0) : []
    const wordCount = abstractContent ? abstractContent.trim().split(/\s+/).filter((w: string) => w.length > 0).length : 0

    // Find reviewers for auto-assignment
    const availableReviewers = await User.find({ role: 'reviewer', isActive: true }).select('_id')

    // Create abstract
    const abstract = await Abstract.create({
      abstractId,
      userId: user._id,
      registrationId: user.registration.registrationId,
      submissionCategory: normalizedCategory,
      track: getSubmissionCategoryLabel(normalizedCategory),
      title,
      authors,
      keywords,
      wordCount,
      status: 'submitted',
      initial: { file: fileData, notes: abstractContent },
      assignedReviewerIds: availableReviewers.map(r => r._id)
    })

    // Send confirmation email
    try {
      await EmailService.sendAbstractSubmissionConfirmation({
        userId: user._id.toString(),
        email: user.email,
        name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email,
        registrationId: user.registration.registrationId,
        abstractId: abstract.abstractId,
        title: abstract.title,
        track: getSubmissionCategoryLabel(normalizedCategory),
        authors: abstract.authors,
        submittedAt: abstract.submittedAt.toISOString()
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    return NextResponse.json({
      success: true,
      data: {
        abstractId: abstract.abstractId,
        title: abstract.title,
        submissionCategory: getSubmissionCategoryLabel(normalizedCategory),
        status: abstract.status,
        submittedAt: abstract.submittedAt
      }
    })

  } catch (error) {
    console.error('Abstract submission error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
