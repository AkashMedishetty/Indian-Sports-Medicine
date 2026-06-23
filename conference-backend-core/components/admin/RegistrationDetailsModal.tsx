"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Separator } from "../ui/separator"
import { ScrollArea } from "../ui/scroll-area"
import {
  User, CreditCard, FileText, Mail, AlertTriangle, Activity, 
  Copy, Download, Send, Eye, Clock, CheckCircle, XCircle,
  Phone, Building, MapPin, Calendar, Shield, RefreshCw,
  Edit, Link, ChevronDown, Save, X
} from "lucide-react"
import { useToast } from "../ui/use-toast"
import { EmailPreviewModal } from "./EmailPreviewModal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

interface Registration {
  _id: string
  email: string
  profile: {
    title: string
    firstName: string
    lastName: string
    phone: string
    institution: string
    designation?: string
    specialization?: string
    mciNumber?: string
    address: {
      street?: string
      city: string
      state: string
      country: string
      pincode?: string
    }
    dietaryRequirements?: string
    specialNeeds?: string
    hodFormUrl?: string
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
    accommodation?: {
      required: boolean
      roomType: 'single' | 'sharing'
      checkIn: string
      checkOut: string
      nights: number
      totalAmount: number
    }
    registrationDate: string
    paymentDate?: string
    paymentType?: 'regular' | 'pending' | 'online' | 'bank-transfer' | 'complementary' | 'sponsored' | 'complimentary'
    sponsorId?: string
    sponsorName?: string
  }
  payment?: {
    method?: 'bank-transfer' | 'online' | 'pay-now' | 'cash'
    status?: 'pending' | 'verified' | 'rejected' | 'processing'
    amount?: number
    bankTransferUTR?: string
    transactionId?: string
    screenshotUrl?: string
  }
  createdAt?: string
  lastLogin?: string
  loginCount?: number
}

interface EmailHistory {
  emailId: string
  subject: string
  category: string
  status: 'sent' | 'failed' | 'bounced'
  sentAt: string
  tracking?: {
    openCount: number
    clicks: Array<{ url: string; clickedAt: string }>
  }
  hasAttachments: boolean
}

interface PaymentAttempt {
  attemptId: string
  attemptNumber: number
  amount: number
  currency: string
  method: string
  status: string
  initiatedAt: string
  completedAt?: string
  error?: string
  device?: {
    ip: string
    browser: string
    os: string
  }
  razorpay?: {
    orderId: string
    paymentId?: string
  }
}

interface ErrorLog {
  errorId: string
  message: string
  severity: string
  category: string
  lastOccurrence: string
  occurrences: number
  resolved: boolean
  device?: {
    browser: string
    os: string
    ip: string
  }
}

interface AuditLog {
  auditId: string
  timestamp: string
  action: string
  actor: {
    email: string
    role: string
  }
  description?: string
  changes?: {
    before: Record<string, any>
    after: Record<string, any>
    fields?: string[]
  }
}

interface Abstract {
  abstractId: string
  title: string
  track: string
  status: string
  submittedAt: string
  decision?: string
  reviewScore?: number
}

interface RegistrationDetailsModalProps {
  registration: Registration | null
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
}

export function RegistrationDetailsModal({
  registration,
  isOpen,
  onClose,
  onRefresh
}: RegistrationDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Edit form state - expanded for full edit capabilities
  const [editForm, setEditForm] = useState({
    // Profile fields
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    institution: '',
    designation: '',
    specialization: 'not-specified',
    mciNumber: '',
    // Address fields
    city: '',
    state: '',
    country: '',
    // Registration fields
    registrationType: '',
    registrationStatus: '',
    paymentType: '',
    sponsorId: '',
    sponsorName: '',
    membershipNumber: '',
    workshopSelections: [] as string[],
    dietaryRequirements: '',
    specialNeeds: '',
    // Payment fields
    paymentMethod: '',
    paymentStatus: '',
    paymentAmount: 0,
    // Accommodation fields
    accommodationRequired: false,
    accommodationRoomType: '' as string,
    accommodationCheckIn: '',
    accommodationCheckOut: '',
    accommodationNights: 0,
    accommodationTotalAmount: 0,
    // Admin
    adminNotes: ''
  })
  
  // Data states
  const [emails, setEmails] = useState<EmailHistory[]>([])
  const [paymentAttempts, setPaymentAttempts] = useState<PaymentAttempt[]>([])
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [sponsors, setSponsors] = useState<Array<{ _id: string; companyName: string }>>([])
  const [loadingSponsors, setLoadingSponsors] = useState(false)
  const [activities, setActivities] = useState<AuditLog[]>([])
  const [abstracts, setAbstracts] = useState<Abstract[]>([])
  const [workshops, setWorkshops] = useState<Array<{ id: string; name: string; maxSeats: number; bookedSeats: number; price: number }>>([])
  const [loadingWorkshops, setLoadingWorkshops] = useState(false)  
  // Stats
  const [stats, setStats] = useState({
    emailCount: 0,
    paymentAttemptCount: 0,
    abstractCount: 0,
    errorCount: 0
  })

  const { toast } = useToast()

  // Fetch sponsors list
  const fetchSponsors = async () => {
    setLoadingSponsors(true)
    try {
      const response = await fetch('/api/admin/sponsors')
      const data = await response.json()
      if (data.success && data.sponsors) {
        setSponsors(data.sponsors.map((s: any) => ({
          _id: s._id,
          companyName: s.sponsorProfile?.companyName || s.email
        })))
      }
    } catch (err) {
      console.error('Failed to fetch sponsors:', err)
    } finally {
      setLoadingSponsors(false)
    }
  }

  const fetchWorkshops = async () => {
    setLoadingWorkshops(true)
    try {
      const response = await fetch('/api/workshops?includeInactive=true')
      const data = await response.json()
      if (data.success && data.data) {
        setWorkshops(data.data.map((w: any) => ({
          id: w.id,
          name: w.name,
          maxSeats: w.maxSeats,
          bookedSeats: w.bookedSeats,
          price: w.price
        })))
      }
    } catch (err) {
      console.error('Failed to fetch workshops:', err)
    } finally {
      setLoadingWorkshops(false)
    }
  }

  useEffect(() => {
    if (isOpen && registration) {
      fetchAllData()
      fetchSponsors()
      fetchWorkshops()
      // Initialize edit form with all fields
      setEditForm({
        // Profile fields
        title: registration.profile.title || '',
        firstName: registration.profile.firstName || '',
        lastName: registration.profile.lastName || '',
        email: registration.email || '',
        phone: registration.profile.phone || '',
        institution: registration.profile.institution || '',
        designation: registration.profile.designation || '',
        specialization: registration.profile.specialization || 'not-specified',
        mciNumber: registration.profile.mciNumber || '',
        // Address fields
        city: registration.profile.address?.city || '',
        state: registration.profile.address?.state || '',
        country: registration.profile.address?.country || '',
        // Registration fields
        registrationType: registration.registration.type || '',
        registrationStatus: registration.registration.status || '',
        paymentType: registration.registration.paymentType || 'regular',
        sponsorId: registration.registration.sponsorId || '',
        sponsorName: registration.registration.sponsorName || '',
        membershipNumber: registration.registration.membershipNumber || '',
        workshopSelections: registration.registration.workshopSelections || [],
        dietaryRequirements: registration.profile.dietaryRequirements || '',
        specialNeeds: registration.profile.specialNeeds || '',
        // Payment fields
        paymentMethod: (registration as any).payment?.method || '',
        paymentStatus: (registration as any).payment?.status || '',
        paymentAmount: (registration as any).payment?.amount || 0,
        // Accommodation fields
        accommodationRequired: registration.registration.accommodation?.required || false,
        accommodationRoomType: registration.registration.accommodation?.roomType || '',
        accommodationCheckIn: registration.registration.accommodation?.checkIn || '',
        accommodationCheckOut: registration.registration.accommodation?.checkOut || '',
        accommodationNights: registration.registration.accommodation?.nights || 0,
        accommodationTotalAmount: registration.registration.accommodation?.totalAmount || 0,
        // Admin
        adminNotes: ''
      })
    }
  }, [isOpen, registration])

  const fetchAllData = async () => {
    if (!registration) return
    setIsLoading(true)
    
    try {
      // Fetch all data in parallel
      const [emailsRes, paymentsRes, errorsRes, activitiesRes, abstractsRes] = await Promise.allSettled([
        fetch(`/api/admin/users/${registration._id}/emails`),
        fetch(`/api/admin/users/${registration._id}/payment-attempts`),
        fetch(`/api/admin/users/${registration._id}/errors`),
        fetch(`/api/admin/users/${registration._id}/activity`),
        fetch(`/api/admin/users/${registration._id}/abstracts`)
      ])

      // Process emails
      if (emailsRes.status === 'fulfilled' && emailsRes.value.ok) {
        const data = await emailsRes.value.json()
        setEmails(data.emails || [])
        setStats(prev => ({ ...prev, emailCount: data.total || 0 }))
      }

      // Process payment attempts
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.ok) {
        const data = await paymentsRes.value.json()
        setPaymentAttempts(data.attempts || [])
        setStats(prev => ({ ...prev, paymentAttemptCount: data.total || 0 }))
      }

      // Process errors
      if (errorsRes.status === 'fulfilled' && errorsRes.value.ok) {
        const data = await errorsRes.value.json()
        setErrors(data.errors || [])
        setStats(prev => ({ ...prev, errorCount: data.total || 0 }))
      }

      // Process activities
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.ok) {
        const data = await activitiesRes.value.json()
        setActivities(data.logs || [])
      }

      // Process abstracts
      if (abstractsRes.status === 'fulfilled' && abstractsRes.value.ok) {
        const data = await abstractsRes.value.json()
        setAbstracts(data.abstracts || [])
        setStats(prev => ({ ...prev, abstractCount: data.total || 0 }))
      }
    } catch (error) {
      console.error('Error fetching details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    })
  }

  // Quick Actions
  const handleStatusChange = async (newStatus: string) => {
    if (!registration) return
    
    try {
      const response = await fetch(`/api/admin/users/${registration._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Registration status changed to ${newStatus}`
        })
        onRefresh?.()
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      })
    }
  }

  const handleResendWelcomeEmail = async () => {
    if (!registration) return
    
    try {
      const response = await fetch(`/api/admin/users/${registration._id}/resend-welcome`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: "Email Sent",
          description: "Welcome email has been resent"
        })
        fetchAllData()
      } else {
        throw new Error('Failed to send email')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend welcome email",
        variant: "destructive"
      })
    }
  }

  const handleCopyRegistrationLink = () => {
    if (!registration) return
    const link = `${window.location.origin}/register/status/${registration.registration.registrationId}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Copied!",
      description: "Registration link copied to clipboard"
    })
  }

  const handleSaveEdit = async () => {
    if (!registration) return
    setIsSaving(true)
    
    try {
      // Get sponsor name from sponsors list if sponsorId is set
      let sponsorName = editForm.sponsorName
      if (editForm.paymentType === 'sponsored' && editForm.sponsorId) {
        const sponsor = sponsors.find(s => s._id === editForm.sponsorId)
        sponsorName = sponsor?.companyName || ''
      }
      
      const response = await fetch(`/api/admin/users/${registration._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editForm.email,
          profile: {
            title: editForm.title,
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            phone: editForm.phone,
            institution: editForm.institution,
            designation: editForm.designation,
            specialization: editForm.specialization === 'not-specified' ? '' : editForm.specialization,
            mciNumber: editForm.mciNumber,
            address: {
              city: editForm.city,
              state: editForm.state,
              country: editForm.country
            },
            dietaryRequirements: editForm.dietaryRequirements,
            specialNeeds: editForm.specialNeeds
          },
          registration: {
            type: editForm.registrationType,
            status: editForm.registrationStatus,
            paymentType: editForm.paymentType,
            sponsorId: editForm.paymentType === 'sponsored' ? editForm.sponsorId : null,
            sponsorName: editForm.paymentType === 'sponsored' ? sponsorName : null,
            membershipNumber: editForm.membershipNumber,
            workshopSelections: editForm.workshopSelections,
            accommodation: {
              required: editForm.accommodationRequired,
              roomType: editForm.accommodationRoomType || 'single',
              checkIn: editForm.accommodationCheckIn,
              checkOut: editForm.accommodationCheckOut,
              nights: editForm.accommodationNights,
              totalAmount: editForm.accommodationTotalAmount
            }
          },
          payment: {
            method: editForm.paymentMethod,
            status: editForm.paymentStatus,
            amount: editForm.paymentAmount
          },
          adminNotes: editForm.adminNotes
        })
      })
      
      if (response.ok) {
        toast({
          title: "Saved",
          description: "Registration details updated successfully"
        })
        setIsEditing(false)
        onRefresh?.()
        onClose()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (!registration) return
    setEditForm({
      // Profile fields
      title: registration.profile.title || '',
      firstName: registration.profile.firstName || '',
      lastName: registration.profile.lastName || '',
      email: registration.email || '',
      phone: registration.profile.phone || '',
      institution: registration.profile.institution || '',
      designation: registration.profile.designation || '',
      specialization: registration.profile.specialization || 'not-specified',
      mciNumber: registration.profile.mciNumber || '',
      // Address fields
      city: registration.profile.address?.city || '',
      state: registration.profile.address?.state || '',
      country: registration.profile.address?.country || '',
      // Registration fields
      registrationType: registration.registration.type || '',
      registrationStatus: registration.registration.status || '',
      paymentType: registration.registration.paymentType || 'regular',
      sponsorId: registration.registration.sponsorId || '',
      sponsorName: registration.registration.sponsorName || '',
      membershipNumber: registration.registration.membershipNumber || '',
      workshopSelections: registration.registration.workshopSelections || [],
      dietaryRequirements: registration.profile.dietaryRequirements || '',
      specialNeeds: registration.profile.specialNeeds || '',
      // Payment fields
      paymentMethod: (registration as any).payment?.method || '',
      paymentStatus: (registration as any).payment?.status || '',
      paymentAmount: (registration as any).payment?.amount || 0,
      // Accommodation fields
      accommodationRequired: registration.registration.accommodation?.required || false,
      accommodationRoomType: registration.registration.accommodation?.roomType || '',
      accommodationCheckIn: registration.registration.accommodation?.checkIn || '',
      accommodationCheckOut: registration.registration.accommodation?.checkOut || '',
      accommodationNights: registration.registration.accommodation?.nights || 0,
      accommodationTotalAmount: registration.registration.accommodation?.totalAmount || 0,
      // Admin
      adminNotes: ''
    })
    setIsEditing(false)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      paid: { variant: "default", className: "bg-green-500" },
      confirmed: { variant: "default", className: "bg-blue-500" },
      pending: { variant: "secondary", className: "bg-yellow-500 text-black" },
      cancelled: { variant: "destructive", className: "" },
      'pending-payment': { variant: "outline", className: "border-orange-500 text-orange-500" }
    }
    const config = variants[status] || { variant: "outline" as const, className: "" }
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>
  }

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-600",
      error: "bg-red-500",
      warning: "bg-yellow-500 text-black",
      info: "bg-blue-500"
    }
    return <Badge className={colors[severity] || "bg-gray-500"}>{severity}</Badge>
  }

  if (!registration) return null

  const fullName = `${registration.profile.title} ${registration.profile.firstName} ${registration.profile.lastName}`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">{fullName}</div>
                <div className="text-sm text-muted-foreground">{registration.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Status Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    {getStatusBadge(registration.registration.status)}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusChange('paid')}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('confirmed')}>
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-500" /> Confirmed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('pending-payment')}>
                    <Clock className="h-4 w-4 mr-2 text-orange-500" /> Pending Payment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('cancelled')}>
                    <XCircle className="h-4 w-4 mr-2 text-red-500" /> Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quick Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleResendWelcomeEmail}>
                    <Send className="h-4 w-4 mr-2" /> Resend Welcome Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyRegistrationLink}>
                    <Link className="h-4 w-4 mr-2" /> Copy Registration Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Registration
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="sm" onClick={fetchAllData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Quick Stats Bar */}
        <div className="flex gap-4 py-2 border-y text-sm">
          <div className="flex items-center gap-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{stats.emailCount} emails</span>
          </div>
          <div className="flex items-center gap-1">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>{stats.paymentAttemptCount} payments</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{stats.abstractCount} abstracts</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span>{stats.errorCount} errors</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
            <TabsTrigger value="registration" className="text-xs">Registration</TabsTrigger>
            <TabsTrigger value="payment" className="text-xs">Payment</TabsTrigger>
            <TabsTrigger value="abstracts" className="text-xs">Abstracts</TabsTrigger>
            <TabsTrigger value="emails" className="text-xs">Emails</TabsTrigger>
            <TabsTrigger value="errors" className="text-xs">Errors</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
          </TabsList>

          {/* Edit Panel */}
          {isEditing && (
            <Card className="mt-4 border-primary">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Edit className="h-4 w-4" /> Edit Registration
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <ScrollArea className="h-[400px]">
                <CardContent className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Personal Information</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="title" className="text-xs">Title</Label>
                      <Select 
                        value={editForm.title} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, title: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dr.">Dr.</SelectItem>
                          <SelectItem value="Prof.">Prof.</SelectItem>
                          <SelectItem value="Mr.">Mr.</SelectItem>
                          <SelectItem value="Mrs.">Mrs.</SelectItem>
                          <SelectItem value="Ms.">Ms.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-xs">First Name</Label>
                      <Input
                        id="firstName"
                        className="h-8"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                      <Input
                        id="lastName"
                        className="h-8"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        className="h-8"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs">Phone</Label>
                      <Input
                        id="phone"
                        className="h-8"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="institution" className="text-xs">Institution</Label>
                      <Input
                        id="institution"
                        className="h-8"
                        value={editForm.institution}
                        onChange={(e) => setEditForm(prev => ({ ...prev, institution: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="designation" className="text-xs">Designation</Label>
                      <Select 
                        value={editForm.designation} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, designation: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Designation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Consultant">Consultant</SelectItem>
                          <SelectItem value="PG/Student">PG/Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="specialization" className="text-xs">Specialization</Label>
                      <Select 
                        value={editForm.specialization} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, specialization: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not-specified">Not specified</SelectItem>
                          <SelectItem value="Neurology">Neurology</SelectItem>
                          <SelectItem value="Neurosurgery">Neurosurgery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="mciNumber" className="text-xs">MCI Number</Label>
                      <Input
                        id="mciNumber"
                        className="h-8"
                        value={editForm.mciNumber}
                        onChange={(e) => setEditForm(prev => ({ ...prev, mciNumber: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Address</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="city" className="text-xs">City</Label>
                      <Input
                        id="city"
                        className="h-8"
                        value={editForm.city}
                        onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="state" className="text-xs">State</Label>
                      <Input
                        id="state"
                        className="h-8"
                        value={editForm.state}
                        onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="country" className="text-xs">Country</Label>
                      <Input
                        id="country"
                        className="h-8"
                        value={editForm.country}
                        onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Registration Details */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Registration Details</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="registrationType" className="text-xs">Registration Type</Label>
                      <Select 
                        value={editForm.registrationType} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, registrationType: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cvsi-member">CVSI Member</SelectItem>
                          <SelectItem value="non-member">Non-Member</SelectItem>
                          <SelectItem value="resident">Resident</SelectItem>
                          <SelectItem value="international">International</SelectItem>
                          <SelectItem value="complimentary">Complimentary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="registrationStatus" className="text-xs">Status</Label>
                      <Select 
                        value={editForm.registrationStatus} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, registrationStatus: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="pending-payment">Pending Payment</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="paymentType" className="text-xs">Payment Type</Label>
                      <Select 
                        value={editForm.paymentType} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, paymentType: value, sponsorId: value !== 'sponsored' ? '' : prev.sponsorId }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                          <SelectItem value="sponsored">Sponsored</SelectItem>
                          <SelectItem value="complimentary">Complimentary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editForm.paymentType === 'sponsored' && (
                      <div className="space-y-1">
                        <Label htmlFor="sponsorId" className="text-xs">Sponsor</Label>
                        <Select 
                          value={editForm.sponsorId} 
                          onValueChange={(value) => {
                            const sponsor = sponsors.find(s => s._id === value)
                            setEditForm(prev => ({ 
                              ...prev, 
                              sponsorId: value,
                              sponsorName: sponsor?.companyName || ''
                            }))
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder={loadingSponsors ? "Loading..." : "Select sponsor"} />
                          </SelectTrigger>
                          <SelectContent>
                            {sponsors.map(sponsor => (
                              <SelectItem key={sponsor._id} value={sponsor._id}>
                                {sponsor.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label htmlFor="membershipNumber" className="text-xs">Membership #</Label>
                      <Input
                        id="membershipNumber"
                        className="h-8"
                        value={editForm.membershipNumber}
                        onChange={(e) => setEditForm(prev => ({ ...prev, membershipNumber: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Payment Details</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="paymentMethod" className="text-xs">Payment Method</Label>
                      <Select 
                        value={editForm.paymentMethod} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, paymentMethod: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="pay-now">Pay Now</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="paymentStatus" className="text-xs">Payment Status</Label>
                      <Select 
                        value={editForm.paymentStatus} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, paymentStatus: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="paymentAmount" className="text-xs">Amount (₹)</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        className="h-8"
                        value={editForm.paymentAmount}
                        onChange={(e) => setEditForm(prev => ({ ...prev, paymentAmount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Special Requirements */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Special Requirements</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="dietaryRequirements" className="text-xs">Dietary Requirements</Label>
                      <Input
                        id="dietaryRequirements"
                        className="h-8"
                        value={editForm.dietaryRequirements}
                        onChange={(e) => setEditForm(prev => ({ ...prev, dietaryRequirements: e.target.value }))}
                        placeholder="e.g., Vegetarian, Vegan, Halal"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="specialNeeds" className="text-xs">Special Needs / Accessibility</Label>
                      <Input
                        id="specialNeeds"
                        className="h-8"
                        value={editForm.specialNeeds}
                        onChange={(e) => setEditForm(prev => ({ ...prev, specialNeeds: e.target.value }))}
                        placeholder="e.g., Wheelchair access"
                      />
                    </div>
                  </div>
                </div>

                {/* Workshop Selections */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Hotel Accommodation</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.accommodationRequired}
                        onChange={(e) => setEditForm(prev => ({ ...prev, accommodationRequired: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Accommodation Required</span>
                    </label>
                    {editForm.accommodationRequired && (
                      <div className="grid grid-cols-2 gap-3 pl-6">
                        <div className="space-y-1">
                          <Label className="text-xs">Room Type</Label>
                          <Select
                            value={editForm.accommodationRoomType}
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, accommodationRoomType: value }))}
                          >
                            <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single Room</SelectItem>
                              <SelectItem value="sharing">Sharing Room</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Nights</Label>
                          <Input
                            type="number"
                            className="h-8"
                            value={editForm.accommodationNights}
                            onChange={(e) => setEditForm(prev => ({ ...prev, accommodationNights: parseInt(e.target.value) || 0 }))}
                            min={0}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Check-in</Label>
                          <Input
                            type="date"
                            className="h-8"
                            value={editForm.accommodationCheckIn}
                            onChange={(e) => setEditForm(prev => ({ ...prev, accommodationCheckIn: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Check-out</Label>
                          <Input
                            type="date"
                            className="h-8"
                            value={editForm.accommodationCheckOut}
                            onChange={(e) => setEditForm(prev => ({ ...prev, accommodationCheckOut: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs">Total Amount (₹)</Label>
                          <Input
                            type="number"
                            className="h-8"
                            value={editForm.accommodationTotalAmount}
                            onChange={(e) => setEditForm(prev => ({ ...prev, accommodationTotalAmount: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workshop Selections */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Workshop Selections</h4>
                  {loadingWorkshops ? (
                    <p className="text-xs text-muted-foreground">Loading workshops...</p>
                  ) : workshops.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No workshops available</p>
                  ) : (
                    <div className="space-y-2">
                      {workshops.map(workshop => {
                        const isSelected = editForm.workshopSelections.includes(workshop.id)
                        const availableSeats = workshop.maxSeats === 0 ? '∞' : `${workshop.maxSeats - workshop.bookedSeats}/${workshop.maxSeats}`
                        return (
                          <label
                            key={workshop.id}
                            className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setEditForm(prev => ({
                                  ...prev,
                                  workshopSelections: isSelected
                                    ? prev.workshopSelections.filter(id => id !== workshop.id)
                                    : [...prev.workshopSelections, workshop.id]
                                }))
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium">{workshop.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                (Seats: {availableSeats} • ₹{workshop.price})
                              </span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Admin Notes */}
                <div className="space-y-1">
                  <Label htmlFor="adminNotes" className="text-xs">Admin Notes (will be logged)</Label>
                  <Textarea
                    id="adminNotes"
                    value={editForm.adminNotes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                    placeholder="Reason for changes..."
                    rows={2}
                  />
                </div>
              </CardContent>
              </ScrollArea>
            </Card>
          )}

          <ScrollArea className="h-[500px] mt-4">
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <ProfileTab registration={registration} onCopy={copyToClipboard} />
            </TabsContent>

            {/* Registration Tab */}
            <TabsContent value="registration" className="space-y-4">
              <RegistrationTab registration={registration} onCopy={copyToClipboard} />
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-4">
              <PaymentTab 
                registration={registration} 
                attempts={paymentAttempts}
                isLoading={isLoading}
              />
            </TabsContent>

            {/* Abstracts Tab */}
            <TabsContent value="abstracts" className="space-y-4">
              <AbstractsTab abstracts={abstracts} isLoading={isLoading} />
            </TabsContent>

            {/* Emails Tab */}
            <TabsContent value="emails" className="space-y-4">
              <EmailsTab emails={emails} isLoading={isLoading} />
            </TabsContent>

            {/* Errors Tab */}
            <TabsContent value="errors" className="space-y-4">
              <ErrorsTab errors={errors} isLoading={isLoading} />
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <ActivityTab activities={activities} isLoading={isLoading} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}


// Profile Tab Component
function ProfileTab({ registration, onCopy }: { registration: Registration, onCopy: (text: string, label: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Full Name</span>
            <span className="font-medium">{registration.profile.title} {registration.profile.firstName} {registration.profile.lastName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Email</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{registration.email}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onCopy(registration.email, 'Email')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Phone</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{registration.profile.phone}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onCopy(registration.profile.phone, 'Phone')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {registration.profile.mciNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">MCI Number</span>
              <span className="font-medium">{registration.profile.mciNumber}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Professional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Institution</span>
            <span className="font-medium">{registration.profile.institution}</span>
          </div>
          {registration.profile.designation && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Designation</span>
              <span className="font-medium">{registration.profile.designation}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium">
              {[registration.profile.address.city, registration.profile.address.state, registration.profile.address.country]
                .filter(Boolean).join(', ')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* HOD Recommendation Form - shown for PG/Student */}
      {registration.profile.hodFormUrl && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">HOD Recommendation Form</CardTitle>
          </CardHeader>
          <CardContent>
            {registration.profile.hodFormUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <div className="space-y-2">
                <img
                  src={registration.profile.hodFormUrl}
                  alt="HOD Recommendation Form"
                  className="max-w-full max-h-64 rounded-lg border object-contain"
                />
                <a
                  href={registration.profile.hodFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <Eye className="h-3 w-3" /> View Full Size
                </a>
              </div>
            ) : (
              <a
                href={registration.profile.hodFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <FileText className="h-4 w-4" /> View HOD Form (PDF)
              </a>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Special Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dietary</span>
            <span className="font-medium">{registration.profile.dietaryRequirements || 'None specified'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Special Needs</span>
            <span className="font-medium">{registration.profile.specialNeeds || 'None specified'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">{registration.createdAt ? new Date(registration.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Login</span>
            <span className="font-medium">{registration.lastLogin ? new Date(registration.lastLogin).toLocaleDateString() : 'Never'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Login Count</span>
            <span className="font-medium">{registration.loginCount || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Registration Tab Component
function RegistrationTab({ registration, onCopy }: { registration: Registration, onCopy: (text: string, label: string) => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Registration Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Registration ID</span>
            <div className="flex items-center gap-1">
              <code className="bg-muted px-2 py-1 rounded font-mono text-xs">{registration.registration.registrationId}</code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onCopy(registration.registration.registrationId, 'Registration ID')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <Badge variant="outline">{registration.registration.type}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={registration.registration.status === 'paid' ? 'default' : 'secondary'}>
              {registration.registration.status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Registration Date</span>
            <span className="font-medium">{new Date(registration.registration.registrationDate).toLocaleDateString()}</span>
          </div>
          {registration.registration.paymentDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Date</span>
              <span className="font-medium">{new Date(registration.registration.paymentDate).toLocaleDateString()}</span>
            </div>
          )}
          {registration.registration.membershipNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Membership #</span>
              <span className="font-medium">{registration.registration.membershipNumber}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {registration.registration.workshopSelections.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Workshop Selections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {registration.registration.workshopSelections.map((workshop, idx) => (
                <Badge key={idx} variant="outline">{workshop}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {registration.registration.accompanyingPersons.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Accompanying Persons ({registration.registration.accompanyingPersons.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {registration.registration.accompanyingPersons.map((person, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                  <span>{person.name}</span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Age: {person.age}</span>
                    <span>•</span>
                    <span>{person.relationship}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {registration.registration.accommodation?.required && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hotel Accommodation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room Type</span>
              <Badge variant="outline">{registration.registration.accommodation.roomType === 'single' ? 'Single Room' : 'Sharing Room'}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-medium">{registration.registration.accommodation.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-medium">{registration.registration.accommodation.checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nights</span>
              <span className="font-medium">{registration.registration.accommodation.nights}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">₹{registration.registration.accommodation.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {registration.registration.sponsorName && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sponsor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sponsor</span>
              <span className="font-medium">{registration.registration.sponsorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Type</span>
              <Badge variant="secondary">{registration.registration.paymentType}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Payment Tab Component
function PaymentTab({ registration, attempts, isLoading }: { registration: Registration, attempts: PaymentAttempt[], isLoading: boolean }) {
  const { toast } = useToast()
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={registration.registration.status === 'paid' ? 'default' : 'secondary'}>
              {registration.registration.status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Type</span>
            <Badge variant="outline">{registration.registration.paymentType || 'regular'}</Badge>
          </div>
          {registration.payment?.method && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-medium capitalize">{registration.payment.method.replace('-', ' ')}</span>
            </div>
          )}
          {registration.payment?.amount && registration.payment.amount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">₹{registration.payment.amount.toLocaleString()}</span>
            </div>
          )}
          {registration.payment?.bankTransferUTR && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">UTR Number</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-medium text-primary">{registration.payment.bankTransferUTR}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => copyToClipboard(registration.payment!.bankTransferUTR!, 'UTR')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          {registration.payment?.transactionId && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Transaction ID</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-medium">{registration.payment.transactionId}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => copyToClipboard(registration.payment!.transactionId!, 'Transaction ID')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          {registration.payment?.status && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status</span>
              <Badge variant={registration.payment.status === 'verified' ? 'default' : 'outline'}>
                {registration.payment.status}
              </Badge>
            </div>
          )}
          {registration.payment?.screenshotUrl && (
            <div className="pt-3 border-t">
              <span className="text-muted-foreground block mb-2">Payment Screenshot</span>
              <a 
                href={registration.payment.screenshotUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <img 
                  src={registration.payment.screenshotUrl} 
                  alt="Payment Screenshot" 
                  className="max-w-full h-auto rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxHeight: '300px' }}
                />
              </a>
              <p className="text-xs text-muted-foreground mt-1">Click to view full size</p>
            </div>
          )}
          {registration.registration.sponsorName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sponsor</span>
              <span className="font-medium">{registration.registration.sponsorName}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Payment Attempts ({attempts.length})
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" /> Invoice
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No payment attempts recorded</div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <div key={attempt.attemptId} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(attempt.status)}
                      <span className="font-medium">Attempt #{attempt.attemptNumber}</span>
                      <Badge variant="outline" className="text-xs">{attempt.method}</Badge>
                    </div>
                    <span className="font-mono">₹{attempt.amount.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Initiated: {new Date(attempt.initiatedAt).toLocaleString()}</div>
                    {attempt.completedAt && <div>Completed: {new Date(attempt.completedAt).toLocaleString()}</div>}
                    {attempt.razorpay?.orderId && <div>Order: {attempt.razorpay.orderId}</div>}
                    {attempt.device && <div>IP: {attempt.device.ip} • {attempt.device.browser}/{attempt.device.os}</div>}
                  </div>
                  {attempt.error && (
                    <div className="text-xs text-red-500 bg-red-50 p-2 rounded">{attempt.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


// Abstracts Tab Component
function AbstractsTab({ abstracts, isLoading }: { abstracts: Abstract[], isLoading: boolean }) {
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      submitted: "bg-blue-500",
      reviewing: "bg-yellow-500 text-black",
      accepted: "bg-green-500",
      rejected: "bg-red-500",
      revision: "bg-orange-500"
    }
    return <Badge className={colors[status] || "bg-gray-500"}>{status}</Badge>
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Submitted Abstracts ({abstracts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : abstracts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No abstracts submitted</div>
        ) : (
          <div className="space-y-3">
            {abstracts.map((abstract) => (
              <div key={abstract.abstractId} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{abstract.title}</span>
                  {getStatusBadge(abstract.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>ID: {abstract.abstractId}</span>
                  <span>Track: {abstract.track}</span>
                  <span>Submitted: {new Date(abstract.submittedAt).toLocaleDateString()}</span>
                  {abstract.reviewScore && <span>Score: {abstract.reviewScore}/10</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="h-3 w-3 mr-1" /> Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Emails Tab Component
function EmailsTab({ emails, isLoading }: { emails: EmailHistory[], isLoading: boolean }) {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const { toast } = useToast()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'bounced': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      registration: "bg-blue-500",
      payment: "bg-green-500",
      abstract: "bg-purple-500",
      system: "bg-gray-500",
      reminder: "bg-orange-500",
      sponsor: "bg-indigo-500"
    }
    return <Badge className={colors[category] || "bg-gray-500"} variant="secondary">{category}</Badge>
  }

  const handlePreview = (emailId: string) => {
    setSelectedEmailId(emailId)
    setIsPreviewOpen(true)
  }

  const handleResend = async (emailId: string) => {
    toast({
      title: "Resend",
      description: "Email resend functionality coming soon"
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Email History ({emails.length})
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {emails.filter(e => e.status === 'sent').length} sent
              </Badge>
              <Badge variant="outline" className="text-xs">
                {emails.filter(e => e.tracking?.openCount && e.tracking.openCount > 0).length} opened
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : emails.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No emails sent</div>
          ) : (
            <div className="space-y-2">
              {emails.map((email) => (
                <div key={email.emailId} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    {getStatusIcon(email.status)}
                    <span className="font-medium text-sm">{email.subject}</span>
                  </div>
                  {getCategoryBadge(email.category)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{new Date(email.sentAt).toLocaleString()}</span>
                  {email.tracking && email.tracking.openCount > 0 && (
                    <span className="text-green-600">Opened {email.tracking.openCount}x</span>
                  )}
                  {email.hasAttachments && <span>📎 Attachments</span>}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handlePreview(email.emailId)}
                  >
                    <Eye className="h-3 w-3 mr-1" /> Preview
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleResend(email.emailId)}
                  >
                    <Send className="h-3 w-3 mr-1" /> Resend
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <EmailPreviewModal
      emailId={selectedEmailId}
      isOpen={isPreviewOpen}
      onClose={() => {
        setIsPreviewOpen(false)
        setSelectedEmailId(null)
      }}
    />
  </>
  )
}

// Errors Tab Component
function ErrorsTab({ errors, isLoading }: { errors: ErrorLog[], isLoading: boolean }) {
  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-600",
      error: "bg-red-500",
      warning: "bg-yellow-500 text-black",
      info: "bg-blue-500"
    }
    return <Badge className={colors[severity] || "bg-gray-500"}>{severity}</Badge>
  }

  const getCategoryBadge = (category: string) => {
    return <Badge variant="outline">{category}</Badge>
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Error Log ({errors.length})
          <div className="flex gap-2">
            <Badge variant="destructive" className="text-xs">
              {errors.filter(e => e.severity === 'critical' || e.severity === 'error').length} critical/error
            </Badge>
            <Badge variant="outline" className="text-xs">
              {errors.filter(e => !e.resolved).length} unresolved
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : errors.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-green-600">
            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
            No errors recorded for this user
          </div>
        ) : (
          <div className="space-y-2">
            {errors.map((error) => (
              <div key={error.errorId} className={`border rounded-lg p-3 space-y-2 ${error.resolved ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(error.severity)}
                    {getCategoryBadge(error.category)}
                    {error.resolved && <Badge variant="outline" className="text-green-600">Resolved</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {error.occurrences > 1 && `${error.occurrences}x • `}
                    {new Date(error.lastOccurrence).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{error.message}</p>
                {error.device && (
                  <div className="text-xs text-muted-foreground">
                    {error.device.browser}/{error.device.os} • IP: {error.device.ip}
                  </div>
                )}
                {!error.resolved && (
                  <Button variant="outline" size="sm" className="text-xs">
                    Mark Resolved
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Activity Tab Component
function ActivityTab({ activities, isLoading }: { activities: AuditLog[], isLoading: boolean }) {
  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <User className="h-4 w-4" />
    if (action.includes('payment')) return <CreditCard className="h-4 w-4" />
    if (action.includes('registration')) return <FileText className="h-4 w-4" />
    if (action.includes('email')) return <Mail className="h-4 w-4" />
    if (action.includes('abstract')) return <FileText className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const getActorBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500",
      user: "bg-blue-500",
      system: "bg-gray-500"
    }
    return <Badge className={colors[role] || "bg-gray-500"} variant="secondary">{role}</Badge>
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Activity Timeline
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="h-3 w-3 mr-1" /> Export
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No activity recorded</div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.auditId} className="relative pl-10">
                  <div className="absolute left-2 top-1 h-5 w-5 rounded-full bg-background border-2 flex items-center justify-center">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{activity.action.replace(/\./g, ' ').replace(/_/g, ' ')}</span>
                        {getActorBadge(activity.actor.role)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      By: {activity.actor.email}
                    </div>
                    {activity.changes && activity.changes.fields && activity.changes.fields.length > 0 && (
                      <div className="text-xs bg-muted p-2 rounded mt-2">
                        <span className="font-medium">Changed: </span>
                        {activity.changes.fields.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RegistrationDetailsModal
