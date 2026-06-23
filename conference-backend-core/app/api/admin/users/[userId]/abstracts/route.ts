import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import { Types } from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    const query = { userId: new Types.ObjectId(userId) }

    const [abstractDocs, total] = await Promise.all([
      Abstract.find(query)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Abstract.countDocuments(query)
    ])

    // Transform for frontend
    const abstracts = abstractDocs.map((abstract: any) => ({
      abstractId: abstract.abstractId || abstract._id.toString(),
      title: abstract.title,
      track: abstract.track || abstract.category || 'General',
      status: abstract.status,
      submittedAt: abstract.submittedAt || abstract.createdAt,
      decision: abstract.decision,
      reviewScore: abstract.averageScore || abstract.reviewScore
    }))

    return NextResponse.json({
      success: true,
      abstracts,
      total
    })
  } catch (error) {
    console.error('Error fetching user abstracts:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch abstracts'
    }, { status: 500 })
  }
}
