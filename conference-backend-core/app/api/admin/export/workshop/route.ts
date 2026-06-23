import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Workshop from '@/lib/models/Workshop'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userRole = (session.user as any)?.role
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const workshopId = searchParams.get('workshop')
    const format = searchParams.get('format') || 'csv'

    if (!workshopId || workshopId === 'all') {
      return NextResponse.json(
        { success: false, message: 'Workshop ID is required' },
        { status: 400 }
      )
    }

    let users
    if (workshopId === 'no-workshop') {
      // Get users with no workshop selections
      users = await User.find({
        role: 'user',
        $or: [
          { 'registration.workshopSelections': { $exists: false } },
          { 'registration.workshopSelections': { $size: 0 } }
        ]
      }).select('profile registration email').lean()
    } else {
      // Get users registered for specific workshop
      users = await User.find({
        role: 'user',
        'registration.workshopSelections': workshopId
      }).select('profile registration email').lean()
    }

    // Get workshop details for the header
    let workshopName = 'No Workshop Selected'
    if (workshopId !== 'no-workshop') {
      const workshop = await Workshop.findOne({ id: workshopId }).lean()
      workshopName = (workshop as any)?.name || workshopId
    }

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Registration ID',
        'Name',
        'Email',
        'Phone',
        'Institution',
        'City',
        'State',
        'Country',
        'Registration Type',
        'Status',
        'Membership Number',
        'Workshop Selections',
        'Accompanying Persons',
        'Registration Date',
        'Payment Type',
        'Sponsor Name',
        'Dietary Requirements',
        'Special Needs'
      ]

      const csvRows = users.map(user => {
        const profile = user.profile || {}
        const registration = user.registration || {}
        const address = profile.address || {}
        
        return [
          registration.registrationId || '',
          `${profile.title || ''} ${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
          user.email || '',
          profile.phone || '',
          profile.institution || '',
          address.city || '',
          address.state || '',
          address.country || '',
          registration.type || '',
          registration.status || '',
          registration.membershipNumber || '',
          (registration.workshopSelections || []).join('; '),
          (registration.accompanyingPersons || []).map((p: any) => p.name).join('; '),
          registration.registrationDate ? new Date(registration.registrationDate).toLocaleDateString() : '',
          registration.paymentType || 'regular',
          registration.sponsorName || '',
          profile.dietaryRequirements || '',
          profile.specialNeeds || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`)
      })

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n')

      const filename = `${workshopName.replace(/[^a-zA-Z0-9]/g, '_')}_registrations_${new Date().toISOString().split('T')[0]}.csv`

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    } else {
      // Return JSON data
      return NextResponse.json({
        success: true,
        data: {
          workshopName,
          workshopId,
          totalRegistrations: users.length,
          registrations: users.map(user => ({
            registrationId: user.registration?.registrationId,
            name: `${user.profile?.title || ''} ${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
            email: user.email,
            phone: user.profile?.phone,
            institution: user.profile?.institution,
            address: user.profile?.address,
            registrationType: user.registration?.type,
            status: user.registration?.status,
            membershipNumber: user.registration?.membershipNumber,
            workshopSelections: user.registration?.workshopSelections || [],
            accompanyingPersons: user.registration?.accompanyingPersons || [],
            registrationDate: user.registration?.registrationDate,
            paymentType: user.registration?.paymentType || 'regular',
            sponsorName: user.registration?.sponsorName,
            dietaryRequirements: user.profile?.dietaryRequirements,
            specialNeeds: user.profile?.specialNeeds
          }))
        }
      })
    }
  } catch (error) {
    console.error('Workshop export error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}