import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/conference-backend-core/lib/models/Abstract'
import User from '@/lib/models/User'
import { EmailService } from '@/lib/email/service'

// Allow up to 60 seconds for this endpoint (Vercel Pro)
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { abstractIds, filter } = body

    let abstracts: any[]

    if (abstractIds && abstractIds.length > 0) {
      abstracts = await Abstract.find({ _id: { $in: abstractIds } })
    } else if (filter === 'all-accepted') {
      abstracts = await Abstract.find({ status: 'accepted' })
    } else {
      return NextResponse.json({ success: false, message: 'Provide abstractIds or filter' }, { status: 400 })
    }

    // Pre-fetch all users in one query for efficiency
    const userIds = [...new Set(abstracts.map(a => a.userId?.toString()).filter(Boolean))]
    const users = await User.find({ _id: { $in: userIds } })
    const userMap = new Map(users.map(u => [u._id.toString(), u]))

    let sent = 0
    let failed = 0
    const errors: Array<{ abstractId: string; error: string }> = []

    // Send in parallel batches of 5
    const BATCH_SIZE = 5
    for (let i = 0; i < abstracts.length; i += BATCH_SIZE) {
      const batch = abstracts.slice(i, i + BATCH_SIZE)
      
      const results = await Promise.allSettled(batch.map(async (abstract) => {
        const user = userMap.get(abstract.userId?.toString())
        if (!user) throw new Error('User not found')
        if (abstract.status !== 'accepted') throw new Error(`Status is ${abstract.status}, skipping`)

        const authorName = `${user.profile?.title || ''} ${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim()

        await EmailService.sendAbstractAcceptance({
          userId: user._id.toString(),
          email: user.email,
          name: authorName,
          registrationId: user.registration?.registrationId || 'N/A',
          abstractId: abstract.abstractId,
          title: abstract.title,
          track: abstract.track || abstract.submittingFor || 'N/A',
          authors: abstract.authors || [],
          reviewedAt: abstract.decisionAt?.toISOString() || new Date().toISOString(),
          approvedFor: abstract.approvedFor || abstract.submissionCategory
        })

        return abstract.abstractId
      }))

      for (let j = 0; j < results.length; j++) {
        const result = results[j]
        if (result.status === 'fulfilled') {
          sent++
        } else {
          failed++
          errors.push({ abstractId: batch[j].abstractId, error: result.reason?.message || 'Unknown error' })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Resent ${sent} emails, ${failed} failed`,
      data: { sent, failed, total: abstracts.length, errors }
    })
  } catch (error: any) {
    console.error('Resend status emails error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
