import puppeteer, { Browser, Page } from 'puppeteer-core'

/**
 * Badge Generator with Browser Pooling
 * Optimized for bulk badge generation (1000+ participants)
 */
export class BadgeGenerator {
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
    
    // Default viewport for badge generation
    const viewport = {
      deviceScaleFactor: 2,
      hasTouch: false,
      height: 600,
      isLandscape: false,
      isMobile: false,
      width: 400,
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
        console.log('🧹 Closing idle badge generator browser...')
        await this.browser.close()
        this.browser = null
      } else {
        // Reschedule if browser was used recently
        this.scheduleBrowserCleanup()
      }
    }, this.BROWSER_TIMEOUT)
  }

  /**
   * Generate a badge PDF from configuration
   */
  static async generateBadgePDF(data: {
    user: any
    badgeConfig: any
    registrationId: string
  }): Promise<Buffer> {
    const startTime = Date.now()
    console.log(`🎫 Generating badge for ${data.registrationId}...`)

    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      // Set viewport
      await page.setViewport({
        width: data.badgeConfig.value.template?.width || 400,
        height: data.badgeConfig.value.template?.height || 600
      })

      // Generate QR code if needed
      let qrCodeDataURL: string | undefined
      if (this.needsQRCode(data.badgeConfig)) {
        try {
          const { QRCodeGenerator } = await import('@/lib/utils/qrcode-generator')
          qrCodeDataURL = await QRCodeGenerator.generateRegistrationQR({
            registrationId: data.user.registration?.registrationId || data.registrationId,
            name: `${data.user.profile?.title || ''} ${data.user.profile?.firstName || ''} ${data.user.profile?.lastName || ''}`.trim(),
            email: data.user.email,
            type: data.user.registration?.type || 'general'
          })
          console.log('✅ QR code generated for badge')
        } catch (qrError) {
          console.error('❌ Failed to generate QR code:', qrError)
        }
      }

      // Generate badge HTML
      const badgeHTML = this.generateBadgeHTML(data.user, data.badgeConfig, qrCodeDataURL)

      // Load content and wait for images (including background and QR codes)
      await page.setContent(badgeHTML, {
        waitUntil: 'load', // Wait for all resources including images
        timeout: 15000 // 15 second timeout for images to load
      })
      
      // Wait for all images to load (especially background and QR codes)
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
      await new Promise(r => setTimeout(r, 1000))

      // Generate PDF
      const pdfBuffer = Buffer.from(await page.pdf({
        width: `${data.badgeConfig.value.template?.width || 400}px`,
        height: `${data.badgeConfig.value.template?.height || 600}px`,
        printBackground: true,
        timeout: 10000
      }))

      const duration = Date.now() - startTime
      console.log(`✅ Badge generated for ${data.registrationId} in ${duration}ms (${pdfBuffer.length} bytes)`)

      return pdfBuffer
    } finally {
      // Always close the page to free memory
      await page.close()
    }
  }

  /**
   * Check if badge configuration needs a QR code
   */
  private static needsQRCode(badgeConfig: any): boolean {
    const elements = badgeConfig.value?.elements || []
    return elements.some((el: any) => 
      el.type === 'qr' || 
      el.content?.includes('{qr}') ||
      el.content?.includes('{qrcode}')
    )
  }

  /**
   * Generate HTML for badge
   */
  private static generateBadgeHTML(user: any, badgeConfig: any, qrCodeDataURL?: string): string {
    // Use logoUrl which is the actual field name used in the badge configuration
    let backgroundUrl = badgeConfig.value.template?.logoUrl || badgeConfig.value.template?.backgroundImageUrl || ''
    
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
          console.log('✅ Background image loaded from disk and converted to base64')
        } else {
          console.warn('⚠️ Background image not found at:', imagePath)
        }
      } catch (err) {
        console.error('❌ Failed to load background image:', err)
      }
    }
    
    console.log('🖼️ Badge background URL:', backgroundUrl ? 'SET (base64)' : 'NOT SET')
    
    // Build elements HTML with proper image handling
    const elementsHTML = (badgeConfig.value.elements || []).map((el: any) => {
      let content = el.content || ''
      
      // Replace text placeholders
      content = content
        .replace(/{name}/g, `${user.profile?.title || ''} ${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim())
        .replace(/{registrationId}/g, user.registration?.registrationId || '')
        .replace(/{institution}/g, user.profile?.institution || '')
        .replace(/{designation}/g, user.profile?.designation || '')
        .replace(/{category}/g, user.registration?.category || '')
      
      // Replace QR code placeholders with actual QR code
      if (qrCodeDataURL && (el.type === 'qr' || content.includes('{qr}') || content.includes('{qrcode}'))) {
        content = qrCodeDataURL
      }
      
      // If element is an image/QR code type
      if (el.type === 'image' || el.type === 'qr' || content.startsWith('http') || content.startsWith('data:')) {
        return `
          <div class="badge-element" style="
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
        <div class="badge-element" style="
          left: ${el.x}px;
          top: ${el.y}px;
          width: ${el.width}px;
          height: ${el.height}px;
          font-size: ${el.fontSize || 16}px;
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
          body { font-family: Arial, sans-serif; margin: 0; }
          .badge-container {
            width: ${badgeConfig.value.template?.width || 400}px;
            height: ${badgeConfig.value.template?.height || 600}px;
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
          .badge-element {
            position: absolute;
            display: flex;
            align-items: center;
            font-weight: bold;
            overflow: hidden;
            z-index: 1;
          }
          img {
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="badge-container">
          ${backgroundUrl ? `<img src="${backgroundUrl}" class="background-image" crossorigin="anonymous" alt="Badge Background" />` : ''}
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
      console.log('🔒 Badge generator browser closed')
    }
  }
}
