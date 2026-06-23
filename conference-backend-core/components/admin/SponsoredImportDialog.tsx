'use client'

import { useState, useEffect } from 'react'
import { Upload, Award, Download, Eye, CheckCircle, XCircle, Users } from 'lucide-react'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '../ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'

interface Sponsor {
  _id: string
  companyName: string
  category: string
  allocation: { total: number; used: number }
}

interface PreviewRow {
  sponsorName: string
  email: string
  firstName: string
  lastName: string
  phone: string
  institution: string
  title?: string
  designation?: string
  city?: string
  state?: string
  pincode?: string
  valid: boolean
  errors: string[]
  sponsorId?: string
}

interface ImportResults {
  success: number
  failed: number
  claimed: number
  errors: Array<{ row: number; email: string; error: string }>
  registered: Array<{ email: string; registrationId: string; sponsorName: string }>
  testMode?: boolean
}

export function SponsoredImportDialog({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewRow[]>([])
  const [importResults, setImportResults] = useState<ImportResults | null>(null)
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loadingSponsors, setLoadingSponsors] = useState(false)

  // Fetch sponsors when dialog opens
  useEffect(() => {
    if (isOpen && sponsors.length === 0) {
      fetchSponsors()
    }
  }, [isOpen])

  const fetchSponsors = async () => {
    setLoadingSponsors(true)
    try {
      const response = await fetch('/api/admin/sponsors')
      const data = await response.json()
      if (data.success && data.sponsors) {
        setSponsors(data.sponsors.map((s: any) => ({
          _id: s._id,
          companyName: s.sponsorProfile?.companyName || s.email,
          category: s.sponsorProfile?.category || 'other',
          allocation: s.sponsorProfile?.allocation || { total: 0, used: 0 }
        })))
      }
    } catch (err) {
      console.error('Failed to fetch sponsors:', err)
      toast.error('Failed to load sponsors list')
    } finally {
      setLoadingSponsors(false)
    }
  }

  const findSponsorByName = (name: string): Sponsor | undefined => {
    if (!name) return undefined
    const normalizedName = name.toLowerCase().trim()
    return sponsors.find(s => 
      s.companyName.toLowerCase().trim() === normalizedName ||
      s.companyName.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(s.companyName.toLowerCase())
    )
  }

  const handlePreview = async () => {
    if (!importFile) {
      toast.error('Please select a CSV file')
      return
    }

    const text = await importFile.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      toast.error('CSV file is empty or invalid')
      return
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''))
    const rows: PreviewRow[] = []

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
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      // Validate row
      const errors: string[] = []
      
      // Required fields
      if (!row.sponsorname) errors.push('Missing Sponsor Name')
      if (!row.email) errors.push('Missing Email')
      if (!row.firstname) errors.push('Missing First Name')
      if (!row.lastname) errors.push('Missing Last Name')
      if (!row.phone) errors.push('Missing Phone')
      if (!row.institution) errors.push('Missing Institution')

      // Validate email format
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push('Invalid email format')
      }

      // Validate phone (10 digits)
      const cleanPhone = (row.phone || '').replace(/\D/g, '')
      if (row.phone && cleanPhone.length !== 10) {
        errors.push('Phone must be 10 digits')
      }

      // Validate pincode if provided (6 digits)
      if (row.pincode) {
        const cleanPincode = row.pincode.replace(/\D/g, '')
        if (cleanPincode.length !== 6) {
          errors.push('Pincode must be 6 digits')
        }
      }

      // Find sponsor
      const sponsor = findSponsorByName(row.sponsorname)
      if (!sponsor && row.sponsorname) {
        errors.push(`Sponsor "${row.sponsorname}" not found`)
      }

      rows.push({
        sponsorName: row.sponsorname || '',
        email: row.email || '',
        firstName: row.firstname || '',
        lastName: row.lastname || '',
        phone: row.phone || '',
        institution: row.institution || '',
        title: row.title || 'Dr.',
        designation: row.designation || 'Consultant',
        city: row.city || '',
        state: row.state || '',
        pincode: row.pincode || '',
        valid: errors.length === 0,
        errors,
        sponsorId: sponsor?._id
      })
    }

    setPreviewData(rows)
    setShowPreview(true)
  }

  const handleImport = async (testMode = false) => {
    if (!importFile) {
      toast.error('Please select a CSV file')
      return
    }

    const formData = new FormData()
    formData.append('file', importFile)
    if (testMode) {
      formData.append('testMode', 'true')
    }

    setIsImporting(true)
    setImportResults(null)

    try {
      const response = await fetch('/api/admin/registrations/import-sponsored', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setImportResults({
          success: data.result.success,
          failed: data.result.failed,
          claimed: data.result.claimed,
          errors: data.result.errors || [],
          registered: data.result.registered || [],
          testMode: data.testMode
        })

        if (data.testMode) {
          toast.success('🧪 Test Completed!', {
            description: `Would register ${data.result.success} delegates. No actual changes made.`,
          })
        } else {
          toast.success('Import Successful!', {
            description: `${data.result.success} delegates registered, ${data.result.claimed} claimed, ${data.result.failed} failed.`,
          })
          onImportComplete?.()
        }
      } else {
        toast.error('Import Failed', {
          description: data.message || 'An error occurred during import',
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Import Error', {
        description: 'Failed to import sponsored registrations. Please try again.',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'Sponsor Name',
      'Title',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Designation',
      'Institution',
      'MCI Number',
      'Address',
      'City',
      'State',
      'Pincode',
      'Dietary Requirements'
    ]
    
    // Example rows with different sponsors
    const exampleRows = [
      'Platinum Pharma,Dr.,John,Doe,john@example.com,9876543210,Consultant,ABC Hospital,MCI12345,123 Main Street,Hyderabad,Telangana,500001,vegetarian',
      'Platinum Pharma,Dr.,Jane,Smith,jane@example.com,9876543211,PG/Student,XYZ Medical College,,456 Park Road,Hyderabad,Telangana,500001,none',
      'Gold Medical,Dr.,Robert,Johnson,robert@example.com,9876543212,Consultant,City Hospital,MCI12347,789 Oak Avenue,Mumbai,Maharashtra,400001,',
      'Silver Healthcare,Dr.,Emily,Brown,emily@example.com,9876543213,PG/Student,State Medical College,,321 Pine Street,Bangalore,Karnataka,560001,vegan'
    ]
    
    const csvContent = [headers.join(','), ...exampleRows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'sponsored-registrations-template.csv'
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success('Template downloaded!')
  }

  const resetDialog = () => {
    setImportFile(null)
    setImportResults(null)
    setShowPreview(false)
    setPreviewData([])
    setIsOpen(false)
  }

  const validRows = previewData.filter(r => r.valid).length
  const invalidRows = previewData.filter(r => !r.valid).length
  
  // Group by sponsor for summary
  const sponsorSummary = previewData.reduce((acc, row) => {
    if (row.valid && row.sponsorName) {
      acc[row.sponsorName] = (acc[row.sponsorName] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
        >
          <Award className="h-4 w-4" />
          <span className="hidden sm:inline">Import Sponsored</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[1000px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            Import Sponsored Registrations
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Upload a CSV file with sponsored delegate data. Supports multiple sponsors in a single file. 
            Delegates will be registered with "Sponsored" type and linked to their sponsor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 w-full max-w-full overflow-hidden">
          {/* Sponsors List */}
          {loadingSponsors ? (
            <div className="text-center py-4 text-slate-500">Loading sponsors...</div>
          ) : sponsors.length === 0 ? (
            <Alert variant="destructive">
              <AlertDescription>
                No sponsors found. Please create sponsors first before importing sponsored registrations.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700">
              <Users className="h-4 w-4" />
              <AlertDescription className="text-slate-700 dark:text-slate-300">
                <strong>Available Sponsors ({sponsors.length}):</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {sponsors.map(s => (
                    <Badge key={s._id} variant="outline" className="text-xs">
                      {s.companyName} ({s.allocation.total - s.allocation.used} slots)
                    </Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Template Download */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <Download className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:justify-between text-slate-700 dark:text-slate-300">
              <span>Download the CSV template with multiple sponsor examples</span>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="sm:ml-2"
              >
                <Download className="h-3 w-3 mr-2" />
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <Label htmlFor="sponsored-import-file" className="text-slate-900 dark:text-white">CSV File</Label>
            <Input
              id="sponsored-import-file"
              type="file"
              accept=".csv"
              onChange={(e) => {
                setImportFile(e.target.files?.[0] || null)
                setShowPreview(false)
                setPreviewData([])
                setImportResults(null)
              }}
              disabled={isImporting || sponsors.length === 0}
              className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
            {importFile && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  disabled={isImporting}
                  className="gap-2"
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </Button>
              </div>
            )}
          </div>

          {/* Preview Section */}
          {showPreview && previewData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-medium text-slate-900 dark:text-white">Data Preview</h4>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {validRows} Valid
                  </Badge>
                  {invalidRows > 0 && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {invalidRows} Invalid
                    </Badge>
                  )}
                </div>
              </div>

              {/* Sponsor Summary */}
              {Object.keys(sponsorSummary).length > 0 && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                  <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">Delegates by Sponsor:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(sponsorSummary).map(([sponsor, count]) => (
                      <Badge key={sponsor} className="bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100">
                        {sponsor}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <ScrollArea className="h-[300px] rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Sponsor</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index} className={row.valid ? '' : 'bg-red-50 dark:bg-red-900/10'}>
                        <TableCell>
                          {row.valid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={row.sponsorId ? 'border-indigo-300 text-indigo-700' : 'border-red-300 text-red-700'}>
                            {row.sponsorName || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.title} {row.firstName} {row.lastName}
                        </TableCell>
                        <TableCell className="text-sm">{row.email}</TableCell>
                        <TableCell className="font-mono text-sm">{row.phone}</TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{row.institution}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 && (
                            <span className="text-xs text-red-600">{row.errors.join(', ')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {invalidRows > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>{invalidRows} rows have errors and will be skipped.</strong> Fix the errors and re-upload, or proceed with valid rows only.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Import Info */}
          <Alert className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <AlertDescription className="text-sm text-slate-700 dark:text-slate-300">
              <strong>What happens after import:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Registration type set to "Sponsored" with sponsor name</li>
                <li>Password set to delegate's phone number</li>
                <li>Welcome emails sent with login credentials</li>
                <li>Sponsor allocation counts updated automatically</li>
                <li>Existing pending-payment users can be claimed by sponsors</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Import Results */}
          {importResults && (
            <Alert className={importResults.failed > 0 ? 'border-yellow-500' : (importResults.testMode ? 'border-blue-500' : 'border-green-500')}>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">
                    {importResults.testMode ? '🧪 Test Results:' : 'Import Results:'}
                  </p>
                  <div className="grid grid-cols-3 gap-4 my-3">
                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                      <div className="text-xs text-green-700">New Registrations</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <div className="text-2xl font-bold text-blue-600">{importResults.claimed}</div>
                      <div className="text-xs text-blue-700">Claimed</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                      <div className="text-xs text-red-700">Failed</div>
                    </div>
                  </div>

                  {importResults.testMode && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="font-semibold text-blue-800 mb-1">🧪 Test Mode - No Changes Made</p>
                      <p className="text-sm text-blue-700">This was a dry run. No users were created and no emails were sent.</p>
                    </div>
                  )}
                  
                  {importResults.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="font-semibold text-red-600 mb-1">Errors ({importResults.errors.length}):</p>
                      <ScrollArea className="h-32 bg-red-50 p-2 rounded border border-red-200">
                        {importResults.errors.map((error, index) => (
                          <p key={index} className="text-xs text-red-800 mb-1">
                            Row {error.row}: {error.email} - {error.error}
                          </p>
                        ))}
                      </ScrollArea>
                    </div>
                  )}

                  {importResults.registered.length > 0 && !importResults.testMode && (
                    <div className="mt-3">
                      <p className="font-semibold text-green-600 mb-1">Successfully Registered ({importResults.registered.length}):</p>
                      <ScrollArea className="h-32 bg-green-50 p-2 rounded border border-green-200">
                        {importResults.registered.map((reg, index) => (
                          <p key={index} className="text-xs text-green-800 mb-1">
                            {reg.email} → {reg.registrationId} ({reg.sponsorName})
                          </p>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={resetDialog}
            disabled={isImporting}
            className="w-full sm:w-auto"
          >
            {importResults ? 'Close' : 'Cancel'}
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => handleImport(true)}
              disabled={!importFile || isImporting || sponsors.length === 0 || (showPreview && validRows === 0)}
              className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
            >
              {isImporting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Testing...
                </>
              ) : (
                <>
                  🧪 Test Import
                  {showPreview && validRows > 0 && ` (${validRows} rows)`}
                </>
              )}
            </Button>
            <Button
              onClick={() => handleImport(false)}
              disabled={!importFile || isImporting || sponsors.length === 0 || (showPreview && validRows === 0)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isImporting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import & Send Emails
                  {showPreview && validRows > 0 && ` (${validRows} rows)`}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
