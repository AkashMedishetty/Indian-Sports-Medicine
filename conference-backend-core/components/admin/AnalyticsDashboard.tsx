"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Alert, AlertDescription } from "../ui/alert"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Building,
  Award,
  FileSpreadsheet,
  FileText
} from "lucide-react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { useToast } from "../ui/use-toast"

interface AnalyticsData {
  overview: {
    totalRegistrations: number
    confirmedRegistrations: number
    pendingRegistrations: number
    cancelledRegistrations: number
    totalRevenue: number
    paidRegistrations: number
    unpaidRegistrations: number
    totalAccompanyingPersons: number
    conversionRate: number
    averageTransactionValue: number
  }
  typeBreakdown: Record<string, { count: number; revenue: number }>
  statusBreakdown: {
    confirmed: number
    pending: number
    cancelled: number
  }
  dailyRegistrations: Array<{ date: string; count: number; revenue: number }>
  monthlyTrends: Array<{ month: string; count: number; revenue: number }>
  workshopStats: Record<string, number>
  paymentMethodBreakdown: Record<string, { count: number; revenue: number }>
  geographicalDistribution: Record<string, { count: number; states: Record<string, number> }>
  topInstitutions: Array<{ name: string; count: number }>
  dateRange: {
    start: string
    end: string
  }
}

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const { toast } = useToast()

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/admin/analytics?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setAnalyticsData(result.data)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch analytics",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()

    toast({
      title: "✅ Export Successful",
      description: `${filename} has been downloaded`
    })
  }

  const exportOverviewReport = () => {
    if (!analyticsData) return

    const data = [{
      Metric: 'Total Registrations',
      Value: analyticsData.overview.totalRegistrations
    }, {
      Metric: 'Confirmed',
      Value: analyticsData.overview.confirmedRegistrations
    }, {
      Metric: 'Pending',
      Value: analyticsData.overview.pendingRegistrations
    }, {
      Metric: 'Cancelled',
      Value: analyticsData.overview.cancelledRegistrations
    }, {
      Metric: 'Total Revenue',
      Value: analyticsData.overview.totalRevenue
    }, {
      Metric: 'Paid Registrations',
      Value: analyticsData.overview.paidRegistrations
    }, {
      Metric: 'Unpaid Registrations',
      Value: analyticsData.overview.unpaidRegistrations
    }, {
      Metric: 'Conversion Rate',
      Value: `${analyticsData.overview.conversionRate}%`
    }, {
      Metric: 'Average Transaction Value',
      Value: analyticsData.overview.averageTransactionValue
    }]

    exportToCSV(data, 'overview-report')
  }

  const exportDailyReport = () => {
    if (!analyticsData) return
    exportToCSV(analyticsData.dailyRegistrations, 'daily-registrations')
  }

  const exportTypeBreakdown = () => {
    if (!analyticsData) return
    
    const data = Object.entries(analyticsData.typeBreakdown).map(([type, stats]) => ({
      Type: type,
      Count: stats.count,
      Revenue: stats.revenue
    }))
    
    exportToCSV(data, 'type-breakdown')
  }

  const exportWorkshopReport = () => {
    if (!analyticsData) return
    
    const data = Object.entries(analyticsData.workshopStats).map(([workshop, count]) => ({
      Workshop: workshop,
      Registrations: count
    }))
    
    exportToCSV(data, 'workshop-report')
  }

  const exportInstitutionReport = () => {
    if (!analyticsData) return
    exportToCSV(analyticsData.topInstitutions, 'top-institutions')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>No analytics data available</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics & Reports</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Comprehensive registration insights and statistics</p>
        </div>
        <Button onClick={fetchAnalytics} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Date Filter */}
      <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-500" />
            Date Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={fetchAnalytics} className="flex-1">
                Apply Filter
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStartDate("")
                  setEndDate("")
                  fetchAnalytics()
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Registrations</p>
                <p className="text-3xl font-bold mt-2">{analyticsData.overview.totalRegistrations}</p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(analyticsData.overview.totalRevenue)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Conversion Rate</p>
                <p className="text-3xl font-bold mt-2">{analyticsData.overview.conversionRate}%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Avg. Transaction</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(analyticsData.overview.averageTransactionValue)}</p>
              </div>
              <BarChart3 className="h-12 w-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-500" />
            Registration Status
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportOverviewReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Confirmed</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                    {analyticsData.statusBreakdown.confirmed}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
                    {analyticsData.statusBreakdown.pending}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">Cancelled</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
                    {analyticsData.statusBreakdown.cancelled}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
            Quick Export Reports
          </CardTitle>
          <CardDescription>Download comprehensive reports in CSV format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button variant="outline" onClick={exportOverviewReport} className="gap-2">
              <Download className="h-4 w-4" />
              Overview Report
            </Button>
            <Button variant="outline" onClick={exportDailyReport} className="gap-2">
              <Download className="h-4 w-4" />
              Daily Report
            </Button>
            <Button variant="outline" onClick={exportTypeBreakdown} className="gap-2">
              <Download className="h-4 w-4" />
              Type Breakdown
            </Button>
            <Button variant="outline" onClick={exportWorkshopReport} className="gap-2">
              <Download className="h-4 w-4" />
              Workshop Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
