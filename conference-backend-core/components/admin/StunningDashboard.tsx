'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  Users, CreditCard, TrendingUp, FileText, Calendar,
  ArrowUp, ArrowDown, Activity, DollarSign, CheckCircle,
  Clock, MapPin, Award, Zap
} from 'lucide-react'
import { 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface DashboardData {
  totalRegistrations: number
  paidRegistrations: number
  confirmedRegistrations: number
  pendingPayments: number
  totalRevenue: number
  totalAbstracts: number
  currency: string
  todayStats: {
    registrations: number
    payments: number
    revenue: number
  }
  registrationsByCategory: Record<string, number>
  dailyRegistrations: Array<{ date: string; count: number }>
  workshopStats: {
    totalWorkshops: number
    totalParticipants: number
    popularWorkshops: Array<{ name: string; participants: number }>
  }
  geographicDistribution: {
    topStates: Array<{ state: string; count: number }>
  }
  abstractStats: {
    total: number
    byTrack: Record<string, { submitted: number; accepted: number; total: number }>
  }
  recentActivity: Array<{
    type: string
    timestamp: Date
    userName: string
    details: any
  }>
}

export function StunningDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const primary = conferenceConfig.theme.primary
  const accent = conferenceConfig.theme.accent
  const success = conferenceConfig.theme.success

  useEffect(() => {
    fetchDashboardData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Add timestamp to prevent browser caching
      const response = await fetch(`/api/admin/dashboard?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: primary }} />
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Calculate days to conference
  const eventDate = new Date(conferenceConfig.eventDate.start)
  const today = new Date()
  const daysToGo = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Prepare chart data
  const categoryData = Object.entries(data.registrationsByCategory).map(([name, value]) => ({
    name: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value,
    percentage: ((value / data.totalRegistrations) * 100).toFixed(1)
  }))

  const COLORS = [primary, accent, success, '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-8 shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome Back, Admin! 👋
              </h1>
              <p className="text-white/90 text-lg">
                {conferenceConfig.shortName} • {daysToGo} Days to Go
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Activity className="h-5 w-5 text-white animate-pulse" />
              <span className="text-white font-semibold">Live</span>
            </div>
          </div>

          {/* Quick Stats in Hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-white" />
                <span className="text-white/80 text-sm">Pending</span>
              </div>
              <p className="text-3xl font-bold text-white">{data.pendingPayments}</p>
              <p className="text-white/70 text-xs mt-1">Need attention</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-white" />
                <span className="text-white/80 text-sm">Revenue</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {data.currency} {data.totalRevenue > 0 ? (data.totalRevenue / 100000).toFixed(1) : '0'}L
              </p>
              <p className="text-white/70 text-xs mt-1">+{data.currency}{(data.todayStats.revenue / 1000).toFixed(0)}k today</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-white" />
                <span className="text-white/80 text-sm">Growth</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {data.todayStats.registrations > 0 ? '+' : ''}{data.todayStats.registrations}
              </p>
              <p className="text-white/70 text-xs mt-1">Registrations today</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-white" />
                <span className="text-white/80 text-sm">Active Now</span>
              </div>
              <p className="text-3xl font-bold text-white">{data.confirmedRegistrations}</p>
              <p className="text-white/70 text-xs mt-1">Confirmed attendees</p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
      </motion.div>

      {/* Live Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Registrations"
          value={data.totalRegistrations}
          change={data.todayStats.registrations}
          color={primary}
          subtitle={`+${data.todayStats.registrations} today`}
        />
        <StatCard
          icon={CreditCard}
          title="Payments Received"
          value={data.paidRegistrations}
          change={data.todayStats.payments}
          color={success}
          subtitle={`+${data.todayStats.payments} today`}
        />
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`${data.currency} ${data.totalRevenue > 0 ? (data.totalRevenue / 100000).toFixed(2) : '0.00'}L`}
          change={data.totalRevenue > 0 ? (data.todayStats.revenue / data.totalRevenue) * 100 : 0}
          color={accent}
          subtitle={`+${data.currency}${(data.todayStats.revenue / 1000).toFixed(0)}k today`}
          isAmount
        />
        <StatCard
          icon={CheckCircle}
          title="Confirmed"
          value={data.confirmedRegistrations}
          change={data.totalRegistrations > 0 ? ((data.confirmedRegistrations / data.totalRegistrations) * 100) : 0}
          color={success}
          subtitle={`${data.totalRegistrations > 0 ? ((data.confirmedRegistrations / data.totalRegistrations) * 100).toFixed(0) : 0}% of total`}
          isPercentage
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Registration Breakdown */}
        <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" style={{ color: primary }} />
              Registration Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {categoryData.map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {cat.name}: {cat.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color: accent }} />
              Daily Registrations (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailyRegistrations}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke={primary} 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workshop & Activity Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Workshop Popularity */}
        <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" style={{ color: accent }} />
              Popular Workshops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.workshopStats.popularWorkshops}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="participants" fill={accent} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" style={{ color: success }} />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data.recentActivity.map((activity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                >
                  <div className={`p-2 rounded-full ${
                    activity.type === 'registration' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    activity.type === 'payment' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-purple-100 dark:bg-purple-900/30'
                  }`}>
                    {activity.type === 'registration' && <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    {activity.type === 'abstract' && <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {activity.userName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {activity.type === 'registration' && `Registered as ${activity.details.category}`}
                      {activity.type === 'payment' && `Payment of ${data.currency}${activity.details.amount}`}
                      {activity.type === 'abstract' && `Submitted: ${activity.details.title?.substring(0, 30)}...`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic & Abstract Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top States */}
        <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" style={{ color: primary }} />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.geographicDistribution.topStates.map((state, idx) => (
                <div key={state.state} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{state.state}</span>
                      <span className="text-sm font-semibold" style={{ color: COLORS[idx % COLORS.length] }}>
                        {state.count}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${(state.count / data.totalRegistrations) * 100}%`,
                          backgroundColor: COLORS[idx % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Abstract Stats */}
        <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: accent }} />
              Abstract Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.abstractStats.byTrack).map(([track, stats], idx) => (
                <div key={track}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                      {track.replace(/-/g, ' ')}
                    </span>
                    <Badge variant="outline">
                      {stats.submitted}/{stats.total}
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all"
                      style={{ 
                        width: `${(stats.submitted / stats.total) * 100}%`,
                        backgroundColor: COLORS[idx % COLORS.length]
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {stats.accepted} accepted • {stats.submitted > 0 ? ((stats.accepted / stats.submitted) * 100).toFixed(0) : 0}% acceptance rate
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  change, 
  color, 
  subtitle,
  isAmount = false,
  isPercentage = false
}: any) {
  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      className="relative"
    >
      <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20` }}>
              <Icon className="h-6 w-6" style={{ color }} />
            </div>
            {!isAmount && !isPercentage && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(change)}
              </div>
            )}
          </div>
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          
          {/* Mini sparkline effect */}
          <div className="mt-3 flex gap-1">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 rounded-full transition-all"
                style={{ 
                  height: `${Math.random() * 20 + 10}px`,
                  backgroundColor: `${color}40`
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
