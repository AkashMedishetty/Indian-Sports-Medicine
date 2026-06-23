import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided'
      }, { status: 400 })
    }

    // Validate file type - only images allowed
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
      }, { status: 400 })
    }

    // Validate file size - max 5MB
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `payment-screenshots/${timestamp}-${randomStr}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false
    })

    console.log('✅ Payment screenshot uploaded:', blob.url)

    return NextResponse.json({
      success: true,
      message: 'Screenshot uploaded successfully',
      data: {
        url: blob.url,
        filename: filename
      }
    })

  } catch (error) {
    console.error('❌ Screenshot upload error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to upload screenshot',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
