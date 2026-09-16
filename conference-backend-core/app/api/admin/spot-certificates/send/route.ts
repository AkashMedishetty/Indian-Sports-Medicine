import { NextRequest, NextResponse } from 'next/server'
import SpotCertificate from '@/conference-backend-core/lib/models/SpotCertificate'
import User from '@/lib/models/User'
import EmailHistory from '@/conference-backend-core/lib/models/EmailHistory'
import { requireCertificateStaff } from '@/conference-backend-core/lib/certificates/auth'
import { renderSpotCertificate, toBytes } from '@/conference-backend-core/lib/certificates/spot-render'
import { buildSpotEmail, certificateFileName } from '@/conference-backend-core/lib/certificates/spot-email'
import { cleanValues, EMAIL_RE, MAX_RECIPIENTS_PER_REQUEST } from '@/conference-backend-core/lib/certificates/spot-fields'
import { loadTemplateWithPdf, toTemplateDTO } from '@/conference-backend-core/lib/certificates/templates'
import { sendEmail } from '@/conference-backend-core/lib/email/smtp'

export const dynamic = 'force-dynamic'
// A full batch of 25 over SMTP can take well over a minute.
export const maxDuration = 300

const SOURCES = ['manual', 'lookup', 'csv', 'resend'] as const
type Source = (typeof SOURCES)[number]

interface SendResult {
  index: number
  name: string
  email: string
  success: boolean
  error?: string
  warnings?: string[]
  logId?: string
}

/**
 * sendEmail's SMTP path records successful sends in EmailHistory but not failures,
 * so a failed certificate would be missing from the registrant's Email History.
 * Record it here, skipping it if the mail layer already did (its Maileroo path
 * records failures) — matched on the referenceId sendEmail returns.
 */
async function recordFailedEmail(entry: {
  referenceId?: string
  userId?: string
  email: string
  name: string
  subject: string
  html: string
  text: string
  attachmentName: string
  attachmentSize: number
  error: string
}) {
  try {
    if (entry.referenceId && (await EmailHistory.exists({ referenceId: entry.referenceId }))) return
    await EmailHistory.create({
      recipient: { userId: entry.userId || undefined, email: entry.email, name: entry.name || entry.email.split('@')[0] },
      subject: entry.subject,
      htmlContent: entry.html,
      plainTextContent: entry.text,
      templateName: 'spot-certificate',
      templateData: {},
      category: 'custom',
      attachments: [{ filename: entry.attachmentName, contentType: 'application/pdf', size: entry.attachmentSize }],
      status: 'failed',
      error: entry.error,
      referenceId: entry.referenceId,
      sentAt: new Date(),
    })
  } catch (historyError) {
    console.warn('Could not record failed spot certificate email in history:', historyError)
  }
}

/**
 * Render and email certificates, one recipient at a time, logging every attempt.
 * The client sends large lists in batches of MAX_RECIPIENTS_PER_REQUEST.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error
  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 })
    }

    const recipients: unknown[] = Array.isArray(body?.recipients) ? body.recipients : []
    if (!recipients.length) return NextResponse.json({ success: false, message: 'Add at least one recipient' }, { status: 400 })
    if (recipients.length > MAX_RECIPIENTS_PER_REQUEST) {
      return NextResponse.json({ success: false, message: `Send at most ${MAX_RECIPIENTS_PER_REQUEST} per request` }, { status: 400 })
    }

    const template = await loadTemplateWithPdf(String(body.templateId ?? ''))
    if (!template) return NextResponse.json({ success: false, message: 'Template not found' }, { status: 404 })

    const dto = toTemplateDTO(template.toObject())
    const pdfBytes = toBytes(template.pdf)
    const source: Source = SOURCES.includes(body.source) ? body.source : 'manual'
    const results: SendResult[] = []

    // Link each email to the registrant it belongs to, so it also appears in that
    // person's Email History (that tab looks emails up by userId first).
    const recipientEmails = [
      ...new Set(recipients.map((r) => String((r as Record<string, unknown>)?.email ?? '').trim().toLowerCase()).filter(Boolean)),
    ]
    const registered = recipientEmails.length
      ? ((await User.find({ email: { $in: recipientEmails } }).select('_id email').lean()) as unknown as Array<{ _id: unknown; email: string }>)
      : []
    const userIdByEmail = new Map(registered.map((u) => [String(u.email).toLowerCase(), String(u._id)]))

    for (let index = 0; index < recipients.length; index++) {
      const input = (recipients[index] ?? {}) as Record<string, unknown>
      const values = cleanValues(input)
      const name = values.name ?? ''
      const email = String(input.email ?? '').trim().toLowerCase()

      if (!name) { results.push({ index, name, email, success: false, error: 'Name is required' }); continue }
      if (!EMAIL_RE.test(email)) { results.push({ index, name, email, success: false, error: 'Email looks invalid' }); continue }

      let status: 'sent' | 'failed' = 'failed'
      let error: string | undefined
      let messageId: string | undefined
      let warnings: string[] = []

      try {
        const rendered = await renderSpotCertificate(pdfBytes, dto.fields, values)
        warnings = rendered.warnings
        const { subject, html, text } = buildSpotEmail(dto.emailSubject, dto.emailBody, values)
        const sent = await sendEmail({
          to: email,
          subject,
          html,
          text,
          attachments: [{ filename: certificateFileName(name), content: Buffer.from(rendered.bytes), contentType: 'application/pdf' }],
          userId: userIdByEmail.get(email),
          userName: name,
          templateName: 'spot-certificate',
          category: 'custom',
        })
        if (sent?.success) {
          status = 'sent'
          messageId = sent.messageId
        } else {
          error = sent?.error || 'The email could not be sent'
          await recordFailedEmail({
            referenceId: undefined,
            userId: userIdByEmail.get(email),
            email,
            name,
            subject,
            html,
            text,
            attachmentName: certificateFileName(name),
            attachmentSize: rendered.bytes.length,
            error,
          })
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to generate or send the certificate'
      }

      let logId: string | undefined
      try {
        const log = await SpotCertificate.create({
          templateId: template._id,
          templateName: template.name,
          name,
          email,
          values,
          source,
          status,
          messageId,
          error,
          sentBy: auth.user._id,
          sentByEmail: auth.user.email,
        })
        logId = String(log._id)
      } catch (logError) {
        console.error('Spot certificate log write failed:', logError)
      }

      results.push({ index, name, email, success: status === 'sent', error, warnings, logId })
    }

    const sent = results.filter((r) => r.success).length
    return NextResponse.json({ success: true, sent, failed: results.length - sent, results })
  } catch (error) {
    console.error('Spot certificate send error:', error)
    return NextResponse.json({ success: false, message: 'Failed to send certificates' }, { status: 500 })
  }
}
