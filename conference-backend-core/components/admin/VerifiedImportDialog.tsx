'use client'

import { useState } from 'react'
import { Upload, FileCheck, Download, Eye, CheckCircle, XCircle } from 'lucide-react'
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

interface PreviewRow {
  Email: string
  Name: string
  Amount: string
  'Registration Type'?: string
  Phone?: string
  'Transaction ID'?: string
  valid: boolean
  errors: string[]
}

interface ImportResults {
  imported: number
  emailsSent: number
  emailErrors: number
  errors?: string[]
  testMode?: boolean
  simulatedData?: any[]
}

export function VerifiedImportDialog({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewRow[]>([])
  const [importResults, setImportResults] = useState<ImportResults | null>(null)

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

    const headers = lines[0].split(',').map(h => h.trim())
    const rows: PreviewRow[] = []

    for (let i = 1; i < lines.length && i < 11; i++) { // Preview first 10 rows
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      // Validate row
      const errors: string[] = []
      if (!row['Email']) errors.push('Missing Email')
      if (!row['Name']) errors.push('Missing Name')
      if (!row['Amount']) errors.push('Missing Amount')

      rows.push({
        ...row,
        valid: errors.length === 0,
        errors
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

    setIsImporting(true)
    setImportResults(null)
    setShowPreview(false)

    try {
      const endpoint = testMode 
        ? '/api/admin/registrations/import-verified-test'
        : '/api/admin/registrations/import-verified'
        
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setImportResults({
          imported: data.testMode ? data.wouldImport : data.imported,
          emailsSent: data.testMode ? data.wouldSendEmails : data.emailsSent,
          emailErrors: data.emailErrors || 0,
          errors: data.errors,
          testMode: data.testMode,
          simulatedData: data.simulatedData
        })

        if (data.testMode) {
          toast.success('ðŸ§ª Test Completed!', {
            description: `Would import ${data.wouldImport} registrations and send ${data.wouldSendEmails} emails. No actual changes made.`,
          })
        } else {
          toast.success('Import Successful!', {
            description: `${data.imported} registrations imported and ${data.emailsSent} acceptance emails sent with QR codes.`,
          })
        }

        // Close dialog after 3 seconds if no errors
        if (!data.errors || data.errors.length === 0) {
          setTimeout(() => {
            setIsOpen(false)
            setImportFile(null)
            setImportResults(null)
            onImportComplete?.()
          }, 3000)
        } else {
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
        description: 'Failed to import registrations. Please try again.',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    // Generate CSV template dynamically
    const headers = [
      'Email',
      'Name',
      'Amount',
      'Registration Type',
      'Phone',
      'Transaction ID',
      'Title',
      'Institution',
      'City',
      'State',
      'Country',
      'Pincode',
      'MCI Number',
      'Membership Number',
      'Accompanying Persons',
      'Accompanying Person Names',
      'Dietary Requirements',
      'Special Needs',
      'Payment Remarks'
    ]
    
    // Example rows
    const exampleRows = [
      'john.doe@example.com,Dr. John Doe,5000,consultant,9876543210,UTR123456789012,Dr.,ABC Hospital,Hyderabad,Telangana,India,500001,MCI12345,MEM001,1,Jane Doe,vegetarian,,Verified via bank transfer',
      'jane.smith@example.com,Dr. Jane Smith,3000,postgraduate,9876543211,UTR123456789013,Dr.,XYZ Medical College,Mumbai,Maharashtra,India,400001,MCI12346,,0,,,,'
    ]
    
    const csvContent = [headers.join(','), ...exampleRows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'verified-registrations-template.csv'
    link.click()
    
    URL.revokeObjectURL(url)
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300"
        >
          <FileCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Import Verified</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">Import Verified Registrations</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Upload a CSV file with verified payment data. Registrations will be automatically confirmed and acceptance emails with QR codes will be sent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 w-full max-w-full overflow-hidden">
          {/* Template Download */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <Download className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:justify-between text-slate-700 dark:text-slate-300">
              <span>Download the CSV template to ensure correct format</span>
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
            <Label htmlFor="verified-import-file" className="text-slate-900 dark:text-white">CSV File</Label>
            <Input
              id="verified-import-file"
              type="file"
              accept=".csv"
              onChange={(e) => {
                setImportFile(e.target.files?.[0] || null)
                setShowPreview(false)
                setPreviewData([])
              }}
              disabled={isImporting}
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
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900 dark:text-white">Data Preview (First 10 rows)</h4>
                <div className="flex gap-2">
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
              
              <div className="border rounded-lg overflow-x-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800">
                      <TableHead className="w-12 text-slate-700 dark:text-slate-200">Status</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-200">Email</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-200">Name</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-200">Amount</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-200">Type</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-200">Phone</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-200">Transaction ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index} className={row.valid ? 'bg-white dark:bg-slate-900' : 'bg-red-50 dark:bg-red-900/20'}>
                        <TableCell>
                          {row.valid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 dark:text-white">{row.Email}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.Name}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.Amount}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row['Registration Type'] || 'Member'}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{row.Phone || '-'}</TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">{row['Transaction ID'] || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {invalidRows > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Found {invalidRows} invalid rows:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {previewData.filter(r => !r.valid).map((row, index) => (
                        <li key={index} className="text-sm">
                          Row {previewData.indexOf(row) + 2}: {row.errors.join(', ')}
                        </li>
                      ))}
                    </ul>
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
                <li>Registration IDs generated automatically</li>
                <li>Payment status set to "verified"</li>
                <li>Registration status set to "confirmed"</li>
                <li>Acceptance emails sent with QR codes & invoices</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Import Results */}
          {importResults && (
            <Alert className={importResults.errors && importResults.errors.length > 0 ? 'border-yellow-500' : (importResults.testMode ? 'border-[#f0f3f8]0' : 'border-green-500')}>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">
                    {importResults.testMode ? 'ðŸ§ª Test Results:' : 'Import Results:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li className={importResults.testMode ? "text-[#25406b]" : "text-green-600"}>
                      {importResults.testMode ? 'ðŸ§ª' : 'âœ“'} {importResults.imported} registrations {importResults.testMode ? 'would be imported' : 'imported'}
                    </li>
                    <li className={importResults.testMode ? "text-[#25406b]" : "text-green-600"}>
                      {importResults.testMode ? 'ðŸ§ª' : 'âœ“'} {importResults.emailsSent} acceptance emails {importResults.testMode ? 'would be sent' : 'sent'}
                    </li>
                    {importResults.emailErrors > 0 && (
                      <li className="text-yellow-600">âš  {importResults.emailErrors} email failures</li>
                    )}
                  </ul>

                  {importResults.testMode && (
                    <div className="mt-3 p-3 bg-[#f0f3f8] rounded border border-[#b0c1db]">
                      <p className="font-semibold text-blue-800 mb-2">ðŸ§ª Test Mode - No Changes Made</p>
                      <p className="text-sm text-[#1d3357]">This was a dry run. No users were created, no emails were sent, and no database changes were made.</p>
                    </div>
                  )}
                  
                  {importResults.errors && importResults.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="font-semibold text-yellow-600 mb-1">Errors:</p>
                      <div className="max-h-40 overflow-y-auto bg-yellow-50 p-2 rounded border border-yellow-200">
                        {importResults.errors.map((error, index) => (
                          <p key={index} className="text-xs text-yellow-800 mb-1">
                            {error}
                          </p>
                        ))}
                      </div>
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
            className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 w-full sm:w-auto"
          >
            {importResults ? 'Close' : 'Cancel'}
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => handleImport(true)}
              disabled={!importFile || isImporting || (showPreview && invalidRows > 0)}
              className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
            >
              {isImporting ? (
                <>
                  <span className="animate-spin mr-2">â³</span>
                  Testing...
                </>
              ) : (
                <>
                  ðŸ§ª Test Import
                  {showPreview && validRows > 0 && ` (${validRows} rows)`}
                </>
              )}
            </Button>
            <Button
              onClick={() => handleImport(false)}
              disabled={!importFile || isImporting || (showPreview && invalidRows > 0)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isImporting ? (
                <>
                  <span className="animate-spin mr-2">â³</span>
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
