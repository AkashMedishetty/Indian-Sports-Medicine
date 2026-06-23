import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { sendEmail } from '@/conference-backend-core/lib/email/smtp'
import { getEventReminderTemplate } from '@/conference-backend-core/lib/email/templates'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { dryRun = false, testEmail, page, pageSize = 30 } = body

    const users = await User.find({
      'registration.status': { $in: ['confirmed', 'paid'] },
      'registration.registrationId': { $exists: true, $ne: '' }
    }).select('email profile registration').lean()

    if (!users.length) {
      return NextResponse.json({ success: false, message: 'No confirmed registrations found' })
    }

    const getCategoryLabel = (key: string) => {
      const cat = conferenceConfig.registration.categories.find((c: any) => c.key === key)
      return cat?.label || key
    }

    const userData = users.map((u: any) => ({
      name: `${u.profile?.title || ''} ${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim(),
      email: u.email,
      registrationId: u.registration.registrationId,
      category: getCategoryLabel(u.registration.type),
    }))

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        data: { total: userData.length, sample: userData.slice(0, 10) }
      })
    }

    if (testEmail) {
      const sample = userData[0]
      const html = getEventReminderTemplate({
        name: sample.name,
        registrationId: sample.registrationId,
        category: sample.category,
      })
      await sendEmail({
        to: testEmail,
        subject: `[TEST] ⏰ See You Tomorrow — ${conferenceConfig.shortName}`,
        html,
        text: `Reminder for ${sample.name} (${sample.registrationId})`,
        templateName: 'conference-reminder-test',
        category: 'reminder'
      })
      return NextResponse.json({ success: true, message: `Test reminder sent to ${testEmail} using ${sample.name}'s data` })
    }

    // Paginated send
    const totalPages = Math.ceil(userData.length / pageSize)
    const currentPage = page ?? 0
    const startIdx = currentPage * pageSize
    const pageData = userData.slice(startIdx, startIdx + pageSize)

    if (pageData.length === 0) {
      return NextResponse.json({ success: true, data: { sent: 0, failed: 0, errors: [], total: userData.length, totalPages, currentPage, done: true } })
    }

    let sent = 0, failed = 0
    const errors: Array<{ name: string; email: string; error: string }> = []
    const sentList: Array<{ name: string; email: string; registrationId: string }> = []
    const BATCH_SIZE = 5

    for (let i = 0; i < pageData.length; i += BATCH_SIZE) {
      const batch = pageData.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(batch.map(async (u) => {
        const html = getEventReminderTemplate({ name: u.name, registrationId: u.registrationId, category: u.category })
        await sendEmail({
          to: u.email,
          subject: `⏰ See You Tomorrow — ${conferenceConfig.shortName}`,
          html,
          text: `Conference reminder for ${u.name}`,
          templateName: 'conference-reminder',
          category: 'reminder'
        })
        return u
      }))

      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled') {
          sent++
          sentList.push({ name: batch[j].name, email: batch[j].email, registrationId: batch[j].registrationId })
        } else {
          failed++
          errors.push({ name: batch[j].name, email: batch[j].email, error: (results[j] as PromiseRejectedResult).reason?.message || 'Unknown' })
        }
      }
    }

    const done = currentPage >= totalPages - 1
    return NextResponse.json({
      success: true,
      message: `Page ${currentPage + 1}/${totalPages}: ${sent} sent, ${failed} failed`,
      data: { sent, failed, errors, sentList, total: userData.length, totalPages, currentPage, done }
    })
  } catch (error: any) {
    console.error('Reminder email error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
