import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import Review from '@/conference-backend-core/lib/models/Review'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  console.log('=== ABSTRACTS EXPORT START ===')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session check:', !!session?.user)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }
    
    const userRole = (session.user as any)?.role
    console.log('User role:', userRole)
    
    if (userRole !== 'admin' && userRole !== 'reviewer') {
      return NextResponse.json({ success: false, message: 'Admin or reviewer access required' }, { status: 403 })
    }

    await connectDB()
    console.log('DB connected')
    
    const { searchParams } = new URL(request.url)
    const includeFiles = searchParams.get('includeFiles') === 'true'
    const status = searchParams.get('status')
    const submittingFor = searchParams.get('submittingFor')
    const submissionCategory = searchParams.get('submissionCategory')

    console.log('Params:', { includeFiles, status, submittingFor, submissionCategory })

    const query: any = {}
    if (status && status !== 'all') query.status = status
    if (submittingFor && submittingFor !== 'all') query.submittingFor = submittingFor
    if (submissionCategory && submissionCategory !== 'all') query.submissionCategory = submissionCategory

    // Fetch abstracts
    const abstracts = await Abstract.find(query)
      .populate({
        path: 'userId',
        select: 'firstName lastName email registration.registrationId profile'
      })
      .sort({ submittedAt: -1 })
      .lean()

    console.log('Found abstracts:', abstracts.length)

    // Fetch all reviews for these abstracts
    const abstractIds = abstracts.map(a => a._id)
    const reviews = await Review.find({ abstractId: { $in: abstractIds } })
      .populate({
        path: 'reviewerId',
        select: 'firstName lastName email'
      })
      .lean()

    // Create a map of abstractId to reviews
    const reviewsMap = new Map<string, any[]>()
    for (const review of reviews) {
      const abstractIdStr = review.abstractId.toString()
      if (!reviewsMap.has(abstractIdStr)) {
        reviewsMap.set(abstractIdStr, [])
      }
      reviewsMap.get(abstractIdStr)!.push(review)
    }

    // Attach reviews to abstracts
    const abstractsWithReviews = abstracts.map(abstract => {
      const abstractReviews = reviewsMap.get(abstract._id.toString()) || []
      return { ...abstract, reviews: abstractReviews }
    })

    console.log('Reviews fetched:', reviews.length)

    if (includeFiles) {
      console.log('Creating ZIP with files...')
      return await createZipWithFiles(abstractsWithReviews)
    }

    // Return CSV
    console.log('Creating CSV...')
    return createCsv(abstractsWithReviews)

  } catch (error: any) {
    console.error('EXPORT ERROR:', error.message, error.stack)
    return NextResponse.json(
      { success: false, message: 'Export failed: ' + error.message },
      { status: 500 }
    )
  }
}

function createCsv(abstracts: any[]) {
  const headers = [
    'Abstract ID', 'Registration ID', 'Title', 'Status',
    'Submitting For', 'Submission Category', 'Submission Topic', 'Track',
    'Approved For', 'Authors', 'Keywords',
    // User data
    'Presenter Name', 'Email', 'Phone', 'Designation', 'Institution',
    'City', 'State', 'Country',
    // Dates
    'Submitted At', 'Decision At',
    // Files
    'Initial File URL', 'Final File URL', 'Final Submitted At',
    // Review data
    'Review Decision', 'Review Approved For', 'Total Score', 
    'Originality', 'Level of Evidence', 'Scientific Impact', 
    'Social Significance', 'Quality of Manuscript',
    'Reviewer Name', 'Reviewer Email', 'Review Comments', 'Rejection Comment', 'Review Date'
  ]

  const rows = abstracts.map(a => {
    const user = a.userId as any
    const profile = user?.profile || {}
    const name = [profile.firstName || user?.firstName, profile.lastName || user?.lastName]
      .filter(Boolean).join(' ') || 'N/A'
    
    const review = a.reviews?.[0]
    const reviewerName = review?.reviewerId 
      ? `${review.reviewerId.firstName || ''} ${review.reviewerId.lastName || ''}`.trim() 
      : 'N/A'
    
    const esc = (v: string) => `"${(v || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    
    return [
      a.abstractId || '',
      user?.registration?.registrationId || 'N/A',
      esc(a.title || ''),
      a.status || 'N/A',
      a.submittingFor || a.track || 'N/A',
      a.submissionCategory || 'N/A',
      a.submissionTopic || 'N/A',
      a.track || 'N/A',
      a.approvedFor || 'N/A',
      esc((a.authors || []).join(', ')),
      esc((a.keywords || []).join(', ')),
      // User data
      esc(name),
      user?.email || 'N/A',
      profile.phone || 'N/A',
      profile.designation || 'N/A',
      esc(profile.institution || ''),
      profile.address?.city || 'N/A',
      profile.address?.state || 'N/A',
      profile.address?.country || 'N/A',
      // Dates
      a.submittedAt ? new Date(a.submittedAt).toISOString() : 'N/A',
      a.decisionAt ? new Date(a.decisionAt).toISOString() : 'N/A',
      // Files
      a.initial?.file?.blobUrl || 'N/A',
      a.final?.file?.blobUrl || 'N/A',
      a.final?.submittedAt ? new Date(a.final.submittedAt).toISOString() : 'N/A',
      // Review data
      review?.decision || review?.recommendation || 'N/A',
      review?.approvedFor || 'N/A',
      review?.scores?.total ?? 'N/A',
      review?.scores?.originality ?? 'N/A',
      review?.scores?.levelOfEvidence ?? 'N/A',
      review?.scores?.scientificImpact ?? 'N/A',
      review?.scores?.socialSignificance ?? 'N/A',
      review?.scores?.qualityOfManuscript ?? 'N/A',
      esc(reviewerName),
      review?.reviewerId?.email || 'N/A',
      esc(review?.comments || ''),
      esc(review?.rejectionComment || ''),
      review?.submittedAt ? new Date(review.submittedAt).toISOString() : 'N/A'
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="abstracts-${Date.now()}.csv"`,
    }
  })
}

async function createZipWithFiles(abstracts: any[]) {
  console.log('ZIP: Importing JSZip...')
  const JSZip = (await import('jszip')).default
  console.log('ZIP: JSZip imported')
  
  const zip = new JSZip()
  
  // Create a comprehensive CSV for the ZIP
  const esc = (v: string) => `"${(v || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
  const csvHeaders = [
    'Abstract ID', 'Registration ID', 'Title', 'Status',
    'Submitting For', 'Submission Category', 'Track', 'Approved For',
    'Authors', 'Presenter Name', 'Email', 'Phone', 'Institution',
    'Submitted At', 'Initial File', 'Final File'
  ]
  const rows = abstracts.map(a => {
    const user = a.userId as any
    const profile = user?.profile || {}
    const name = [profile.firstName || user?.firstName, profile.lastName || user?.lastName]
      .filter(Boolean).join(' ') || 'N/A'
    return [
      a.abstractId || '',
      user?.registration?.registrationId || 'N/A',
      esc(a.title || ''),
      a.status || 'N/A',
      a.submittingFor || a.track || 'N/A',
      a.submissionCategory || 'N/A',
      a.track || 'N/A',
      a.approvedFor || 'N/A',
      esc((a.authors || []).join(', ')),
      esc(name),
      user?.email || 'N/A',
      profile.phone || 'N/A',
      esc(profile.institution || ''),
      a.submittedAt ? new Date(a.submittedAt).toISOString() : 'N/A',
      a.initial?.file?.originalName || 'N/A',
      a.final?.file?.originalName || 'N/A'
    ].join(',')
  })
  
  const csvContent = [csvHeaders.join(','), ...rows].join('\n')
  zip.file('abstracts.csv', csvContent)
  console.log('ZIP: Added CSV')

  // Fetch and add files
  let added = 0
  let failed = 0
  
  for (const a of abstracts) {
    const blobUrl = a.initial?.file?.blobUrl || a.initial?.file?.storagePath
    
    if (blobUrl && blobUrl.startsWith('https://')) {
      try {
        console.log(`ZIP: Fetching ${a.abstractId}...`)
        const res = await fetch(blobUrl)
        
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer()
          const fileName = a.initial?.file?.originalName || `${a.abstractId}.pdf`
          zip.file(`files/${a.abstractId}_${fileName}`, arrayBuffer)
          added++
          console.log(`ZIP: Added ${fileName} (${arrayBuffer.byteLength} bytes)`)
        } else {
          failed++
          console.log(`ZIP: Fetch failed for ${a.abstractId}: ${res.status}`)
        }
      } catch (err: any) {
        failed++
        console.error(`ZIP: Error for ${a.abstractId}:`, err.message)
      }
    }
    
    // Also check final file
    const finalUrl = a.final?.file?.blobUrl || a.final?.file?.storagePath
    if (finalUrl && finalUrl.startsWith('https://')) {
      try {
        const res = await fetch(finalUrl)
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer()
          const fileName = a.final?.file?.originalName || `${a.abstractId}_final.pptx`
          zip.file(`files/${a.abstractId}_final_${fileName}`, arrayBuffer)
          added++
        }
      } catch (err: any) {
        failed++
      }
    }
  }

  console.log(`ZIP: Files added=${added}, failed=${failed}`)
  console.log('ZIP: Generating buffer...')
  
  const buffer = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 5 }
  })
  
  console.log(`ZIP: Generated ${buffer.byteLength} bytes`)

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="abstracts-export-${Date.now()}.zip"`,
      'Content-Length': buffer.byteLength.toString()
    }
  })
}
