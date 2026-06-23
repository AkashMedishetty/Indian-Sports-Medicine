import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'

const TYPE = 'abstracts'
const KEY = 'reviewer_assignments'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
  }
  await connectDB()
  const cfg = await Configuration.findOne({ type: TYPE, key: KEY })
  return NextResponse.json({ success: true, data: cfg?.value || [] })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
  }
  const body = await request.json()
  await connectDB()
  const updated = await Configuration.findOneAndUpdate(
    { type: TYPE, key: KEY },
    { type: TYPE, key: KEY, value: body, isActive: true },
    { upsert: true, new: true }
  )
  return NextResponse.json({ success: true, data: updated.value })
}


