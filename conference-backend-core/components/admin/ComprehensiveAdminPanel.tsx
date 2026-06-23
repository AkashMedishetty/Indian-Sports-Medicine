"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { PricingTiersManager } from "./PricingTiersManager"
import { WorkshopManager } from "./WorkshopManager"
import { ContactMessagesManager } from "./ContactMessagesManager"
import { RegistrationTable } from "./RegistrationTable"
import { AbstractsSubmissionsManager } from "./AbstractsSubmissionsManager"
import { DarkModeToggle } from "./DarkModeToggle"
import { StunningDashboard } from "./StunningDashboard"
import { DashboardCharts } from "./DashboardCharts"
import { QuickSettings } from "./QuickSettings"
import { EnhancedExport } from "./EnhancedExport"
import { BadgeConfig } from "./BadgeConfig"
import { CertificateConfig } from "./CertificateConfig"
import { BulkCertificateEmailer } from "./BulkCertificateEmailer"
import { BadgeDesigner } from "./BadgeDesigner"
import { CertificateDesigner } from "./CertificateDesigner"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { Alert, AlertDescription } from "../ui/alert"
import { Separator } from "../ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import {
  Users,
  CreditCard,
  CheckCircle,
  MoreHorizontal,
  Edit,
  Download,
  Search,
  RefreshCw,
  Settings,
  Mail,
  BarChart3,
  FileText,
  DollarSign,
  AlertTriangle,
  Star,
  Calendar,
  Globe,
  Shield,
  Database,
  TrendingUp,
  UserCheck,
  Receipt,
  Bell,
  MessageCircle,
  Upload,
  Plus,
  Gift,
  Activity,
  Filter,
  Eye,
  Zap,
  Sparkles
} from "lucide-react"
import { useToast } from "../ui/use-toast"
import { conferenceConfig } from "../../config/conference.config"

interface DashboardStats {
  totalRegistrations: number
  paidRegistrations: number
  pendingPayments: number
  totalRevenue: number
  totalAbstracts: number
  workshopRegistrations: number
  accompanyingPersons: number
  registrationsByCategory: Record<string, number>
  dailyRegistrations: Array<{ date: string; count: number }>
  paymentsByMethod: Record<string, number>
  workshopStats?: {
    totalWorkshops: number
    totalParticipants: number
    popularWorkshops: Array<{ name: string; participants: number }>
  }
}

interface Registration {
  _id: string
  registrationId: string
  profile: {
    title: string
    firstName: string
    lastName: string
    phone: string
    institution: string
  }
  email: string
  registration: {
    type: string
    status: string
    workshopSelections: string[]
    accompanyingPersons: any[]
    registrationDate: string
    paymentDate?: string
    paymentType?: 'regular' | 'pending' | 'online' | 'bank-transfer' | 'complementary' | 'complimentary' | 'sponsored'
    sponsorName?: string
    sponsorCategory?: string
    paymentRemarks?: string
  }
  createdAt: string
}

interface Payment {
  _id: string
  userId: string
  registrationId: string
  amount: {
    total: number
    currency: string
  }
  status: string
  razorpayOrderId: string
  razorpayPaymentId?: string
  transactionDate: string
  paymentMethod?: string
  userDetails?: {
    name: string
    email: string
    phone: string
    institution: string
    registrationType: string
  }
}

export function ComprehensiveAdminPanel() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [error, setError] = useState<string | null>(null)
  const [currentTier, setCurrentTier] = useState<any>(null)

  // Handle registrations tab click to redirect to external URL
  const handleRegistrationsTabClick = () => {
    // Use relative URL for production compatibility
    const baseUrl = window.location.origin
    window.open(`${baseUrl}/admin/registrations`, '_blank')
  }

  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    paidRegistrations: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    totalAbstracts: 0,
    workshopRegistrations: 0,
    accompanyingPersons: 0,
    registrationsByCategory: {},
    dailyRegistrations: [],
    paymentsByMethod: {}
  })

  // Registrations data
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([])

  // Payments data
  const [payments, setPayments] = useState<Payment[]>([])

  // Search and filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all")

  // Bulk email states
  const [emailSubject, setEmailSubject] = useState("")
  const [emailContent, setEmailContent] = useState("")
  const [senderName, setSenderName] = useState(`${conferenceConfig.shortName} Team`)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["all"])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["all"])
  const [filteredRecipients, setFilteredRecipients] = useState<any[]>([])
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Dialog states
  const [isAddRegistrationOpen, setIsAddRegistrationOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isSpecialPaymentOpen, setIsSpecialPaymentOpen] = useState(false)
  const [selectedRegistrationForPayment, setSelectedRegistrationForPayment] = useState<Registration | null>(null)
  const [specialPaymentData, setSpecialPaymentData] = useState({
    paymentType: 'complementary' as 'complementary' | 'sponsored',
    sponsorName: '',
    sponsorCategory: 'platinum' as 'platinum' | 'gold' | 'silver' | 'bronze' | 'exhibitor' | 'other',
    paymentRemarks: ''
  })

  useEffect(() => {
    fetchDashboardData()
    loadCurrentTier()
  }, [])

  const loadCurrentTier = async () => {
    try {
      const response = await fetch('/api/payment/pricing')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.currentTier) {
          setCurrentTier(result.data.currentTier)
        }
      }
    } catch (error) {
      console.error('Error loading current tier:', error)
    }
  }

  // Filter registrations based on search term and status
  useEffect(() => {
    let filtered = registrations

    if (searchTerm) {
      filtered = filtered.filter(reg =>
        reg.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.registrationId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(reg => reg.registration.status === statusFilter)
    }

    setFilteredRegistrations(filtered)
  }, [registrations, searchTerm, statusFilter])

  // Bulk email functions
  const loadRecipients = async () => {
    setIsLoadingRecipients(true)
    try {
      const response = await fetch('/api/admin/recipients')
      if (response.ok) {
        const data = await response.json()
        let recipients = data.data || []

        // Filter by registration type
        if (!selectedTypes.includes('all')) {
          recipients = recipients.filter((r: any) =>
            selectedTypes.includes(r.registrationType)
          )
        }

        // Filter by payment status
        if (!selectedStatuses.includes('all')) {
          recipients = recipients.filter((r: any) =>
            selectedStatuses.includes(r.registrationStatus)
          )
        }

        setFilteredRecipients(recipients)

        toast({
          title: "Recipients Loaded",
          description: `Found ${recipients.length} matching recipients`
        })
      } else {
        throw new Error('Failed to load recipients')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load recipients",
        variant: "destructive"
      })
    } finally {
      setIsLoadingRecipients(false)
    }
  }

  const sendBulkEmail = async () => {
    if (!emailSubject || !emailContent) {
      toast({
        title: "Missing Information",
        description: "Please provide both subject and content for the email.",
        variant: "destructive"
      })
      return
    }

    if (filteredRecipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select recipients for the email.",
        variant: "destructive"
      })
      return
    }

    setIsSendingEmail(true)
    try {
      const recipients = filteredRecipients.map(r => r.email)
      const response = await fetch('/api/admin/send-bulk-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: emailSubject,
          content: emailContent,
          recipients,
          senderName
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Email Sent Successfully",
          description: `Bulk email sent to ${recipients.length} recipients`
        })

        // Reset form
        setEmailSubject("")
        setEmailContent("")
        setFilteredRecipients([])
        setSelectedTypes(["all"])
        setSelectedStatuses(["all"])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send bulk email')
      }
    } catch (error) {
      toast({
        title: "Email Failed",
        description: error instanceof Error ? error.message : "Failed to send bulk email",
        variant: "destructive"
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Admin Panel Function Implementations
  const createNotification = () => {
    toast({
      title: "Notification Created",
      description: "New notification has been created successfully.",
    })
  }

  const scheduleNotification = () => {
    toast({
      title: "Notification Scheduled",
      description: "Notification has been scheduled for later delivery.",
    })
  }

  const useTemplate = (template: string) => {
    const templates = {
      welcome: { subject: `Welcome to ${conferenceConfig.shortName}`, content: "Welcome to the conference! We're excited to have you join us." },
      reminder: { subject: "Payment Reminder", content: "Please complete your payment to confirm your registration." },
      workshop: { subject: "Workshop Update", content: "There has been an update to your selected workshop." },
      abstract: { subject: "Abstract Status Update", content: "Your abstract status has been updated." },
      urgent: { subject: "Urgent Conference Update", content: "Important conference information requires your attention." },
      custom: { subject: "", content: "" }
    }
    
    if (templates[template as keyof typeof templates]) {
      const templateData = templates[template as keyof typeof templates]
      setEmailSubject(templateData.subject)
      setEmailContent(templateData.content)
      toast({
        title: "Template Applied",
        description: `${template} template has been applied.`,
      })
    }
  }

  const generateRegistrationReport = () => {
    toast({
      title: "Report Generated",
      description: "Registration report is being prepared for download.",
    })
  }

  const generateFinancialReport = () => {
    toast({
      title: "Report Generated",
      description: "Financial report is being prepared for download.",
    })
  }

  const generateWorkshopReport = () => {
    toast({
      title: "Report Generated",
      description: "Workshop report is being prepared for download.",
    })
  }

  const generateAbstractReport = () => {
    toast({
      title: "Report Generated",
      description: "Abstract report is being prepared for download.",
    })
  }

  const generateDemographicsReport = () => {
    toast({
      title: "Report Generated",
      description: "Demographics report is being prepared for download.",
    })
  }

  const generateCustomReport = () => {
    toast({
      title: "Custom Report",
      description: "Custom report builder will be available soon.",
    })
  }

  const exportToCSV = () => {
    toast({
      title: "Export Started",
      description: "Data export to CSV is in progress.",
    })
  }

  const exportToExcel = () => {
    toast({
      title: "Export Started",
      description: "Data export to Excel is in progress.",
    })
  }

  const exportToPDF = () => {
    toast({
      title: "Export Started",
      description: "Data export to PDF is in progress.",
    })
  }

  const generateDashboardSnapshot = () => {
    toast({
      title: "Snapshot Generated",
      description: "Dashboard snapshot has been created successfully.",
    })
  }

  const loadFilteredRecipients = async () => {
    setIsLoadingRecipients(true)
    try {
      // Simulate API call to get filtered recipients
      const mockRecipients = registrations
        .filter(reg => {
          const typeMatch = selectedTypes.includes('all') || selectedTypes.includes(reg.registration.type)
          const statusMatch = selectedStatuses.includes('all') || selectedStatuses.includes(reg.registration.status)
          return typeMatch && statusMatch
        })
        .map(reg => ({
          email: reg.email,
          profile: reg.profile,
          registration: reg.registration
        }))
      
      setFilteredRecipients(mockRecipients)
      
      toast({
        title: "Recipients Loaded",
        description: `${mockRecipients.length} recipients found based on your filters.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load recipients. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingRecipients(false)
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [dashboardRes, registrationsRes, paymentsRes] = await Promise.all([
        fetch('/api/admin/dashboard').catch(() => ({ ok: false })),
        fetch('/api/admin/registrations').catch(() => ({ ok: false })),
        fetch('/api/admin/payments').catch(() => ({ ok: false }))
      ])

      if (dashboardRes.ok && 'json' in dashboardRes) {
        const dashboardData = await dashboardRes.json()
        setDashboardStats(dashboardData.data || {
          totalRegistrations: 0,
          paidRegistrations: 0,
          pendingPayments: 0,
          totalRevenue: 0,
          totalAbstracts: 0,
          workshopRegistrations: 0,
          accompanyingPersons: 0,
          registrationsByCategory: {},
          dailyRegistrations: [],
          paymentsByMethod: {}
        })
      } else {
        // Set default stats if API fails
        setDashboardStats({
          totalRegistrations: 0,
          paidRegistrations: 0,
          pendingPayments: 0,
          totalRevenue: 0,
          totalAbstracts: 0,
          workshopRegistrations: 0,
          accompanyingPersons: 0,
          registrationsByCategory: {},
          dailyRegistrations: [],
          paymentsByMethod: {}
        })
      }

      if (registrationsRes.ok && 'json' in registrationsRes) {
        const registrationsData = await registrationsRes.json()
        setRegistrations(registrationsData.data || [])
        setFilteredRegistrations(registrationsData.data || [])
      } else {
        setRegistrations([])
        setFilteredRegistrations([])
      }

      if (paymentsRes.ok && 'json' in paymentsRes) {
        const paymentsData = await paymentsRes.json()
        setPayments(paymentsData.data || [])
      } else {
        setPayments([])
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')

      // Set default values on error
      setDashboardStats({
        totalRegistrations: 0,
        paidRegistrations: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        totalAbstracts: 0,
        workshopRegistrations: 0,
        accompanyingPersons: 0,
        registrationsByCategory: {},
        dailyRegistrations: [],
        paymentsByMethod: {}
      })
      setRegistrations([])
      setFilteredRegistrations([])
      setPayments([])

      toast({
        title: "Error",
        description: "Failed to load admin data. Using default values.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/export/registrations')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Export Successful",
          description: "Registrations data exported successfully"
        })
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export registrations data",
        variant: "destructive"
      })
    }
  }

  const handleExportPayments = async () => {
    try {
      const response = await fetch('/api/admin/export/payments')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Export Successful",
          description: "Payments data exported successfully"
        })
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export payments data",
        variant: "destructive"
      })
    }
  }

  const handleEditRegistration = (registration: Registration) => {
    // For now, redirect to the dedicated registrations page
    window.open(`/admin/registrations?edit=${registration._id}`, '_blank')
  }

  const handleSendEmail = async (registration: Registration) => {
    try {
      const response = await fetch(`/api/admin/registrations/${registration._id}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: 'general',
          subject: `${conferenceConfig.shortName} - Registration Update`,
          message: `Thank you for registering for ${conferenceConfig.shortName} Conference.`
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Email Sent",
          description: "Email has been sent successfully to the participant."
        })
      } else {
        toast({
          title: "Email Failed",
          description: data.message || "Failed to send email",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Send email error:", error)
      toast({
        title: "Error",
        description: "An error occurred while sending email",
        variant: "destructive"
      })
    }
  }

  const handleMarkAsSpecial = (registration: Registration) => {
    setSelectedRegistrationForPayment(registration)
    setSpecialPaymentData({
      paymentType: 'complementary',
      sponsorName: '',
      sponsorCategory: 'platinum',
      paymentRemarks: ''
    })
    setIsSpecialPaymentOpen(true)
  }

  const handleSaveSpecialPayment = async () => {
    if (!selectedRegistrationForPayment) return

    try {
      const response = await fetch(`/api/admin/registrations/${selectedRegistrationForPayment._id}/special-payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paymentType: specialPaymentData.paymentType,
          sponsorName: specialPaymentData.sponsorName,
          sponsorCategory: specialPaymentData.sponsorCategory,
          paymentRemarks: specialPaymentData.paymentRemarks,
          status: 'paid' // Mark as paid when setting special payment
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Payment Updated",
          description: `Registration marked as ${specialPaymentData.paymentType} successfully.`
        })
        setIsSpecialPaymentOpen(false)
        setSelectedRegistrationForPayment(null)
        fetchDashboardData() // Refresh data
      } else {
        toast({
          title: "Update Failed",
          description: data.message || "Failed to update payment status",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Special payment update error:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating payment status",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-[#f0f3f8]0" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error loading admin panel:</strong> {error}
            <br />
            <Button
              onClick={() => {
                setError(null)
                fetchDashboardData()
              }}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:bg-[#181818]">
      {/* Modern Header with Glass Morphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#1e1e1e]/95 border-b border-blue-100/50 dark:border-slate-700/50 shadow-sm"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#25406b] via-indigo-600 to-theme-accent-600 bg-clip-text text-transparent">
                {conferenceConfig.shortName} Admin
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base">
                Comprehensive conference management dashboard
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              
              <Button 
                onClick={fetchDashboardData} 
                variant="glass" 
                size="sm"
                className="bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80 border-[#b0c1db]/50 dark:border-slate-700/50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#f0f3f8]0/10 to-indigo-500/10 dark:from-[#f0f3f8]0/20 dark:to-indigo-500/20 rounded-full border border-[#b0c1db]/30 dark:border-[#152843]/30">
                <Activity className="h-4 w-4 text-[#25406b] dark:text-[#3d5f8e]" />
                <span className="text-sm font-medium text-[#1d3357] dark:text-[#6889b3]">Live</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-6 py-8 space-y-8">

        {/* Modern Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-100/50 dark:border-slate-700/50 shadow-lg p-2"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-14 gap-1 bg-transparent p-0 h-auto overflow-x-auto">
              <TabsTrigger 
                value="dashboard" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#f0f3f8]0 data-[state=active]:to-[#25406b] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-[#f0f3f8] transition-all duration-200"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs font-medium">Dashboard</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="registrations" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#f0f3f8]0 data-[state=active]:to-[#25406b] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-[#f0f3f8] transition-all duration-200"
                onClick={(e) => {
                  e.preventDefault()
                  handleRegistrationsTabClick()
                }}
              >
                <Users className="h-5 w-5" />
                <span className="text-xs font-medium">Registrations</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="payments" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#f0f3f8]0 data-[state=active]:to-[#25406b] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-[#f0f3f8] transition-all duration-200"
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-xs font-medium">Payments</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="pricing" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#f0f3f8]0 data-[state=active]:to-[#25406b] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-[#f0f3f8] transition-all duration-200"
              >
                <DollarSign className="h-5 w-5" />
                <span className="text-xs font-medium">Pricing</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="workshops" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#f0f3f8]0 data-[state=active]:to-[#25406b] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-[#f0f3f8] transition-all duration-200"
              >
                <Calendar className="h-5 w-5" />
                <span className="text-xs font-medium">Workshops</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="abstracts" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#f0f3f8]0 data-[state=active]:to-[#25406b] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-[#f0f3f8] transition-all duration-200"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs font-medium">Abstracts</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="configuration" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#f0f3f8]0 data-[state=active]:to-[#25406b] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-[#f0f3f8] transition-all duration-200"
              >
                <Settings className="h-5 w-5" />
                <span className="text-xs font-medium">Config</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="emails" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#f0f3f8]0 data-[state=active]:to-[#25406b] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-[#f0f3f8] transition-all duration-200"
              >
                <Mail className="h-5 w-5" />
                <span className="text-xs font-medium">Emails</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="notifications" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#f0f3f8]0 data-[state=active]:to-[#25406b] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-[#f0f3f8] transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                <span className="text-xs font-medium">Alerts</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="messages" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#f0f3f8]0 data-[state=active]:to-[#25406b] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-[#f0f3f8] transition-all duration-200"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs font-medium">Messages</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="reports" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#f0f3f8]0 data-[state=active]:to-[#25406b] data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-[#f0f3f8] dark:hover:bg-slate-800 transition-all duration-200"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs font-medium">Reports</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="badges" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all duration-200"
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-xs font-medium">Badges</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="certificates" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition-all duration-200"
              >
                <Star className="h-5 w-5" />
                <span className="text-xs font-medium">Certificates</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="bulk-emailer" 
                className="flex flex-col items-center gap-2 p-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all duration-200"
              >
                <Mail className="h-5 w-5" />
                <span className="text-xs font-medium">Bulk Email</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab - STUNNING NEW DESIGN */}
            <TabsContent value="dashboard" className="space-y-6">
              <StunningDashboard />
              
              {/* Optional: Keep Quick Settings & Export Below */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <QuickSettings />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <EnhancedExport />
                </motion.div>
              </div>
            </TabsContent>

        {/* OLD DASHBOARD CODE BELOW - KEEPING FOR REFERENCE IF NEEDED */}
            <TabsContent value="dashboard-old" className="space-y-8 hidden">
              {/* Enhanced Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6"
              >
                <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border-[#b0c1db]/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#f0f3f8]0/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-[#25406b]">Total Registrations</p>
                        <p className="text-3xl font-bold text-slate-900">{dashboardStats.totalRegistrations}</p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-[#f0f3f8]0 rounded-full animate-pulse" />
                          <span className="text-xs text-slate-600">Active</span>
                        </div>
                      </div>
                      <div className="p-3 bg-[#f0f3f8]0/10 rounded-2xl group-hover:bg-[#f0f3f8]0/20 transition-colors duration-300">
                        <Users className="h-8 w-8 text-[#25406b]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-600">Paid Registrations</p>
                        <p className="text-3xl font-bold text-slate-900">{dashboardStats.paidRegistrations}</p>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-emerald-500" />
                          <span className="text-xs text-slate-600">Confirmed</span>
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors duration-300">
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-amber-600">Pending Payments</p>
                        <p className="text-3xl font-bold text-slate-900">{dashboardStats.pendingPayments}</p>
                        <div className="flex items-center gap-2">
                          <Zap className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-slate-600">Requires Action</span>
                        </div>
                      </div>
                      <div className="p-3 bg-amber-500/10 rounded-2xl group-hover:bg-amber-500/20 transition-colors duration-300">
                        <AlertTriangle className="h-8 w-8 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/50 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-violet-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-slate-900">â‚¹{dashboardStats.totalRevenue.toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-violet-500" />
                          <span className="text-xs text-slate-600">Growing</span>
                        </div>
                      </div>
                      <div className="p-3 bg-violet-500/10 rounded-2xl group-hover:bg-violet-500/20 transition-colors duration-300">
                        <DollarSign className="h-8 w-8 text-violet-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-theme-accent-600">Abstract Submissions</p>
                        <p className="text-3xl font-bold text-slate-900">{dashboardStats.totalAbstracts || 0}</p>
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3 text-purple-500" />
                          <span className="text-xs text-slate-600">Submitted</span>
                        </div>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors duration-300">
                        <FileText className="h-8 w-8 text-theme-accent-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Enhanced Dashboard Content */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Registration Categories - Enhanced */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="xl:col-span-2"
                >
                  <Card className="bg-white/60 backdrop-blur-xl border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-[#25406b]" />
                            Registration Analytics
                          </CardTitle>
                          <CardDescription className="text-slate-600">
                            Detailed breakdown by registration categories
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dashboardStats.registrationsByCategory && Object.entries(dashboardStats.registrationsByCategory).map(([category, count], index) => {
                        const percentage = dashboardStats.totalRegistrations > 0 ? (count / dashboardStats.totalRegistrations * 100) : 0
                        const colors = ['bg-[#f0f3f8]0', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500']
                        const bgColors = ['bg-[#f0f3f8]', 'bg-emerald-50', 'bg-amber-50', 'bg-violet-50', 'bg-rose-50']
                        
                        return (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className={`p-4 rounded-xl ${bgColors[index % bgColors.length]} border border-slate-200/50 hover:shadow-md transition-all duration-200`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                                <span className="font-medium text-slate-900 capitalize">{category}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-white/80 text-slate-700">
                                  {count}
                                </Badge>
                                <span className="text-sm text-slate-600">{percentage.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-white/60 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                                className={`h-2 rounded-full ${colors[index % colors.length]}`}
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                      {!dashboardStats.registrationsByCategory && (
                        <div className="text-center py-8">
                          <Database className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-500">No registration data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Actions - Enhanced */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-6"
                >
                  <Card className="bg-white/60 backdrop-blur-xl border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-600" />
                        Quick Actions
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Common administrative tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        onClick={handleExportRegistrations} 
                        className="w-full justify-start bg-gradient-to-r from-[#f0f3f8]0 to-[#25406b] hover:from-[#25406b] hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Registrations
                      </Button>
                      
                      <Button 
                        onClick={handleExportPayments} 
                        className="w-full justify-start bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Export Payments
                      </Button>
                      
                      <Button 
                        onClick={() => setActiveTab('abstracts')} 
                        className="w-full justify-start bg-gradient-to-r from-purple-500 to-theme-accent-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Manage Abstracts
                      </Button>
                      
                      <Button 
                        variant="glass" 
                        className="w-full justify-start bg-white/60 hover:bg-white/80 border-slate-200/50 text-slate-700 hover:text-slate-900"
                        onClick={() => window.open('/admin/emails', '_blank')}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Bulk Email
                      </Button>
                      
                      <Button 
                        variant="glass" 
                        className="w-full justify-start bg-white/60 hover:bg-white/80 border-slate-200/50 text-slate-700 hover:text-slate-900"
                        onClick={() => window.open('/admin/config', '_blank')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Update Configuration
                      </Button>
                    </CardContent>
                  </Card>

                  {/* System Status Card */}
                  <Card className="bg-gradient-to-br from-slate-50 to-blue-50/30 border-slate-200/50 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        System Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-slate-200/50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-slate-700">Database</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Online</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-slate-200/50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#f0f3f8]0 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-slate-700">Payment Gateway</span>
                        </div>
                        <Badge variant="secondary" className="bg-[#d8e0ed] text-[#1d3357]">Active</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-slate-200/50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-slate-700">Email Service</span>
                        </div>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">Monitoring</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Dashboard Charts Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <DashboardCharts
                  registrationsByCategory={dashboardStats.registrationsByCategory || {}}
                  totalRevenue={dashboardStats.totalRevenue || 0}
                  dailyRegistrations={dashboardStats.dailyRegistrations || []}
                  workshopStats={dashboardStats.workshopStats}
                />
              </motion.div>

              {/* END OF OLD DASHBOARD - KEPT AS BACKUP */}
            </TabsContent>

        {/* Registrations Tab */}
        <TabsContent value="registrations" className="space-y-6">
          <RegistrationTable />
        </TabsContent>

            {/* Payments Tab - Enhanced */}
            <TabsContent value="payments" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/60 backdrop-blur-xl border-slate-200/50 shadow-lg">
                  <CardHeader className="pb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <CreditCard className="h-6 w-6 text-[#25406b]" />
                          Payment Management
                        </CardTitle>
                        <CardDescription className="text-slate-600 mt-1">
                          Monitor and manage all payment transactions
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Search payments..."
                            className="pl-10 bg-white/60 border-slate-200/50 focus:bg-white/80"
                          />
                        </div>
                        <Button variant="glass" size="sm" className="bg-white/60 hover:bg-white/80">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="rounded-xl border border-slate-200/50 bg-white/40 backdrop-blur-sm overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80 hover:bg-slate-50/90">
                            <TableHead className="font-semibold text-slate-700">Registration ID</TableHead>
                            <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                            <TableHead className="font-semibold text-slate-700">Type</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700">Method</TableHead>
                            <TableHead className="font-semibold text-slate-700">Date</TableHead>
                            <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment, index) => (
                            <motion.tr
                              key={payment._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + index * 0.05 }}
                              className="hover:bg-white/60 transition-colors duration-200"
                            >
                              <TableCell className="font-mono text-sm bg-slate-50/50 rounded-lg m-1 p-3">
                                {payment.registrationId}
                              </TableCell>
                              <TableCell className="font-semibold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  {payment.amount.currency} {payment.amount.total.toLocaleString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize bg-[#f0f3f8] text-[#1d3357] border-[#b0c1db]">
                                  {payment.userDetails?.registrationType?.replace('-', ' ') || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={payment.status === 'completed' ? 'default' : 'secondary'}
                                  className={payment.status === 'completed' 
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                  }
                                >
                                  {payment.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-slate-600">{payment.paymentMethod || 'N/A'}</span>
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {new Date(payment.transactionDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border-slate-200/50">
                                    <DropdownMenuLabel className="text-slate-700">Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="hover:bg-slate-50">
                                      <FileText className="mr-2 h-4 w-4 text-[#25406b]" />
                                      View Invoice
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="hover:bg-slate-50">
                                      <Download className="mr-2 h-4 w-4 text-emerald-600" />
                                      Download Receipt
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {payments.length === 0 && (
                      <div className="text-center py-12">
                        <CreditCard className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">No Payments Found</h3>
                        <p className="text-slate-500">Payment transactions will appear here once available.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            {/* Pricing Tiers Tab - Enhanced */}
            <TabsContent value="pricing" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/60 backdrop-blur-xl border-slate-200/50 shadow-lg">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <DollarSign className="h-6 w-6 text-violet-600" />
                      Pricing Tiers Management
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      Configure pricing tiers, special offers, and category pricing for the conference
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PricingTiersManager />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Workshops Tab - Enhanced */}
            <TabsContent value="workshops" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <WorkshopManager />
              </motion.div>
            </TabsContent>

            {/* Abstracts Tab - Enhanced */}
            <TabsContent value="abstracts" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/60 backdrop-blur-xl border-slate-200/50 shadow-lg">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-6 w-6 text-[#25406b]" />
                      Abstract Management
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      View all submitted abstracts, update status, search, filter, and export with files
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AbstractsSubmissionsManager />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Configuration Tab - Enhanced */}
            <TabsContent value="configuration" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/60 backdrop-blur-xl border-slate-200/50 shadow-lg">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Settings className="h-6 w-6 text-slate-600" />
                      System Configuration
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      Manage system settings and configuration options
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Configuration content would go here */}
                    <div className="text-center py-12">
                      <Settings className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">Configuration Panel</h3>
                      <p className="text-slate-500">System configuration options will be available here.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Emails Tab - Enhanced */}
            <TabsContent value="emails" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/60 backdrop-blur-xl border-slate-200/50 shadow-lg">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Mail className="h-6 w-6 text-[#25406b]" />
                      Email Management
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      Send bulk emails and manage email communications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Email management content would go here */}
                    <div className="text-center py-12">
                      <Mail className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">Email Center</h3>
                      <p className="text-slate-500">Email management tools will be available here.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Notifications Tab - Enhanced */}
            <TabsContent value="notifications" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/60 backdrop-blur-xl border-slate-200/50 shadow-lg">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Bell className="h-6 w-6 text-amber-600" />
                      Notification Center
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      Manage system notifications and alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Bell className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">Notification Hub</h3>
                      <p className="text-slate-500">Notification management will be available here.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Messages Tab - Enhanced */}
            <TabsContent value="messages" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/60 backdrop-blur-xl border-slate-200/50 shadow-lg">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <MessageCircle className="h-6 w-6 text-green-600" />
                      Message Center
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      View and respond to contact messages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContactMessagesManager />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Reports Tab - Enhanced */}
            <TabsContent value="reports" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                      Analytics & Reports
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
                      Generate detailed reports and analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <TrendingUp className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">Reports Dashboard</h3>
                      <p className="text-slate-500 dark:text-slate-400">Advanced reporting tools will be available here.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Badges Configuration Tab */}
            <TabsContent value="badges" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <BadgeConfig />
              </motion.div>
            </TabsContent>

            {/* Certificates Configuration Tab */}
            <TabsContent value="certificates" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CertificateConfig />
              </motion.div>
            </TabsContent>

            {/* Bulk Certificate Emailer Tab */}
            <TabsContent value="bulk-emailer" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <BulkCertificateEmailer />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}