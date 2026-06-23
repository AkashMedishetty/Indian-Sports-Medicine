import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'
import { logAction } from '@/conference-backend-core/lib/audit/service'
import { generateAbstractId } from '@/lib/utils/generateId'

interface CSVRow {
  userEmail: string
  title: string
  authors: string
  submittingFor?: string
  submissionCategory?: string
  submissionTopic?: string
  introduction?: string
  methods?: string
  results?: string
  conclusion?: string
  keywords?: string
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim().replace(/^"|"$/g, '') || ''
    })
    
    if (row.userEmail && row.title) {
      rows.push(row as CSVRow)
    }
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const adminUserId = (session.user as any).id
    const userRole = (session.user as any).role

    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, message: 'CSV file is required' }, { status: 400 })
    }

    // Read file content
    const content = await file.text()
    const rows = parseCSV(content)

    if (rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No valid data found in CSV. Ensure headers include: userEmail, title, authors' 
      }, { status: 400 })
    }

    await connectDB()

    let createdCount = 0
    const errors: string[] = []
    const created: string[] = []

    for (const row of rows) {
      try {
        // Find user by email
        const user = await User.findOne({ email: row.userEmail.toLowerCase() })
        
        if (!user) {
          errors.push(`Row ${rows.indexOf(row) + 2}: User not found with email ${row.userEmail}`)
          continue
        }

        // Generate unique abstract ID using the same format as normal submissions
        const abstractId = await generateAbstractId()

        // Parse authors (comma or semicolon separated)
        const authors = row.authors.split(/[,;]/).map(a => a.trim()).filter(Boolean)

        // Calculate word count
        const contentText = `${row.introduction || ''} ${row.methods || ''} ${row.results || ''} ${row.conclusion || ''}`
        const wordCount = contentText.trim().split(/\s+/).filter(Boolean).length

        // Create abstract
        await Abstract.create({
          abstractId,
          userId: user._id,
          title: row.title,
          authors,
          submittingFor: row.submittingFor || 'neurosurgery',
          submissionCategory: row.submissionCategory || 'free-paper',
          submissionTopic: row.submissionTopic || '',
          track: row.submittingFor || 'neurosurgery',
          category: row.submissionCategory || 'free-paper',
          content: {
            introduction: row.introduction || '',
            methods: row.methods || '',
            results: row.results || '',
            conclusion: row.conclusion || ''
          },
          keywords: row.keywords ? row.keywords.split(/[,;]/).map(k => k.trim()) : [],
          wordCount,
          status: 'submitted',
          submittedAt: new Date(),
          submittedOnBehalf: true,
          submittedByAdmin: adminUserId,
          initial: {
            notes: `Bulk uploaded by admin: ${session.user.email}`
          }
        })

        createdCount++
        created.push(abstractId)
      } catch (rowError) {
        console.error(`Error processing row:`, rowError)
        errors.push(`Row ${rows.indexOf(row) + 2}: ${(rowError as Error).message}`)
      }
    }

    // Log the action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    
    await logAction({
      actor: {
        userId: adminUserId,
        email: session.user.email || '',
        role: userRole,
        name: session.user.name || ''
      },
      action: 'abstracts.bulk_upload',
      resourceType: 'abstract',
      resourceId: 'bulk',
      resourceName: `${rows.length} abstracts`,
      metadata: { ip, userAgent },
      changes: {
        before: { totalRows: rows.length },
        after: { createdCount, created, errors }
      },
      description: `Admin bulk uploaded ${createdCount} abstracts from CSV`
    })

    return NextResponse.json({ 
      success: true, 
      createdCount,
      totalRows: rows.length,
      created,
      errors: errors.length > 0 ? errors : undefined,
      message: `${createdCount} of ${rows.length} abstracts created successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    })

  } catch (error) {
    console.error('Error bulk uploading abstracts:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// GET - Download CSV template
export async function GET() {
  const template = `userEmail,title,authors,submittingFor,submissionCategory,submissionTopic,introduction,methods,results,conclusion,keywords
user@example.com,"Sample Abstract Title","Author One; Author Two",neurosurgery,free-paper,"Brain Tumors","Introduction text here","Methods text here","Results text here","Conclusion text here","keyword1, keyword2, keyword3"
`

  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="abstracts-upload-template.csv"'
    }
  })
}
