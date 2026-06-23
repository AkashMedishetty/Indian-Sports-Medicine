import puppeteer from 'puppeteer-core';
import { conferenceConfig } from '../../config/conference.config';

export interface InvoiceData {
  invoiceNumber: string;
  registrationId: string;
  invoiceType?: 'registration' | 'workshop-addon';
  date: string;
  dueDate: string;
  user: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    mciNumber?: string;
  };
  registration: {
    type: string;
    tier: string;
    workshopSelections: string[];
    accompanyingPersons: Array<{
      name: string;
      relationship: string;
    }>;
  };
  workshops?: Array<{
    workshopId: string;
    workshopName: string;
    price: number;
  }>;
  payment: {
    amount: number;
    status: string;
    method: string;
    utr?: string;
    transactionId?: string;
    paidAt?: string;
  };
  accommodation?: {
    roomType: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    perNight: number;
    totalAmount: number;
  };
  pricing: {
    baseAmount: number;
    gst: number;
    workshopFees: number;
    accompanyingFees: number;
    accommodationFees: number;
    totalAmount: number;
    discount?: number;
    finalAmount: number;
  };
}

export class InvoiceGenerator {
  private static getCategoryLabel(categoryKey: string): string {
    const category = conferenceConfig.registration.categories.find(c => c.key === categoryKey);
    return category?.label || categoryKey;
  }

  private static generateInvoiceHTML(data: InvoiceData): string {
    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return 'N/A';
      }
    };
    const formatTier = (tier?: string) => {
      if (!tier) return 'Regular';
      return tier.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${data.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 12px;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 2px solid #2563eb;
        }
        
        .logo-section {
            flex: 1;
        }
        
        .logo-section h1 {
            color: #2563eb;
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        
        .logo-section p {
            color: #64748b;
            font-size: 14px;
        }
        
        .invoice-info {
            text-align: right;
            flex: 1;
        }
        
        .invoice-info h2 {
            color: #1e293b;
            font-size: 20px;
            margin-bottom: 8px;
        }
        
        .invoice-details {
            background: #f8fafc;
            padding: 14px;
            border-radius: 8px;
            margin-bottom: 18px;
        }
        
        .invoice-details h3 {
            color: #1e293b;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
        }
        
        .detail-item {
            margin-bottom: 10px;
        }
        
        .detail-label {
            font-weight: 600;
            color: #475569;
            font-size: 12px;
        }
        
        .detail-value {
            color: #1e293b;
            font-size: 12px;
            margin-top: 2px;
        }
        
        .items-section {
            margin-bottom: 16px;
        }
        
        .items-section h3 {
            color: #1e293b;
            margin-bottom: 12px;
            font-size: 16px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .items-table th {
            background: #2563eb;
            color: white;
            padding: 8px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
        }
        
        .items-table td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .items-table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .total-section {
            background: #f8fafc;
            padding: 12px;
            border-radius: 8px;
            margin-top: 12px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
        }
        
        .total-row.final {
            font-weight: 700;
            font-size: 14px;
            color: #1e293b;
            border-top: 2px solid #2563eb;
            padding-top: 8px;
            margin-top: 8px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-paid {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }
        
        .footer {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 11px;
        }
        
        .footer p {
            margin-bottom: 5px;
        }
        
        .footer a {
            color: #2563eb;
            text-decoration: none;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .invoice-container {
                padding: 16px;
            }
        }

        /* Ensure single page by reducing spacing and avoiding page breaks */
        .invoice-container, .items-section, .total-section, .invoice-details { page-break-inside: avoid; }
        .invoice-details, .items-section, .total-section { margin-bottom: 16px; }
        @page { size: A4; margin: 8mm; }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                <h1>${conferenceConfig.shortName}</h1>
                <p>${conferenceConfig.organizationName}</p>
                <p>${conferenceConfig.name}</p>
            </div>
            <div class="invoice-info">
                <h2>INVOICE</h2>
                <div class="detail-item">
                    <div class="detail-label">Invoice #</div>
                    <div class="detail-value">${data.invoiceNumber}</div>
                </div>
            </div>
        </div>

        <!-- Invoice Details -->
        <div class="invoice-details">
            <h3>Registration Details</h3>
            <div class="details-grid">
                <div>
                    <div class="detail-item">
                        <div class="detail-label">Registration ID</div>
                        <div class="detail-value">${data.registrationId}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Participant Name</div>
                        <div class="detail-value">${data.user.name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Email</div>
                        <div class="detail-value">${data.user.email}</div>
                    </div>
                    ${data.user.phone ? `
                    <div class="detail-item">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value">${data.user.phone}</div>
                    </div>
                    ` : ''}
                    ${data.user.mciNumber ? `
                    <div class="detail-item">
                        <div class="detail-label">MCI Number</div>
                        <div class="detail-value">${data.user.mciNumber}</div>
                    </div>
                    ` : ''}
                </div>
                <div>
                    <div class="detail-item">
                        <div class="detail-label">Registration Type</div>
                        <div class="detail-value">${this.getCategoryLabel(data.registration.type)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Pricing Tier</div>
                        <div class="detail-value">${formatTier(data.registration.tier)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Payment Status</div>
                        <div class="detail-value">
                            <span class="status-badge ${data.payment.status === 'completed' || data.payment.status === 'verified' ? 'status-paid' : 'status-pending'}">
                                ${data.payment.status === 'completed' || data.payment.status === 'verified' ? 'Paid' : 'Pending'}
                            </span>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Payment Method</div>
                        <div class="detail-value">${data.payment.method}</div>
                    </div>
                    ${data.payment.utr ? `
                    <div class="detail-item">
                        <div class="detail-label">UTR/Transaction ID</div>
                        <div class="detail-value">${data.payment.utr}</div>
                    </div>
                    ` : ''}
                    ${data.payment.paidAt ? `
                    <div class="detail-item">
                        <div class="detail-label">Payment Date</div>
                        <div class="detail-value">${formatDate(data.payment.paidAt)}</div>
                    </div>
                    ` : ''}
                    <div class="detail-item">
                        <div class="detail-label">Accompanying Persons</div>
                        <div class="detail-value">${data.registration.accompanyingPersons && data.registration.accompanyingPersons.length > 0
                          ? `${data.registration.accompanyingPersons.length} (${data.registration.accompanyingPersons.map(p => p.name).join(', ')})`
                          : 'None'}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Items Section -->
        <div class="items-section">
            <h3>Registration Items</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-center">Quantity</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.invoiceType === 'workshop-addon' && data.workshops ? 
                      data.workshops.map(workshop => `
                    <tr>
                        <td>
                            <strong>${workshop.workshopName}</strong><br>
                            <small>Workshop ID: ${workshop.workshopId}</small>
                        </td>
                        <td class="text-center">1</td>
                        <td class="text-right">${formatCurrency(workshop.price)}</td>
                        <td class="text-right">${formatCurrency(workshop.price)}</td>
                    </tr>
                      `).join('') :
                      `
                    <tr>
                        <td>
                            <strong>${this.getCategoryLabel(data.registration.type)} Registration</strong>
                        </td>
                        <td class="text-center">1</td>
                        <td class="text-right">${formatCurrency(data.pricing.baseAmount)}</td>
                        <td class="text-right">${formatCurrency(data.pricing.baseAmount)}</td>
                    </tr>
                    ${(data.pricing.workshopFees > 0 && data.registration.workshopSelections.length > 0) ? `
                    <tr>
                        <td>
                            <strong>Workshop Registration</strong><br>
                            <small>${data.registration.workshopSelections.join(', ')}</small>
                        </td>
                        <td class="text-center">${data.registration.workshopSelections.length}</td>
                        <td class="text-right">${formatCurrency(data.pricing.workshopFees / data.registration.workshopSelections.length)}</td>
                        <td class="text-right">${formatCurrency(data.pricing.workshopFees)}</td>
                    </tr>
                    ` : ''}
                      `
                    }
                    ${data.invoiceType !== 'workshop-addon' && data.registration.accompanyingPersons.length > 0 ? `
                    <tr>
                        <td>
                            <strong>Accompanying Person(s)</strong><br>
                            <small>${data.registration.accompanyingPersons.map(p => `${p.name} (${p.relationship})`).join(', ')}</small>
                        </td>
                        <td class="text-center">${data.registration.accompanyingPersons.length}</td>
                        <td class="text-right">${formatCurrency((data.pricing.accompanyingFees || 0) / Math.max(1, data.registration.accompanyingPersons.length))}</td>
                        <td class="text-right">${formatCurrency(data.pricing.accompanyingFees || 0)}</td>
                    </tr>
                    ` : ''}
                    ${data.invoiceType !== 'workshop-addon' && data.accommodation && data.pricing.accommodationFees > 0 ? `
                    <tr>
                        <td>
                            <strong>Hotel Accommodation (${data.accommodation.roomType === 'single' ? 'Single Room' : 'Sharing Room'})</strong><br>
                            <small>Check-in: ${formatDate(data.accommodation.checkIn)} — Check-out: ${formatDate(data.accommodation.checkOut)}</small>
                        </td>
                        <td class="text-center">${data.accommodation.nights}</td>
                        <td class="text-right">${formatCurrency(data.accommodation.perNight)}</td>
                        <td class="text-right">${formatCurrency(data.pricing.accommodationFees)}</td>
                    </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>

        <!-- Total Section -->
        <div class="total-section">
            <div class="total-row">
                <span>Registration Fee:</span>
                <span>${formatCurrency(data.pricing.baseAmount)}</span>
            </div>
            ${data.pricing.workshopFees > 0 ? `
            <div class="total-row">
                <span>Workshop Fees:</span>
                <span>${formatCurrency(data.pricing.workshopFees)}</span>
            </div>
            ` : ''}
            ${data.pricing.accompanyingFees > 0 ? `
            <div class="total-row">
                <span>Accompanying Person(s):</span>
                <span>${formatCurrency(data.pricing.accompanyingFees)}</span>
            </div>
            ` : ''}
            ${data.pricing.accommodationFees > 0 ? `
            <div class="total-row">
                <span>Accommodation:</span>
                <span>${formatCurrency(data.pricing.accommodationFees)}</span>
            </div>
            ` : ''}
            ${data.pricing.gst > 0 ? `
            <div class="total-row">
                <span>GST (18%):</span>
                <span>${formatCurrency(data.pricing.gst)}</span>
            </div>
            ` : ''}
            ${data.pricing.discount && data.pricing.discount > 0 ? `
            <div class="total-row">
                <span>Discount:</span>
                <span>-${formatCurrency(data.pricing.discount)}</span>
            </div>
            ` : ''}
            <div class="total-row final">
                <span>Total Amount:</span>
                <span>${formatCurrency(data.pricing.finalAmount)}</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Thank you for registering for ${conferenceConfig.shortName}!</strong></p>
            <p>For any queries, please contact us at <a href="mailto:${conferenceConfig.contact.supportEmail}">${conferenceConfig.contact.supportEmail}</a></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  static async generatePDF(data: InvoiceData): Promise<Buffer> {
    // Check if we're in Vercel serverless environment
    const isVercel = process.env.VERCEL === '1';
    
    // Default viewport for PDF generation
    const viewport = {
      deviceScaleFactor: 1,
      hasTouch: false,
      height: 1200,
      isLandscape: false,
      isMobile: false,
      width: 800,
    };
    
    let browser;
    if (isVercel) {
      // Use @sparticuz/chromium for Vercel/AWS Lambda
      const chromium = require('@sparticuz/chromium');
      
      // Disable WebGL for better performance in serverless
      chromium.setGraphicsMode = false;
      
      browser = await puppeteer.launch({
        args: [...chromium.args, '--disable-gpu', '--disable-dev-shm-usage'],
        defaultViewport: viewport,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      // Local development - try to find Chrome executable
      const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.CHROME_PATH,
        process.env.PUPPETEER_EXECUTABLE_PATH
      ].filter(Boolean);

      let executablePath = '';
      for (const path of possiblePaths) {
        try {
          const fs = require('fs');
          if (path && fs.existsSync(path)) {
            executablePath = path;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }

      browser = await puppeteer.launch({
        headless: true,
        defaultViewport: viewport,
        executablePath: executablePath || undefined,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
    }

    try {
      const page = await browser.newPage();
      
      // Set page size to A4
      await page.setViewport({ width: 800, height: 1200 });
      
      const html = this.generateInvoiceHTML(data);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = Buffer.from(await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '8mm',
          right: '8mm',
          bottom: '8mm',
          left: '8mm'
        }
      }));

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  static async generatePDFFromPayment(user: any, payment: any): Promise<Buffer> {
    const isWorkshopAddon = payment.type === 'workshop-addon';
    
    const invoiceData: InvoiceData = {
      invoiceNumber: `${payment.registrationId}-INV-${conferenceConfig.shortName.replace(/\s+/g, '')}`,
      registrationId: payment.registrationId,
      invoiceType: isWorkshopAddon ? 'workshop-addon' : 'registration',
      date: payment.transactionDate || new Date().toISOString(),
      dueDate: payment.transactionDate || new Date().toISOString(),
      user: {
        name: user.profile.name || `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim(),
        email: user.email,
        phone: user.profile.phone,
        address: user.profile.address,
        mciNumber: user.profile.mciNumber
      },
      registration: {
        type: user.registration.type,
        tier: user.registration.tier || 'Standard',
        workshopSelections: user.registration.workshopSelections || [],
        accompanyingPersons: user.registration.accompanyingPersons || []
      },
      workshops: isWorkshopAddon ? payment.workshops : undefined,
      payment: {
        amount: payment.amount.total || 0,
        status: payment.status || 'pending',
        method: payment.paymentMethod || 'Online',
        transactionId: payment.razorpayPaymentId || payment.razorpayOrderId,
        paidAt: payment.transactionDate
      },
      pricing: {
        baseAmount: payment.amount.registration || 0,
        gst: payment.breakdown?.gst || payment.amount?.gst || 0,
        workshopFees: payment.amount.workshops || 0,
        accompanyingFees: payment.amount.accompanyingPersons || 0,
        accommodationFees: payment.amount.accommodation || 0,
        totalAmount: payment.amount.total || 0,
        discount: payment.amount.discount || 0,
        finalAmount: payment.amount.total || 0
      }
    };

    // Add accommodation if present
    if (user.registration?.accommodation?.required) {
      const acc = user.registration.accommodation;
      const perNight = acc.roomType === 'single' ? 10000 : 7500;
      invoiceData.accommodation = {
        roomType: acc.roomType || 'single',
        checkIn: acc.checkIn || '',
        checkOut: acc.checkOut || '',
        nights: acc.nights || 0,
        perNight,
        totalAmount: acc.totalAmount || 0
      };
    }

    return this.generatePDF(invoiceData);
  }

  static async generatePDFFromUser(user: any): Promise<Buffer> {
    // Get payment breakdown - use ONLY actual data, no calculations
    const paymentBreakdown = user.payment?.breakdown || user.paymentInfo?.breakdown || {};
    
    const totalPaid = user.payment?.amount || 0;
    
    // Use actual breakdown values if available
    const registrationFee = paymentBreakdown.registration || 0;
    let gst = paymentBreakdown.gst || 0;
    const workshopFees = paymentBreakdown.workshops || 0;
    const accompanyingFees = paymentBreakdown.accompanyingPersons || 0;
    const accommodationFees = paymentBreakdown.accommodation || 0;
    const discount = paymentBreakdown.discount || 0;
    
    // If breakdown is missing, put everything in registration fee
    const actualRegistrationFee = registrationFee || (totalPaid - workshopFees - accompanyingFees - accommodationFees + discount);
    
    // If GST is missing from breakdown, recalculate it (18% on pre-GST total)
    if (gst === 0 && totalPaid > 0) {
      const preGstTotal = actualRegistrationFee + workshopFees + accompanyingFees + accommodationFees;
      // Check if totalPaid already includes GST by seeing if preGstTotal * 1.18 ≈ totalPaid
      if (preGstTotal > 0 && Math.abs(preGstTotal * 1.18 - totalPaid) < 2) {
        gst = Math.round(preGstTotal * 0.18);
      }
    }
    
    const totalAmount = actualRegistrationFee + workshopFees + accompanyingFees + accommodationFees - discount;
    
    // Parse accompanying persons data
    let accompanyingPersons: Array<{ name: string; relationship: string }> = [];
    if (user.registration?.accompanyingPersons) {
      if (Array.isArray(user.registration.accompanyingPersons)) {
        accompanyingPersons = user.registration.accompanyingPersons;
      }
    }
    
    // Parse workshop selections
    let workshopSelections: string[] = [];
    if (user.registration?.workshopSelections) {
      if (Array.isArray(user.registration.workshopSelections)) {
        workshopSelections = user.registration.workshopSelections;
      } else if (typeof user.registration.workshopSelections === 'string') {
        workshopSelections = [user.registration.workshopSelections];
      }
    }
    
    // Get payment date from various possible locations
    const paymentDate = user.payment?.paymentDate || 
                        user.payment?.paidAt || 
                        user.payment?.verificationDate || 
                        user.registration?.paymentDate ||
                        user.createdAt;
    
    // Validate and format dates
    const getValidDate = (dateValue: any): string => {
      if (!dateValue) return new Date().toISOString()
      const date = new Date(dateValue)
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
    }
    
    const invoiceData: InvoiceData = {
      invoiceNumber: `${user.registration.registrationId}-INV-${conferenceConfig.shortName.replace(/\s+/g, '')}`,
      registrationId: user.registration.registrationId,
      date: getValidDate(paymentDate),
      dueDate: getValidDate(paymentDate),
      user: {
        name: user.profile.name || `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim(),
        email: user.email,
        phone: user.profile.phone,
        address: user.profile.address,
        mciNumber: user.profile.mciNumber
      },
      registration: {
        type: user.registration.type || user.registration.category,
        tier: user.registration.tier || 'Standard',
        workshopSelections: workshopSelections,
        accompanyingPersons: accompanyingPersons
      },
      payment: {
        amount: totalAmount,
        // Check both payment.status and registration.status to determine if paid
        status: ['verified', 'completed'].includes(user.payment?.status) || 
                ['paid', 'confirmed'].includes(user.registration?.status) 
                  ? 'verified' 
                  : (user.payment?.status || 'pending'),
        method: user.payment?.method === 'bank-transfer' ? 'Bank Transfer' : (user.payment?.method || 'Bank Transfer'),
        utr: user.payment?.bankTransferUTR || user.payment?.transactionId,
        transactionId: user.payment?.transactionId,
        paidAt: paymentDate ? getValidDate(paymentDate) : undefined
      },
      pricing: {
        baseAmount: actualRegistrationFee,
        gst: gst,
        workshopFees: workshopFees,
        accompanyingFees: accompanyingFees,
        accommodationFees: accommodationFees,
        totalAmount: actualRegistrationFee + gst + workshopFees + accompanyingFees + accommodationFees,
        discount: discount,
        finalAmount: totalAmount
      }
    };

    // Add accommodation if present
    if (user.registration?.accommodation?.required) {
      const acc = user.registration.accommodation;
      const perNight = acc.roomType === 'single' ? 10000 : 7500;
      invoiceData.accommodation = {
        roomType: acc.roomType || 'single',
        checkIn: acc.checkIn || '',
        checkOut: acc.checkOut || '',
        nights: acc.nights || 0,
        perNight,
        totalAmount: acc.totalAmount || 0
      };
    }

    return this.generatePDF(invoiceData);
  }
}