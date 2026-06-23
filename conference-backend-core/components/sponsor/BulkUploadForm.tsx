"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/conference-backend-core/components/ui/card'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/conference-backend-core/components/ui/table'
import { Progress } from '@/conference-backend-core/components/ui/progress'
import { ScrollArea } from '@/conference-backend-core/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/conference-backend-core/components/ui/tabs'
import { SponsorLayout } from './SponsorLayout'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { 
  Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, 
  ArrowLeft, Loader2, Eye, Trash2, Users, Info, FileText, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface CSVRow {
  title?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  age?: string
  designation?: string
  institution: string
  mciNumber?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  dietaryRequirements?: string
  isValid?: boolean
  errors?: string[]
}

interface UploadResult {
  success: number
  failed: number
  claimed: number
  errors: Array<{ row: number; email: string; error: string }>
  registered: Array<{ email: string; registrationId: string }>
}

interface SponsorData {
  companyName: string
  category: string
  allocation: { total: number; used: number }
}

const REQUIRED_FIELDS = ['firstname', 'lastname', 'email', 'phone', 'institution', 'city', 'state']
const ALL_FIELDS = ['title', 'firstname', 'lastname', 'email', 'phone', 'age', 'designation', 'institution', 'mcinumber', 'address', 'city', 'state', 'pincode', 'dietaryrequirements']
const DISPLAY_FIELDS = ['title', 'firstName', 'lastName', 'email', 'phone', 'age', 'designation', 'institution', 'mciNumber', 'address', 'city', 'state', 'pincode', 'dietaryRequirements']

export function BulkUploadForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [sponsorData, setSponsorData] = useState<SponsorData | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [activeTab, setActiveTab] = useState('upload')
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sponsor/login')
    } else if (status === 'authenticated') {
      const user = session?.user as any
      if (user?.role !== 'sponsor') {
        router.push('/sponsor/login')
      } else {
        fetchSponsorData()
      }
    }
  }, [status, session])

  const fetchSponsorData = async () => {
    try {
      const res = await fetch('/api/sponsor/dashboard')
      const result = await res.json()
      if (result.success) {
        setSponsorData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch sponsor data')
    }
  }

  const downloadTemplate = () => {
    const headers = DISPLAY_FIELDS.join(',')
    const example1 = 'Dr.,John,Doe,john@example.com,9876543210,35,Consultant,ABC Hospital,MCI12345,123 Main Street,Hyderabad,Telangana,500001,vegetarian'
    const example2 = 'Dr.,Jane,Smith,jane@example.com,9876543211,28,PG/Student,XYZ Medical College,,456 Park Road,Hyderabad,Telangana,500001,none'
    const csv = `${headers}\n${example1}\n${example2}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'delegate_bulk_template.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Template downloaded!')
  }

  const parseCSV = (text: string): CSVRow[] => {
    // Remove BOM if present and normalize line endings
    const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
    const lines = cleanText.split('\n')
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''))
    const rows: CSVRow[] = []
    
    for (let i = 1; i < lines.length; i++) {
      // Handle CSV with quoted values
      const values: string[] = []
      let current = ''
      let inQuotes = false
      
      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      
      const row: any = {}
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || '').trim()
      })
      
      // Map to expected field names
      // Headers are already lowercased, so we only need to check lowercase versions
      const normalizedRow: any = {
        title: row.title || '',
        firstName: row.firstname || '',
        lastName: row.lastname || '',
        email: row.email || '',
        phone: row.phone || '',
        age: row.age || '',
        designation: row.designation || '',
        institution: row.institution || '',
        mciNumber: row.mcinumber || '',
        address: row.address || '',
        city: row.city || '',
        state: row.state || '',
        pincode: row.pincode || '',
        dietaryRequirements: row.dietaryrequirements || ''
      }
      
      // Validate row
      const errors: string[] = []
      if (!normalizedRow.firstName) errors.push('Missing firstName')
      if (!normalizedRow.lastName) errors.push('Missing lastName')
      if (!normalizedRow.email) errors.push('Missing email')
      if (!normalizedRow.phone) errors.push('Missing phone')
      if (!normalizedRow.institution) errors.push('Missing institution')
      if (!normalizedRow.city) errors.push('Missing city')
      if (!normalizedRow.state) errors.push('Missing state')
      
      // Validate email format
      if (normalizedRow.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRow.email)) {
        errors.push('Invalid email format')
      }
      
      // Validate phone (10 digits)
      if (normalizedRow.phone && !/^\d{10}$/.test(normalizedRow.phone.replace(/\D/g, ''))) {
        errors.push('Phone must be 10 digits')
      }
      
      // Validate pincode (6 digits) - only if provided
      if (normalizedRow.pincode && !/^\d{6}$/.test(normalizedRow.pincode.replace(/\D/g, ''))) {
        errors.push('Pincode must be 6 digits')
      }
      
      normalizedRow.isValid = errors.length === 0
      normalizedRow.errors = errors
      rows.push(normalizedRow)
    }
    
    return rows
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setFileName(file.name)
    const text = await file.text()
    const rows = parseCSV(text)
    
    if (rows.length === 0) {
      toast.error('No data rows found in CSV')
      return
    }

    setCsvData(rows)
    setActiveTab('preview')
    setResult(null)
    
    const validCount = rows.filter(r => r.isValid).length
    const invalidCount = rows.length - validCount
    
    if (invalidCount > 0) {
      toast.warning(`${invalidCount} rows have validation errors`)
    } else {
      toast.success(`${validCount} rows ready for upload`)
    }
  }

  const clearFile = () => {
    setCsvData([])
    setFileName('')
    setResult(null)
    setActiveTab('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async () => {
    const validRows = csvData.filter(r => r.isValid)
    
    if (validRows.length === 0) {
      toast.error('No valid rows to upload')
      return
    }

    const remaining = sponsorData ? sponsorData.allocation.total - sponsorData.allocation.used : 0
    if (validRows.length > remaining) {
      toast.error(`You only have ${remaining} slots remaining, but trying to upload ${validRows.length} delegates`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    // Helper function to escape CSV values
    const escapeCSV = (value: string | undefined): string => {
      const str = value || ''
      // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // Create CSV from valid rows only
    // Use display field names for the CSV that goes to the API
    const headers = DISPLAY_FIELDS.join(',')
    const csvContent = [headers, ...validRows.map(row => 
      DISPLAY_FIELDS.map(field => {
        // Map display field names to row properties
        const key = field as keyof CSVRow
        return escapeCSV(row[key] as string)
      }).join(',')
    )].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const formData = new FormData()
    formData.append('file', blob, 'delegates.csv')

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const res = await fetch('/api/sponsor/delegates/bulk', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (data.success) {
        setResult(data.result)
        setActiveTab('results')
        
        if (data.result.success > 0) {
          toast.success(`${data.result.success} delegates registered successfully!`)
        }
        if (data.result.claimed > 0) {
          toast.info(`${data.result.claimed} existing users claimed`)
        }
        if (data.result.failed > 0) {
          toast.error(`${data.result.failed} rows failed`)
        }
        
        // Refresh sponsor data
        fetchSponsorData()
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch (error) {
      clearInterval(progressInterval)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const validCount = csvData.filter(r => r.isValid).length
  const invalidCount = csvData.length - validCount
  const remaining = sponsorData ? sponsorData.allocation.total - sponsorData.allocation.used : 0

  if (status === 'loading' || !sponsorData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: conferenceConfig.theme.primary }} />
      </div>
    )
  }

  return (
    <SponsorLayout sponsorData={sponsorData}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link href="/sponsor/delegates">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Delegates
              </Button>
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Bulk Upload Delegates</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Upload multiple delegates at once via CSV • {remaining} slots remaining
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="shrink-0">
              <Download className="w-4 h-4 mr-2" /> Download Template
            </Button>
          </div>
        </motion.div>

        {/* Allocation Warning */}
        {remaining <= 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">No Slots Available</h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                You have used all your delegate allocation. Contact the organizers for more slots.
              </p>
            </div>
          </motion.div>
        )}

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3"
        >
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">Password Information</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Each delegate's mobile number will be used as their initial password. They can change it after first login.
            </p>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={csvData.length === 0} className="flex items-center gap-2">
              <Eye className="w-4 h-4" /> Preview {csvData.length > 0 && `(${csvData.length})`}
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!result} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Results
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Upload Area */}
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" style={{ color: conferenceConfig.theme.primary }} />
                    Upload CSV File
                  </CardTitle>
                  <CardDescription>Drag and drop or click to select</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                      dragActive 
                        ? 'border-primary bg-primary/5 scale-[1.02]' 
                        : 'border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                      {dragActive ? 'Drop your CSV file here' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">CSV files only</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {fileName && (
                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">{fileName}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearFile}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" style={{ color: conferenceConfig.theme.primary }} />
                    CSV Format Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Required Fields</h4>
                    <div className="flex flex-wrap gap-2">
                      {['firstName', 'lastName', 'email', 'phone', 'institution', 'city', 'state'].map(field => (
                        <Badge key={field} variant="default" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Optional Fields</h4>
                    <div className="flex flex-wrap gap-2">
                      {['title', 'age', 'designation', 'mciNumber', 'address', 'pincode', 'dietaryRequirements'].map(field => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                    <p><strong>title:</strong> Dr., Prof., Mr., Mrs., Ms.</p>
                    <p><strong>designation:</strong> Consultant, PG/Student</p>
                    <p><strong>phone:</strong> 10-digit mobile number (used as password)</p>
                    <p><strong>pincode:</strong> 6-digit postal code</p>
                    <p><strong>dietaryRequirements:</strong> none, vegetarian, vegan, halal, kosher, gluten-free</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card className="border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Preview Data</CardTitle>
                    <CardDescription>Review before uploading • {fileName}</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500">{validCount} valid</Badge>
                      {invalidCount > 0 && (
                        <Badge variant="destructive">{invalidCount} invalid</Badge>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={clearFile}>
                      <Trash2 className="w-4 h-4 mr-2" /> Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Validation Summary */}
                {invalidCount > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {invalidCount} rows have validation errors and will be skipped during upload.
                      </p>
                    </div>
                  </div>
                )}

                {/* Data Table */}
                <ScrollArea className="h-[400px] rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.map((row, idx) => (
                        <TableRow key={idx} className={!row.isValid ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                          <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.title} {row.firstName} {row.lastName}
                          </TableCell>
                          <TableCell className="text-sm">{row.email}</TableCell>
                          <TableCell className="font-mono text-sm">{row.phone}</TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">{row.institution}</TableCell>
                          <TableCell className="text-sm">{row.city}</TableCell>
                          <TableCell className="text-sm">{row.state}</TableCell>
                          <TableCell>
                            {row.errors && row.errors.length > 0 && (
                              <span className="text-xs text-red-600">{row.errors.join(', ')}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Upload Button */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {validCount > remaining ? (
                      <span className="text-red-600">
                        ⚠️ You have {validCount} valid rows but only {remaining} slots remaining
                      </span>
                    ) : (
                      <span>Ready to upload {validCount} delegates</span>
                    )}
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || validCount === 0 || validCount > remaining}
                    className="text-white min-w-[200px]"
                    style={{ backgroundColor: conferenceConfig.theme.primary }}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload {validCount} Delegates
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress Bar */}
                {uploading && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-center text-slate-500 mt-2">Processing... {uploadProgress}%</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {result && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-green-100 dark:bg-green-800">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-green-700 dark:text-green-300">{result.success}</div>
                            <div className="text-sm text-green-600 dark:text-green-400">New Registrations</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{result.claimed}</div>
                            <div className="text-sm text-blue-600 dark:text-blue-400">Existing Users Claimed</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-red-100 dark:bg-red-800">
                            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-red-700 dark:text-red-300">{result.failed}</div>
                            <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Errors Table */}
                {result.errors.length > 0 && (
                  <Card className="border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-red-600 flex items-center gap-2">
                        <XCircle className="w-5 h-5" /> Failed Rows
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Error</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.errors.map((err, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-mono">{err.row}</TableCell>
                                <TableCell>{err.email}</TableCell>
                                <TableCell className="text-red-600">{err.error}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Success Table */}
                {result.registered.length > 0 && (
                  <Card className="border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Successfully Registered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>Registration ID</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.registered.map((reg, i) => (
                              <TableRow key={i}>
                                <TableCell>{reg.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono">{reg.registrationId}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={clearFile}>
                    <Upload className="w-4 h-4 mr-2" /> Upload Another
                  </Button>
                  <Link href="/sponsor/delegates">
                    <Button className="text-white" style={{ backgroundColor: conferenceConfig.theme.primary }}>
                      <Users className="w-4 h-4 mr-2" /> View All Delegates
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SponsorLayout>
  )
}
