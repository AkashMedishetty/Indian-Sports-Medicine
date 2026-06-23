import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Get certificate configuration
    const config = await Configuration.findOne({ 
      type: 'certificate', 
      key: 'certificate_config' 
    })

    if (!config) {
      return NextResponse.json({
        success: false,
        message: 'Certificate configuration not found'
      }, { status: 404 })
    }

    // Sample data for preview
    const sampleData = {
      name: 'Dr. Sample Name',
      conference: conferenceConfig.shortName,
      startDate: new Date(conferenceConfig.eventDate.start).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }),
      endDate: new Date(conferenceConfig.eventDate.end).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }),
      location: `${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}`,
      registrationId: 'NV2026-PREVIEW'
    }

    // Generate HTML for certificate preview
    const html = generateCertificateHTML(config.value, sampleData)

    // Return HTML page
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    })

  } catch (error) {
    console.error('Certificate preview error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to generate preview'
    }, { status: 500 })
  }
}

function generateCertificateHTML(config: any, data: any): string {
  const orientation = config.template?.orientation || 'landscape'
  const width = orientation === 'landscape' ? '1000px' : '800px'
  const height = orientation === 'landscape' ? '700px' : '1000px'
  const bgImage = config.template?.backgroundImageUrl || ''
  const logoUrl = config.template?.logoUrl || ''
  const signatureUrl = config.template?.signatureUrl || ''

  let elementsHTML = ''
  
  if (config.elements && Array.isArray(config.elements)) {
    elementsHTML = config.elements.map((el: any) => {
      if (el.type === 'text' || el.type === 'variable') {
        let content = el.content || ''
        content = content
          .replace('{name}', data.name)
          .replace('{conference}', data.conference)
          .replace('{startDate}', data.startDate)
          .replace('{endDate}', data.endDate)
          .replace('{location}', data.location)
          .replace('{registrationId}', data.registrationId)

        return `
          <div style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${el.width}px;
            height: ${el.height}px;
            font-size: ${el.fontSize}px;
            font-family: ${el.fontFamily || 'Georgia'};
            color: ${el.color};
            font-weight: ${el.id === 'title' ? 'bold' : 'normal'};
            display: flex;
            align-items: center;
            justify-content: ${el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start'};
            text-align: ${el.align || 'center'};
            padding: 0 20px;
          ">
            ${content}
          </div>
        `
      } else if (el.type === 'image' && signatureUrl) {
        return `
          <img src="${signatureUrl}" style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${el.width}px;
            height: ${el.height}px;
            object-fit: contain;
          " />
        `
      }
      return ''
    }).join('')
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Certificate Preview</title>
      <style>
        body {
          margin: 0;
          padding: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #f3f4f6;
          font-family: Georgia, serif;
        }
        .certificate-container {
          position: relative;
          width: ${width};
          height: ${height};
          background: white;
          ${bgImage ? `background-image: url(${bgImage});` : ''}
          background-size: cover;
          background-position: center;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
          overflow: hidden;
        }
        .logo {
          position: absolute;
          top: 20px;
          left: 20px;
          width: 120px;
          height: 120px;
        }
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .watermark {
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 12px;
          color: #999;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="Logo" /></div>` : ''}
        ${elementsHTML}
        <div class="watermark">PREVIEW</div>
      </div>
    </body>
    </html>
  `
}
