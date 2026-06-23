import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
    }

    // Allow images and PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF files are allowed.'
      }, { status: 400 })
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop() || 'pdf'
    const filename = `hod-forms/${timestamp}-${randomStr}.${extension}`

    const blob = await put(filename, file, { access: 'public', addRandomSuffix: false })

    return NextResponse.json({
      success: true,
      message: 'HOD form uploaded successfully',
      data: { url: blob.url, filename }
    })
  } catch (error) {
    console.error('HOD form upload error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to upload HOD form'
    }, { status: 500 })
  }
}
