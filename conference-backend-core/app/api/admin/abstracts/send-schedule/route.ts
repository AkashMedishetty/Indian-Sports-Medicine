import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Abstract from '@/lib/models/Abstract'
import { sendEmail } from '@/conference-backend-core/lib/email/smtp'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { getBaseTemplate } from '@/conference-backend-core/lib/email/templates'
import fs from 'fs'
import path from 'path'

export const maxDuration = 60

interface ScheduleEntry {
  time: string
  title: string
  presenter: string
  hall: string
  date: string
  category: string // 'Free Paper' or 'Award Paper'
}

function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchPresenterToUser(presenterName: string, users: any[]): any | null {
  const normalized = normalizeName(presenterName)
  const presenterWords = normalized.split(' ').filter(w => w.length > 1)

  // Exact match first
  for (const user of users) {
    const userName = normalizeName(`${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`)
    if (userName === normalized) return user
  }

  // Fuzzy: all presenter words must appear in user name
  for (const user of users) {
    const userName = normalizeName(`${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`)
    const userWords = userName.split(' ').filter(w => w.length > 1)
    const allMatch = presenterWords.every(pw => 
      userWords.some(uw => uw === pw || (pw.length > 3 && uw.startsWith(pw)) || (uw.length > 3 && pw.startsWith(uw)))
    )
    if (allMatch && presenterWords.length >= 2) return user
  }

  // Last resort: check if last name matches (for short names like "Dr Rahul")
  if (presenterWords.length === 1 && presenterWords[0].length >= 4) {
    for (const user of users) {
      const lastName = normalizeName(user.profile?.lastName || '')
      const firstName = normalizeName(user.profile?.firstName || '')
      if (lastName === presenterWords[0] || firstName === presenterWords[0]) return user
    }
  }

  return null
}

function parseCSV(content: string): ScheduleEntry[] {
  // Join multi-line quoted fields into single logical lines
  const rawLines = content.split('\n')
  if (rawLines.length < 2) return []

  const logicalLines: string[] = []
  let currentLine = ''
  let inQuotes = false

  for (const raw of rawLines) {
    if (!currentLine) {
      currentLine = raw
    } else {
      currentLine += ' ' + raw
    }
    for (const char of raw) {
      if (char === '"') inQuotes = !inQuotes
    }
    if (!inQuotes) {
      logicalLines.push(currentLine)
      currentLine = ''
    }
  }
  if (currentLine) logicalLines.push(currentLine)

  // Skip header
  return logicalLines.slice(1).filter(l => l.trim()).map(line => {
    const parts: string[] = []
    let current = ''
    let quoted = false
    for (const char of line) {
      if (char === '"') { quoted = !quoted; continue }
      if (char === ',' && !quoted) { parts.push(current.trim()); current = ''; continue }
      current += char
    }
    parts.push(current.trim())
    
    return {
      time: parts[0] || '',
      title: parts[1] || '',
      presenter: parts[2] || '',
      hall: parts[3] || '',
      date: parts[4] || '',
      category: ''
    }
  }).filter(e => e.presenter && e.time)
}

function generateScheduleEmail(userName: string, entries: ScheduleEntry[]): string {
  const categories = [...new Set(entries.map(e => e.category))]
  const hasAward = categories.includes('Award Paper')
  const hasFreePaper = categories.includes('Free Paper')
  const hasEPoster = categories.includes('E-Poster')

  const rows = entries.map(e => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; color: #015189;">${e.time}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${e.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;"><span style="background: ${e.category === 'Award Paper' ? '#fef3c7' : e.category === 'E-Poster' ? '#f3e8ff' : '#dbeafe'}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${e.category}</span></td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${e.hall}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${e.date}</td>
    </tr>
  `).join('')

  // Category-specific guidelines
  let guidelinesSection = ''

  if (hasAward) {
    guidelinesSection += `
      <div style="background-color: #fefce8; padding: 15px; border-left: 4px solid #eab308; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #854d0e;">🏆 Award (Medal) Paper Presentation Guidelines</h4>
        <table style="width: 100%; margin: 10px 0; font-size: 13px;">
          <tr><td style="padding: 4px 0;"><strong>Presentation:</strong> 8 minutes</td><td style="padding: 4px 0;"><strong>Discussion:</strong> 2 minutes</td></tr>
          <tr><td style="padding: 4px 0;">⚠️ Warning at 7 minutes</td><td style="padding: 4px 0;">🛑 Stop at 8 minutes</td></tr>
        </table>
        <p style="font-size: 13px; margin: 8px 0 0 0;"><strong>Instructions:</strong></p>
        <ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
          <li>Use the provided template for slide presentation</li>
          <li>Begin with greeting and introduction</li>
          <li>Clearly state title and objectives</li>
          <li>Present key results and conclusion</li>
          <li>Keep slides concise and readable</li>
          <li>Paper should include <strong>only presenter name</strong>; institution name must not be mentioned anywhere in the paper</li>
          <li>Answer questions from judges briefly and clearly</li>
          <li>Be present 15 minutes before your session</li>
          <li>Submit presentation in advance</li>
          <li>Strict time adherence required</li>
        </ul>
      </div>
    `
  }

  if (hasFreePaper) {
    guidelinesSection += `
      <div style="background-color: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #1e40af;">📋 Free Paper Presentation Guidelines</h4>
        <table style="width: 100%; margin: 10px 0; font-size: 13px;">
          <tr><td style="padding: 4px 0;"><strong>Presentation:</strong> 5 minutes</td><td style="padding: 4px 0;"><strong>Discussion:</strong> 2 minutes</td></tr>
          <tr><td style="padding: 4px 0;">⚠️ Warning at 4 minutes</td><td style="padding: 4px 0;">🛑 Stop at 5 minutes</td></tr>
        </table>
        <p style="font-size: 13px; margin: 8px 0 0 0;"><strong>Instructions:</strong></p>
        <ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
          <li>Use the provided template for slide presentation</li>
          <li>Begin with greeting and introduction</li>
          <li>Clearly state title and objectives</li>
          <li>Present key results and conclusion</li>
          <li>Keep slides concise and readable</li>
          <li>Paper should include <strong>only presenter name</strong>; institution name must not be mentioned anywhere in the paper</li>
          <li>Answer questions from judges briefly and clearly</li>
          <li>Strict time adherence required</li>
        </ul>
      </div>
    `
  }

  if (hasEPoster) {
    guidelinesSection += `
      <div style="background-color: #faf5ff; padding: 15px; border-left: 4px solid #a855f7; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #7e22ce;">🖼️ E-Poster Presentation Guidelines</h4>
        <ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
          <li>E-Poster session: <strong>3:15 PM - 5:15 PM on April 25, 2026 (Hall B)</strong></li>
          <li>Prepare your poster in the provided template format</li>
          <li>Be present at your poster during the session for discussion with judges</li>
          <li>Poster should include <strong>only presenter name</strong>; institution name must not be mentioned</li>
        </ul>
      </div>
    `
  }

  const content = `
    <h2>📋 Your Presentation Schedule</h2>
    <p>Dear ${userName},</p>
    
    <p>Congratulations on being selected! We are pleased to share your presentation schedule for <strong>${conferenceConfig.shortName}</strong>.</p>
    
    <div class="highlight">
      <h3 style="margin-top: 0;">Your Schedule</h3>
      <table>
        <thead>
          <tr>
            <th>Time</th><th>Title</th><th style="text-align: center;">Category</th><th style="text-align: center;">Hall</th><th style="text-align: center;">Date</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    ${guidelinesSection}

    <!-- Final Submission -->
    <div style="background-color: #fff7ed; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #9a3412;">📤 Submit Your Final Presentation</h4>
      <p style="margin: 0 0 8px 0; font-size: 14px;">If you haven't submitted your final presentation yet, please do so at the earliest:</p>
      <p style="margin: 0; text-align: center;">
        <a href="https://www.isshmidtermcme2026.com/abstracts" style="display: inline-block; padding: 10px 24px; background: linear-gradient(45deg, #015189, #0066b3); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Submit Final Presentation →</a>
      </p>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #9a3412;">Log in with your registered email to access the submission portal.</p>
    </div>

    <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #166534;">🏨 Venue</h4>
      <p style="margin: 0; font-size: 14px;">
        <strong>${conferenceConfig.venue.name}</strong><br>
        ${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}<br>
        April 25-26, 2026
      </p>
    </div>
    
    <p>If you have any questions, please contact us at <a href="mailto:${conferenceConfig.contact.email}">${conferenceConfig.contact.email}</a></p>
    
    <p>We wish you all the best!</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Scientific Committee</strong></p>
  `

  return getBaseTemplate(content)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { dryRun = false, testEmail, testPresenter } = body

    // Read CSV files from public directory
    const publicDir = path.join(process.cwd(), 'public')
    
    let freePaperContent = ''
    let awardPaperContent = ''
    
    try {
      freePaperContent = fs.readFileSync(path.join(process.cwd(), 'Free Paper  - Sheet1.csv'), 'utf-8')
    } catch { console.error('Free Paper CSV not found') }
    
    try {
      awardPaperContent = fs.readFileSync(path.join(process.cwd(), 'Award Paper List - Sheet1.csv'), 'utf-8')
    } catch { console.error('Award Paper CSV not found') }

    const freePapers = parseCSV(freePaperContent).map(e => ({ ...e, category: 'Free Paper' }))
    const awardPapers = parseCSV(awardPaperContent).map(e => ({ ...e, category: 'Award Paper' }))
    const allEntries = [...freePapers, ...awardPapers]

    // Get unique presenter names from CSVs
    const presenterNames = [...new Set(allEntries.map(e => e.presenter))]

    // Fetch all users from DB
    const users = await User.find({}).select('email profile registration')

    // Fetch accepted e-poster/poster abstracts from DB
    // Check both approvedFor AND submissionCategory since some abstracts don't have approvedFor set
    const posterAbstracts = await Abstract.find({
      status: { $in: ['accepted', 'final-submitted'] },
      $or: [
        { approvedFor: { $in: ['poster-presentation', 'e-poster', 'poster'] } },
        { submissionCategory: 'poster-presentation' },
        { track: 'E-Poster' }
      ]
    }).lean()

    console.log(`[send-schedule] Found ${posterAbstracts.length} poster abstracts from DB`)
    posterAbstracts.forEach((a: any) => {
      console.log(`  → ${a.abstractId}: approvedFor=${a.approvedFor}, submissionCategory=${a.submissionCategory}, track=${a.track}, status=${a.status}, userId=${a.userId}`)
    })

    // Match presenters to users
    const matched: Array<{ presenter: string; user: any; entries: ScheduleEntry[] }> = []
    const unmatched: string[] = []

    // Match CSV presenters
    for (const name of presenterNames) {
      const user = matchPresenterToUser(name, users)
      const entries = allEntries.filter(e => e.presenter === name)
      
      if (user) {
        const existing = matched.find(m => m.user._id.toString() === user._id.toString())
        if (existing) {
          existing.entries.push(...entries)
        } else {
          matched.push({ presenter: name, user, entries })
        }
      } else {
        unmatched.push(name)
      }
    }

    // Add e-poster presenters from DB
    let ePosterCount = 0
    for (const abs of posterAbstracts) {
      const absAny = abs as any
      const user = users.find((u: any) => u._id.toString() === absAny.userId?.toString())
      if (!user) {
        console.log(`  [e-poster] No user found for abstract ${absAny.abstractId} (userId: ${absAny.userId})`)
        continue
      }

      const posterEntry: ScheduleEntry = {
        time: '03:15PM - 05:15PM',
        title: absAny.title || 'E-Poster Presentation',
        presenter: `${(user as any).profile?.firstName || ''} ${(user as any).profile?.lastName || ''}`.trim(),
        hall: 'Hall-B',
        date: '25/04/2026',
        category: 'E-Poster'
      }

      const existing = matched.find(m => m.user._id.toString() === (user as any)._id.toString())
      if (existing) {
        // Don't add duplicate if same title already exists
        const alreadyHas = existing.entries.some(e => {
          const eTitle = e.title.toLowerCase().replace(/[^a-z0-9]/g, '')
          const pTitle = posterEntry.title.toLowerCase().replace(/[^a-z0-9]/g, '')
          return eTitle === pTitle || eTitle.includes(pTitle) || pTitle.includes(eTitle)
        })
        if (!alreadyHas) {
          existing.entries.push(posterEntry)
          ePosterCount++
          console.log(`  [e-poster] Added to existing: ${posterEntry.presenter} — ${posterEntry.title}`)
        } else {
          console.log(`  [e-poster] Skipped duplicate: ${posterEntry.presenter} — ${posterEntry.title}`)
        }
      } else {
        matched.push({ presenter: posterEntry.presenter, user, entries: [posterEntry] })
        ePosterCount++
        console.log(`  [e-poster] New match: ${posterEntry.presenter} — ${posterEntry.title}`)
      }
    }

    console.log(`[send-schedule] Summary: ${matched.length} matched, ${unmatched.length} unmatched, ${ePosterCount} e-posters added, freePapers=${freePapers.length}, awardPapers=${awardPapers.length}`)

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        data: {
          totalPresenters: matched.length,
          matched: matched.map(m => ({
            presenter: m.presenter,
            email: m.user.email,
            name: `${m.user.profile?.firstName} ${m.user.profile?.lastName}`,
            registrationId: m.user.registration?.registrationId,
            slots: m.entries.length,
            categories: [...new Set(m.entries.map(e => e.category))].join(', ')
          })),
          unmatched,
          freePapers: freePapers.length,
          awardPapers: awardPapers.length,
          ePosters: ePosterCount,
          ePosterAbstractsFound: posterAbstracts.length,
          ePosterApprovedForValues: [...new Set(posterAbstracts.map((a: any) => a.approvedFor))],
        }
      })
    }

    // Test email — send to a specific address using a selected presenter's data
    if (testEmail) {
      let sample = matched[0]
      if (testPresenter) {
        const found = matched.find(m => m.presenter === testPresenter || m.user.registration?.registrationId === testPresenter)
        if (found) sample = found
      }
      if (!sample) return NextResponse.json({ success: false, message: 'No matched presenters to test with' })

      const userName = `${sample.user.profile?.title || 'Dr.'} ${sample.user.profile?.firstName || ''} ${sample.user.profile?.lastName || ''}`.trim()
      const html = generateScheduleEmail(userName, sample.entries)

      await sendEmail({
        to: testEmail,
        subject: `[TEST] 📋 Your Presentation Schedule — ${conferenceConfig.shortName}`,
        html,
        text: `Test presentation schedule for ${userName}`,
        templateName: 'presentation-schedule-test',
        category: 'system'
      })

      return NextResponse.json({
        success: true,
        message: `Test email sent to ${testEmail} using data from ${sample.presenter} (${sample.entries.length} slots: ${sample.entries.map(e => e.category).join(', ')})`
      })
    }

    // Send emails in batches of 5
    let sent = 0
    let failed = 0
    const errors: Array<{ presenter: string; error: string }> = []
    const BATCH_SIZE = 5

    for (let i = 0; i < matched.length; i += BATCH_SIZE) {
      const batch = matched.slice(i, i + BATCH_SIZE)
      
      const results = await Promise.allSettled(batch.map(async ({ presenter, user, entries }) => {
        const userName = `${user.profile?.title || 'Dr.'} ${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim()
        const html = generateScheduleEmail(userName, entries)
        
        await sendEmail({
          to: user.email,
          subject: `📋 Your Presentation Schedule — ${conferenceConfig.shortName}`,
          html,
          text: `Your presentation schedule for ${conferenceConfig.shortName}: ${entries.map(e => `${e.date} ${e.time} - ${e.title} (${e.hall})`).join('; ')}`,
          userId: user._id.toString(),
          userName,
          templateName: 'presentation-schedule',
          category: 'abstract'
        })
        
        return presenter
      }))

      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled') {
          sent++
        } else {
          failed++
          errors.push({ presenter: batch[j].presenter, error: (results[j] as PromiseRejectedResult).reason?.message || 'Unknown' })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} schedule emails, ${failed} failed, ${unmatched.length} unmatched`,
      data: { sent, failed, unmatched, errors }
    })
  } catch (error: any) {
    console.error('Send schedule error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
