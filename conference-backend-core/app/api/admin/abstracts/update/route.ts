import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import { logAction } from '@/conference-backend-core/lib/audit/service'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { abstractId, updates } = body

    if (!abstractId) {
      return NextResponse.json({ success: false, message: 'Abstract ID is required' }, { status: 400 })
    }

    await connectDB()

    // Find the abstract
    const abstract = await Abstract.findById(abstractId)
    if (!abstract) {
      return NextResponse.json({ success: false, message: 'Abstract not found' }, { status: 404 })
    }

    // Store original values for audit
    const originalValues: Record<string, any> = {}
    const changedFields: string[] = []

    // Allowed fields to update
    const allowedFields = [
      'title',
      'authors',
      'submittingFor',
      'submissionCategory',
      'submissionTopic',
      'keywords',
      'status',
      'approvedFor',
      'initial.introduction',
      'initial.methods',
      'initial.results',
      'initial.conclusion',
      'initial.notes'
    ]

    // Apply updates
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        // Handle nested fields
        if (field.includes('.')) {
          const [parent, child] = field.split('.')
          const abstractAny = abstract as any
          if (!abstractAny[parent]) {
            abstractAny[parent] = {}
          }
          originalValues[field] = abstractAny[parent][child]
          abstractAny[parent][child] = updates[field]
          changedFields.push(field)
        } else {
          const abstractAny = abstract as any
          originalValues[field] = abstractAny[field]
          abstractAny[field] = updates[field]
          changedFields.push(field)
        }
      }
    }

    // Handle nested initial fields from flat structure
    if (updates.introduction !== undefined) {
      if (!abstract.initial) abstract.initial = {}
      originalValues['initial.introduction'] = abstract.initial.introduction
      abstract.initial.introduction = updates.introduction
      changedFields.push('introduction')
    }
    if (updates.methods !== undefined) {
      if (!abstract.initial) abstract.initial = {}
      originalValues['initial.methods'] = abstract.initial.methods
      abstract.initial.methods = updates.methods
      changedFields.push('methods')
    }
    if (updates.results !== undefined) {
      if (!abstract.initial) abstract.initial = {}
      originalValues['initial.results'] = abstract.initial.results
      abstract.initial.results = updates.results
      changedFields.push('results')
    }
    if (updates.conclusion !== undefined) {
      if (!abstract.initial) abstract.initial = {}
      originalValues['initial.conclusion'] = abstract.initial.conclusion
      abstract.initial.conclusion = updates.conclusion
      changedFields.push('conclusion')
    }
    if (updates.notes !== undefined) {
      if (!abstract.initial) abstract.initial = {}
      originalValues['initial.notes'] = abstract.initial.notes
      abstract.initial.notes = updates.notes
      changedFields.push('notes')
    }

    // Save the abstract
    await abstract.save()

    // Log the action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''

    await logAction({
      actor: {
        userId: (session.user as any).id,
        email: session.user.email || '',
        role: 'admin',
        name: session.user.name || ''
      },
      action: 'abstract.updated',
      resourceType: 'abstract',
      resourceId: abstract.abstractId,
      resourceName: abstract.title,
      metadata: { ip, userAgent },
      changes: {
        before: originalValues,
        after: updates
      },
      description: `Admin updated abstract "${abstract.title}" - Changed fields: ${changedFields.join(', ')}`
    })

    return NextResponse.json({
      success: true,
      data: abstract,
      message: 'Abstract updated successfully'
    })

  } catch (error) {
    console.error('Error updating abstract:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
