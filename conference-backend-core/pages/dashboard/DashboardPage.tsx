/**
 * User Dashboard Page - Complete UI
 * Copy to: app/dashboard/page.tsx
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/conference-backend-core/components/ui/card'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { Alert, AlertDescription } from '@/conference-backend-core/components/ui/alert'
import {
  User, FileText, CreditCard, Calendar, CheckCircle, Clock,
  AlertCircle, Download, Upload, Mail, Settings, LogOut,
  TrendingUp, Users, Award, ArrowRight
} from 'lucide-react'
import { Navigation } from '@/conference-backend-core/components/Navigation'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { useConferenceTheme } from '@/conference-backend-core/hooks/useConferenceTheme'

interface DashboardData {
  user: any
  abstracts: any[]
  payments: any[]
  stats: {
    totalAbstracts: number
    totalPayments: number
    registrationStatus: string
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const theme = useConferenceTheme()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status, router])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/user/dashboard')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError('Failed to load dashboard data')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.primary }}></div>
      </div>
    )
  }

  if (!data) return null

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      paid: '#10b981',
      cancelled: '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  const stats = [
    {
      title: 'Registration Status',
      value: data.user.registration.status.toUpperCase(),
      icon: User,
      color: getStatusColor(data.user.registration.status),
      link: '/dashboard/profile'
    },
    {
      title: 'Abstracts Submitted',
      value: data.stats.totalAbstracts,
      icon: FileText,
      color: theme.primary,
      link: '/dashboard/abstracts'
    },
    {
      title: 'Payment Status',
      value: data.user.payment?.status || 'Pending',
      icon: CreditCard,
      color: theme.secondary,
      link: '/dashboard/payment'
    },
    {
      title: 'Workshops',
      value: data.user.registration.workshopSelections?.length || 0,
      icon: Award,
      color: theme.accent,
      link: '/dashboard/profile'
    }
  ]

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-[#181818]">
        {/* Header */}
        <div className="bg-white dark:bg-[#1f1f1f] border-b dark:border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {data.user.profile.firstName}!
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {conferenceConfig.name}
                </p>
              </div>
              <Button variant="outline" onClick={() => signOut()} className="dark:border-gray-700 dark:text-gray-300">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Registration Alert */}
        {data.user.registration.status === 'pending' && (
          <Alert className="mb-6" style={{ borderColor: theme.warning, backgroundColor: `${theme.warning}10` }}>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your registration is pending payment verification. Please complete your payment to confirm your registration.
              <Link href="/dashboard/payment" className="ml-2 font-semibold underline">
                View Payment Details
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={stat.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-[#1f1f1f] border-gray-200 dark:border-gray-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold mt-2" style={{ color: stat.color }}>
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className="p-3 rounded-full"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registration Details */}
          <Card className="bg-white dark:bg-[#1f1f1f] border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Registration Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Registration ID</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{data.user.registration.registrationId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                  <Badge>{data.user.registration.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <Badge style={{ backgroundColor: getStatusColor(data.user.registration.status) }}>
                    {data.user.registration.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Registered</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(data.user.registration.registrationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button asChild className="w-full" style={{ backgroundColor: theme.primary }}>
                <Link href="/dashboard/profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/abstracts/submit">
                  <Upload className="mr-2 h-4 w-4" />
                  Submit New Abstract
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/abstracts">
                  <FileText className="mr-2 h-4 w-4" />
                  View My Abstracts
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/payment">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment Status
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Abstracts */}
        {data.abstracts && data.abstracts.length > 0 && (
          <Card className="mt-6 bg-white dark:bg-[#1f1f1f] border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Abstracts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.abstracts.slice(0, 3).map((abstract: any) => (
                  <div
                    key={abstract._id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{abstract.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {abstract.abstractId} • {abstract.track}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{abstract.status}</Badge>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/dashboard/abstracts`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {data.abstracts.length > 3 && (
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/dashboard/abstracts">
                    View All Abstracts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </>
  )
}
