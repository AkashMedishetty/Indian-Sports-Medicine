import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'

// POST: Mark final submission (expects abstractId in JSON; file upload handled separately)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { abstractId } = await request.json()
    if (!abstractId) {
      return NextResponse.json({ success: false, message: 'abstractId is required' }, { status: 400 })
    }

    await connectDB()
    const userId = (session.user as any).id
    const doc = await Abstract.findOne({ abstractId, userId })
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Abstract not found' }, { status: 404 })
    }

    if (doc.status !== 'accepted') {
      return NextResponse.json({ success: false, message: 'Final submission allowed only after acceptance' }, { status: 400 })
    }

    doc.final = {
      ...(doc.final || {}),
      submittedAt: new Date(),
      displayId: `${doc.abstractId}-F`
    }
    doc.status = 'final-submitted'
    await doc.save()

    return NextResponse.json({ success: true, data: doc })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}


