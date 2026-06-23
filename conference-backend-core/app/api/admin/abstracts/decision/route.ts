import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import Review from '@/lib/models/Review'
import User from '@/lib/models/User'
import { EmailService } from '@/lib/email/service'
import { getEmailSubject } from '@/config/conference.config'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
  }
  const { abstractId, decision } = await request.json()
  if (!abstractId || !['accepted', 'rejected'].includes(decision)) {
    return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 })
  }
  await connectDB()
  const doc = await Abstract.findOne({ abstractId })
  if (!doc) return NextResponse.json({ success: false, message: 'Abstract not found' }, { status: 404 })

  // Compute average score using the 5 criteria (each 1-10, total max 50)
  const reviews = await Review.find({ abstractId: doc._id })
  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => {
      const total = r.scores?.total || (
        (r.scores?.originality || 0) + 
        (r.scores?.levelOfEvidence || 0) + 
        (r.scores?.scientificImpact || 0) + 
        (r.scores?.socialSignificance || 0) + 
        (r.scores?.qualityOfManuscript || 0)
      )
      return acc + total
    }, 0)
    doc.averageScore = sum / reviews.length // average of total scores (out of 50)
  }
  doc.status = decision
  doc.decisionAt = new Date()
  await doc.save()

  try {
    const author = await User.findById(doc.userId)
    if (author?.email) {
      const subject = decision === 'accepted' ? getEmailSubject('Abstract Accepted') : getEmailSubject('Abstract Decision')
      await EmailService.sendCustomMessage({
        email: author.email,
        recipientName: `${author.profile?.title || ''} ${author.profile?.firstName || ''}`.trim(),
        subject,
        content: decision === 'accepted' ? `Your abstract ${doc.abstractId} has been accepted. You can now submit the final version.` : `Your abstract ${doc.abstractId} was not accepted. Thank you for your submission.`,
      })
    }
  } catch (e) {
    console.error('Decision email error', e)
  }

  return NextResponse.json({ success: true, data: { abstractId: doc.abstractId, status: doc.status, averageScore: doc.averageScore } })
}


