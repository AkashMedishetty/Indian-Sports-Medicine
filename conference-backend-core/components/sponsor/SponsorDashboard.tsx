"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/conference-backend-core/components/ui/card'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { Progress } from '@/conference-backend-core/components/ui/progress'
import { SponsorLayout } from './SponsorLayout'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { 
  Users, UserPlus, FileSpreadsheet, Clock, ArrowRight, 
  CheckCircle, AlertCircle, TrendingUp, Calendar, MapPin,
  Download, Building2, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface SponsorData {
  companyName: string
  category: string
  allocation: { total: number; used: number }
  recentDelegates: Array<{
    _id: string
    name: string
    email: string
    registrationId: string
    status: string
    city?: string
    createdAt: string
  }>
}

export function SponsorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<SponsorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sponsor/login')
    } else if (status === 'authenticated') {
      const user = session?.user as any
      if (user?.role !== 'sponsor') {
        router.push('/sponsor/login')
      } else if (user?.mustChangePassword) {
        router.push('/sponsor/change-password')
      } else {
        fetchDashboard()
      }
    }
  }, [status, session])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/sponsor/dashboard')
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      } else {
        toast.error(result.message || 'Failed to load dashboard')
      }
    } catch (error) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: conferenceConfig.theme.primary }} />
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const remaining = data.allocation.total - data.allocation.used
  const usagePercent = (data.allocation.used / data.allocation.total) * 100

  const stats = [
    {
      title: 'Total Allocation',
      value: data.allocation.total,
      subtitle: 'delegates',
      icon: Users,
      color: conferenceConfig.theme.primary,
    },
    {
      title: 'Registered',
      value: data.allocation.used,
      subtitle: `${usagePercent.toFixed(0)}% used`,
      icon: CheckCircle,
      color: conferenceConfig.theme.success || '#22c55e',
      progress: usagePercent,
    },
    {
      title: 'Remaining',
      value: remaining,
      subtitle: 'slots available',
      icon: remaining <= 2 ? AlertCircle : TrendingUp,
      color: remaining <= 2 ? '#ef4444' : '#3b82f6',
    },
  ]

  const quickActions = [
    {
      title: 'Register Delegate',
      description: 'Add a single delegate with full details',
      icon: UserPlus,
      href: '/sponsor/delegates/register',
      color: conferenceConfig.theme.primary,
      disabled: remaining <= 0,
    },
    {
      title: 'Bulk Upload',
      description: 'Upload CSV with multiple delegates',
      icon: FileSpreadsheet,
      href: '/sponsor/delegates/bulk',
      color: '#22c55e',
      disabled: remaining <= 0,
    },
    {
      title: 'View All Delegates',
      description: `See all ${data.allocation.used} registered delegates`,
      icon: Users,
      href: '/sponsor/delegates',
      color: '#3b82f6',
    },
    {
      title: 'Download Report',
      description: 'Export delegates list as CSV',
      icon: Download,
      href: '/sponsor/delegates?export=true',
      color: '#8b5cf6',
    },
  ]

  return (
    <SponsorLayout sponsorData={data}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div 
            className="rounded-2xl p-6 md:p-8 text-white"
            style={{ backgroundColor: conferenceConfig.theme.primary }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-8 w-8" />
                  <h1 className="text-2xl md:text-3xl font-bold">{data.companyName}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-white/20 text-white border-white/40">
                    {data.category} Sponsor
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/40">
                    <Calendar className="w-3 h-3 mr-1" />
                    {conferenceConfig.eventDate.start}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/40">
                    <MapPin className="w-3 h-3 mr-1" />
                    {conferenceConfig.venue.city}
                  </Badge>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">Delegate Slots</div>
                <div className="text-3xl font-bold">{data.allocation.used} / {data.allocation.total}</div>
                <Progress value={usagePercent} className="h-2 mt-2 bg-white/20" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                      <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{stat.subtitle}</p>
                  {stat.progress !== undefined && (
                    <Progress value={stat.progress} className="h-1.5 mt-3" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Alert for low allocation */}
        {remaining <= 2 && remaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="border rounded-lg p-4 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Low Allocation</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You have only {remaining} delegate slot{remaining > 1 ? 's' : ''} remaining. Contact the organizers if you need more.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {remaining <= 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="border rounded-lg p-4 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">Allocation Exhausted</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  You have used all your delegate slots. Contact the organizers to request additional allocation.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Link href={action.disabled ? '#' : action.href}>
                <Card className={`h-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:border-slate-300 cursor-pointer'
                }`}>
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${action.color}15` }}>
                      <action.icon className="w-6 h-6" style={{ color: action.color }} />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{action.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent Registrations */}
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Clock className="h-5 w-5" />
                  Recent Registrations
                </CardTitle>
                <CardDescription>Latest delegates registered by your organization</CardDescription>
              </div>
              <Link href="/sponsor/delegates">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentDelegates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 mb-4">No delegates registered yet</p>
                <Link href="/sponsor/delegates/register">
                  <Button style={{ backgroundColor: conferenceConfig.theme.primary }}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register First Delegate
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentDelegates.slice(0, 5).map((delegate) => (
                  <div
                    key={delegate._id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: conferenceConfig.theme.primary }}>
                        {delegate.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{delegate.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{delegate.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="font-mono">{delegate.registrationId}</Badge>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(delegate.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SponsorLayout>
  )
}
