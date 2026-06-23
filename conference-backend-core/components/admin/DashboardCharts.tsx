'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Area, AreaChart 
} from 'recharts'
import { TrendingUp, Users, DollarSign, FileText, Calendar } from 'lucide-react'

interface DashboardChartsProps {
  registrationsByCategory: Record<string, number>
  totalRevenue: number
  dailyRegistrations?: Array<{ date: string; count: number }>
  workshopStats?: {
    totalWorkshops: number
    totalParticipants: number
    popularWorkshops: Array<{ name: string; participants: number }>
  }
}

const COLORS = ['#FCCA00', '#FF6B00', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']

export function DashboardCharts({
  registrationsByCategory,
  totalRevenue,
  dailyRegistrations = [],
  workshopStats
}: DashboardChartsProps) {
  // Prepare data for charts
  const registrationData = Object.entries(registrationsByCategory).map(([name, value]) => ({
    name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
    percentage: Math.round((value / Object.values(registrationsByCategory).reduce((a, b) => a + b, 0)) * 100)
  }))

  const workshopData = workshopStats?.popularWorkshops.map(workshop => ({
    name: workshop.name.length > 20 ? workshop.name.substring(0, 20) + '...' : workshop.name,
    participants: workshop.participants
  })) || []

  const revenueData = [
    { name: 'Total Revenue', amount: totalRevenue, target: totalRevenue * 1.2 }
  ]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Registration Breakdown - Pie Chart */}
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Registration Distribution
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Breakdown by category
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={registrationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {registrationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend with counts */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {registrationData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workshop Participation - Bar Chart */}
      {workshopStats && workshopData.length > 0 && (
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Popular Workshops
                </CardTitle>
                <CardDescription className="dark:text-slate-400">
                  Top {workshopData.length} workshops by participation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workshopData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                />
                <Bar dataKey="participants" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Total Workshop Participants: <strong>{workshopStats.totalParticipants}</strong>
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                Across {workshopStats.totalWorkshops} workshops
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Registrations Trend - Area Chart */}
      {dailyRegistrations.length > 0 && (
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-lg xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Registration Trend
                </CardTitle>
                <CardDescription className="dark:text-slate-400">
                  Daily registration activity over time
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyRegistrations}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Revenue Overview */}
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Revenue Analytics
          </CardTitle>
          <CardDescription className="dark:text-emerald-300">
            Financial performance overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-emerald-900 dark:text-emerald-100">
                ₹{totalRevenue.toLocaleString()}
              </span>
              <span className="text-sm text-emerald-600 dark:text-emerald-400">Total Revenue</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/60">
                <p className="text-xs text-slate-600 dark:text-slate-400">Average per Registration</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  ₹{Math.round(totalRevenue / Object.values(registrationsByCategory).reduce((a, b) => a + b, 0) || 1).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/60">
                <p className="text-xs text-slate-600 dark:text-slate-400">Projected Growth</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+20%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
