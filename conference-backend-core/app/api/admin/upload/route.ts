import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided'
      }, { status: 400 })
    }

    // Validate file type based on upload type
    const allowedTypes: Record<string, string[]> = {
      'program-brochure': ['application/pdf'],
      'speaker-photo': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      'qr-code': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
      'default': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    }

    const validTypes = allowedTypes[type] || allowedTypes['default']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: `Invalid file type. Allowed types: ${validTypes.join(', ')}`
      }, { status: 400 })
    }

    // Validate file size (4MB max for Vercel serverless)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        message: 'File size must be less than 4MB'
      }, { status: 400 })
    }

    // Upload to Vercel Blob
    const sanitizedType = type?.replace(/[^a-z0-9-]/gi, '_') || 'upload'
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const blobPath = `admin/${sanitizedType}-${timestamp}.${fileExtension}`

    const blob = await put(blobPath, file, {
      access: 'public',
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: blobPath,
      size: file.size,
      type: file.type,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
