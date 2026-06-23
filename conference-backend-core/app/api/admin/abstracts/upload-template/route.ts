import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import AbstractsConfig from '@/conference-backend-core/lib/models/AbstractsConfig'
import { put } from '@vercel/blob'
import { logAction } from '@/conference-backend-core/lib/audit/service'

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'initial' or 'final'

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`templates/${type}-${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    await connectDB()

    // Update config with template URL
    let config = await AbstractsConfig.findOne({})
    
    if (!config) {
      config = new AbstractsConfig({
        isEnabled: true,
        submissionOpenDate: new Date(),
        submissionCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        fileRequirements: {}
      })
    }

    if (type === 'initial') {
      config.fileRequirements.templateUrl = blob.url
      config.fileRequirements.templateFileName = file.name
    } else {
      config.fileRequirements.finalTemplateUrl = blob.url
      config.fileRequirements.finalTemplateFileName = file.name
    }

    await config.save()

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
      action: 'config.template_uploaded',
      resourceType: 'config',
      resourceId: 'abstracts',
      resourceName: `${type} template`,
      metadata: { ip, userAgent },
      changes: { before: {}, after: { templateUrl: blob.url, fileName: file.name } },
      description: `Admin uploaded ${type} submission template: ${file.name}`
    })

    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      fileName: file.name,
      message: 'Template uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading template:', error)
    return NextResponse.json({ success: false, message: 'Failed to upload template' }, { status: 500 })
  }
}
