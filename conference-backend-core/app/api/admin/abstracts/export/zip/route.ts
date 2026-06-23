import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large exports

export async function GET(_request: NextRequest) {
  try {
    console.log('START: ZIP Export process initiated')
    
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      console.log('ERROR: Unauthorized access attempt')
      return new Response(JSON.stringify({ success: false, message: 'Admin access required' }), { status: 403 })
    }

    console.log('AUTH: Admin authenticated successfully')
    
    await connectDB()
    const abstracts = await Abstract.find({}).lean()
    console.log(`DB: Found ${abstracts.length} abstracts`)

    // Use JSZip instead of archiver for better serverless compatibility
    const JSZip = (await import('jszip')).default
    const { default: ExcelJS } = await import('exceljs')
    
    const zip = new JSZip()

    // Build Excel workbook
    console.log('EXCEL: Building workbook')
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Abstracts')
    sheet.columns = [
      { header: 'Abstract ID', key: 'abstractId', width: 16 },
      { header: 'User ID', key: 'userId', width: 24 },
      { header: 'Registration ID', key: 'registrationId', width: 16 },
      { header: 'Track', key: 'track', width: 20 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Subcategory', key: 'subcategory', width: 20 },
      { header: 'Title', key: 'title', width: 60 },
      { header: 'Authors', key: 'authors', width: 40 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Initial File', key: 'initialFile', width: 40 },
      { header: 'Final File', key: 'finalFile', width: 40 },
    ]
    
    for (const a of abstracts) {
      sheet.addRow({
        abstractId: a.abstractId,
        userId: String(a.userId),
        registrationId: a.registrationId,
        track: a.track,
        category: a.category || '',
        subcategory: a.subcategory || '',
        title: a.title,
        authors: (a.authors || []).join('; '),
        status: a.status,
        initialFile: a.initial?.file?.originalName || '',
        finalFile: a.final?.file?.originalName || ''
      })
    }
    
    const excelBufferRaw = await workbook.xlsx.writeBuffer()
    const excelBuffer = Buffer.isBuffer(excelBufferRaw) ? excelBufferRaw : Buffer.from(excelBufferRaw as ArrayBuffer)
    console.log(`EXCEL: Created workbook (${excelBuffer.length} bytes)`)
    
    // Add Excel to ZIP
    zip.file('abstracts.xlsx', excelBuffer)
    console.log('ZIP: Added Excel file')

    // Process files
    console.log(`FILES: Processing ${abstracts.length} abstracts`)
    let filesAdded = 0
    let filesFailed = 0
    let filesSkipped = 0
    
    for (let i = 0; i < abstracts.length; i++) {
      const a = abstracts[i]
      const abstractId = a.abstractId
      
      console.log(`[${i + 1}/${abstracts.length}] Processing ${abstractId}`)
      
      // Process initial file
      const initialBlobUrl = a.initial?.file?.blobUrl || a.initial?.file?.storagePath
      if (initialBlobUrl && initialBlobUrl.startsWith('https://')) {
        try {
          console.log(`  Fetching initial: ${initialBlobUrl.substring(0, 50)}...`)
          const response = await fetch(initialBlobUrl)
          if (response.ok) {
            const buffer = await response.arrayBuffer()
            const fileName = a.initial?.file?.originalName || `${abstractId}_initial.pdf`
            zip.file(`abstracts/${abstractId}/initial/${fileName}`, buffer)
            filesAdded++
            console.log(`  ✓ Added initial (${buffer.byteLength} bytes)`)
          } else {
            filesFailed++
            console.log(`  ✗ Initial fetch failed: ${response.status}`)
          }
        } catch (error) {
          filesFailed++
          console.log(`  ✗ Initial error:`, error)
        }
      } else {
        filesSkipped++
        console.log(`  - No initial file`)
      }
      
      // Process final file
      const finalBlobUrl = a.final?.file?.blobUrl || a.final?.file?.storagePath
      if (finalBlobUrl && finalBlobUrl.startsWith('https://')) {
        try {
          console.log(`  Fetching final: ${finalBlobUrl.substring(0, 50)}...`)
          const response = await fetch(finalBlobUrl)
          if (response.ok) {
            const buffer = await response.arrayBuffer()
            const fileName = a.final?.file?.originalName || `${abstractId}_final.pptx`
            zip.file(`abstracts/${abstractId}/final/${fileName}`, buffer)
            filesAdded++
            console.log(`  ✓ Added final (${buffer.byteLength} bytes)`)
          } else {
            filesFailed++
            console.log(`  ✗ Final fetch failed: ${response.status}`)
          }
        } catch (error) {
          filesFailed++
          console.log(`  ✗ Final error:`, error)
        }
      } else {
        filesSkipped++
        console.log(`  - No final file`)
      }
    }

    console.log(`SUMMARY: Added=${filesAdded}, Failed=${filesFailed}, Skipped=${filesSkipped}`)
    console.log('ZIP: Generating final archive...')
    
    // Generate ZIP
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    })
    
    console.log(`COMPLETE: ZIP generated (${zipBuffer.length} bytes)`)

    // Convert Buffer to Uint8Array for Response compatibility
    const uint8Array = new Uint8Array(zipBuffer)

    return new Response(uint8Array, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="abstracts_export.zip"',
        'Content-Length': zipBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('FATAL ERROR:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Export failed', 
      error: (error as Error).message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
