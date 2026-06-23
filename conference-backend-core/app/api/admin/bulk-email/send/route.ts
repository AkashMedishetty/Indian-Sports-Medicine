import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { EmailService } from '@/lib/email/service'
import EmailHistory from '@/lib/models/EmailHistory'

// Increase timeout for bulk email sending (5 minutes)
export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    const { subject, content, recipients, template } = await request.json()

    if (!subject || !content || !recipients || recipients.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 })
    }

    await connectDB()

    let sent = 0
    let failed = 0
    const errors: string[] = []
    const totalRecipients = recipients.length
    
    console.log(`🚀 Starting bulk email send: ${totalRecipients} recipients`)
    console.log(`📧 Template: ${template || 'custom'}, Subject: ${subject}`)

    // Process emails in batches to prevent timeout and provide progress
    const BATCH_SIZE = 10 // Process 10 emails at a time
    const batches = []
    
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE))
    }

    console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE} emails each`)

    // Send emails batch by batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      const batchStart = Date.now()
      
      console.log(`⏳ Batch ${batchIndex + 1}/${batches.length} - Processing ${batch.length} emails...`)

      // Process batch in parallel for speed
      const batchResults = await Promise.allSettled(
        batch.map(async (recipient: any) => {
          try {
            // Replace variables in content
            let personalizedContent = content
              .replace(/{name}/g, recipient.name || '')
              .replace(/{registrationId}/g, recipient.registrationId || '')
              .replace(/{category}/g, recipient.category || '')
              .replace(/{status}/g, recipient.status || '')

            await EmailService.sendBulkTemplateEmail({
              to: recipient.email,
              subject,
              template: template || 'custom',
              userData: {
                name: recipient.name,
                registrationId: recipient.registrationId,
                category: recipient.category,
                userId: recipient._id,
                workshop: recipient.workshop
              },
              content: personalizedContent
            })

            return { success: true, email: recipient.email }
          } catch (error) {
            return {
              success: false,
              email: recipient.email,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })
      )

      // Count successes and failures
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          sent++
        } else {
          failed++
          const errorMsg = result.status === 'fulfilled' 
            ? `${result.value.email}: ${result.value.error}`
            : 'Promise rejected'
          errors.push(errorMsg)
        }
      })

      const batchTime = Date.now() - batchStart
      console.log(`✅ Batch ${batchIndex + 1}/${batches.length} completed in ${batchTime}ms - Sent: ${sent}, Failed: ${failed}`)
      
      // Small delay between batches to prevent rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`🎉 Bulk email send completed - Total Sent: ${sent}/${totalRecipients}, Failed: ${failed}`)

    // Save to email history
    try {
      await EmailHistory.create({
        subject,
        template,
        content: content.substring(0, 500), // Store first 500 chars
        sentAt: new Date(),
        recipientCount: recipients.length,
        successCount: sent,
        failureCount: failed,
        sentBy: (session.user as any).email,
        errorMessages: errors.length > 0 ? errors.slice(0, 20) : undefined
      })
    } catch (error) {
      console.error('Failed to save email history:', error)
    }

    const response = {
      success: true,
      sent,
      failed,
      total: totalRecipients,
      successRate: totalRecipients > 0 ? ((sent / totalRecipients) * 100).toFixed(2) : '0',
      errors: errors.length > 0 ? errors.slice(0, 10) : [], // Return first 10 errors only
      message: `Successfully sent ${sent} emails out of ${totalRecipients}. Failed: ${failed}`
    }

    console.log(`📊 Final Result:`, response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Bulk email send error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to send emails',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
