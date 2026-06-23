"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/conference-backend-core/components/ui/tabs"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Progress } from "@/conference-backend-core/components/ui/progress"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { 
  User, 
  CreditCard, 
  FileText, 
  Calendar, 
  MapPin, 
  Mail,
  Phone,
  Building,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Edit,
  RefreshCw,
  Eye,
  Star,
  Award,
  BookOpen,
  UserCheck,
  DollarSign,
  Receipt,
  QrCode,
  Share2,
  Activity,
  TrendingUp,
  Zap,
  Shield,
  Target,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/conference-backend-core/components/ui/use-toast"
import { RegistrationCard } from "@/conference-backend-core/components/dashboard/RegistrationCard"
import { PaymentStatus } from "@/conference-backend-core/components/dashboard/PaymentStatus"
import { ProfileForm } from "@/conference-backend-core/components/dashboard/ProfileForm"
import { WorkshopAddon } from "@/conference-backend-core/components/user/WorkshopAddon"
import { BadgeDisplay } from "@/conference-backend-core/components/user/BadgeDisplay"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

interface UserData {
  _id: string
  email: string
  profile: {
    title: string
    firstName: string
    lastName: string
    phone: string
    institution: string
    address: {
      street: string
      city: string
      state: string
      country: string
      pincode: string
    }
    profilePicture?: string
    dietaryRequirements?: string
    specialNeeds?: string
  }
  registration: {
    registrationId: string
    type: string
    status: string
    membershipNumber?: string
    workshopSelections: string[]
    accompanyingPersons: Array<{
      name: string
      age: number
      relationship: string
      dietaryRequirements?: string
    }>
    registrationDate: string
    paymentDate?: string
  }
  role: string
  createdAt: string
}

interface PaymentData {
  _id: string
  amount: {
    total: number
    currency: string
    registration: number
    workshops: number
    accompanyingPersons: number
    discount: number
  }
  breakdown: {
    registrationType: string
    baseAmount: number
    gst: number
    gstPercentage: number
    workshopFees: Array<{
      name: string
      amount: number
    }>
    accompanyingPersonFees: number
    discountsApplied: Array<{
      type: string
      code?: string
      percentage: number
      amount: number
    }>
  }
  status: string
  transactionDate: string
  razorpayPaymentId: string
  invoiceGenerated: boolean
  invoicePath?: string
}

export function EnhancedUserDashboard() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const shouldReduceMotion = useReducedMotion()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeView, setActiveView] = useState('overview')

  const fetchUserData = async (showRefreshMessage = false) => {
    try {
      if (showRefreshMessage) {
        setRefreshing(true)
        toast({
          title: "Refreshing Data",
          description: "Updating your dashboard information..."
        })
      }

      const [userResponse, paymentResponse] = await Promise.all([
        fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }),
        fetch('/api/user/payments', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
      ])

      if (userResponse.ok) {
        const userResult = await userResponse.json()
        if (userResult.success) {
          setUserData(userResult.data)
        }
      }

      if (paymentResponse.ok) {
        const paymentResult = await paymentResponse.json()
        if (paymentResult.success) {
          setPaymentData(paymentResult.payments || [])
        }
      }

      if (showRefreshMessage) {
        toast({
          title: "Dashboard Updated",
          description: "Your information has been refreshed successfully."
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchUserData()
    }
  }, [session])

  // Auto-refresh data when returning to tab or when payment succeeds
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.user) {
        fetchUserData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [session])

  // Check URL params for payment success and refresh
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('payment') === 'success') {
      // Wait a moment for backend to process payment
      setTimeout(() => {
        fetchUserData(true)
      }, 2000)
    }
  }, [])

  const handleDownloadInvoice = async (paymentId: string, registrationId: string) => {
    setIsDownloading(true)
    try {
      // Open invoice in new window
      const invoiceUrl = `/api/payment/invoice/${paymentId}`
      const newWindow = window.open(invoiceUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
      
      if (newWindow) {
        toast({
          title: "Invoice Opened",
          description: "Your invoice has been opened in a new window. You can print it as PDF."
        })
      } else {
        // Fallback: direct navigation if popup blocked
        window.location.href = invoiceUrl
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while opening the invoice.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`
    }
    return `â‚¹${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Date not available'
    }
  }

  const getRegistrationProgress = () => {
    if (!userData) return 0
    const steps = [
      userData.profile.firstName,
      userData.registration.registrationId,
      paymentData.some(p => p.status === 'completed')
    ]
    return (steps.filter(Boolean).length / steps.length) * 100
  }

  const getRegistrationTypeLabel = (type: string) => {
    if (!type) return "Unknown"
    
    // Get label from conference config
    const category = conferenceConfig.registration?.categories?.find(cat => cat.key === type)
    if (category) return category.label
    
    // Fallback to formatted string
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-[#25406b]" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load your profile information. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  const latestPayment = paymentData.length > 0 ? paymentData[0] : null
  const isRegistrationComplete = ['paid','confirmed'].includes(userData.registration.status?.toLowerCase()) || ['completed','verified','paid'].includes(latestPayment?.status?.toLowerCase() || '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-ocean-50/40 to-sapphire-50/20 dark:from-midnight-950 dark:to-midnight-900">
      {/* Sidebar Navigation - Mobile Responsive Layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar */}
        <div className="w-full lg:w-80 min-h-screen bg-gradient-to-b from-midnight-900 via-ocean-900 to-sapphire-900 p-4 lg:p-6 text-white">
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: -20 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* User Profile Card */}
            <Card variant="glass" className="mb-8 border-white/25 bg-white/5">
              <CardContent className="p-6 text-center text-white">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-ocean-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                  {userData.profile.firstName.charAt(0)}{userData.profile.lastName.charAt(0)}
                </div>
                <h2 className="font-display text-fluid-lg font-bold text-white mb-2">
                  {userData.profile.title} {userData.profile.firstName} {userData.profile.lastName}
                </h2>
                <Badge variant="success" size="sm" className="mb-3">
                  {userData.registration.registrationId}
                </Badge>
                <p className="text-fluid-sm text-white/90">
                  {userData.profile.institution}
                </p>
              </CardContent>
            </Card>

            {/* Navigation Menu */}
            <nav className="space-y-2 lg:space-y-2 lg:space-x-0">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {[
                  { id: 'overview', label: 'Overview', icon: Activity },
                  { id: 'registration', label: 'Registration', icon: FileText },
                  { id: 'payment', label: 'Payment', icon: CreditCard },
                  { id: 'profile', label: 'Profile', icon: User },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center justify-center lg:justify-start space-x-2 lg:space-x-3 px-2 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-200 text-sm lg:text-base ${
                      activeView === item.id
                        ? 'bg-white/25 text-white shadow-lg ring-1 ring-white/30'
                        : 'text-white/85 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Quick Actions */}
            <div className="mt-8 space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-white/50 text-white hover:bg-white/20"
                onClick={() => fetchUserData(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              
              {userData.role === 'admin' && (
                <Button variant="glass" size="sm" className="w-full" asChild>
                  <Link href="/admin">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div
                key="overview"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="mb-8">
                  <h1 className="font-display text-fluid-5xl font-bold text-midnight-800 dark:text-white mb-2">
                    Dashboard Overview
                  </h1>
                  <p className="text-fluid-lg text-midnight-600 dark:text-midnight-300">
                    Welcome back! Here's your ${conferenceConfig.shortName} registration status.
                  </p>
                </div>

                {/* Stats Grid - Horizontal Layout */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    {
                      title: 'Registration',
                      value: userData.registration.status === 'paid' ? 'Complete' : 'Pending',
                      icon: CheckCircle,
                      color: userData.registration.status === 'paid' ? 'emerald' : 'amber',
                      progress: userData.registration.status === 'paid' ? 100 : 75
                    },
                    {
                      title: 'Payment',
                      value: latestPayment ? formatCurrency(latestPayment.amount.total, latestPayment.amount.currency) : 'Pending',
                      icon: DollarSign,
                      color: latestPayment?.status === 'completed' ? 'emerald' : 'coral',
                      progress: latestPayment?.status === 'completed' ? 100 : 0
                    },
                    {
                      title: 'Workshops',
                      value: userData.registration.workshopSelections?.length || 0,
                      icon: BookOpen,
                      color: 'ocean',
                      progress: (userData.registration.workshopSelections?.length || 0) * 25
                    },
                    {
                      title: 'Days Left',
                      value: Math.max(0, Math.ceil((new Date('2026-02-06').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
                      icon: Calendar,
                      color: 'sapphire',
                      progress: 85
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                      animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card variant="glass" className="relative overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${
                              stat.color === 'emerald' ? 'from-emerald-500 to-emerald-600' :
                              stat.color === 'amber' ? 'from-amber-400 to-amber-500' :
                              stat.color === 'coral' ? 'from-coral-400 to-coral-500' :
                              stat.color === 'ocean' ? 'from-ocean-500 to-ocean-600' :
                              'from-sapphire-500 to-sapphire-600'
                            } text-white`}>
                              <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                              <div className={`text-fluid-2xl font-black ${
                                stat.color === 'emerald' ? 'text-emerald-600' :
                                stat.color === 'amber' ? 'text-amber-600' :
                                stat.color === 'coral' ? 'text-coral-500' :
                                stat.color === 'ocean' ? 'text-ocean-600' :
                                'text-sapphire-600'
                              }`}>
                                {stat.value}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-fluid-sm font-semibold text-midnight-700 dark:text-midnight-300">
                                {stat.title}
                              </span>
                              <span className="text-fluid-xs text-midnight-500">
                                {stat.progress}%
                              </span>
                            </div>
                            <Progress 
                              value={stat.progress} 
                              className="h-2"
                              indicatorVariant={stat.color === 'emerald' ? 'success' : stat.color === 'coral' ? 'danger' : 'default'}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Conference Info - Wide Card */}
                <motion.div
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Card variant="gradient" className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-ocean-600/10 to-sapphire-600/10"></div>
                    <CardContent className="p-8 relative">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-display text-fluid-2xl font-bold text-midnight-800 dark:text-white mb-2">
                            ${conferenceConfig.shortName}
                          </h3>
                          <p className="text-midnight-600 dark:text-midnight-300">
                            Annual Conference of Orthopaedic Surgeons Society of Andhra Pradesh
                          </p>
                        </div>
                        <div className="flex space-x-4">
                          <Button variant="default" size="lg" asChild>
                            <Link href="/program">
                              <BookOpen className="w-5 h-5 mr-2" />
                              View Program
                            </Link>
                          </Button>
                          {latestPayment && ['completed','verified','paid'].includes(latestPayment.status?.toLowerCase()) && (
                            <Button 
                              variant="outline" 
                              size="lg"
                              onClick={() => handleDownloadInvoice(latestPayment._id, userData.registration.registrationId)}
                              disabled={isDownloading}
                            >
                              <Download className="w-5 h-5 mr-2" />
                              {isDownloading ? 'Opening...' : 'Invoice'}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 rounded-xl bg-ocean-500 text-white">
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-midnight-800 dark:text-white">Conference Dates</p>
                            <p className="text-midnight-600 dark:text-midnight-300">{conferenceConfig.eventDate?.start} - {conferenceConfig.eventDate?.end}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="p-3 rounded-xl bg-emerald-500 text-white">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-midnight-800 dark:text-white">Location</p>
                            <p className="text-midnight-600 dark:text-midnight-300">{conferenceConfig.venue?.city}, {conferenceConfig.venue?.state}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                            <Users className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-midnight-800 dark:text-white">Conference Theme</p>
                            <p className="text-midnight-600 dark:text-midnight-300">{conferenceConfig.tagline || 'Professional Development'}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-ocean-600" />
                        <span>Registration Status</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Profile Complete</span>
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Registration Created</span>
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Payment Status</span>
                          {isRegistrationComplete ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-500" />
                          )}
                        </div>
                        {!isRegistrationComplete && (
                          <Button 
                            className="w-full mt-4 bg-gray-400 text-gray-600 cursor-not-allowed" 
                            disabled
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Payment Temporarily Disabled
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        <span>Quick Actions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                          <Link href="/dashboard/profile">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                          <Link href="/program">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Conference Program
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                          <Link href="/venue">
                            <MapPin className="w-4 h-4 mr-2" />
                            Venue Information
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Other views would go here with similar motion animations */}
            {activeView === 'registration' && (
              <motion.div
                key="registration"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RegistrationCard userData={userData} onUpdate={fetchUserData} />
              </motion.div>
            )}

            {activeView === 'payment' && (
              <motion.div
                key="payment"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PaymentStatus 
                  registrationStatus={userData?.registration?.status || 'pending'}
                  paymentData={paymentData}
                  detailed={true}
                />
              </motion.div>
            )}

            {activeView === 'profile' && (
              <motion.div
                key="profile"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ProfileForm />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Registration Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-2 border-[#b0c1db] dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#25406b]" />
              Registration Progress
            </CardTitle>
            <CardDescription>
              Your journey to ${conferenceConfig.shortName} Conference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(getRegistrationProgress())}%</span>
              </div>
              <Progress value={getRegistrationProgress()} className="h-2" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Profile Complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Registration Created</span>
                </div>
                <div className="flex items-center gap-2">
                  {isRegistrationComplete ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-[#25406b]" />
                  )}
                  <span className="text-sm">
                    {isRegistrationComplete ? 'Payment Complete' : 'Payment Pending'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="registration" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Registration
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Registration Status */}
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-[#f0f3f8]0" />
                    Registration Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-2">
                    <Badge className={getStatusColor(userData.registration.status)}>
                      {getStatusIcon(userData.registration.status)}
                      <span className="ml-1">
                        {userData.registration.status.charAt(0).toUpperCase() + userData.registration.status.slice(1)}
                      </span>
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Type: {getRegistrationTypeLabel(userData.registration.type)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Registered: {formatDate(userData.registration.registrationDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  {latestPayment ? (
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {formatCurrency(latestPayment.amount.total, latestPayment.amount.currency)}
                      </div>
                      <Badge className={getStatusColor(latestPayment.status)}>
                        {getStatusIcon(latestPayment.status)}
                        <span className="ml-1">
                          {latestPayment.status.charAt(0).toUpperCase() + latestPayment.status.slice(1)}
                        </span>
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Paid: {formatDate(latestPayment.transactionDate)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-muted-foreground">Pending</div>
                      {/* Pay Now temporarily disabled */}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-950" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-[#25406b]" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  {latestPayment && ['completed','verified','paid'].includes(latestPayment.status?.toLowerCase()) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownloadInvoice(latestPayment._id, userData.registration.registrationId)}
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading ? 'Opening...' : 'View Invoice'}
                    </Button>
                  )}
                  {/* Fallback for bank-transfer embedded payment: allow invoice via pseudo id when reg is paid/confirmed */}
                  {!latestPayment && ['paid','confirmed'].includes(userData.registration.status?.toLowerCase()) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownloadInvoice(`userpay_${userData._id}`, userData.registration.registrationId)}
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading ? 'Opening...' : 'View Invoice'}
                    </Button>
                  )}
                  {/* If a payment exists but is not yet marked completed, still allow invoice when registration is paid/confirmed */}
                  {latestPayment && !['completed','verified','paid'].includes(latestPayment.status?.toLowerCase()) && ['paid','confirmed'].includes(userData.registration.status?.toLowerCase()) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownloadInvoice(`userpay_${userData._id}`, userData.registration.registrationId)}
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading ? 'Opening...' : 'View Invoice'}
                    </Button>
                  )}
                  <Link href="/dashboard/profile">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                  <Link href="/program">
                    <Button variant="outline" size="sm" className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Program
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Conference Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#25406b]" />
                  Conference Information
                </CardTitle>
                <CardDescription>
                  {conferenceConfig.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-[#25406b]" />
                    <div>
                      <p className="font-semibold">Dates</p>
                      <p className="text-sm text-muted-foreground">{conferenceConfig.eventDate?.start} - {conferenceConfig.eventDate?.end}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-8 w-8 text-[#25406b]" />
                    <div>
                      <p className="font-semibold">Location</p>
                      <p className="text-sm text-muted-foreground">{conferenceConfig.venue?.city}, {conferenceConfig.venue?.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-[#25406b]" />
                    <div>
                      <p className="font-semibold">Conference Theme</p>
                      <p className="text-sm text-muted-foreground">{conferenceConfig.tagline || 'Join Us'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registration Tab */}
          <TabsContent value="registration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registration Details</CardTitle>
                <CardDescription>
                  Your conference registration information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Registration ID</label>
                      <p className="text-lg font-semibold">{userData.registration.registrationId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Registration Type</label>
                      <p className="text-lg">{getRegistrationTypeLabel(userData.registration.type)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                      <p className="text-lg">{formatDate(userData.registration.registrationDate)}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(userData.registration.status)}>
                          {getStatusIcon(userData.registration.status)}
                          <span className="ml-1">
                            {userData.registration.status.charAt(0).toUpperCase() + userData.registration.status.slice(1)}
                          </span>
                        </Badge>
                      </div>
                    </div>
                    {userData.registration.membershipNumber && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Membership Number</label>
                        <p className="text-lg">{userData.registration.membershipNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workshop Selections */}
                {userData.registration.workshopSelections && userData.registration.workshopSelections.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Selected Workshops</label>
                    <div className="mt-2 space-y-2">
                      {userData.registration.workshopSelections.map((workshop, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <BookOpen className="h-4 w-4 text-[#25406b]" />
                          <span>{workshop}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workshop Add-on - Show if registration is confirmed/paid */}
                {(userData.registration.status === 'confirmed' || userData.registration.status === 'paid') && (
                  <div className="mt-6">
                    <WorkshopAddon
                      userEmail={userData.email}
                      registrationId={userData.registration.registrationId}
                      existingWorkshops={userData.registration.workshopSelections || []}
                      maxWorkshops={3}
                    />
                  </div>
                )}

                {/* Accompanying Persons */}
                {userData.registration.accompanyingPersons && userData.registration.accompanyingPersons.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Accompanying Persons</label>
                    <div className="mt-2 space-y-2">
                      {userData.registration.accompanyingPersons.map((person, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <User className="h-4 w-4 text-[#25406b]" />
                          <span>{person.name} ({person.relationship})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Badge Display - Show if registration is confirmed/paid */}
            {(userData.registration.status === 'confirmed' || userData.registration.status === 'paid') && (
              <div className="mt-6">
                <BadgeDisplay />
              </div>
            )}
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            {paymentData.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Payments Found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    You haven't made any payments yet. Complete your registration by making a payment.
                  </p>
                  <Link href="/dashboard/payment">
                    <Button>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Make Payment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {paymentData.map((payment, index) => (
                  <Card key={payment._id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-green-500" />
                        Payment #{index + 1}
                      </CardTitle>
                      <CardDescription>
                        Transaction ID: {payment.razorpayPaymentId}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Payment Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Amount Paid</label>
                          <p className="text-2xl font-bold">
                            {formatCurrency(payment.amount.total, payment.amount.currency)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Registration Type</label>
                          <p className="text-lg">
                            {getRegistrationTypeLabel(payment.breakdown?.registrationType || 'N/A')}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Payment Date</label>
                          <p className="text-lg">{formatDate(payment.transactionDate)}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Payment Breakdown */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Payment Breakdown
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Registration Fee ({getRegistrationTypeLabel(payment.breakdown?.registrationType || 'N/A')}):</span>
                            <span>{formatCurrency(payment.breakdown?.baseAmount || 0, payment.amount.currency)}</span>
                          </div>
                          
                          {payment.breakdown?.workshopFees && payment.breakdown.workshopFees.length > 0 && (
                            <>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Workshop Fees:</div>
                              {payment.breakdown.workshopFees.map((workshop, idx) => (
                                <div key={idx} className="flex justify-between ml-4 text-sm">
                                  <span>â€¢ {workshop.name}:</span>
                                  <span>{formatCurrency(workshop.amount, payment.amount.currency)}</span>
                                </div>
                              ))}
                            </>
                          )}

                          {payment.breakdown?.accompanyingPersonFees > 0 && (
                            <div className="flex justify-between">
                              <span>Accompanying Person Fees:</span>
                              <span>{formatCurrency(payment.breakdown.accompanyingPersonFees, payment.amount.currency)}</span>
                            </div>
                          )}

                          {payment.breakdown?.discountsApplied && payment.breakdown.discountsApplied.length > 0 && (
                            <>
                              <div className="text-sm font-medium text-green-700 dark:text-green-300">Discounts Applied:</div>
                              {payment.breakdown.discountsApplied.map((discount, idx) => (
                                <div key={idx} className="flex justify-between ml-4 text-sm text-green-600">
                                  <span>
                                    â€¢ {discount.type} {discount.code ? `(${discount.code})` : ''} - {discount.percentage}%:
                                  </span>
                                  <span>-{formatCurrency(discount.amount, payment.amount.currency)}</span>
                                </div>
                              ))}
                            </>
                          )}

                          <Separator />
                          <div className="flex justify-between text-lg font-semibold">
                            <span>Total Amount Paid:</span>
                            <span>{formatCurrency(payment.amount.total, payment.amount.currency)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Actions */}
                      <div className="flex items-center justify-between pt-4">
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1">
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </Badge>
                        
                        {payment.status === 'completed' && (
                          <Button
                            onClick={() => handleDownloadInvoice(payment._id, userData.registration.registrationId)}
                            disabled={isDownloading}
                            className="bg-gradient-to-r from-[#f0f3f8]0 to-blue-700 hover:from-[#25406b] hover:to-blue-800"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {isDownloading ? 'Opening...' : 'View Invoice'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your personal and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <p>{userData.profile.title} {userData.profile.firstName} {userData.profile.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p>{userData.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p>{userData.profile.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Institution</label>
                        <p>{userData.profile.institution}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Street Address</label>
                        <p>{userData.profile.address.street}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">City</label>
                        <p>{userData.profile.address.city}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">State</label>
                        <p>{userData.profile.address.state}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Country</label>
                        <p>{userData.profile.address.country}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Pincode</label>
                        <p>{userData.profile.address.pincode}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {(userData.profile.dietaryRequirements || userData.profile.specialNeeds) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Additional Information</h4>
                    {userData.profile.dietaryRequirements && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Dietary Requirements</label>
                        <p>{userData.profile.dietaryRequirements}</p>
                      </div>
                    )}
                    {userData.profile.specialNeeds && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Special Needs</label>
                        <p>{userData.profile.specialNeeds}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4">
                  <Link href="/dashboard/profile">
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}