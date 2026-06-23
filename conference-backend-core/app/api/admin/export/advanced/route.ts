import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Payment from '@/lib/models/Payment'
import Abstract from '@/lib/models/Abstract'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get('dataType') || 'registrations'
    const status = searchParams.get('status') || 'all'
    const category = searchParams.get('category') || 'all'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const format = searchParams.get('format') || 'csv'

    let data: any[] = []

    if (dataType === 'registrations') {
      let query: any = { role: 'user' }
      
      if (status !== 'all') query['registration.status'] = status
      if (category !== 'all') query['registration.type'] = category
      if (dateFrom || dateTo) {
        query['registration.registrationDate'] = {}
        if (dateFrom) query['registration.registrationDate'].$gte = new Date(dateFrom)
        if (dateTo) query['registration.registrationDate'].$lte = new Date(dateTo)
      }

      data = await User.find(query).lean()
    }

    // Generate CSV content
    const csv = generateCSV(data, dataType)
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${dataType}-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Advanced export error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to export data'
    }, { status: 500 })
  }
}

function generateCSV(data: any[], type: string): string {
  if (!data || data.length === 0) {
    return 'No data available'
  }

  // COMPLETE CSV headers matching old export (24 fields)
  const headers = [
    'Registration ID',
    'Name',
    'Email',
    'Phone',
    'Institution',
    'MCI Number',
    'Designation',
    'Age',
    'Registration Type',
    'Status',
    'Tier',
    'Payment Method',
    'Payment Status',
    'Payment Amount',
    'UTR Number',
    'Transaction ID',
    'Payment Date',
    'Verified By',
    'Verification Date',
    'Payment Remarks',
    'Workshop Selections',
    'Accompanying Persons Count',
    'Accompanying Names',
    'Registration Date',
    'Street',
    'City',
    'State',
    'Pincode',
    'Country',
    'Dietary Requirements',
    'Special Needs',
    'Membership Number',
    'Payment Type',
    'Sponsor Name',
    'Sponsor Category'
  ]
  
  const rows = data.map(item => [
    item.registration?.registrationId || '',
    `${item.profile?.title || ''} ${item.profile?.firstName || ''} ${item.profile?.lastName || ''}`.trim(),
    item.email || '',
    item.profile?.phone || '',
    item.profile?.institution || '',
    item.profile?.mciNumber || '',
    item.profile?.designation || '',
    item.profile?.age || '',
    item.registration?.type || '',
    item.registration?.status || '',
    item.registration?.tier || '',
    item.payment?.method || 'Not specified',
    item.payment?.status || 'No payment info',
    item.payment?.amount || 0,
    item.payment?.bankTransferUTR || '',
    item.payment?.transactionId || '',
    item.payment?.paymentDate ? new Date(item.payment.paymentDate).toLocaleDateString() : '',
    item.payment?.verifiedBy || '',
    item.payment?.verificationDate ? new Date(item.payment.verificationDate).toLocaleDateString() : '',
    item.payment?.remarks || '',
    item.registration?.workshopSelections?.join('; ') || '',
    item.registration?.accompanyingPersons?.length || 0,
    (item.registration?.accompanyingPersons || []).map((p: any) => `${p.name} (${p.relationship || ''})`).join('; '),
    item.registration?.registrationDate ? new Date(item.registration.registrationDate).toLocaleDateString() : '',
    item.profile?.address?.street || '',
    item.profile?.address?.city || '',
    item.profile?.address?.state || '',
    item.profile?.address?.pincode || '',
    item.profile?.address?.country || '',
    item.profile?.dietaryRequirements || '',
    item.profile?.specialNeeds || '',
    item.registration?.membershipNumber || '',
    item.registration?.paymentType || '',
    item.registration?.sponsorName || '',
    item.registration?.sponsorCategory || ''
  ])

  // Escape CSV fields properly
  const escapeCsvField = (field: any): string => {
    const str = String(field)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  return [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsvField).join(','))
  ].join('\n')
}
