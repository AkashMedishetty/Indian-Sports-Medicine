import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const { id } = await params
    const userId = (session.user as any).id
    const user = await User.findById(userId)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get the abstract
    const abstract = await Abstract.findById(id).populate('userId')
    
    if (!abstract) {
      return NextResponse.json(
        { success: false, message: 'Abstract not found' },
        { status: 404 }
      )
    }

    // Check permissions - user can download their own files, admin can download any, reviewers can download assigned abstracts
    const isOwner = abstract.userId._id.toString() === userId
    const isAdmin = user.role === 'admin'
    const isAssignedReviewer = user.role === 'reviewer' && abstract.assignedReviewerIds?.includes(userId)
    
    if (!isOwner && !isAdmin && !isAssignedReviewer) {
      return NextResponse.json(
        { success: false, message: 'Access denied - You are not authorized to download this file' },
        { status: 403 }
      )
    }

    // Get file type from query params
    const { searchParams } = new URL(request.url)
    const fileType = searchParams.get('type') || 'initial' // 'initial' or 'final'

    let fileData
    if (fileType === 'final' && abstract.final?.file) {
      fileData = abstract.final.file
    } else if (abstract.initial?.file) {
      fileData = abstract.initial.file
    } else {
      return NextResponse.json(
        { success: false, message: 'File not found' },
        { status: 404 }
      )
    }

    // Check if we have a blob URL (Vercel Blob storage)
    const blobUrl = fileData.blobUrl || fileData.storagePath
    
    if (!blobUrl) {
      return NextResponse.json(
        { success: false, message: 'File URL not found' },
        { status: 404 }
      )
    }

    // Check if it's a Vercel Blob URL
    if (blobUrl.includes('blob.vercel-storage.com') || blobUrl.startsWith('https://')) {
      try {
        // Fetch the file from Vercel Blob
        const response = await fetch(blobUrl)
        
        if (!response.ok) {
          return NextResponse.json(
            { success: false, message: 'File not found on storage' },
            { status: 404 }
          )
        }

        const fileBuffer = await response.arrayBuffer()
        
        // Get file extension for content type
        const fileExtension = path.extname(fileData.originalName).toLowerCase()
        let contentType = fileData.mimeType || 'application/octet-stream'
        
        if (!contentType || contentType === 'application/octet-stream') {
          switch (fileExtension) {
            case '.pdf':
              contentType = 'application/pdf'
              break
            case '.doc':
              contentType = 'application/msword'
              break
            case '.docx':
              contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              break
            case '.ppt':
              contentType = 'application/vnd.ms-powerpoint'
              break
            case '.pptx':
              contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
              break
            case '.txt':
              contentType = 'text/plain'
              break
          }
        }

        // Create filename with registration ID
        const userReg = abstract.userId as any
        const regId = userReg?.registration?.registrationId || 'UNKNOWN'
        const fileName = `${regId}-${abstract.abstractId}-${fileType}${path.extname(fileData.originalName)}`

        // Return the file
        return new Response(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': fileBuffer.byteLength.toString(),
          },
        })

      } catch (fetchError) {
        console.error('Blob fetch error:', fetchError)
        return NextResponse.json(
          { success: false, message: 'Error fetching file from storage' },
          { status: 500 }
        )
      }
    }

    // Fallback for local file storage (legacy)
    try {
      const { readFileSync, existsSync } = await import('fs')
      
      if (!existsSync(blobUrl)) {
        return NextResponse.json(
          { success: false, message: 'File not found on server' },
          { status: 404 }
        )
      }

      const fileBuffer = readFileSync(blobUrl)
      
      const fileExtension = path.extname(fileData.originalName).toLowerCase()
      let contentType = 'application/octet-stream'
      
      switch (fileExtension) {
        case '.pdf':
          contentType = 'application/pdf'
          break
        case '.doc':
          contentType = 'application/msword'
          break
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          break
        case '.txt':
          contentType = 'text/plain'
          break
      }

      const userReg = abstract.userId as any
      const regId = userReg?.registration?.registrationId || 'UNKNOWN'
      const fileName = `${regId}-${abstract.abstractId}-${fileType}${path.extname(fileData.originalName)}`

      return new Response(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      })

    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json(
        { success: false, message: 'Error reading file' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
