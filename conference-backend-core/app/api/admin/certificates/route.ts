import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { sendEmail } from '@/conference-backend-core/lib/email/smtp'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { getBaseTemplate } from '@/conference-backend-core/lib/email/templates'
import { CertificateGenerator } from '@/conference-backend-core/lib/pdf/certificate-generator'
import Configuration from '@/lib/models/Configuration'
import User from '@/lib/models/User'
import * as XLSX from 'xlsx'
import path from 'path'

export const maxDuration = 300

// Certificate categories and their Excel file mappings
const CERTIFICATE_CATEGORIES = {
  'eposter': {
    label: 'E-Poster Presentation',
    file: 'Eposter ISSH.xlsx',
    nameField: 'Presenter Name',
    emailField: 'Email',
    extraFields: { title: 'Title', abstractId: 'Abstract ID', institution: 'Institution', authors: 'Authors' },
  },
  'free-paper': {
    label: 'Free Paper Presentation',
    file: 'Free Paper  (1).xlsx',
    nameField: 'Presenter',
    emailField: null, // No email in this file — need to match from DB
    extraFields: { title: 'Title', time: 'TIME', hall: 'Hall', date: 'Date' },
  },
  'award-paper': {
    label: 'Award Paper Presentation',
    file: 'Award Paper List.xlsx',
    nameField: 'Presenter',
    emailField: null,
    extraFields: { title: 'Title', time: 'TIME', hall: 'Hall', date: 'Date' },
  },
  'workshop-sawbone': {
    label: 'Saw Bone Workshop',
    file: 'Saw_Bone_workshop_for_Distal_Radius_and_hand_fracture_fixation_registrations_2026-04-24 (1).xlsx',
    nameField: 'Name',
    emailField: 'Email',
    extraFields: { registrationId: 'Registration ID', institution: 'Institution' },
  },
  'workshop-tendon': {
    label: 'Tendon Repair Workshop',
    file: 'Tendon_Repair_Workshop_over_Porcine_models_registrations_2026-04-24 (1).xlsx',
    nameField: 'Name',
    emailField: 'Email',
    extraFields: { registrationId: 'Registration ID' },
  },
}

type CategoryKey = keyof typeof CERTIFICATE_CATEGORIES

interface CertificateRecipient {
  id: string
  name: string
  email: string
  category: CategoryKey
  categoryLabel: string
  title?: string
  abstractId?: string
  institution?: string
  authors?: string
  time?: string
  hall?: string
  date?: string
  registrationId?: string
  phone?: string
}

// Fix mojibake / encoding issues in text
function cleanText(text: string): string {
  if (!text) return text
  return text
    .replace(/â€"/g, '—')    // em-dash
    .replace(/â€"/g, '–')    // en-dash
    .replace(/â€™/g, "'")    // right single quote
    .replace(/â€˜/g, "'")    // left single quote
    .replace(/â€œ/g, '"')    // left double quote
    .replace(/â€\u009D/g, '"') // right double quote
    .replace(/â€¦/g, '…')    // ellipsis
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã¶/g, 'ö')
    .replace(/Ã¤/g, 'ä')
    .replace(/Â /g, ' ')
    .replace(/ï¿½/g, '')
    .trim()
}

function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)\s*/i, '')
    .replace(/,.*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchNameToUser(presenterName: string, users: any[]): any | null {
  const normalized = normalizeName(presenterName)
  const words = normalized.split(' ').filter(w => w.length > 1)
  // Exact match
  for (const u of users) {
    const uName = normalizeName(`${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`)
    if (uName === normalized) return u
  }
  // Fuzzy: 2+ words match
  for (const u of users) {
    const uName = normalizeName(`${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`)
    const uWords = uName.split(' ').filter(w => w.length > 1)
    if (words.length >= 2) {
      const matchCount = words.filter(w => uWords.some(uw => uw === w || (w.length > 3 && uw.startsWith(w)) || (uw.length > 3 && w.startsWith(uw)))).length
      if (matchCount >= 2) return u
    }
  }
  return null
}

function readExcelFile(filename: string): any[] {
  try {
    const filePath = path.join(process.cwd(), filename)
    console.log(`[certificates] Reading: ${filePath}`)
    const fs = require('fs')
    if (!fs.existsSync(filePath)) {
      console.log(`[certificates] File NOT found: ${filePath}`)
      return []
    }
    const fileBuffer = fs.readFileSync(filePath)
    const wb = XLSX.read(fileBuffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws)
    console.log(`[certificates] Read ${data.length} rows from ${filename}`)
    return data
  } catch (e: any) {
    console.error(`[certificates] Failed to read ${filename}:`, e.message)
    return []
  }
}

function loadRecipients(category: CategoryKey): CertificateRecipient[] {
  const config = CERTIFICATE_CATEGORIES[category]
  const rows = readExcelFile(config.file)
  
  return rows.filter((r: any) => r[config.nameField]).map((r: any, i: number) => {
    const recipient: CertificateRecipient = {
      id: `${category}-${i}`,
      name: cleanText((r[config.nameField] || '').toString()),
      email: config.emailField ? (r[config.emailField] || '').toString().trim() : '',
      category,
      categoryLabel: config.label,
    }
    // Map extra fields
    for (const [key, col] of Object.entries(config.extraFields)) {
      const val = r[col as string]
      if (val !== undefined && val !== null) {
        (recipient as any)[key] = cleanText(val.toString())
      }
    }
    // Handle Excel date serial numbers
    if (recipient.date && /^\d{5}$/.test(recipient.date)) {
      const d = XLSX.SSF.parse_date_code(parseInt(recipient.date))
      recipient.date = `${String(d.d).padStart(2,'0')}/${String(d.m).padStart(2,'0')}/${d.y}`
    }
    // Phone from Mobile No field (free paper)
    if (!recipient.phone && r['Mobile No']) {
      recipient.phone = r['Mobile No'].toString().trim()
    }
    return recipient
  })
}

function generateCertificateEmailHTML(recipient: CertificateRecipient): string {
  const content = `
    <h2>🎓 Your Certificate — ${conferenceConfig.shortName}</h2>
    <p>Dear ${recipient.name},</p>
    
    <p>Thank you for your participation in <strong>${conferenceConfig.shortName}</strong>. Please find your certificate attached to this email.</p>
    
    <div class="highlight">
      <h3 style="margin-top:0;">Certificate Details</h3>
      <table>
        <tr><th>Certificate Type</th><td><strong>${recipient.categoryLabel}</strong></td></tr>
        <tr><th>Name</th><td>${recipient.name}</td></tr>
        ${recipient.title ? `<tr><th>Title</th><td>${recipient.title}</td></tr>` : ''}
        ${recipient.abstractId ? `<tr><th>Abstract ID</th><td>${recipient.abstractId}</td></tr>` : ''}
        ${recipient.institution ? `<tr><th>Institution</th><td>${recipient.institution}</td></tr>` : ''}
        ${recipient.time ? `<tr><th>Time</th><td>${recipient.time}</td></tr>` : ''}
        ${recipient.hall ? `<tr><th>Hall</th><td>${recipient.hall}</td></tr>` : ''}
      </table>
    </div>
    
    <p>Your certificate is attached as a PDF to this email. Please save it for your records.</p>
    
    <p>We hope you had a wonderful experience at the conference!</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Organising Committee</strong></p>
  `
  return getBaseTemplate(content)
}

async function generateCertificatePDF(recipient: CertificateRecipient): Promise<Buffer | null> {
  try {
    // Load the template config for this category
    let templateConfig = await Configuration.findOne({
      type: 'certificate',
      key: `certificate_config_${recipient.category}`
    })
    
    // Fallback to default template
    if (!templateConfig) {
      templateConfig = await Configuration.findOne({
        type: 'certificate',
        key: 'certificate_config_default'
      })
    }
    if (!templateConfig) {
      templateConfig = await Configuration.findOne({
        type: 'certificate',
        key: 'certificate_config'
      })
    }

    if (!templateConfig?.value) {
      console.log(`[certificates] No template config found for category: ${recipient.category}`)
      return null
    }

    // Build a user-like object that the CertificateGenerator expects
    const userData = {
      profile: {
        title: '',
        firstName: recipient.name,
        lastName: '',
        institution: recipient.institution || '',
        designation: '',
      },
      registration: {
        registrationId: recipient.registrationId || '',
      },
      // Extra fields for variable replacement
      title: recipient.title || '',
      abstractTitle: recipient.title || '',
      abstractId: recipient.abstractId || '',
      authors: recipient.authors || '',
    }

    const certConfig = {
      value: {
        template: templateConfig.value.template,
        elements: templateConfig.value.elements || [],
      }
    }

    console.log(`[certificates] Generating PDF for ${recipient.name} using template ${recipient.category} (${certConfig.value.elements?.length || 0} elements)`)

    const pdfBuffer = await CertificateGenerator.generateCertificatePDF({
      user: userData,
      certificateConfig: certConfig,
      registrationId: recipient.registrationId || recipient.id,
    })

    return pdfBuffer
  } catch (err: any) {
    console.error(`[certificates] PDF generation failed for ${recipient.name}:`, err.message)
    return null
  }
}

// GET — Load recipients for preview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[certificates GET] session:', !!session, 'role:', (session?.user as any)?.role)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as CategoryKey | 'all'

    // Load users from DB for name matching (needed for free-paper and award-paper)
    await connectDB()
    const dbUsers = await User.find({}).select('email profile registration').lean()

    const enrichWithEmail = (recipients: CertificateRecipient[]): CertificateRecipient[] => {
      return recipients.map(r => {
        if (!r.email) {
          const match = matchNameToUser(r.name, dbUsers)
          if (match) {
            return { ...r, email: match.email, registrationId: match.registration?.registrationId || r.registrationId, institution: r.institution || match.profile?.institution || '' }
          }
        }
        return r
      })
    }

    if (category && category !== 'all' && CERTIFICATE_CATEGORIES[category]) {
      const recipients = enrichWithEmail(loadRecipients(category))
      const noEmail = recipients.filter(r => !r.email).length
      return NextResponse.json({ success: true, data: { category, recipients, total: recipients.length, noEmail } })
    }

    // Load all categories
    const allData: Record<string, { label: string; recipients: CertificateRecipient[]; total: number; noEmail: number }> = {}
    let grandTotal = 0
    for (const [key, config] of Object.entries(CERTIFICATE_CATEGORIES)) {
      const recipients = enrichWithEmail(loadRecipients(key as CategoryKey))
      const noEmail = recipients.filter(r => !r.email).length
      allData[key] = { label: config.label, recipients, total: recipients.length, noEmail }
      grandTotal += recipients.length
    }

    return NextResponse.json({ success: true, data: { categories: allData, grandTotal } })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST — Send certificates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { action, category, recipients: customRecipients, page, pageSize = 10, testEmail, recipientId, manualRecipient } = body

    // Load recipients
    let recipients: CertificateRecipient[] = []
    if (customRecipients) {
      recipients = customRecipients
    } else if (category && CERTIFICATE_CATEGORIES[category as CategoryKey]) {
      const raw = loadRecipients(category as CategoryKey)
      // Enrich with DB emails for free-paper and award-paper
      const dbUsers = await User.find({}).select('email profile registration').lean()
      recipients = raw.map(r => {
        if (!r.email) {
          const match = matchNameToUser(r.name, dbUsers)
          if (match) return { ...r, email: match.email, registrationId: match.registration?.registrationId || r.registrationId, institution: r.institution || match.profile?.institution || '' }
        }
        return r
      })
    }

    // Send to a single manual recipient (not in any list)
    if (action === 'send-manual' && manualRecipient) {
      const r: CertificateRecipient = {
        id: 'manual-0',
        name: manualRecipient.name,
        email: manualRecipient.email,
        category: manualRecipient.category || 'eposter',
        categoryLabel: CERTIFICATE_CATEGORIES[manualRecipient.category as CategoryKey]?.label || manualRecipient.categoryLabel || 'Participation',
        title: manualRecipient.title,
        institution: manualRecipient.institution,
      }
      const html = generateCertificateEmailHTML(r)
      const pdfBuffer = await generateCertificatePDF(r)
      const attachments: any[] = []
      if (pdfBuffer) {
        attachments.push({ filename: `Certificate-${r.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' })
      }
      await sendEmail({
        to: r.email,
        subject: `🎓 Your Certificate — ${conferenceConfig.shortName}`,
        html,
        text: `Certificate for ${r.name} — ${r.categoryLabel}`,
        attachments,
        templateName: 'certificate',
        category: 'system'
      })
      return NextResponse.json({ success: true, message: `Certificate email sent to ${r.email}` })
    }

    // Send test email using a specific recipient's data
    if (action === 'test' && testEmail) {
      let sample = recipients[0]
      if (recipientId) {
        const found = recipients.find(r => r.id === recipientId)
        if (found) sample = found
      }
      if (!sample) return NextResponse.json({ success: false, message: 'No recipients found' })

      const html = generateCertificateEmailHTML(sample)
      const pdfBuffer = await generateCertificatePDF(sample)
      const attachments: any[] = []
      if (pdfBuffer) {
        attachments.push({ filename: `Certificate-${sample.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' })
      }
      await sendEmail({
        to: testEmail,
        subject: `[TEST] 🎓 Certificate — ${sample.categoryLabel} — ${conferenceConfig.shortName}`,
        html,
        text: `Test certificate for ${sample.name}`,
        attachments,
        templateName: 'certificate-test',
        category: 'system'
      })
      return NextResponse.json({ success: true, message: `Test sent to ${testEmail} using ${sample.name}'s data${pdfBuffer ? ' (PDF attached)' : ' (no PDF - template not configured)'}` })
    }

    // Send to a single recipient by ID (resend)
    if (action === 'send-single' && recipientId) {
      const r = recipients.find(r => r.id === recipientId)
      if (!r) return NextResponse.json({ success: false, message: 'Recipient not found' })
      if (!r.email) return NextResponse.json({ success: false, message: `No email for ${r.name}` })

      const html = generateCertificateEmailHTML(r)
      const pdfBuffer = await generateCertificatePDF(r)
      const attachments: any[] = []
      if (pdfBuffer) {
        attachments.push({ filename: `Certificate-${r.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' })
      }
      await sendEmail({
        to: r.email,
        subject: `🎓 Your Certificate — ${conferenceConfig.shortName}`,
        html,
        text: `Certificate for ${r.name} — ${r.categoryLabel}`,
        userName: r.name,
        attachments,
        templateName: 'certificate',
        category: 'system'
      })
      return NextResponse.json({ success: true, message: `Certificate sent to ${r.email} (${r.name})${pdfBuffer ? ' with PDF' : ''}` })
    }

    // Bulk send — ALL in one call, browser reused across all PDFs
    if (action === 'send-all') {
      const validRecipients = recipients.filter(r => r.email)

      if (validRecipients.length === 0) {
        return NextResponse.json({ success: true, data: { sent: 0, failed: 0, errors: [], sentList: [], total: 0, done: true } })
      }

      let sent = 0, failed = 0
      const errors: Array<{ name: string; email: string; error: string }> = []
      const sentList: Array<{ name: string; email: string; category: string }> = []

      console.log(`[certificates] Starting bulk send for ${validRecipients.length} recipients (browser will be reused)`)

      try {
        for (const r of validRecipients) {
          try {
            const html = generateCertificateEmailHTML(r)
            const pdfBuffer = await generateCertificatePDF(r)
            const attachments: any[] = []
            if (pdfBuffer) {
              attachments.push({ filename: `Certificate-${r.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' })
            }
            await sendEmail({
              to: r.email,
              subject: `🎓 Your Certificate — ${conferenceConfig.shortName}`,
              html,
              text: `Certificate for ${r.name} — ${r.categoryLabel}`,
              userName: r.name,
              attachments,
              templateName: 'certificate',
              category: 'system'
            })
            sent++
            sentList.push({ name: r.name, email: r.email, category: r.categoryLabel })
            console.log(`[certificates] ${sent}/${validRecipients.length} sent: ${r.name}`)
          } catch (err: any) {
            failed++
            errors.push({ name: r.name, email: r.email, error: err.message || 'Unknown' })
            console.error(`[certificates] Failed: ${r.name} — ${err.message}`)
          }
        }
      } finally {
        // Close browser after all PDFs are generated
        await CertificateGenerator.closeBrowser()
        console.log(`[certificates] Browser closed. Sent: ${sent}, Failed: ${failed}`)
      }

      return NextResponse.json({
        success: true,
        message: `${sent} certificates sent, ${failed} failed`,
        data: { sent, failed, errors, sentList, total: validRecipients.length, done: true, noEmail: recipients.length - validRecipients.length }
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid action' })
  } catch (error: any) {
    console.error('Certificate error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
