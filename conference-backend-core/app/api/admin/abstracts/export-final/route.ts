import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'
import { readFileSync, existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import archiver from 'archiver'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }
    
    const userRole = (session.user as any)?.role
    if (userRole !== 'admin' && userRole !== 'reviewer') {
      return NextResponse.json({ success: false, message: 'Admin or reviewer access required' }, { status: 403 })
    }

    await connectDB()

    const query: any = {
      status: 'final-submitted',
      'final.file': { $exists: true }
    }

    // If reviewer, only show assigned abstracts
    if (userRole === 'reviewer') {
      query.assignedReviewerIds = { $in: [(session.user as any).id] }
    }

    // Fetch final submissions
    const abstracts = await Abstract.find(query)
      .populate('userId', 'firstName lastName email registration.registrationId profile')
      .sort({ 'final.submittedAt': -1 })
      .lean()

    // Create CSV data
    const csvHeaders = [
      'Abstract ID', 'Final Display ID', 'Title', 'Track', 'Authors',
      'Submitter Name', 'Email', 'Registration ID', 'Final Submitted',
      'Final File Name', 'Final Notes'
    ]

    const csvRows = abstracts.map(abstract => {
      const user = abstract.userId as any
      return [
        abstract.abstractId,
        abstract.final?.displayId || '',
        `"${abstract.title.replace(/"/g, '""')}"`,
        abstract.track,
        `"${abstract.authors.join(', ')}"`,
        `${user?.profile?.firstName || user?.firstName || ''} ${user?.profile?.lastName || user?.lastName || ''}`.trim(),
        user?.email || '',
        user?.registration?.registrationId || '',
        abstract.final?.submittedAt ? new Date(abstract.final.submittedAt).toLocaleDateString() : '',
        abstract.final?.file?.originalName || '',
        `"${(abstract.final?.notes || '').replace(/"/g, '""')}"`
      ]
    })

    const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n')

    // Create ZIP with CSV and files
    const tempDir = path.join(process.cwd(), 'temp', `final-export-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })

    // Write CSV
    const csvPath = path.join(tempDir, 'final-submissions.csv')
    await writeFile(csvPath, csvContent)

    // Create ZIP
    const zipPath = path.join(tempDir, 'final-submissions-export.zip')
    const output = require('fs').createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    archive.pipe(output)
    archive.file(csvPath, { name: 'final-submissions.csv' })

    // Add final files
    const finalDir = path.join(tempDir, 'final-files')
    await mkdir(finalDir, { recursive: true })

    for (const abstract of abstracts) {
      if (abstract.final?.file?.storagePath && existsSync(abstract.final.file.storagePath)) {
        const user = abstract.userId as any
        const regId = user?.registration?.registrationId || 'UNKNOWN'
        const ext = path.extname(abstract.final.file.originalName)
        const fileName = `${regId}-${abstract.abstractId}-final${ext}`
        
        archive.file(abstract.final.file.storagePath, { name: `final-files/${fileName}` })
      }
    }

    await archive.finalize()

    // Wait for ZIP to complete
    await new Promise((resolve) => output.on('close', resolve))

    // Read and return ZIP
    const zipBuffer = readFileSync(zipPath)
    const fileName = `final-submissions-${new Date().toISOString().split('T')[0]}.zip`

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ success: false, message: 'Export failed' }, { status: 500 })
  }
}
