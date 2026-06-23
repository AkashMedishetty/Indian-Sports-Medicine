import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Abstract from '@/lib/models/Abstract'
import Workshop from '@/lib/models/Workshop'
import { sendEmail } from '@/conference-backend-core/lib/email/smtp'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { getBaseTemplate } from '@/conference-backend-core/lib/email/templates'
import { QRCodeGenerator } from '@/conference-backend-core/lib/utils/qrcode-generator'
import { InvoiceGenerator } from '@/conference-backend-core/lib/pdf/invoice-generator'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300

// ─── Faculty CSV parsing (reused from faculty send-schedule) ───

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
  sessions: FacultySession[]
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)\s*/i, '').replace(/,.*$/, '').replace(/\s+/g, ' ').trim()
}

function parseFacultyCSV(content: string): FacultyEntry[] {
  const rawLines = content.split('\n')
  if (rawLines.length < 2) return []
  const logicalLines: string[] = []
  let currentLine = ''
  let inQuotes = false
  for (const raw of rawLines) {
    currentLine = currentLine ? currentLine + '\n' + raw : raw
    for (const char of raw) { if (char === '"') inQuotes = !inQuotes }
    if (!inQuotes) { logicalLines.push(currentLine); currentLine = '' }
  }
  if (currentLine) logicalLines.push(currentLine)

  const entries: FacultyEntry[] = []
  for (let i = 1; i < logicalLines.length; i++) {
    const line = logicalLines[i].trim()
    if (!line) continue
    const parts: string[] = []
    let current = '', quoted = false
    for (const char of line) {
      if (char === '"') { quoted = !quoted; continue }
      if (char === ',' && !quoted) { parts.push(current.trim()); current = ''; continue }
      if (char === '\n' && !quoted) continue
      current += char
    }
    parts.push(current.trim())
    const name = parts[0] || ''
    const phone = (parts[1] || '').replace(/\D/g, '').slice(-10)
    const email = (parts[2] || '').trim()
    const sessions: FacultySession[] = []
    for (let s = 0; s < 6; s++) {
      const b = 5 + s * 5
      const sn = (parts[b] || '').replace(/\n/g, ' ').trim()
      const tp = (parts[b+1] || '').replace(/\n/g, ' ').trim()
      const dy = (parts[b+2] || '').replace(/\n/g, '').trim()
      const tm = (parts[b+3] || '').replace(/\n/g, '').trim()
      const hl = (parts[b+4] || '').replace(/\n/g, '').trim()
      if (sn && tp) sessions.push({ session: sn, topic: tp, day: dy, time: tm, hall: hl })
    }
    if (name) entries.push({ name, phone, email, sessions })
  }
  return entries
}

function matchFacultyToUser(phone: string, name: string, facultyEntries: FacultyEntry[]): FacultyEntry | null {
  // Phone match first
  if (phone && phone.length >= 10) {
    const last10 = phone.slice(-10)
    const match = facultyEntries.find(f => f.phone === last10)
    if (match) return match
  }
  // Fuzzy name match
  const normalized = normalizeName(name)
  const words = normalized.split(' ').filter(w => w.length > 1)
  for (const f of facultyEntries) {
    const fn = normalizeName(f.name)
    if (fn === normalized) return f
    const fWords = fn.split(' ').filter(w => w.length > 1)
    if (words.length >= 2) {
      const matchCount = words.filter(w => fWords.some(fw => fw === w || (w.length > 3 && fw.startsWith(w)) || (fw.length > 3 && w.startsWith(fw)))).length
      if (matchCount >= 2) return f
    }
  }
  return null
}

// ─── Presentation schedule CSV parsing ───

interface PresentationSlot {
  time: string
  title: string
  hall: string
  date: string
  category: string
}

function parsePresentationCSV(content: string): Array<{ presenter: string; slots: PresentationSlot[] }> {
  const rawLines = content.split('\n')
  if (rawLines.length < 2) return []
  const logicalLines: string[] = []
  let currentLine = '', inQuotes = false
  for (const raw of rawLines) {
    currentLine = currentLine ? currentLine + ' ' + raw : raw
    for (const char of raw) { if (char === '"') inQuotes = !inQuotes }
    if (!inQuotes) { logicalLines.push(currentLine); currentLine = '' }
  }
  if (currentLine) logicalLines.push(currentLine)

  const presenterMap = new Map<string, PresentationSlot[]>()
  for (let i = 1; i < logicalLines.length; i++) {
    const line = logicalLines[i].trim()
    if (!line) continue
    const parts: string[] = []
    let current = '', quoted = false
    for (const char of line) {
      if (char === '"') { quoted = !quoted; continue }
      if (char === ',' && !quoted) { parts.push(current.trim()); current = ''; continue }
      current += char
    }
    parts.push(current.trim())
    const presenter = parts[2] || ''
    if (!presenter || !parts[0]) continue
    const existing = presenterMap.get(presenter) || []
    existing.push({ time: parts[0], title: parts[1] || '', hall: parts[3] || '', date: parts[4] || '', category: '' })
    presenterMap.set(presenter, existing)
  }
  return Array.from(presenterMap.entries()).map(([presenter, slots]) => ({ presenter, slots }))
}

function matchPresenterToUser(presenterName: string, userPhone: string, userName: string, presenters: Array<{ presenter: string; slots: PresentationSlot[] }>): PresentationSlot[] {
  const normalizedUser = normalizeName(userName)
  const userWords = normalizedUser.split(' ').filter(w => w.length > 1)
  const allSlots: PresentationSlot[] = []
  
  for (const p of presenters) {
    const pn = normalizeName(p.presenter)
    let matched = false
    if (pn === normalizedUser) matched = true
    if (!matched) {
      const pWords = pn.split(' ').filter(w => w.length > 1)
      if (userWords.length >= 2) {
        const matchCount = userWords.filter(w => pWords.some(pw => pw === w || (w.length > 3 && pw.startsWith(w)) || (pw.length > 3 && w.startsWith(pw)))).length
        if (matchCount >= 2) matched = true
      }
    }
    if (matched) allSlots.push(...p.slots)
  }
  return allSlots
}

// ─── Email HTML Generator ───

function generateConferenceKitEmail(data: {
  userName: string
  registrationId: string
  registrationType: string
  institution: string
  email: string
  phone: string
  qrCodeDataUrl: string
  hasInvoice: boolean
  facultySessions?: FacultySession[]
  presentationSlots?: PresentationSlot[]
  abstracts?: Array<{ title: string; abstractId: string; approvedFor: string; status: string }>
  workshops?: Array<{ name: string; date?: string; time?: string; venue?: string }>
  accompanyingPersons?: Array<{ name: string; relationship?: string }>
  accommodation?: { roomType: string; checkIn: string; checkOut: string; nights: number; totalAmount: number }
  programmeUrl: string
}): string {
  const isChairperson = (topic: string) => topic === 'Chairperson' || topic === 'Chaiperson'

  const getCategoryLabel = (key: string) => {
    const cat = conferenceConfig.registration.categories.find(c => c.key === key)
    return cat?.label || key
  }

  const facultyDay1 = data.facultySessions?.filter(s => s.day.includes('1')) || []
  const facultyDay2 = data.facultySessions?.filter(s => s.day.includes('2')) || []

  const renderFacultySessions = (sessions: FacultySession[], dayLabel: string) => {
    if (sessions.length === 0) return ''
    return `
      <tr><td colspan="4" style="padding:10px;background-color:#015189;color:white;font-weight:bold;font-size:13px;">${dayLabel}</td></tr>
      ${sessions.map(s => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ddd;font-weight:bold;color:#015189;white-space:nowrap;vertical-align:top;font-size:12px;">${s.time.replace(/\n/g,'').trim()}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd;vertical-align:top;font-size:11px;color:#666;">${s.session}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd;vertical-align:top;">
            ${isChairperson(s.topic)
              ? '<span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:4px;font-weight:700;font-size:12px;">🪑 Chairperson</span>'
              : `<span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:4px;font-weight:700;font-size:11px;">🗣️ Speaker</span><div style="font-size:12px;color:#333;margin-top:3px;">${s.topic}</div>`
            }
          </td>
          <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;vertical-align:top;font-size:12px;">${s.hall}</td>
        </tr>
      `).join('')}
    `
  }

  // Build sections
  let facultySection = ''
  if (data.facultySessions && data.facultySessions.length > 0) {
    facultySection = `
      <h3>🎓 Your Faculty Schedule</h3>
      <table>
        <thead><tr>
          <th style="width:120px;">Time</th>
          <th>Session</th>
          <th>Role / Topic</th>
          <th style="width:60px;text-align:center;">Hall</th>
        </tr></thead>
        <tbody>
          ${renderFacultySessions(facultyDay1, '📅 Day 1 — April 25, 2026 (Saturday)')}
          ${renderFacultySessions(facultyDay2, '📅 Day 2 — April 26, 2026 (Sunday)')}
        </tbody>
      </table>
    `
  }

  let presentationSection = ''
  if (data.presentationSlots && data.presentationSlots.length > 0) {
    presentationSection = `
      <h3>📋 Your Presentation Schedule</h3>
      <table>
        <thead><tr>
          <th>Time</th><th>Title</th><th style="text-align:center;">Category</th><th style="text-align:center;">Hall</th><th style="text-align:center;">Date</th>
        </tr></thead>
        <tbody>
          ${data.presentationSlots.map(s => `
            <tr>
              <td style="font-weight:bold;color:#015189;">${s.time}</td>
              <td>${s.title}</td>
              <td style="text-align:center;"><span style="background:${s.category === 'Award Paper' ? '#fef3c7' : s.category === 'E-Poster' ? '#f3e8ff' : '#dbeafe'};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${s.category}</span></td>
              <td style="text-align:center;">${s.hall}</td>
              <td style="text-align:center;">${s.date}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }

  let abstractsSection = ''
  if (data.abstracts && data.abstracts.length > 0) {
    abstractsSection = `
      <h3>📄 Your Accepted Abstracts</h3>
      ${data.abstracts.map(a => `
        <div style="background-color:#e8f5e9;padding:15px;border-left:4px solid #4caf50;margin:15px 0;">
          <p style="margin:0;font-weight:bold;">${a.title}</p>
          <p style="margin:4px 0 0 0;font-size:13px;color:#666;">ID: ${a.abstractId} • Accepted as: <strong>${a.approvedFor?.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase())}</strong></p>
        </div>
      `).join('')}
    `
  }

  let workshopsSection = ''
  if (data.workshops && data.workshops.length > 0) {
    workshopsSection = `
      <h3>🔧 Your Workshops</h3>
      ${data.workshops.map(w => `
        <div class="highlight">
          <p style="margin:0;font-weight:bold;">${w.name}</p>
          ${w.date || w.time || w.venue ? `<p style="margin:4px 0 0 0;font-size:13px;color:#666;">${[w.date, w.time, w.venue].filter(Boolean).join(' • ')}</p>` : ''}
        </div>
      `).join('')}
      <p style="font-size:13px;color:#666;">📅 Workshops: Day 2 — April 26, 2026 (Sunday), 02:30 PM - 05:30 PM</p>
    `
  }

  let accompanyingSection = ''
  if (data.accompanyingPersons && data.accompanyingPersons.length > 0) {
    accompanyingSection = `
      <h3>👥 Accompanying Persons</h3>
      <table>
        ${data.accompanyingPersons.map(p => `
          <tr><td><strong>${p.name}</strong>${p.relationship ? ` (${p.relationship})` : ''}</td></tr>
        `).join('')}
      </table>
    `
  }

  let accommodationSection = ''
  if (data.accommodation) {
    const a = data.accommodation
    accommodationSection = `
      <h3>🏨 Accommodation</h3>
      <div style="background-color:#fefce8;padding:15px;border-left:4px solid #eab308;margin:15px 0;">
        <table style="margin:0;">
          <tr><th>Room Type</th><td>${a.roomType === 'single' ? 'Single Room' : a.roomType === 'sharing' ? 'Sharing Room' : a.roomType}</td></tr>
          <tr><th>Check-in</th><td>${a.checkIn}</td></tr>
          <tr><th>Check-out</th><td>${a.checkOut}</td></tr>
          <tr><th>Nights</th><td>${a.nights}</td></tr>
          ${a.totalAmount ? `<tr><th>Amount</th><td><strong>₹${a.totalAmount.toLocaleString('en-IN')}</strong> (+ 18% GST)</td></tr>` : ''}
        </table>
        <p style="margin:8px 0 0 0;font-size:12px;color:#856404;">Please carry a valid ID proof for hotel check-in.</p>
      </div>
    `
  }

  const content = `
    <h2>Welcome to ${conferenceConfig.shortName}!</h2>
    <p>Dear ${data.userName},</p>
    
    <p>We're excited to welcome you to <strong>${conferenceConfig.shortName}</strong>! Here is your complete registration summary and all the details you need for the conference.</p>
    
    <!-- QR Code -->
    <div style="text-align:center;background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
      <h3 style="margin-top:0;color:#015189;">Your Registration QR Code</h3>
      <img src="cid:qrcode" alt="Registration QR Code" style="max-width:200px;border:4px solid #015189;border-radius:8px;padding:10px;background:white;" />
      <p style="margin-bottom:0;font-size:14px;color:#666;">
        <strong>Present this QR code at the registration desk</strong><br>
        Registration ID: <strong>${data.registrationId}</strong>
      </p>
    </div>

    <div class="highlight">
      <h3 style="margin-top:0;">Your Registration Details</h3>
      <table>
        <tr><th>Registration ID</th><td><strong>${data.registrationId}</strong></td></tr>
        <tr><th>Name</th><td>${data.userName}</td></tr>
        <tr><th>Category</th><td>${getCategoryLabel(data.registrationType)}</td></tr>
        <tr><th>Institution</th><td>${data.institution || 'N/A'}</td></tr>
        <tr><th>Email</th><td>${data.email}</td></tr>
        <tr><th>Phone</th><td>${data.phone || 'N/A'}</td></tr>
        <tr><th>Status</th><td><span style="color:#16a34a;font-weight:bold;">✓ CONFIRMED</span></td></tr>
      </table>
    </div>

    ${facultySection}
    ${presentationSection}
    ${abstractsSection}
    ${workshopsSection}
    ${accompanyingSection}
    ${accommodationSection}

    <div style="background-color:#f0f9ff;padding:15px;border-left:4px solid #0284c7;margin:20px 0;">
      <h4 style="margin-top:0;color:#0c4a6e;">📥 Conference Programme</h4>
      <p style="margin-bottom:0;">View the full scientific programme: <a href="${data.programmeUrl}" style="color:#015189;font-weight:bold;">Programme Schedule →</a></p>
    </div>

    <div style="background-color:#fff3cd;padding:15px;border-left:4px solid #ffc107;margin:20px 0;">
      <h4 style="margin-top:0;color:#856404;">📌 Important Reminders</h4>
      <ul style="margin-bottom:0;">
        <li>Registration desk opens at <strong>8:00 AM</strong> on both days</li>
        <li>Your <strong>QR code</strong> will be scanned at the registration desk</li>
        ${data.hasInvoice ? '<li>Your invoice is attached as a PDF to this email</li>' : ''}
        ${data.facultySessions && data.facultySessions.length > 0 ? '<li>Faculty: Please arrive <strong>15 minutes before</strong> your session</li>' : ''}
        ${data.presentationSlots && data.presentationSlots.length > 0 ? '<li>Presenters: Carry your presentation on a <strong>USB drive</strong> as backup</li>' : ''}
      </ul>
    </div>

    <div style="background-color:#f0f9ff;padding:15px;border-left:4px solid #0284c7;margin:20px 0;">
      <h4 style="margin-top:0;color:#0c4a6e;">Conference Details</h4>
      <ul style="margin-bottom:0;">
        <li><strong>Dates:</strong> April 25-26, 2026 (Saturday & Sunday)</li>
        <li><strong>Venue:</strong> ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}</li>
        <li><strong>Contact:</strong> ${conferenceConfig.contact.email} | ${conferenceConfig.contact.phone}</li>
      </ul>
    </div>

    <p style="text-align:center;margin:25px 0;">
      <a href="${process.env.APP_URL || process.env.NEXTAUTH_URL || 'https://isshmidtermcme2026.com'}/dashboard" class="button">Access Your Dashboard</a>
    </p>

    <p>If you have any questions, please contact us at <a href="mailto:${conferenceConfig.contact.email}">${conferenceConfig.contact.email}</a></p>
    
    <p>We look forward to welcoming you!</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Organising Committee</strong></p>
  `

  return getBaseTemplate(content)
}

// ─── POST Handler ───

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { dryRun = false, testEmail, testRegistrationId, page, pageSize = 20 } = body

    // 1. Load all registered users with confirmed/paid status
    const users = await User.find({
      'registration.status': { $in: ['confirmed', 'paid'] },
      'registration.registrationId': { $exists: true, $ne: '' }
    }).lean()

    if (!users.length) {
      return NextResponse.json({ success: false, message: 'No confirmed registrations found' })
    }

    // 2. Load faculty CSV
    let facultyEntries: FacultyEntry[] = []
    try {
      const csv = fs.readFileSync(path.join(process.cwd(), 'ISSH Faculty Details - Sheet1.csv'), 'utf-8')
      facultyEntries = parseFacultyCSV(csv)
    } catch { console.log('Faculty CSV not found, skipping faculty schedule') }

    // 3. Load presentation CSVs
    let allPresenters: Array<{ presenter: string; slots: PresentationSlot[] }> = []
    try {
      const fp = fs.readFileSync(path.join(process.cwd(), 'Free Paper  - Sheet1.csv'), 'utf-8')
      const fpPresenters = parsePresentationCSV(fp)
      fpPresenters.forEach(p => p.slots.forEach(s => s.category = 'Free Paper'))
      allPresenters.push(...fpPresenters)
    } catch { console.log('Free Paper CSV not found') }
    try {
      const ap = fs.readFileSync(path.join(process.cwd(), 'Award Paper List - Sheet1.csv'), 'utf-8')
      const apPresenters = parsePresentationCSV(ap)
      apPresenters.forEach(p => p.slots.forEach(s => s.category = 'Award Paper'))
      allPresenters.push(...apPresenters)
    } catch { console.log('Award Paper CSV not found') }

    // 4. Load all accepted abstracts
    const abstracts = await Abstract.find({
      status: { $in: ['accepted', 'final-submitted'] }
    }).lean()

    // 5. Load workshops
    const workshops = await Workshop.find({ isActive: true }).lean()
    const workshopMap = new Map(workshops.map((w: any) => [w.id, w]))

    // 6. Programme URL
    const programmeUrl = 'https://www.isshmidtermcme2026.com/program-schedule'

    // 7. Build per-user data
    const kitData = users.map((user: any) => {
      const userName = `${user.profile?.title || ''} ${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim()
      const phone = user.profile?.phone || ''

      // Faculty match
      const faculty = matchFacultyToUser(phone, userName, facultyEntries)

      // Presentation match
      const presSlots = matchPresenterToUser('', phone, userName, allPresenters)

      // Abstracts for this user
      const userAbstracts = abstracts
        .filter((a: any) => a.userId?.toString() === user._id?.toString())
        .map((a: any) => ({
          title: a.title,
          abstractId: a.abstractId,
          approvedFor: a.approvedFor || a.submissionCategory,
          submissionCategory: a.submissionCategory,
          status: a.status
        }))

      // Cross-reference presentation slots with abstracts to get correct category
      for (const slot of presSlots) {
        const matchingAbstract = userAbstracts.find((a: any) => {
          const slotTitle = slot.title.toLowerCase().replace(/[^a-z0-9]/g, '')
          const absTitle = a.title.toLowerCase().replace(/[^a-z0-9]/g, '')
          return slotTitle === absTitle || slotTitle.includes(absTitle) || absTitle.includes(slotTitle)
        })
        if (matchingAbstract) {
          const approvedLabel = matchingAbstract.approvedFor?.replace(/-/g, ' ').replace(/\b\w/g, (m: string) => m.toUpperCase())
          if (approvedLabel) slot.category = approvedLabel
        }
      }

      // Add e-poster slots from accepted abstracts
      const posterTypes = ['poster-presentation', 'e-poster', 'poster']
      for (const abs of userAbstracts) {
        const isPoster = posterTypes.includes(abs.approvedFor) || posterTypes.includes(abs.submissionCategory)
        if (isPoster) {
          const alreadyHas = presSlots.some(s => {
            const sTitle = s.title.toLowerCase().replace(/[^a-z0-9]/g, '')
            const aTitle = abs.title.toLowerCase().replace(/[^a-z0-9]/g, '')
            return sTitle === aTitle || sTitle.includes(aTitle) || aTitle.includes(sTitle)
          })
          if (!alreadyHas) {
            presSlots.push({
              time: '03:15PM - 05:15PM',
              title: abs.title,
              hall: 'Hall-B',
              date: '25/04/2026',
              category: 'E-Poster'
            })
          }
        }
      }

      // Workshops
      const userWorkshops = (user.registration?.workshopSelections || [])
        .map((wId: string) => {
          const w = workshopMap.get(wId) as any
          return w ? { name: w.name, date: w.workshopDate ? new Date(w.workshopDate).toLocaleDateString('en-IN') : undefined, time: w.workshopTime, venue: w.venue } : { name: wId }
        })

      // Accompanying persons
      const accompanyingPersons = user.registration?.accompanyingPersons || []

      // Accommodation
      const accommodation = user.registration?.accommodation?.required ? {
        roomType: user.registration.accommodation.roomType || 'Standard',
        checkIn: user.registration.accommodation.checkIn || '',
        checkOut: user.registration.accommodation.checkOut || '',
        nights: user.registration.accommodation.nights || 0,
        totalAmount: user.registration.accommodation.totalAmount || 0
      } : undefined

      return {
        user,
        userName,
        email: user.email,
        registrationId: user.registration.registrationId,
        registrationType: user.registration.type,
        institution: user.profile?.institution || '',
        phone,
        facultySessions: faculty?.sessions || [],
        presentationSlots: presSlots,
        abstracts: userAbstracts,
        workshops: userWorkshops,
        accompanyingPersons,
        accommodation,
        isFaculty: !!faculty && faculty.sessions.length > 0,
        isPresenter: presSlots.length > 0,
        hasAbstracts: userAbstracts.length > 0,
        hasWorkshops: userWorkshops.length > 0,
      }
    })

    // Dry run
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        data: {
          total: kitData.length,
          faculty: kitData.filter(k => k.isFaculty).length,
          presenters: kitData.filter(k => k.isPresenter).length,
          withAbstracts: kitData.filter(k => k.hasAbstracts).length,
          withWorkshops: kitData.filter(k => k.hasWorkshops).length,
          users: kitData.map(k => ({
            name: k.userName,
            email: k.email,
            registrationId: k.registrationId,
            type: k.registrationType,
            facultySessions: k.facultySessions.length,
            presentationSlots: k.presentationSlots.length,
            abstracts: k.abstracts.length,
            workshops: k.workshops.length,
            isFaculty: k.isFaculty,
            isPresenter: k.isPresenter,
          }))
        }
      })
    }

    // Test email — send to a single address with selected user's data
    if (testEmail) {
      let sample = kitData[0]
      if (testRegistrationId) {
        const found = kitData.find(k => k.registrationId === testRegistrationId)
        if (found) sample = found
      }
      if (!sample) return NextResponse.json({ success: false, message: 'No users to test with' })

      const qrCodeDataUrl = await QRCodeGenerator.generateRegistrationQR({
        registrationId: sample.registrationId,
        name: sample.userName,
        email: sample.email,
        type: sample.registrationType
      })
      const qrBuffer = await QRCodeGenerator.generateSimpleRegistrationQRBuffer(sample.registrationId)

      let invoiceBuffer: Buffer | null = null
      const isFreeFaculty = sample.user.registration?.type === 'faculty' || sample.user.registration?.paymentType === 'complementary' || sample.user.registration?.paymentType === 'complimentary'
      const isSponsored = sample.user.registration?.source === 'sponsor-managed' || sample.user.registration?.paymentType === 'sponsored'
      const hasPayment = (sample.user.payment?.amount > 0 || sample.user.registration?.accommodation?.required) && !isFreeFaculty && !isSponsored
      if (hasPayment) {
        try {
          invoiceBuffer = await InvoiceGenerator.generatePDFFromUser(sample.user)
        } catch (e) { console.error('Invoice generation failed for test:', e) }
      }

      const html = generateConferenceKitEmail({
        userName: sample.userName,
        registrationId: sample.registrationId,
        registrationType: sample.registrationType,
        institution: sample.institution,
        email: sample.email,
        phone: sample.phone,
        qrCodeDataUrl,
        hasInvoice: !!invoiceBuffer,
        facultySessions: sample.facultySessions.length > 0 ? sample.facultySessions : undefined,
        presentationSlots: sample.presentationSlots.length > 0 ? sample.presentationSlots : undefined,
        abstracts: sample.abstracts.length > 0 ? sample.abstracts : undefined,
        workshops: sample.workshops.length > 0 ? sample.workshops : undefined,
        accompanyingPersons: sample.accompanyingPersons.length > 0 ? sample.accompanyingPersons : undefined,
        accommodation: sample.accommodation,
        programmeUrl,
      })

      const attachments: any[] = [
        { filename: 'qrcode.png', content: qrBuffer, cid: 'qrcode', contentType: 'image/png' }
      ]
      if (invoiceBuffer) {
        attachments.push({ filename: `Invoice-${sample.registrationId}.pdf`, content: invoiceBuffer, contentType: 'application/pdf' })
      }

      await sendEmail({
        to: testEmail,
        subject: `[TEST] 🎫 Your Registration Summary — ${conferenceConfig.shortName}`,
        html,
        text: `Registration summary for ${sample.userName} (${sample.registrationId})`,
        attachments,
        templateName: 'conference-kit-test',
        category: 'system'
      })

      return NextResponse.json({
        success: true,
        message: `Test email sent to ${testEmail} using data from ${sample.userName} (${sample.registrationId}). Faculty: ${sample.facultySessions.length}, Presentations: ${sample.presentationSlots.length}, Abstracts: ${sample.abstracts.length}, Workshops: ${sample.workshops.length}`
      })
    }

    // Send in pages — frontend calls with page=0, page=1, etc.
    const totalPages = Math.ceil(kitData.length / pageSize)
    const currentPage = page ?? 0
    const startIdx = currentPage * pageSize
    const endIdx = Math.min(startIdx + pageSize, kitData.length)
    const pageData = kitData.slice(startIdx, endIdx)

    if (pageData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No more users to process',
        data: { sent: 0, failed: 0, errors: [], total: kitData.length, totalPages, currentPage, done: true }
      })
    }

    let sent = 0, failed = 0
    const errors: Array<{ name: string; registrationId: string; error: string }> = []
    const sentList: Array<{ name: string; registrationId: string; email: string }> = []
    const BATCH_SIZE = 2

    for (let i = 0; i < pageData.length; i += BATCH_SIZE) {
      const batch = pageData.slice(i, i + BATCH_SIZE)

      const results = await Promise.allSettled(batch.map(async (kit) => {
        try {
          const qrCodeDataUrl = await QRCodeGenerator.generateRegistrationQR({
            registrationId: kit.registrationId,
            name: kit.userName,
            email: kit.email,
            type: kit.registrationType
          })
          const qrBuffer = await QRCodeGenerator.generateSimpleRegistrationQRBuffer(kit.registrationId)

          let invoiceBuffer: Buffer | null = null
          const isFreeFaculty = kit.user.registration?.type === 'faculty' || kit.user.registration?.paymentType === 'complementary' || kit.user.registration?.paymentType === 'complimentary'
          const isSponsored = kit.user.registration?.source === 'sponsor-managed' || kit.user.registration?.paymentType === 'sponsored'
          const hasPayment = (kit.user.payment?.amount > 0 || kit.user.registration?.accommodation?.required) && !isFreeFaculty && !isSponsored
          if (hasPayment) {
            try {
              invoiceBuffer = await InvoiceGenerator.generatePDFFromUser(kit.user)
            } catch (e) { console.error(`Invoice failed for ${kit.registrationId}:`, e) }
          }

          const html = generateConferenceKitEmail({
            userName: kit.userName,
            registrationId: kit.registrationId,
            registrationType: kit.registrationType,
            institution: kit.institution,
            email: kit.email,
            phone: kit.phone,
            qrCodeDataUrl,
            hasInvoice: !!invoiceBuffer,
            facultySessions: kit.facultySessions.length > 0 ? kit.facultySessions : undefined,
            presentationSlots: kit.presentationSlots.length > 0 ? kit.presentationSlots : undefined,
            abstracts: kit.abstracts.length > 0 ? kit.abstracts : undefined,
            workshops: kit.workshops.length > 0 ? kit.workshops : undefined,
            accompanyingPersons: kit.accompanyingPersons.length > 0 ? kit.accompanyingPersons : undefined,
            accommodation: kit.accommodation,
            programmeUrl,
          })

          const attachments: any[] = [
            { filename: 'qrcode.png', content: qrBuffer, cid: 'qrcode', contentType: 'image/png' }
          ]
          if (invoiceBuffer) {
            attachments.push({ filename: `Invoice-${kit.registrationId}.pdf`, content: invoiceBuffer, contentType: 'application/pdf' })
          }

          await sendEmail({
            to: kit.email,
            subject: `🎫 Your Registration Summary — ${conferenceConfig.shortName}`,
            html,
            text: `Registration summary for ${kit.userName} (${kit.registrationId})`,
            attachments,
            userId: kit.user._id?.toString(),
            userName: kit.userName,
            templateName: 'conference-kit',
            category: 'system'
          })

          return kit.registrationId
        } catch (err: any) {
          throw new Error(`${kit.registrationId}: ${err.message}`)
        }
      }))

      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled') {
          sent++
          sentList.push({ name: batch[j].userName, registrationId: batch[j].registrationId, email: batch[j].email })
        }
        else {
          failed++
          errors.push({
            name: batch[j].userName,
            registrationId: batch[j].registrationId,
            error: (results[j] as PromiseRejectedResult).reason?.message || 'Unknown'
          })
        }
      }

      if (i + BATCH_SIZE < pageData.length) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    const done = currentPage >= totalPages - 1

    return NextResponse.json({
      success: true,
      message: `Page ${currentPage + 1}/${totalPages}: ${sent} sent, ${failed} failed`,
      data: { sent, failed, errors, sentList, total: kitData.length, totalPages, currentPage, done, pageSize }
    })

  } catch (error: any) {
    console.error('Registration summary email error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
