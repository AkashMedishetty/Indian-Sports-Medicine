import puppeteer, { Browser, Page } from 'puppeteer-core'
import { conferenceConfig } from '../../config/conference.config'

/**
 * Certificate Generator with Browser Pooling
 * Optimized for bulk certificate generation (1000+ participants)
 */
export class CertificateGenerator {
  private static browser: Browser | null = null
  private static browserPromise: Promise<Browser> | null = null
  private static lastUsed: number = Date.now()
  private static readonly BROWSER_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  /**
   * Get or create a shared browser instance
   */
  private static async getBrowser(): Promise<Browser> {
    // If browser exists and is connected, return it
    if (this.browser && this.browser.isConnected()) {
      this.lastUsed = Date.now()
      return this.browser
    }

    // If a browser is currently being created, wait for it
    if (this.browserPromise) {
      return this.browserPromise
    }

    // Create a new browser
    this.browserPromise = this.launchBrowser()
    this.browser = await this.browserPromise
    this.browserPromise = null
    this.lastUsed = Date.now()

    // Auto-close browser after timeout to save resources
    this.scheduleBrowserCleanup()

    return this.browser
  }

  /**
   * Launch a new browser instance
   */
  private static async launchBrowser(): Promise<Browser> {
    const isVercel = process.env.VERCEL === '1'
    
    // Default viewport for certificate generation
    const viewport = {
      deviceScaleFactor: 1,
      hasTouch: false,
      height: 800,
      isLandscape: true,
      isMobile: false,
      width: 1200,
    }
    
    if (isVercel) {
      const chromium = require('@sparticuz/chromium')
      
      // Disable WebGL for better performance in serverless
      chromium.setGraphicsMode = false
      
      return await puppeteer.launch({
        args: chromium.args,
        defaultViewport: viewport,
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    }

    // Local development - try to find Chrome executable
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.CHROME_PATH,
      process.env.PUPPETEER_EXECUTABLE_PATH
    ].filter(Boolean)

    let executablePath = ''
    for (const path of possiblePaths) {
      try {
        const fs = require('fs')
        if (path && fs.existsSync(path)) {
          executablePath = path
          break
        }
      } catch (e) {
        // Continue to next path
      }
    }

    return await puppeteer.launch({
      headless: true,
      defaultViewport: viewport,
      executablePath: executablePath || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    })
  }

  /**
   * Schedule browser cleanup after timeout
   */
  private static scheduleBrowserCleanup() {
    setTimeout(async () => {
      const timeSinceLastUse = Date.now() - this.lastUsed
      if (timeSinceLastUse >= this.BROWSER_TIMEOUT && this.browser) {
        console.log('🧹 Closing idle certificate generator browser...')
        await this.browser.close()
        this.browser = null
      } else {
        // Reschedule if browser was used recently
        this.scheduleBrowserCleanup()
      }
    }, this.BROWSER_TIMEOUT)
  }

  /**
   * Generate a certificate PDF from configuration
   */
  static async generateCertificatePDF(data: {
    user: any
    certificateConfig: any
    registrationId: string
  }): Promise<Buffer> {
    const startTime = Date.now()
    console.log(`🎓 Generating certificate for ${data.registrationId}...`)

    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      // Calculate dimensions
      const actualWidth = data.certificateConfig.value.template?.width || 800
      const actualHeight = data.certificateConfig.value.template?.height || 600

      // Set viewport
      await page.setViewport({
        width: actualWidth,
        height: actualHeight
      })

      // Generate certificate HTML
      const certificateHTML = this.generateCertificateHTML(data.user, data.certificateConfig)

      // Load content and wait for images
      await page.setContent(certificateHTML, {
        waitUntil: 'load',
        timeout: 15000
      })
      
      // Wait for all images to load
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
              img.onload = img.onerror = resolve
            }))
        )
      })
      
      // Verify background image loaded
      const bgImageLoaded = await page.evaluate(() => {
        const bgImg = document.querySelector('.background-image') as HTMLImageElement
        if (bgImg) {
          console.log('Background image found:', bgImg.src, 'Complete:', bgImg.complete, 'Size:', bgImg.naturalWidth, 'x', bgImg.naturalHeight)
          return bgImg.complete && bgImg.naturalWidth > 0
        }
        return false
      })
      console.log('🖼️ Background image loaded:', bgImageLoaded)
      
      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate PDF (Buffer.from: newer puppeteer returns Uint8Array)
      const pdfBuffer = Buffer.from(await page.pdf({
        width: `${actualWidth}px`,
        height: `${actualHeight}px`,
        printBackground: true,
        preferCSSPageSize: true,
        timeout: 10000
      }))

      const duration = Date.now() - startTime
      console.log(`✅ Certificate generated for ${data.registrationId} in ${duration}ms (${pdfBuffer.length} bytes)`)

      return pdfBuffer
    } finally {
      // Always close the page to free memory
      await page.close()
    }
  }

  /**
   * Generate HTML for certificate
   */
  private static generateCertificateHTML(user: any, certificateConfig: any): string {
    const actualWidth = certificateConfig.value.template?.width || 800
    const actualHeight = certificateConfig.value.template?.height || 600
    let backgroundUrl = certificateConfig.value.template?.backgroundImageUrl || ''
    
    // Convert relative URLs to base64 data URLs for production compatibility
    if (backgroundUrl && backgroundUrl.startsWith('/')) {
      try {
        const fs = require('fs')
        const path = require('path')
        // Try parent public folder first (development)
        let imagePath = path.join(process.cwd(), '..', 'public', backgroundUrl.substring(1))
        
        // If not found, try current public folder (production)
        if (!fs.existsSync(imagePath)) {
          imagePath = path.join(process.cwd(), 'public', backgroundUrl.substring(1))
        }
        
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath)
          const ext = path.extname(backgroundUrl).substring(1).toLowerCase()
          const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
          backgroundUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`
          console.log('✅ Certificate background image loaded from disk and converted to base64')
        } else {
          console.warn('⚠️ Certificate background image not found at:', imagePath)
        }
      } catch (err) {
        console.error('❌ Failed to load certificate background image:', err)
      }
    }
    
    console.log('🖼️ Certificate background URL:', backgroundUrl ? 'SET (base64)' : 'NOT SET')

    // Build elements HTML
    const elementsHTML = (certificateConfig.value.elements || []).map((el: any) => {
      let content = el.content || ''
      
      // Replace placeholders
      content = content
        .replace(/{name}/g, `${user.profile?.title || ''} ${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim())
        .replace(/{registrationId}/g, user.registration?.registrationId || '')
        .replace(/{institution}/g, user.profile?.institution || '')
        .replace(/{designation}/g, user.profile?.designation || '')
        .replace(/{conference}/g, conferenceConfig.name)
        .replace(/{startDate}/g, conferenceConfig.eventDate.start)
        .replace(/{endDate}/g, conferenceConfig.eventDate.end)
        .replace(/{location}/g, `${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}`)
      
      // Check if it's an image
      if (el.type === 'image' || content.startsWith('http') || content.startsWith('data:')) {
        return `
          <div class="certificate-element" style="
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${el.width}px;
            height: ${el.height}px;
            text-align: ${el.align || 'center'};
            justify-content: ${el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start'};
          ">
            <img src="${content}" style="max-width: 100%; max-height: 100%; object-fit: contain;" crossorigin="anonymous" />
          </div>
        `
      }
      
      // Regular text element
      return `
        <div class="certificate-element" style="
          left: ${el.x}px;
          top: ${el.y}px;
          width: ${el.width}px;
          height: ${el.height}px;
          font-size: ${el.fontSize || 16}px;
          font-family: ${el.fontFamily || 'Georgia'};
          color: ${el.color || '#000'};
          text-align: ${el.align || 'center'};
          justify-content: ${el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start'};
        ">${content}</div>
      `
    }).join('')
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Georgia, serif; margin: 0; }
          .certificate-container {
            width: ${actualWidth}px;
            height: ${actualHeight}px;
            position: relative;
            overflow: hidden;
          }
          .background-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 0;
          }
          .certificate-element {
            position: absolute;
            display: flex;
            align-items: center;
            overflow: hidden;
            z-index: 1;
          }
          img {
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          ${backgroundUrl ? `<img src="${backgroundUrl}" class="background-image" crossorigin="anonymous" alt="Certificate Background" />` : ''}
          ${elementsHTML}
        </div>
      </body>
      </html>
    `
  }

  /**
   * Manually close the browser (for cleanup or testing)
   */
  static async closeBrowser() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.browserPromise = null
      console.log('🔒 Certificate generator browser closed')
    }
  }
}
