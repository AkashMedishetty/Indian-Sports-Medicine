import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import { logAction } from '@/conference-backend-core/lib/audit/service'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const abstractId = formData.get('abstractId') as string
    const file = formData.get('file') as File | null

    if (!abstractId) {
      return NextResponse.json({ success: false, message: 'Abstract ID is required' }, { status: 400 })
    }

    await connectDB()

    // Find the abstract
    const abstract = await Abstract.findById(abstractId)
    if (!abstract) {
      return NextResponse.json({ success: false, message: 'Abstract not found' }, { status: 404 })
    }

    // Store original values for audit
    const originalValues: Record<string, any> = {}
    const changedFields: string[] = []

    // Extract and apply updates from form data
    const title = formData.get('title') as string
    const authorsStr = formData.get('authors') as string
    const submittingFor = formData.get('submittingFor') as string
    const submissionCategory = formData.get('submissionCategory') as string
    const submissionTopic = formData.get('submissionTopic') as string
    const keywordsStr = formData.get('keywords') as string
    const status = formData.get('status') as string
    const approvedFor = formData.get('approvedFor') as string
    const introduction = formData.get('introduction') as string
    const methods = formData.get('methods') as string
    const results = formData.get('results') as string
    const conclusion = formData.get('conclusion') as string
    const notes = formData.get('notes') as string

    // Apply updates
    if (title) {
      originalValues.title = abstract.title
      abstract.title = title
      changedFields.push('title')
    }

    if (authorsStr) {
      originalValues.authors = abstract.authors
      abstract.authors = JSON.parse(authorsStr)
      changedFields.push('authors')
    }

    if (submittingFor) {
      originalValues.submittingFor = abstract.submittingFor
      abstract.submittingFor = submittingFor as 'neurosurgery' | 'neurology'
      changedFields.push('submittingFor')
    }

    if (submissionCategory) {
      originalValues.submissionCategory = abstract.submissionCategory
      abstract.submissionCategory = submissionCategory as 'award-paper' | 'free-paper' | 'poster-presentation'
      changedFields.push('submissionCategory')
    }

    if (submissionTopic !== undefined) {
      originalValues.submissionTopic = abstract.submissionTopic
      abstract.submissionTopic = submissionTopic
      changedFields.push('submissionTopic')
    }

    if (keywordsStr) {
      originalValues.keywords = abstract.keywords
      abstract.keywords = JSON.parse(keywordsStr)
      changedFields.push('keywords')
    }

    if (status) {
      originalValues.status = abstract.status
      abstract.status = status as 'submitted' | 'under-review' | 'accepted' | 'rejected' | 'final-submitted'
      changedFields.push('status')
    }

    if (status === 'accepted' && approvedFor) {
      originalValues.approvedFor = abstract.approvedFor
      abstract.approvedFor = approvedFor as 'award-paper' | 'free-paper' | 'poster-presentation' | 'podium' | 'poster'
      changedFields.push('approvedFor')
    }

    // Update initial content
    if (!abstract.initial) abstract.initial = {}
    
    if (introduction !== undefined) {
      originalValues['initial.introduction'] = abstract.initial.introduction
      abstract.initial.introduction = introduction
      changedFields.push('introduction')
    }

    if (methods !== undefined) {
      originalValues['initial.methods'] = abstract.initial.methods
      abstract.initial.methods = methods
      changedFields.push('methods')
    }

    if (results !== undefined) {
      originalValues['initial.results'] = abstract.initial.results
      abstract.initial.results = results
      changedFields.push('results')
    }

    if (conclusion !== undefined) {
      originalValues['initial.conclusion'] = abstract.initial.conclusion
      abstract.initial.conclusion = conclusion
      changedFields.push('conclusion')
    }

    if (notes !== undefined) {
      originalValues['initial.notes'] = abstract.initial.notes
      abstract.initial.notes = notes
      changedFields.push('notes')
    }

    // Handle file upload
    if (file && file.size > 0) {
      try {
        const fileName = `${uuidv4()}-${file.name}`
        const blob = await put(`abstracts/${abstract.abstractId}/${fileName}`, file, {
          access: 'public',
          contentType: file.type
        })

        originalValues['initial.file'] = abstract.initial.file
        abstract.initial.file = {
          originalName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
          storagePath: blob.url,
          blobUrl: blob.url,
          uploadedAt: new Date()
        }
        changedFields.push('file')
      } catch (uploadError) {
        console.error('File upload error:', uploadError)
        // Continue without file if upload fails
      }
    }

    // Save the abstract
    await abstract.save()

    // Log the action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''

    await logAction({
      actor: {
        userId: (session.user as any).id,
        email: session.user.email || '',
        role: 'admin',
        name: session.user.name || ''
      },
      action: 'abstract.updated',
      resourceType: 'abstract',
      resourceId: abstract.abstractId,
      resourceName: abstract.title,
      metadata: { ip, userAgent },
      changes: {
        before: originalValues,
        after: { changedFields }
      },
      description: `Admin updated abstract "${abstract.title}" with file - Changed fields: ${changedFields.join(', ')}`
    })

    return NextResponse.json({
      success: true,
      data: abstract,
      message: 'Abstract updated successfully'
    })

  } catch (error) {
    console.error('Error updating abstract with file:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
