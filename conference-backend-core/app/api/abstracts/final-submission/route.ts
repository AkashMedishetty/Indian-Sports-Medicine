import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'
import { EmailService } from '@/lib/email/service'
import { put } from '@vercel/blob'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    await connectDB()

    const userId = (session.user as any).id
    const user = await User.findById(userId)
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const abstractId = formData.get('abstractId') as string
    const file = formData.get('file') as File
    const notes = formData.get('notes') as string

    if (!abstractId) {
      return NextResponse.json({ success: false, message: 'Abstract ID is required' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ success: false, message: 'Final presentation file is required' }, { status: 400 })
    }

    const abstract = await Abstract.findById(abstractId)
    if (!abstract) {
      return NextResponse.json({ success: false, message: 'Abstract not found' }, { status: 404 })
    }

    if (abstract.userId.toString() !== userId) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    if (abstract.status !== 'accepted') {
      return NextResponse.json({ success: false, message: 'Final submission is only allowed for accepted abstracts' }, { status: 400 })
    }

    const allowedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx']
    const fileExtension = path.extname(file.name).toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json({ success: false, message: 'Only PDF, PowerPoint, and Word documents are allowed' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const timestamp = Date.now()
    const blobPath = `abstracts/final/${abstract.abstractId}-final-${timestamp}${fileExtension}`
    
    const blob = await put(blobPath, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    })

    const finalDisplayId = `${abstract.abstractId}-F`

    abstract.final = {
      file: {
        originalName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        storagePath: blob.url,
        blobUrl: blob.url,
        uploadedAt: new Date()
      },
      submittedAt: new Date(),
      displayId: finalDisplayId,
      notes: notes || ''
    }
    
    abstract.status = 'final-submitted'
    await abstract.save()

    try {
      await EmailService.sendFinalSubmissionConfirmation({
        userId: user._id.toString(),
        email: user.email,
        name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email,
        registrationId: user.registration?.registrationId || 'N/A',
        abstractId: abstract.abstractId,
        finalDisplayId,
        title: abstract.title,
        track: abstract.track || 'N/A',
        authors: abstract.authors,
        submittedAt: abstract.final.submittedAt?.toISOString() || new Date().toISOString(),
        fileName: file.name
      })
      console.log(`✅ Final submission email sent to ${user.email} for abstract ${abstract.abstractId}`)
    } catch (emailError) {
      console.error('Failed to send final submission email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Final submission uploaded successfully',
      data: {
        abstractId: abstract.abstractId,
        finalDisplayId,
        submittedAt: abstract.final.submittedAt,
        filename: file.name
      }
    })

  } catch (error: any) {
    console.error('Error in final submission:', error?.message || error, error?.stack)
    return NextResponse.json({ success: false, message: error?.message || 'Internal server error' }, { status: 500 })
  }
}
