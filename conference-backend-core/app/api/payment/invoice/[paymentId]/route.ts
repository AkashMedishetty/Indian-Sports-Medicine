import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Payment from '@/lib/models/Payment'
import User from '@/lib/models/User'
import { InvoiceGenerator } from '@/lib/pdf/invoice-generator'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const { paymentId } = await params

    // Get payment details
    let payment: any = null
    let isEmbedded = false
    // First handle pseudo id to avoid ObjectId cast errors
    if (paymentId.startsWith('userpay_')) {
      const userId = paymentId.replace('userpay_', '')
      const embeddedUser = await User.findById(userId)
      if (!embeddedUser || !embeddedUser.payment) {
        return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 })
      }
      isEmbedded = true
      payment = {
        _id: paymentId,
        userId: embeddedUser._id,
        registrationId: embeddedUser.registration?.registrationId || 'N/A',
        razorpayOrderId: 'N/A',
        razorpayPaymentId: embeddedUser.payment.bankTransferUTR || embeddedUser.payment.transactionId || 'BANK-TRANSFER',
        amount: {
          registration: embeddedUser.payment.amount,
          workshops: 0,
          accompanyingPersons: 0,
          discount: 0,
          total: embeddedUser.payment.amount,
          currency: 'INR'
        },
        breakdown: {
          registrationType: embeddedUser.registration?.type || 'consultant',
          baseAmount: embeddedUser.payment.amount,
          workshopFees: [],
          accompanyingPersonFees: 0,
          discountsApplied: []
        },
        status: embeddedUser.payment.status === 'verified' ? 'completed' : 'pending',
        transactionDate: embeddedUser.payment.paymentDate || new Date(),
        invoiceGenerated: true
      }
    } else {
      payment = await Payment.findById(paymentId)
      isEmbedded = !payment
      if (!payment) {
        return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 })
      }
    }

    // Get user details
    const user = await User.findById(payment.userId)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    // Check if user owns this payment or is admin
    if (payment.userId.toString() !== (session.user as any).id && (session.user as any).role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }

    // Generate PDF invoice using the new InvoiceGenerator
    try {
      // Use generatePDFFromPayment if we have a Payment record, otherwise use generatePDFFromUser
      const pdfBuffer = !isEmbedded 
        ? await InvoiceGenerator.generatePDFFromPayment(user, payment)
        : await InvoiceGenerator.generatePDFFromUser(user)
      const fileName = `${payment.registrationId}-INV-${conferenceConfig.shortName}.pdf`
      
      // Mark invoice as generated after successful generation
      if (isEmbedded) {
        // For bank transfer payments stored in User model
        if (user.payment && !user.payment.invoiceGenerated) {
          user.payment.invoiceGenerated = true
          await user.save()
        }
      } else {
        // For online payments in Payment collection
        if (!payment.invoiceGenerated) {
          payment.invoiceGenerated = true
          await payment.save()
        }
      }
      
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      })
    } catch (pdfError) {
      console.error('PDF generation failed, falling back to HTML:', pdfError)
      
      // Fallback to HTML if PDF generation fails
      const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Invoice - ${payment.registrationId}</title>
          <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .header h1 { color: #333; margin: 0; font-size: 24px; }
              .invoice-details { display: flex; justify-content: space-between; margin: 20px 0; }
              .payment-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .payment-table th, .payment-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              .payment-table th { background-color: #f5f5f5; font-weight: bold; }
              .amount { text-align: right; }
              .total-row { background-color: #f9f9f9; font-weight: bold; }
              .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>${conferenceConfig.shortName} Conference</h1>
              <p>${conferenceConfig.name}</p>
              <p>${new Date(conferenceConfig.eventDate.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} - ${new Date(conferenceConfig.eventDate.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} | ${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}</p>
              <h2 style="margin-top: 20px; color: #333;">INVOICE</h2>
          </div>
          <div class="invoice-details">
              <div>
                  <strong>Invoice Number:</strong> ${payment.registrationId}-INV-${conferenceConfig.shortName}<br>
                  <strong>Invoice Date:</strong> ${new Date(payment.transactionDate).toLocaleDateString()}<br>
                  <strong>Status:</strong> ${payment.status === 'completed' ? 'Paid' : 'Pending'}
              </div>
          </div>
          <div class="bill-to">
              <h3>Bill To:</h3>
              <p>
                  <strong>${user.profile.title || ''} ${user.profile.firstName} ${user.profile.lastName}</strong><br>
                  ${user.email}<br>
                  ${user.profile.phone}<br>
                  ${user.profile.institution}<br>
                  MCI: ${user.profile.mciNumber || 'N/A'}
              </p>
          </div>
          <table class="payment-table">
              <thead>
                  <tr><th>Description</th><th>Type</th><th class="amount">Amount</th></tr>
              </thead>
              <tbody>
                  <tr>
                      <td>Registration Fee</td>
                      <td>${payment.breakdown?.registrationType?.replace('-', ' ').toUpperCase() || 'N/A'}</td>
                      <td class="amount">${payment.amount.currency} ${payment.amount.registration.toLocaleString()}</td>
                  </tr>
                  ${payment.amount.workshops > 0 ? `<tr><td>Workshop Fees</td><td>Additional</td><td class="amount">${payment.amount.currency} ${payment.amount.workshops.toLocaleString()}</td></tr>` : ''}
                  ${payment.amount.accompanyingPersons > 0 ? `<tr><td>Accompanying Persons</td><td>Additional</td><td class="amount">${payment.amount.currency} ${payment.amount.accompanyingPersons.toLocaleString()}</td></tr>` : ''}
                  ${payment.amount.discount > 0 ? `<tr><td>Discount Applied</td><td>Special</td><td class="amount">-${payment.amount.currency} ${payment.amount.discount.toLocaleString()}</td></tr>` : ''}
                  <tr class="total-row">
                      <td colspan="2"><strong>Total Amount</strong></td>
                      <td class="amount"><strong>${payment.amount.currency} ${payment.amount.total.toLocaleString()}</strong></td>
                  </tr>
              </tbody>
          </table>
          <div class="footer">
              <p><strong>Thank you for your registration!</strong></p>
              <p>For queries: ${conferenceConfig.contact.email}</p>
              <p>Computer-generated invoice - no signature required</p>
          </div>
      </body>
      </html>
      `
      
      const fileName = `${payment.registrationId}-INV-${conferenceConfig.shortName}.html`
      return new NextResponse(invoiceHtml, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="${fileName}"`,
        },
      })
    }

  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}