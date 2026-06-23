import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import Configuration from "@/lib/models/Configuration"
import { CertificateGenerator } from "@/lib/pdf/certificate-generator"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const userRole = (session.user as any)?.role
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    await connectDB()

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    // Get certificate configuration from database
    let certificateConfig = await Configuration.findOne({ 
      type: 'certificate', 
      key: 'certificate_config' 
    })
    
    // Use default config if not found
    if (!certificateConfig) {
      certificateConfig = {
        value: {
          template: { width: 1200, height: 800 },
          elements: [
            { type: 'text', content: 'Certificate of Participation', x: 600, y: 150, width: 1000, height: 60, fontSize: 48, align: 'center', color: '#1a365d', fontFamily: 'Georgia' },
            { type: 'text', content: 'This is to certify that', x: 600, y: 280, width: 800, height: 30, fontSize: 20, align: 'center', color: '#4a5568' },
            { type: 'text', content: '{name}', x: 600, y: 350, width: 1000, height: 50, fontSize: 36, align: 'center', color: '#2d3748', fontFamily: 'Georgia' },
            { type: 'text', content: 'has participated in', x: 600, y: 430, width: 800, height: 30, fontSize: 20, align: 'center', color: '#4a5568' },
            { type: 'text', content: '{conference}', x: 600, y: 490, width: 1000, height: 40, fontSize: 28, align: 'center', color: '#2b6cb0', fontFamily: 'Georgia' },
            { type: 'text', content: '{startDate} - {endDate}', x: 600, y: 550, width: 800, height: 30, fontSize: 18, align: 'center', color: '#718096' },
            { type: 'text', content: '{location}', x: 600, y: 590, width: 800, height: 30, fontSize: 18, align: 'center', color: '#718096' }
          ]
        }
      }
    }

    const pdfBuffer = await CertificateGenerator.generateCertificatePDF({
      user: user.toObject(),
      certificateConfig,
      registrationId: user.registration?.registrationId || id
    })

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${user.registration?.registrationId || id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error("Generate certificate error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to generate certificate" },
      { status: 500 }
    )
  }
}
