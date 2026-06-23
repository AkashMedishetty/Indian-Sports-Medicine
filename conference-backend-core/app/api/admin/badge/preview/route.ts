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

    // Get badge configuration
    const config = await Configuration.findOne({ 
      type: 'badge', 
      key: 'badge_config' 
    })

    if (!config) {
      return NextResponse.json({
        success: false,
        message: 'Badge configuration not found'
      }, { status: 404 })
    }

    // Sample data for preview
    const sampleData = {
      name: 'Dr. Sample Name',
      registrationId: 'NV2026-PREVIEW',
      institution: 'Sample Hospital',
      category: 'CVSI Member',
      city: conferenceConfig.venue.city,
      country: conferenceConfig.venue.country
    }

    // Generate HTML for badge preview
    const html = generateBadgeHTML(config.value, sampleData)

    // Return HTML page
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    })

  } catch (error) {
    console.error('Badge preview error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to generate preview'
    }, { status: 500 })
  }
}

function generateBadgeHTML(config: any, data: any): string {
  const layout = config.template?.layout || 'portrait'
  const width = layout === 'portrait' ? '300px' : '400px'
  const height = layout === 'portrait' ? '400px' : '300px'
  const bgColor = config.template?.backgroundColor || '#ffffff'
  const bgImage = config.template?.logoUrl || ''

  let elementsHTML = ''
  
  if (config.elements && Array.isArray(config.elements)) {
    elementsHTML = config.elements.map((el: any) => {
      if (el.type === 'text') {
        let content = el.content || ''
        content = content
          .replace('{name}', data.name)
          .replace('{registrationId}', data.registrationId)
          .replace('{institution}', data.institution)
          .replace('{category}', data.category)
          .replace('{city}', data.city)
          .replace('{country}', data.country)

        return `
          <div style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${el.width}px;
            height: ${el.height}px;
            font-size: ${el.fontSize}px;
            font-family: ${el.fontFamily};
            color: ${el.color};
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          ">
            ${content}
          </div>
        `
      } else if (el.type === 'qr') {
        return `
          <div style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${el.width}px;
            height: ${el.height}px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #e5e7eb;
          ">
            <div style="width: 90%; height: 90%; background: 
              repeating-linear-gradient(0deg, #000, #000 10px, transparent 10px, transparent 20px),
              repeating-linear-gradient(90deg, #000, #000 10px, transparent 10px, transparent 20px);
            "></div>
          </div>
        `
      }
      return ''
    }).join('')
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Badge Preview</title>
      <style>
        body {
          margin: 0;
          padding: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #f3f4f6;
          font-family: Arial, sans-serif;
        }
        .badge-container {
          position: relative;
          width: ${width};
          height: ${height};
          background-color: ${bgColor};
          ${bgImage ? `background-image: url(${bgImage});` : ''}
          background-size: cover;
          background-position: center;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
          overflow: hidden;
        }
        .watermark {
          position: absolute;
          bottom: 10px;
          right: 10px;
          font-size: 10px;
          color: #999;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="badge-container">
        ${elementsHTML}
        <div class="watermark">PREVIEW</div>
      </div>
    </body>
    </html>
  `
}
