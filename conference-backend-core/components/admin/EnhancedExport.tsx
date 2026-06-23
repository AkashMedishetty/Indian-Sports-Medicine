'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { useToast } from '../ui/use-toast'
import { 
  Download, FileSpreadsheet, FileText, Archive, 
  Calendar, Filter, CheckCircle, Users 
} from 'lucide-react'
import { motion } from 'framer-motion'

export function EnhancedExport() {
  const { toast } = useToast()
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState({
    dataType: 'registrations',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    category: 'all',
    format: 'csv',
    includePayments: true,
    includeWorkshops: true,
    includeAbstracts: false
  })

  const handleExport = async () => {
    try {
      setExporting(true)
      
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value))
      })

      const endpoint = `/api/admin/export/advanced?${queryParams.toString()}`
      const response = await fetch(endpoint)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        const extension = filters.format === 'csv' ? 'csv' : filters.format === 'excel' ? 'xlsx' : 'zip'
        a.download = `${filters.dataType}-export-${new Date().toISOString().split('T')[0]}.${extension}`
        
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Export Successful",
          description: `${filters.dataType} data exported successfully`
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setExporting(false)
    }
  }

  const exportTypes = [
    {
      value: 'registrations',
      label: 'Registrations',
      icon: Users,
      description: 'All user registrations with details'
    },
    {
      value: 'payments',
      label: 'Payments',
      icon: FileText,
      description: 'Payment transactions and invoices'
    },
    {
      value: 'abstracts',
      label: 'Abstracts',
      icon: FileSpreadsheet,
      description: 'Submitted abstracts with files'
    },
    {
      value: 'complete',
      label: 'Complete Data',
      icon: Archive,
      description: 'All data in a ZIP archive'
    }
  ]

  return (
    <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
          <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Enhanced Data Export
        </CardTitle>
        <CardDescription className="dark:text-slate-400">
          Export data with advanced filtering options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div className="space-y-3">
          <Label className="text-slate-900 dark:text-white">Select Data Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exportTypes.map((type) => (
              <motion.div
                key={type.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilters(prev => ({ ...prev, dataType: type.value }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  filters.dataType === type.value
                    ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    filters.dataType === type.value 
                      ? 'bg-blue-100 dark:bg-blue-800/30' 
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <type.icon className={`h-5 w-5 ${
                      filters.dataType === type.value 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{type.label}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{type.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Filter className="h-4 w-4" />
              Status Filter
            </Label>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Users className="h-4 w-4" />
              Category Filter
            </Label>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="cvsi-member">CVSI Member</SelectItem>
                <SelectItem value="non-member">Non Member</SelectItem>
                <SelectItem value="resident">Resident/Fellow</SelectItem>
                <SelectItem value="international">International</SelectItem>
                <SelectItem value="complimentary">Complimentary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Calendar className="h-4 w-4" />
              Date From
            </Label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Calendar className="h-4 w-4" />
              Date To
            </Label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Export Format */}
        <div className="space-y-3">
          <Label className="text-slate-900 dark:text-white">Export Format</Label>
          <div className="flex gap-3">
            {[
              { value: 'csv', label: 'CSV', icon: FileText },
              { value: 'excel', label: 'Excel', icon: FileSpreadsheet },
              { value: 'zip', label: 'ZIP Archive', icon: Archive }
            ].map((format) => (
              <Button
                key={format.value}
                variant={filters.format === format.value ? "default" : "outline"}
                onClick={() => setFilters(prev => ({ ...prev, format: format.value }))}
                className="flex-1"
              >
                <format.icon className="h-4 w-4 mr-2" />
                {format.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        {filters.dataType === 'registrations' && (
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <Label className="text-slate-900 dark:text-white">Include Additional Data</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePayments"
                  checked={filters.includePayments}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includePayments: checked as boolean }))}
                />
                <Label htmlFor="includePayments" className="cursor-pointer text-slate-700 dark:text-slate-300">
                  Include payment details
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeWorkshops"
                  checked={filters.includeWorkshops}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeWorkshops: checked as boolean }))}
                />
                <Label htmlFor="includeWorkshops" className="cursor-pointer text-slate-700 dark:text-slate-300">
                  Include workshop selections
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAbstracts"
                  checked={filters.includeAbstracts}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeAbstracts: checked as boolean }))}
                />
                <Label htmlFor="includeAbstracts" className="cursor-pointer text-slate-700 dark:text-slate-300">
                  Include abstract submissions
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-12"
          size="lg"
        >
          {exporting ? (
            <>
              <Download className="h-5 w-5 mr-2 animate-bounce" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              Export Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
