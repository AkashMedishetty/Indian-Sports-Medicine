"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Alert, AlertDescription } from "../ui/alert"
import { 
  BarChart3, TrendingUp, Users, DollarSign, Calendar, Download, Filter, RefreshCw,
  PieChart, CheckCircle, Clock, XCircle, MapPin, Building, Award, FileSpreadsheet,
  FileText, ArrowUp, ArrowDown, Sparkles, Target, TrendingDown, Activity, Zap
} from "lucide-react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { useToast } from "../ui/use-toast"
import { 
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart 
} from 'recharts'

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
    specialNeedsCount: number
  }
  typeBreakdown: Record<string, { count: number; revenue: number }>
  statusBreakdown: { confirmed: number; pending: number; cancelled: number }
  dailyRegistrations: Array<{ date: string; count: number; revenue: number }>
  monthlyTrends: Array<{ month: string; count: number; revenue: number }>
  workshopStats: Record<string, number>
  paymentMethodBreakdown: Record<string, { count: number; revenue: number }>
  geographicalDistribution: Record<string, { count: number; states: Record<string, number> }>
  topInstitutions: Array<{ name: string; count: number }>
  topCities: Array<{ city: string; state: string; count: number; revenue: number }>
  topStates: Array<{ state: string; count: number; revenue: number; citiesCount: number }>
  designationBreakdown: Record<string, { count: number; revenue: number }>
  titleDistribution: Record<string, number>
  dietaryRequirements: Record<string, number>
  hourlyDistribution: Record<string, number>
  dayOfWeekDistribution: Record<string, number>
  paymentMethodStats: Record<string, { count: number; revenue: number }>
  membershipStats: Record<string, number>
  accompanyingPersonsAgeDistribution: Record<string, number>
  revenueByDay: Record<string, number>
  dateRange: { start: string; end: string }
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
  orange: '#f97316'
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#14b8a6']

export function StunningAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedMetric, setSelectedMetric] = useState<'registrations' | 'revenue'>('registrations')
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
        toast({
          title: "✅ Analytics Refreshed",
          description: "Latest data loaded successfully",
          duration: 2000
        })
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

  const exportAll = () => {
    if (!analyticsData) return
    
    const allData = [{
      TotalRegistrations: analyticsData.overview.totalRegistrations,
      Confirmed: analyticsData.overview.confirmedRegistrations,
      Pending: analyticsData.overview.pendingRegistrations,
      TotalRevenue: analyticsData.overview.totalRevenue,
      ConversionRate: analyticsData.overview.conversionRate,
      AvgTransaction: analyticsData.overview.averageTransactionValue
    }]
    
    exportToCSV(allData, 'complete-analytics-report')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="inline-block animate-pulse">
            <Sparkles className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading comprehensive analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <Alert className="bg-white dark:bg-slate-800 border-2">
          <AlertDescription>No analytics data available</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Prepare chart data
  const pieData = [
    { name: 'Confirmed', value: analyticsData.statusBreakdown.confirmed, color: COLORS.success },
    { name: 'Pending', value: analyticsData.statusBreakdown.pending, color: COLORS.warning },
    { name: 'Cancelled', value: analyticsData.statusBreakdown.cancelled, color: COLORS.danger }
  ]

  const typeData = Object.entries(analyticsData.typeBreakdown).map(([name, data]) => ({
    name: name.replace('-', ' ').toUpperCase(),
    registrations: data.count,
    revenue: data.revenue
  }))

  const trendData = analyticsData.monthlyTrends.map(item => ({
    month: item.month.substring(5), // Get MM from YYYY-MM
    registrations: item.count,
    revenue: item.revenue / 1000 // In thousands
  }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Comprehensive Analytics & Insights
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Complete overview of all registration metrics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAnalytics} className="gap-2 bg-blue-500 hover:bg-blue-600">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={exportAll} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics Grid - Animated Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-10 w-10 opacity-80" />
                <Badge className="bg-white/20 text-white border-white/30">Total</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-blue-100 text-sm font-medium">Total Registrations</p>
                <p className="text-4xl font-bold">{analyticsData.overview.totalRegistrations}</p>
                <div className="flex items-center gap-1 text-blue-100 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  <span>{analyticsData.overview.conversionRate}% conversion</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-10 w-10 opacity-80" />
                <Badge className="bg-white/20 text-white border-white/30">Revenue</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                <p className="text-4xl font-bold">{formatCurrency(analyticsData.overview.totalRevenue)}</p>
                <div className="flex items-center gap-1 text-green-100 text-xs">
                  <Activity className="h-3 w-3" />
                  <span>{analyticsData.overview.paidRegistrations} paid</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-10 w-10 opacity-80" />
                <Badge className="bg-white/20 text-white border-white/30">Rate</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-purple-100 text-sm font-medium">Conversion Rate</p>
                <p className="text-4xl font-bold">{analyticsData.overview.conversionRate}%</p>
                <div className="flex items-center gap-1 text-purple-100 text-xs">
                  <Zap className="h-3 w-3" />
                  <span>Above target</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-10 w-10 opacity-80" />
                <Badge className="bg-white/20 text-white border-white/30">Avg</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-orange-100 text-sm font-medium">Avg Transaction</p>
                <p className="text-4xl font-bold">{formatCurrency(analyticsData.overview.averageTransactionValue)}</p>
                <div className="flex items-center gap-1 text-orange-100 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  <span>Per registration</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Registration Status Distribution
            </CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {analyticsData.statusBreakdown.confirmed}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">Confirmed</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                  {analyticsData.statusBreakdown.pending}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500">Pending</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {analyticsData.statusBreakdown.cancelled}
                </p>
                <p className="text-xs text-red-600 dark:text-red-500">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Types Bar Chart */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Registration by Type
            </CardTitle>
            <CardDescription>Breakdown by registration category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Bar dataKey="registrations" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends Area Chart */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Monthly Trends
              </CardTitle>
              <CardDescription>Registration and revenue trends over time</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedMetric === 'registrations' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('registrations')}
              >
                Registrations
              </Button>
              <Button
                variant={selectedMetric === 'revenue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('revenue')}
              >
                Revenue
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              />
              <Legend />
              {selectedMetric === 'registrations' ? (
                <Area 
                  type="monotone" 
                  dataKey="registrations" 
                  stroke={COLORS.primary} 
                  fillOpacity={1}
                  fill="url(#colorRegistrations)"
                  strokeWidth={2}
                />
              ) : (
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={COLORS.success} 
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Institutions with Progress Bars */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-indigo-500" />
              Top Institutions
            </CardTitle>
            <CardDescription>Leading organizations by registration count</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportToCSV(analyticsData.topInstitutions, 'top-institutions')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.topInstitutions.slice(0, 8).map((institution, index) => {
              const percentage = (institution.count / analyticsData.overview.totalRegistrations) * 100
              return (
                <motion.div
                  key={institution.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm
                        ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                          index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                          'bg-gradient-to-r from-blue-400 to-blue-500'}`}>
                        {index + 1}
                      </div>
                      <p className="font-medium text-slate-900 dark:text-white">{institution.name}</p>
                    </div>
                    <Badge variant="secondary" className="font-bold">{institution.count}</Badge>
                  </div>
                  <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.05 }}
                      className={`h-full rounded-full ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                        'bg-gradient-to-r from-blue-400 to-blue-500'
                      }`}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Geographic Distribution - Cities & States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Top 10 Cities
            </CardTitle>
            <CardDescription>Leading cities by registration count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topCities?.slice(0, 10).map((city, index) => {
                const percentage = (city.count / analyticsData.overview.totalRegistrations) * 100
                return (
                  <div key={`${city.city}-${index}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">{index + 1}</Badge>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{city.city}</p>
                          <p className="text-xs text-slate-500">{city.state}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{city.count}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">{formatCurrency(city.revenue)}</p>
                      </div>
                    </div>
                    <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-500" />
              Top 10 States
            </CardTitle>
            <CardDescription>State-wise distribution with city counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topStates?.map((state, index) => (
                <div key={state.state} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                      index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                      'bg-gradient-to-r from-blue-400 to-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{state.state}</p>
                      <p className="text-xs text-slate-500">{state.citiesCount} cities</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="font-bold">{state.count}</Badge>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">{formatCurrency(state.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demographics - Designation & Title */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-500" />
              Professional Designation
            </CardTitle>
            <CardDescription>Breakdown by professional role</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(analyticsData.designationBreakdown || {}).map(([name, data]) => ({
                name,
                count: data.count,
                revenue: data.revenue
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="count" fill={COLORS.indigo} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-500" />
              Title Distribution
            </CardTitle>
            <CardDescription>Distribution by professional title</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={Object.entries(analyticsData.titleDistribution || {}).map(([name, value], index) => ({
                    name,
                    value,
                    color: CHART_COLORS[index % CHART_COLORS.length]
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(analyticsData.titleDistribution || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Time-Based Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Registration by Day of Week
            </CardTitle>
            <CardDescription>Which days see most registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(analyticsData.dayOfWeekDistribution || {}).map(([name, value]) => ({
                name,
                registrations: value
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="registrations" fill={COLORS.orange} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-pink-500" />
              Membership Status
            </CardTitle>
            <CardDescription>Member vs Non-Member breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={Object.entries(analyticsData.membershipStats || {}).map(([name, value], index) => ({
                    name,
                    value,
                    color: index === 0 ? COLORS.success : COLORS.warning
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(analyticsData.membershipStats || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.success : COLORS.warning} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Special Needs</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                  {analyticsData.overview.specialNeedsCount}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Attendees requiring assistance</p>
              </div>
              <Users className="h-12 w-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Dietary Requirements</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">
                  {Object.keys(analyticsData.dietaryRequirements || {}).length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Different dietary needs</p>
              </div>
              <FileText className="h-12 w-12 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Accompanying Persons</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-2">
                  {analyticsData.overview.totalAccompanyingPersons}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">Total guests</p>
              </div>
              <Users className="h-12 w-12 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Panel */}
      <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
            Quick Export Actions
          </CardTitle>
          <CardDescription>Download comprehensive reports in CSV format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="gap-2 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800"
              onClick={exportAll}
            >
              <Download className="h-4 w-4" />
              Full Report
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-slate-800"
              onClick={() => exportToCSV(trendData, 'monthly-trends')}
            >
              <Calendar className="h-4 w-4" />
              Trends
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 bg-white dark:bg-slate-900 hover:bg-green-50 dark:hover:bg-slate-800"
              onClick={() => exportToCSV(typeData, 'type-breakdown')}
            >
              <Award className="h-4 w-4" />
              Types
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 bg-white dark:bg-slate-900 hover:bg-pink-50 dark:hover:bg-slate-800"
              onClick={() => exportToCSV(analyticsData.topInstitutions, 'institutions')}
            >
              <Building className="h-4 w-4" />
              Institutions
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
