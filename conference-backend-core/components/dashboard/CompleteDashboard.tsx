'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/conference-backend-core/components/ui/card'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { MainLayout } from '@/conference-backend-core/components/layout/MainLayout'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { BadgeDisplay } from '@/conference-backend-core/components/user/BadgeDisplay'
import { CertificateDisplay } from '@/conference-backend-core/components/user/CertificateDisplay'
import { WorkshopAddon } from '@/conference-backend-core/components/user/WorkshopAddon'
import {
  User, FileText, CreditCard, Calendar, CheckCircle, Clock, Settings, Award, 
  ArrowRight, Download, Upload, MapPin, Mail, Phone, Building, FileDown,
  BookOpen, QrCode, Receipt, AlertCircle, ExternalLink, Loader2
} from 'lucide-react'

export function CompleteDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [badgeConfigured, setBadgeConfigured] = useState(false)
  const [certificateConfigured, setCertificateConfigured] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      // Redirect sponsors to their portal - they shouldn't access user dashboard
      const userRole = (session?.user as any)?.role
      if (userRole === 'sponsor') {
        router.push('/sponsor/dashboard')
        return
      }
      fetchDashboardData()
    }
  }, [status, router, session])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/user/dashboard')
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
      
      // Check if badge is configured by trying to fetch user's badge
      try {
        const badgeResponse = await fetch('/api/user/badge')
        // If badge loads successfully (200), it's configured
        // 404 is expected when badge is not configured - not an error
        setBadgeConfigured(badgeResponse.status === 200)
      } catch (badgeError) {
        // Network error or other issue - assume not configured
        setBadgeConfigured(false)
      }

      // Check if certificate is configured by trying to fetch user's certificate
      try {
        const certificateResponse = await fetch('/api/user/certificate')
        // If certificate loads successfully (200), it's configured
        // 404 is expected when certificate is not configured - not an error
        setCertificateConfigured(certificateResponse.status === 200)
      } catch (certificateError) {
        // Network error or other issue - assume not configured
        setCertificateConfigured(false)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <MainLayout currentPage="dashboard" showSearch={false}>
        <div className="min-h-screen bg-white dark:bg-[#181818] flex items-center justify-center">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" 
              style={{ borderColor: conferenceConfig.theme.primary }}
            />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const user = data.user

  // Check if user has registration data
  if (!user?.registration) {
    return (
      <MainLayout currentPage="dashboard" showSearch={false}>
        <div className="min-h-screen bg-white dark:bg-[#181818] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Registration Required
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You need to complete your registration to access the dashboard.
            </p>
            <Link href="/register">
              <Button 
                className="w-full"
                style={{ backgroundColor: conferenceConfig.theme.primary }}
              >
                Complete Registration
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  const isConfirmed = user.registration.status === 'confirmed' || user.registration.status === 'paid'

  // Debug: Log payment data
  console.log('Dashboard Debug - Payment Data:', {
    hasEmbeddedPayment: !!user.payment,
    embeddedPaymentId: user.payment?._id,
    paymentsCount: data.payments?.length || 0,
    paymentDetails: data.payments?.map((p: any) => ({
      id: p._id,
      type: p.type,
      typeValue: JSON.stringify(p.type),
      typeIsUndefined: p.type === undefined,
      typeIsNull: p.type === null,
      status: p.status,
      amount: p.amount?.total,
      hasWorkshops: !!p.workshops?.length,
      workshopCount: p.workshops?.length || 0
    }))
  })
  
  // Also log which button conditions are met
  console.log('Invoice Button Conditions:', {
    hasAnyPayment: !!(user.payment || (data.payments && data.payments.length > 0)),
    hasNonWorkshopPayment: !!data.payments?.find((p: any) => p.status === 'completed' && p.type !== 'workshop-addon'),
    hasWorkshopPayment: !!data.payments?.find((p: any) => p.status === 'completed' && p.type === 'workshop-addon')
  })

  const getCategoryLabel = (type: string) => {
    const category = conferenceConfig.registration.categories.find(cat => cat.key === type)
    return category?.label || type
  }

  const handleDownloadCertificate = async (format: 'png' | 'pdf') => {
    setDownloading(`certificate-${format}`)
    try {
      const response = await fetch(`/api/user/certificate/download?format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${user.registration.registrationId}.${format}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadInvoice = async () => {
    setDownloading('invoice')
    try {
      window.open(`/api/payment/invoice/${user.payment._id}`, '_blank')
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to open invoice.')
    } finally {
      setDownloading(null)
    }
  }

  // Stats Cards Data
  const stats = [
    {
      title: 'Registration',
      value: user.registration.status.charAt(0).toUpperCase() + user.registration.status.slice(1),
      icon: User,
      color: isConfirmed ? conferenceConfig.theme.success : conferenceConfig.theme.warning,
      link: '/dashboard/profile'
    },
    {
      title: 'Abstracts',
      value: `${data.abstracts?.length || 0}/${conferenceConfig.abstracts.maxAbstractsPerUser}`,
      icon: FileText,
      color: conferenceConfig.theme.primary,
      link: '/dashboard/abstracts'
    },
    {
      title: 'Payment',
      value: (user.payment?.status === 'verified' || user.registration.status === 'paid') ? 'Verified' : (user.payment?.status || 'Pending'),
      icon: CreditCard,
      color: (user.payment?.status === 'verified' || user.registration.status === 'paid') ? conferenceConfig.theme.success : conferenceConfig.theme.warning,
      link: '/dashboard/payment'
    },
    {
      title: 'Workshops',
      value: `${user.registration.workshopSelections?.length || 0}`,
      icon: Award,
      color: conferenceConfig.theme.secondary,
      link: '#workshops'
    }
  ]

  return (
    <MainLayout currentPage="dashboard" showSearch={false}>
      <div className="min-h-screen bg-white dark:bg-[#181818]">
        
        {/* Header Section - Solid Color */}
        <div 
          className="border-b border-slate-200 dark:border-[#2a2a2a]"
          style={{ backgroundColor: conferenceConfig.theme.primary }}
        >
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Welcome Section */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white"
                >
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Welcome back, {user.profile.title} {user.profile.firstName} {user.profile.lastName}!
                  </h1>
                  <p className="text-white/90 text-lg mb-4">
                    {conferenceConfig.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/20 text-white border-white/40">
                      <Calendar className="w-3 h-3 mr-1" />
                      {conferenceConfig.eventDate.start} - {conferenceConfig.eventDate.end}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/40">
                      <MapPin className="w-3 h-3 mr-1" />
                      {conferenceConfig.venue.city}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/40">
                      Registration: {user.registration.registrationId}
                    </Badge>
                  </div>
                </motion.div>
              </div>

              {/* Quick Badge Preview */}
              {isConfirmed && conferenceConfig.features.qrCodeGeneration && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-[#1f1f1f] rounded-lg p-4 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Your Badge</h3>
                    <QrCode className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="bg-slate-100 dark:bg-[#2a2a2a] rounded p-3">
                      <QrCode className="h-16 w-16 mx-auto text-slate-600 dark:text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {user.profile.title} {user.profile.firstName} {user.profile.lastName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {getCategoryLabel(user.registration.type)}
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full mt-2"
                      style={{ backgroundColor: conferenceConfig.theme.primary }}
                      asChild
                    >
                      <a href="#badge-section">
                        <Download className="h-3 w-3 mr-2" />
                        Download Badge
                      </a>
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={stat.link}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1f1f1f]">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div 
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: `${stat.color}15` }}
                        >
                          <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {stat.value}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Alert for Pending Payment */}
          {(user.registration.status === 'pending' || user.registration.status === 'pending-payment') && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div 
                className="border rounded-lg p-4 flex items-start gap-3"
                style={{ 
                  backgroundColor: `${conferenceConfig.theme.warning}10`,
                  borderColor: `${conferenceConfig.theme.warning}40`
                }}
              >
                <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: conferenceConfig.theme.warning }} />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Payment Pending</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Your registration is pending payment verification. Please complete your payment to confirm your registration.
                  </p>
                  <Button 
                    size="sm"
                    style={{ backgroundColor: conferenceConfig.theme.primary }}
                    asChild
                  >
                    <Link href="/dashboard/payment">
                      Complete Payment <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Quick Actions */}
              <Card className="border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1f1f1f]">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Quick Actions</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Common tasks and downloads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Submit Abstract */}
                    {conferenceConfig.features.abstractSubmission && (
                      <Button
                        className="h-auto py-4 justify-start"
                        variant="outline"
                        disabled={(data.abstracts?.length || 0) >= conferenceConfig.abstracts.maxAbstractsPerUser}
                        asChild={(data.abstracts?.length || 0) < conferenceConfig.abstracts.maxAbstractsPerUser}
                      >
                        <Link href="/abstracts">
                          <Upload className="h-5 w-5 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold">Submit Abstract</div>
                            <div className="text-xs text-slate-500">
                              {data.abstracts?.length || 0}/{conferenceConfig.abstracts.maxAbstractsPerUser} used
                            </div>
                          </div>
                        </Link>
                      </Button>
                    )}

                    {/* Download Certificate */}
                    {conferenceConfig.features.certificateGeneration && certificateConfigured && (
                      <Button
                        className="h-auto py-4 justify-start"
                        variant="outline"
                        asChild
                      >
                        <a href="#certificate-section">
                          <Award className="h-5 w-5 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold">Download Certificate</div>
                            <div className="text-xs text-slate-500">Participation certificate</div>
                          </div>
                        </a>
                      </Button>
                    )}

                    {/* Download Badge */}
                    {isConfirmed && conferenceConfig.features.qrCodeGeneration && (
                      <Button
                        className="h-auto py-4 justify-start"
                        variant="outline"
                        asChild
                      >
                        <a href="#badge-section">
                          <QrCode className="h-5 w-5 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold">Download Badge</div>
                            <div className="text-xs text-slate-500">Event entry pass</div>
                          </div>
                        </a>
                      </Button>
                    )}

                    {/* Download Invoices */}
                    {/* Show if either embedded payment OR Payment collection exists */}
                    {(user.payment || (data.payments && data.payments.length > 0)) && (
                      <>
                        {/* Registration Invoice - show for any completed payment that is NOT a workshop addon */}
                        {data.payments?.find((p: any) => p.status === 'completed' && p.type !== 'workshop-addon') ? (
                          <Button
                            className="h-auto py-4 justify-start"
                            variant="outline"
                            onClick={async () => {
                              try {
                                setDownloading('invoice-registration')
                                // Find registration payment (any completed payment except workshop-addon)
                                const registrationPayment = data.payments.find((p: any) => 
                                  p.status === 'completed' && p.type !== 'workshop-addon'
                                )
                                if (registrationPayment) {
                                  console.log('Opening invoice for payment:', registrationPayment._id)
                                  window.open(`/api/payment/invoice/${registrationPayment._id}`, '_blank')
                                }
                              } catch (error) {
                                console.error('Error downloading invoice:', error)
                              } finally {
                                setDownloading(null)
                              }
                            }}
                            disabled={downloading === 'invoice-registration'}
                          >
                            {downloading === 'invoice-registration' ? (
                              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                            ) : (
                              <Receipt className="h-5 w-5 mr-3" />
                            )}
                            <div className="text-left">
                              <div className="font-semibold">Registration Invoice</div>
                              <div className="text-xs text-slate-500">Main registration receipt</div>
                            </div>
                          </Button>
                        ) : user.payment ? (
                          <Button
                            className="h-auto py-4 justify-start"
                            variant="outline"
                            onClick={handleDownloadInvoice}
                            disabled={downloading === 'invoice'}
                          >
                            {downloading === 'invoice' ? (
                              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                            ) : (
                              <Receipt className="h-5 w-5 mr-3" />
                            )}
                            <div className="text-left">
                              <div className="font-semibold">Download Invoice</div>
                              <div className="text-xs text-slate-500">Payment receipt</div>
                            </div>
                          </Button>
                        ) : null}

                        {/* Workshop Invoice - only for Payment collection */}
                        {data.payments?.find((p: any) => p.status === 'completed' && p.type === 'workshop-addon') && (
                          <Button
                            className="h-auto py-4 justify-start"
                            variant="outline"
                            onClick={async () => {
                              try {
                                setDownloading('invoice-workshop')
                                const workshopPayment = data.payments.find((p: any) => 
                                  p.status === 'completed' && p.type === 'workshop-addon'
                                )
                                if (workshopPayment) {
                                  window.open(`/api/payment/invoice/${workshopPayment._id}`, '_blank')
                                }
                              } catch (error) {
                                console.error('Error downloading invoice:', error)
                              } finally {
                                setDownloading(null)
                              }
                            }}
                            disabled={downloading === 'invoice-workshop'}
                          >
                            {downloading === 'invoice-workshop' ? (
                              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                            ) : (
                              <BookOpen className="h-5 w-5 mr-3" />
                            )}
                            <div className="text-left">
                              <div className="font-semibold">Workshop Invoice</div>
                              <div className="text-xs text-slate-500">Workshop addon receipt</div>
                            </div>
                          </Button>
                        )}
                      </>
                    )}

                    {/* Edit Profile */}
                    <Button
                      className="h-auto py-4 justify-start"
                      variant="outline"
                      asChild
                    >
                      <Link href="/dashboard/profile">
                        <Settings className="h-5 w-5 mr-3" />
                        <div className="text-left">
                          <div className="font-semibold">Edit Profile</div>
                          <div className="text-xs text-slate-500">Update details</div>
                        </div>
                      </Link>
                    </Button>

                    {/* Add Workshop */}
                    {isConfirmed && conferenceConfig.features.workshopBooking && (
                      <Button
                        className="h-auto py-4 justify-start"
                        variant="outline"
                        asChild
                      >
                        <a href="#workshops">
                          <BookOpen className="h-5 w-5 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold">Add Workshop</div>
                            <div className="text-xs text-slate-500">Register for workshops</div>
                          </div>
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Abstracts */}
              {conferenceConfig.features.abstractSubmission && data.abstracts && data.abstracts.length > 0 && (
                <Card className="border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1f1f1f]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-900 dark:text-white">Your Abstracts</CardTitle>
                      <Link href="/dashboard/abstracts">
                        <Button variant="ghost" size="sm">
                          View All <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.abstracts.slice(0, 3).map((abstract: any) => (
                        <div
                          key={abstract._id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                                {abstract.title}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {abstract.abstractId} • {abstract.track}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="flex-shrink-0"
                              style={{
                                borderColor: abstract.status === 'accepted' ? conferenceConfig.theme.success : 
                                           abstract.status === 'rejected' ? conferenceConfig.theme.error : 
                                           conferenceConfig.theme.warning,
                                color: abstract.status === 'accepted' ? conferenceConfig.theme.success : 
                                       abstract.status === 'rejected' ? conferenceConfig.theme.error : 
                                       conferenceConfig.theme.warning
                              }}
                            >
                              {abstract.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Workshop Add-on */}
              {isConfirmed && conferenceConfig.features.workshopBooking && (
                <div id="workshops">
                  <WorkshopAddon
                    userEmail={user.email}
                    registrationId={user.registration.registrationId}
                    existingWorkshops={user.registration.workshopSelections || []}
                    maxWorkshops={conferenceConfig.registration.maxWorkshopsPerUser}
                  />
                </div>
              )}

              {/* Badge Display */}
              {isConfirmed && conferenceConfig.features.qrCodeGeneration && (
                <div id="badge-section">
                  {badgeConfigured ? (
                    <BadgeDisplay />
                  ) : (
                    <Card className="border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1f1f1f]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                          <QrCode className="h-5 w-5" />
                          Event Badge
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                          Your conference badge will be available soon
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-8 text-center">
                          <div className="inline-block bg-white dark:bg-slate-700 rounded-lg p-6 shadow-lg mb-4">
                            <QrCode className="h-32 w-32 text-slate-400" />
                          </div>
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                            {user.profile.title} {user.profile.firstName} {user.profile.lastName}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                            {user.profile.institution}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
                            {getCategoryLabel(user.registration.type)} • {user.registration.registrationId}
                          </p>
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              The badge design is being prepared by the event organizers. 
                              You'll be able to download your badge once it's ready.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Certificate Display */}
              {/* Certificate is admin-controlled - shows when admin configures and enables it */}
              {/* This allows admin to control when certificates are available (typically after event) */}
              {conferenceConfig.features.certificateGeneration && certificateConfigured && (
                <div id="certificate-section">
                  <CertificateDisplay />
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              
              {/* Registration Details */}
              <Card className="border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1f1f1f]">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Registration Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Registration ID</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{user.registration.registrationId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Type</p>
                    <Badge className="mt-1">{getCategoryLabel(user.registration.type)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                    <Badge 
                      className="mt-1"
                      style={{ 
                        backgroundColor: isConfirmed ? conferenceConfig.theme.success : conferenceConfig.theme.warning 
                      }}
                    >
                      {user.registration.status.charAt(0).toUpperCase() + user.registration.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Registered</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {new Date(user.registration.registrationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    style={{ backgroundColor: conferenceConfig.theme.primary }}
                    asChild
                  >
                    <Link href="/dashboard/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Conference Information */}
              <Card className="border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1f1f1f]">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Conference Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Dates</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {conferenceConfig.eventDate.start} - {conferenceConfig.eventDate.end}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Venue</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {conferenceConfig.venue.name}<br />
                        {conferenceConfig.venue.city}, {conferenceConfig.venue.state}
                      </p>
                    </div>
                  </div>
                  {conferenceConfig.tagline && (
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Theme</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {conferenceConfig.tagline}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Need Help */}
              <Card className="border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1f1f1f]">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a 
                    href={`mailto:${conferenceConfig.contact.supportEmail || conferenceConfig.contact.email}`}
                    className="flex items-center gap-3 text-sm hover:underline text-slate-600 dark:text-slate-400"
                  >
                    <Mail className="h-4 w-4" />
                    {conferenceConfig.contact.supportEmail || conferenceConfig.contact.email}
                  </a>
                  <a 
                    href={`tel:${conferenceConfig.contact.phone}`}
                    className="flex items-center gap-3 text-sm hover:underline text-slate-600 dark:text-slate-400"
                  >
                    <Phone className="h-4 w-4" />
                    {conferenceConfig.contact.phone}
                  </a>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <Link href="/contact">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
