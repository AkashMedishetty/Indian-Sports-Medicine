import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const { abstractId, status } = await request.json()

    if (!abstractId || !status) {
      return NextResponse.json({ success: false, message: 'Abstract ID and status are required' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['submitted', 'under-review', 'accepted', 'rejected', 'final-submitted']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 })
    }

    await connectDB()

    // Check if user is admin
    const user = await User.findById(userId)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    // Update abstract status
    const abstract = await Abstract.findByIdAndUpdate(
      abstractId,
      { 
        status,
        decisionAt: status === 'accepted' || status === 'rejected' ? new Date() : undefined
      },
      { new: true }
    )

    if (!abstract) {
      return NextResponse.json({ success: false, message: 'Abstract not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      data: abstract,
      message: `Abstract status updated to ${status}` 
    })

  } catch (error) {
    console.error('Error updating abstract status:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
