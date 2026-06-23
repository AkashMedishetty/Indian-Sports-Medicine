import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'
import { logAction } from '@/conference-backend-core/lib/audit/service'
import { generateAbstractId } from '@/lib/utils/generateId'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const adminUserId = (session.user as any).id
    const userRole = (session.user as any).role

    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    
    // Extract form fields
    const userEmail = formData.get('userEmail') as string
    const title = formData.get('title') as string
    const authors = JSON.parse(formData.get('authors') as string || '[]')
    const submittingFor = formData.get('submittingFor') as string
    const submissionCategory = formData.get('submissionCategory') as string
    const submissionTopic = formData.get('submissionTopic') as string
    const introduction = formData.get('introduction') as string
    const methods = formData.get('methods') as string
    const results = formData.get('results') as string
    const conclusion = formData.get('conclusion') as string
    const keywords = formData.get('keywords') as string
    const file = formData.get('file') as File | null

    // Validation
    if (!userEmail || !title || !authors.length) {
      return NextResponse.json({ 
        success: false, 
        message: 'User email, title, and authors are required' 
      }, { status: 400 })
    }

    await connectDB()

    // Find the user by email
    let user = await User.findOne({ email: userEmail.toLowerCase() })
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found with this email. Please ensure the user is registered first.' 
      }, { status: 404 })
    }

    // Generate abstract ID using the same format as normal submissions
    const abstractId = await generateAbstractId()

    // Handle file upload if provided
    let fileData = null
    if (file && file.size > 0) {
      try {
        const fileName = `${uuidv4()}-${file.name}`
        const blob = await put(`abstracts/${abstractId}/${fileName}`, file, {
          access: 'public',
          contentType: file.type
        })
        
        fileData = {
          originalName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
          storagePath: blob.url,
          blobUrl: blob.url,
          uploadedAt: new Date()
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError)
        // Continue without file if upload fails
      }
    }

    // Calculate word count
    const content = `${introduction || ''} ${methods || ''} ${results || ''} ${conclusion || ''}`
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length

    // Create the abstract
    const abstract = await Abstract.create({
      abstractId,
      userId: user._id,
      registrationId: user.registration?.registrationId || 'N/A',
      title,
      authors,
      submittingFor: (submittingFor || 'neurosurgery') as 'neurosurgery' | 'neurology',
      submissionCategory: (submissionCategory || 'free-paper') as 'award-paper' | 'free-paper' | 'poster-presentation',
      submissionTopic: submissionTopic || 'General',
      track: submittingFor || 'neurosurgery',
      category: submissionCategory || 'free-paper',
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
      wordCount,
      status: 'submitted',
      submittedAt: new Date(),
      initial: {
        file: fileData,
        introduction: introduction || '',
        methods: methods || '',
        results: results || '',
        conclusion: conclusion || '',
        notes: `Submitted on behalf by admin: ${session.user.email}`
      }
    })

    // Log the action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    
    await logAction({
      actor: {
        userId: adminUserId,
        email: session.user.email || '',
        role: userRole,
        name: session.user.name || ''
      },
      action: 'abstract.submitted_on_behalf',
      resourceType: 'abstract',
      resourceId: abstractId,
      resourceName: title,
      metadata: { ip, userAgent },
      changes: {
        before: {},
        after: {
          abstractId,
          title,
          authors,
          userEmail,
          submittingFor,
          submissionCategory
        }
      },
      description: `Admin submitted abstract "${title}" on behalf of ${userEmail}`
    })

    return NextResponse.json({ 
      success: true, 
      data: {
        abstractId: abstract.abstractId,
        title: abstract.title,
        status: abstract.status
      },
      message: `Abstract submitted successfully with ID: ${abstractId}`
    })

  } catch (error) {
    console.error('Error submitting abstract on behalf:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
