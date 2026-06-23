import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import Configuration from "@/lib/models/Configuration"
import { BadgeGenerator } from "@/lib/pdf/badge-generator"

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

    // Get badge configuration from database
    let badgeConfig = await Configuration.findOne({ 
      type: 'badge', 
      key: 'badge_config' 
    })
    
    // Use default config if not found
    if (!badgeConfig) {
      badgeConfig = {
        value: {
          template: { width: 400, height: 600 },
          elements: [
            { type: 'text', content: '{name}', x: 200, y: 300, width: 350, height: 40, fontSize: 24, align: 'center', color: '#000' },
            { type: 'text', content: '{institution}', x: 200, y: 350, width: 350, height: 30, fontSize: 16, align: 'center', color: '#666' },
            { type: 'text', content: '{registrationId}', x: 200, y: 400, width: 350, height: 25, fontSize: 14, align: 'center', color: '#999' }
          ]
        }
      }
    }

    const pdfBuffer = await BadgeGenerator.generateBadgePDF({
      user: user.toObject(),
      badgeConfig,
      registrationId: user.registration?.registrationId || id
    })

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="badge-${user.registration?.registrationId || id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error("Generate badge error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to generate badge" },
      { status: 500 }
    )
  }
}
