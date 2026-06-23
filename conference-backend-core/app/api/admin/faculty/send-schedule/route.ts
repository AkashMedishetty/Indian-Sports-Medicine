import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { sendEmail } from '@/conference-backend-core/lib/email/smtp'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import fs from 'fs'
import path from 'path'

export const maxDuration = 60

interface FacultySession {
  session: string
  topic: string
  day: string
  time: string
  hall: string
}

interface FacultyEntry {
  name: string
  phone: string
  email: string
  remarks: string
  registrationStatus: string
  sessions: FacultySession[]
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)\s*/i, '').replace(/,.*$/, '').replace(/\s+/g, ' ').trim()
}

function parseCSV(content: string): FacultyEntry[] {
  // First, join multi-line quoted fields into single logical lines
  const rawLines = content.split('\n')
  if (rawLines.length < 2) return []

  const logicalLines: string[] = []
  let currentLine = ''
  let inQuotes = false

  for (const raw of rawLines) {
    if (!currentLine) {
      currentLine = raw
    } else {
      currentLine += '\n' + raw
    }
    // Count unescaped quotes to determine if we're still inside a quoted field
    for (const char of raw) {
      if (char === '"') inQuotes = !inQuotes
    }
    if (!inQuotes) {
      logicalLines.push(currentLine)
      currentLine = ''
    }
  }
  if (currentLine) logicalLines.push(currentLine)

  const entries: FacultyEntry[] = []

  for (let i = 1; i < logicalLines.length; i++) {
    const line = logicalLines[i].trim()
    if (!line) continue

    // Parse CSV with quoted fields (handles newlines within quotes)
    const parts: string[] = []
    let current = ''
    let quoted = false
    for (const char of line) {
      if (char === '"') { quoted = !quoted; continue }
      if (char === ',' && !quoted) { parts.push(current.trim()); current = ''; continue }
      if (char === '\n' && !quoted) { continue }
      current += char
    }
    parts.push(current.trim())

    const name = parts[0] || ''
    const phone = (parts[1] || '').replace(/\D/g, '').slice(-10)
    const email = (parts[2] || '').trim()
    const remarks = parts[3] || ''
    const registrationStatus = parts[4] || ''

    // Parse up to 6 sessions (columns 5-9, 10-14, 15-19, 20-24, 25-29, 30-34)
    const sessions: FacultySession[] = []
    for (let s = 0; s < 6; s++) {
      const baseIdx = 5 + (s * 5)
      const sessionName = (parts[baseIdx] || '').replace(/\n/g, ' ').trim()
      const topic = (parts[baseIdx + 1] || '').replace(/\n/g, ' ').trim()
      const day = (parts[baseIdx + 2] || '').replace(/\n/g, '').trim()
      const time = (parts[baseIdx + 3] || '').replace(/\n/g, '').trim()
      const hall = (parts[baseIdx + 4] || '').replace(/\n/g, '').trim()
      if (sessionName && topic) {
        sessions.push({ session: sessionName, topic, day, time, hall })
      }
    }

    if (name) entries.push({ name, phone, email, remarks, registrationStatus, sessions })
  }

  return entries
}

function matchToUser(entry: FacultyEntry, users: any[]): any | null {
  // Phone match first
  if (entry.phone && entry.phone.length === 10) {
    const match = users.find(u => u.profile?.phone === entry.phone)
    if (match) return match
  }
  // Fuzzy name match
  const normalized = normalizeName(entry.name)
  const words = normalized.split(' ').filter(w => w.length > 1)
  for (const user of users) {
    const userName = normalizeName(`${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`)
    if (userName === normalized) return user
    const userWords = userName.split(' ').filter(w => w.length > 1)
    if (words.length >= 2) {
      const matchCount = words.filter(w => userWords.some(uw => uw === w || (w.length > 3 && uw.startsWith(w)) || (uw.length > 3 && w.startsWith(uw)))).length
      if (matchCount >= 2) return user
    }
  }
  return null
}

function generateICSLink(session: FacultySession, name: string): string {
  // Parse day
  const dateStr = session.day.includes('1') ? '20260425' : '20260426'
  
  // Parse time — handle various formats:
  // "09:00AM - 09:05AM", "9:00-10:00 Am", "08:00 - 09:00 Am", "2:15-3:15 Pm", "2:15-3:15Pm"
  const timeStr = session.time.replace(/\s+/g, ' ').trim()
  
  // Extract start and end times from the range
  const rangeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?\s*[-–]\s*(\d{1,2}):(\d{2})\s*(am|pm)?/i)
  if (!rangeMatch) return ''
  
  let startH = parseInt(rangeMatch[1])
  const startM = parseInt(rangeMatch[2])
  let endH = parseInt(rangeMatch[4])
  const endM = parseInt(rangeMatch[5])
  
  // AM/PM can be on start, end, or just end (applies to both if start has none)
  const startAmPm = (rangeMatch[3] || rangeMatch[6] || '').toLowerCase()
  const endAmPm = (rangeMatch[6] || rangeMatch[3] || '').toLowerCase()
  
  if (startAmPm === 'pm' && startH !== 12) startH += 12
  if (startAmPm === 'am' && startH === 12) startH = 0
  if (endAmPm === 'pm' && endH !== 12) endH += 12
  if (endAmPm === 'am' && endH === 12) endH = 0
  
  // Convert IST to UTC (subtract 5:30)
  const toUTC = (h: number, m: number) => {
    let uh = h - 5
    let um = m - 30
    if (um < 0) { um += 60; uh -= 1 }
    if (uh < 0) uh += 24
    return { h: uh, m: um }
  }
  
  const startUTC = toUTC(startH, startM)
  const endUTC = toUTC(endH, endM)
  
  const fmt = (d: string, h: number, m: number) => `${d}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00Z`
  const startStr = fmt(dateStr, startUTC.h, startUTC.m)
  const endStr = fmt(dateStr, endUTC.h, endUTC.m)
  
  const title = encodeURIComponent(`${session.topic === 'Chairperson' || session.topic === 'Chaiperson' ? '🪑 Chairperson' : '🎤 Speaker'} — ${session.session.substring(0, 60)}`)
  const location = encodeURIComponent(`${session.hall}, HICC Novotel, Hyderabad`)
  const details = encodeURIComponent(`${session.topic}\n\nSession: ${session.session}\nHall: ${session.hall}`)
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&location=${location}&details=${details}`
}

function generateFacultyEmail(name: string, sessions: FacultySession[]): string {
  const day1 = sessions.filter(s => s.day.includes('1'))
  const day2 = sessions.filter(s => s.day.includes('2'))

  const isChairperson = (topic: string) => topic === 'Chairperson' || topic === 'Chaiperson'

  const renderSessions = (daySessions: FacultySession[], dayLabel: string) => {
    if (daySessions.length === 0) return ''
    return `
      <tr><td colspan="5" style="padding: 12px 10px; background: #25406b; color: white; font-weight: bold; font-size: 14px;">${dayLabel}</td></tr>
      ${daySessions.map(s => `
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #25406b; white-space: nowrap; vertical-align: top;">${s.time.replace(/\n/g, '').trim()}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; vertical-align: top; font-size: 12px; color: #6b7280;">${s.session}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; vertical-align: top;">
            ${isChairperson(s.topic) 
              ? `<span style="display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 13px;">🪑 Chairperson</span>`
              : `<span style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 4px; font-weight: 700; font-size: 12px; margin-bottom: 4px;">🗣️ Presenting</span>
                 <div style="font-weight: 600; color: #1f2937; font-size: 13px; line-height: 1.4; margin-top: 4px;">${s.topic}</div>`
            }
          </td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; vertical-align: top;">${s.hall}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; vertical-align: top;">
            <a href="${generateICSLink(s, name)}" style="color: #25406b; font-size: 12px; text-decoration: none;">📅 Add</a>
          </td>
        </tr>
      `).join('')}
    `
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; background: linear-gradient(135deg, #25406b, #152843); color: white; padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0 0 8px 0; font-size: 24px;">🎓 Faculty Schedule</h1>
        <h2 style="margin: 0; font-weight: normal; font-size: 16px; opacity: 0.9;">${conferenceConfig.shortName} — April 25-26, 2026</h2>
      </div>
      <div style="background: white; padding: 25px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #374151;">Dear ${name},</p>
        <p style="font-size: 15px; color: #374151;">Thank you for being a valued faculty member at ${conferenceConfig.shortName}. Here is your complete session schedule:</p>
        
        <div style="display: flex; gap: 10px; margin: 15px 0;">
          <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">🪑 = Chairperson</span>
          <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">🗣️ = Presenting</span>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left; width: 130px;">Time</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Session</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Role / Topic</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; width: 70px;">Hall</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; width: 50px;">Cal</th>
            </tr>
          </thead>
          <tbody>
            ${renderSessions(day1, '📅 Day 1 — April 25, 2026 (Saturday)')}
            ${renderSessions(day2, '📅 Day 2 — April 26, 2026 (Sunday)')}
          </tbody>
        </table>

        <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 16px;">📋 Faculty Guidelines — Presentation Preparation & Submission</h4>
          
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>🎤 CV Slide:</strong> Let your CV slide be the <strong>first slide</strong> — it will be displayed during your introduction.</p>
          
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>💾 Backups:</strong> Have a backup of the folder containing your PPT and videos in your online drive / pen drive.</p>
          
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>🖥️ Preview Room:</strong> Visit the Preview Room at least <strong>2 hours prior</strong> to your session to verify your presentation displays correctly.</p>
        </div>

        <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 12px 0; color: #9a3412;">🎬 Presentation Day Arrangements</h4>
          <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
            <li><strong>⏱️ Time Management:</strong> Strictly adhere to your allotted time to ensure the schedule runs smoothly</li>
            <li><strong>💻 Conference Laptop:</strong> A conference laptop will be provided at the podium. <strong>Personal laptops are not permitted</strong> to avoid technical issues</li>
            <li><strong>🎙️ Audio:</strong> Collar microphones will be available for faculty who prefer to move freely on stage</li>
          </ul>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 12px 0; color: #92400e;">⚠️ Important — Video Workflow</h4>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">For videos to run smoothly, follow this exact workflow:</p>
          <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 2;">
            <li>Place videos in the <strong>same folder</strong> as your presentation file</li>
            <li>In the presentation, insert videos <strong>only from that folder</strong></li>
            <li>Copy the <strong>entire folder</strong> to your pen drive</li>
            <li>Have a backup of the folder in your online drive / email</li>
            <li>When you arrive, <strong>copy the entire folder</strong> (PPT + videos) to the conference laptop</li>
            <li><strong>Do not connect personal laptops</strong> — saves time and avoids glitches</li>
            <li>Early submission is encouraged</li>
          </ol>
        </div>

        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 8px 0; color: #166534;">🏨 Venue</h4>
          <p style="margin: 0; color: #374151; font-size: 14px;"><strong>${conferenceConfig.venue.name}</strong><br>${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}</p>
        </div>

        <p style="color: #374151; font-size: 14px;">For any queries, contact us at <a href="mailto:${conferenceConfig.contact.email}" style="color: #25406b;">${conferenceConfig.contact.email}</a></p>
        <p style="color: #374151; font-size: 14px;">Best regards,<br><strong>${conferenceConfig.shortName} Organizing Committee</strong></p>
      </div>
      <div style="text-align: center; padding: 15px; background: #f9fafb; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">${conferenceConfig.name} | ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}</p>
      </div>
    </div>
  `
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
    const { dryRun = false, testEmail } = body

    // Read CSV
    let csvContent = ''
    try {
      csvContent = fs.readFileSync(path.join(process.cwd(), 'ISSH Faculty Details - Sheet1.csv'), 'utf-8')
    } catch { return NextResponse.json({ success: false, message: 'Faculty CSV not found' }, { status: 404 }) }

    const entries = parseCSV(csvContent)
    const users = await User.find({}).select('email profile registration')

    // Match and resolve emails
    const matched: Array<{ entry: FacultyEntry; email: string; source: string; dbUser?: any }> = []
    const unmatched: Array<{ name: string; phone: string; reason: string }> = []

    for (const entry of entries) {
      if (entry.sessions.length === 0) continue

      const dbUser = matchToUser(entry, users)
      let resolvedEmail = entry.email || ''
      let source = 'csv'

      if (dbUser && !resolvedEmail) {
        resolvedEmail = dbUser.email
        source = 'database'
      } else if (dbUser && resolvedEmail) {
        source = 'csv (db matched)'
      }

      if (resolvedEmail) {
        matched.push({
          entry,
          email: resolvedEmail,
          source,
          dbUser
        })
      } else {
        unmatched.push({
          name: entry.name,
          phone: entry.phone,
          reason: dbUser ? 'DB user found but no email' : 'No DB match and no CSV email'
        })
      }
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        data: {
          total: entries.length,
          withSessions: entries.filter(e => e.sessions.length > 0).length,
          matched: matched.map(m => ({
            name: m.entry.name,
            email: m.email,
            source: m.source,
            phone: m.entry.phone,
            regStatus: m.entry.registrationStatus,
            sessions: m.entry.sessions.length,
            registrationId: m.dbUser?.registration?.registrationId || 'N/A'
          })),
          unmatched,
          matchedCount: matched.length,
          unmatchedCount: unmatched.length
        }
      })
    }

    // Send test email
    if (testEmail) {
      // Create comprehensive test data with multiple sessions, both days, speaker + chairperson
      const testSessions: FacultySession[] = [
        { session: 'Module 1: FINGERTIP INJURIES: PRECISION STARTS AT THE TIP', topic: 'Chairperson', day: 'Day-1', time: '09:00-10:00 Am', hall: 'Hall-A' },
        { session: 'Module 3: COMPRESSION NEUROPATHIES OF UPPER LIMB: PRESSURE OFF, POWER BACK', topic: 'PRECISION DECOMPRESSION: Expert Techniques and Minimally Invasive Options of Nerve Decompression', day: 'Day-1', time: '11:55AM - 12:05PM', hall: 'Hall-A' },
        { session: 'Module 5: TRAUMATIC BRACHIAL PLEXUS INJURIES: BIG INJURY, BOLD STRATEGY', topic: 'Exploration of Plexus, Nerve repair, Nerve transfers', day: 'Day-1', time: '02:50PM - 03:00PM', hall: 'Hall-A' },
        { session: 'MODULE : MEET THE MENTORS', topic: 'Chairperson', day: 'Day-1', time: '2:15-3:15 Pm', hall: 'Hall-B' },
        { session: 'MEDAL PAPER PRESENTATIONS', topic: 'Chairperson', day: 'Day-2', time: '08:00 - 09:00 Am', hall: 'Hall-A' },
        { session: 'Module 10: NERVE IN FOCUS: PALSY AND RECONSTRUCTION', topic: 'DON\'T MESS THE WIRES: Common errors - Missed diagnosis, Wrong timings, Tensioned repairs, Poor planning', day: 'Day-2', time: '10:05AM - 10:15AM', hall: 'Hall-A' },
      ]
      
      const html = generateFacultyEmail('Dr. Test Faculty Member', testSessions)
      await sendEmail({
        to: testEmail,
        subject: `[TEST] 🎓 Your Faculty Schedule — ${conferenceConfig.shortName}`,
        html,
        text: `Test faculty schedule email with ${testSessions.length} sessions`,
        templateName: 'faculty-schedule-test',
        category: 'system'
      })
      return NextResponse.json({ success: true, message: `Test email sent to ${testEmail} with ${testSessions.length} sessions (3 Day-1 + 1 Day-1 Hall-B + 2 Day-2, includes Chairperson + Speaker roles)` })
    }

    // Send all emails
    let sent = 0, failed = 0
    const errors: Array<{ name: string; error: string }> = []
    const BATCH_SIZE = 5

    for (let i = 0; i < matched.length; i += BATCH_SIZE) {
      const batch = matched.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(batch.map(async (m) => {
        const displayName = m.entry.name.replace(/,.*$/, '').trim()
        const html = generateFacultyEmail(displayName, m.entry.sessions)
        await sendEmail({
          to: m.email,
          subject: `🎓 Your Faculty Schedule — ${conferenceConfig.shortName}`,
          html,
          text: `Faculty schedule for ${displayName} - ${m.entry.sessions.length} session(s)`,
          userId: m.dbUser?._id?.toString(),
          userName: displayName,
          templateName: 'faculty-schedule',
          category: 'system'
        })
        return m.entry.name
      }))

      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled') sent++
        else { failed++; errors.push({ name: batch[j].entry.name, error: (results[j] as PromiseRejectedResult).reason?.message || 'Unknown' }) }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} faculty schedule emails, ${failed} failed, ${unmatched.length} unmatched`,
      data: { sent, failed, unmatched, errors }
    })
  } catch (error: any) {
    console.error('Faculty schedule error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
