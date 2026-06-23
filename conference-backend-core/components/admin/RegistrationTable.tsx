"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Alert, AlertDescription } from "../ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Checkbox } from "../ui/checkbox"
import { Skeleton } from "../ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import {
  Users, Search, Filter, Download, Mail, Eye, Edit, Trash2, CheckCircle, Clock,
  AlertTriangle, User, Phone, Calendar, MoreVertical, Plus, Upload, FileSpreadsheet,
  Save, X, DollarSign, Gift, Award, FileText, Send, RefreshCw, Settings2, Columns,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown,
  FileDown, Printer, BadgeCheck, ScrollText, Copy, UserPlus, Link, CreditCard
} from "lucide-react"
import { useToast } from "../ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel } from "../ui/dropdown-menu"
import { EmailDialog } from "./EmailDialog"
import { VerifiedImportDialog } from "./VerifiedImportDialog"
import { SponsoredImportDialog } from "./SponsoredImportDialog"
import { RegistrationDetailsModal } from "./RegistrationDetailsModal"
import { conferenceConfig, getCategoryLabel } from "@/config/conference.config"

// Theme colors from config
const theme = conferenceConfig.theme

// Types
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
    address: { city: string; state: string; country: string }
    dietaryRequirements?: string
    specialNeeds?: string
  }
  registration: {
    registrationId: string
    type: string
    status: string
    membershipNumber?: string
    workshopSelections: string[]
    accompanyingPersons: Array<{ name: string; age: number; relationship: string; dietaryRequirements?: string }>
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
    paymentType?: 'regular' | 'pending' | 'online' | 'bank-transfer' | 'complementary' | 'complimentary' | 'sponsored'
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
  paymentInfo?: { amount: number; currency: string; transactionId: string; status?: string }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  sortable: boolean
}

// Storage keys
const STORAGE_KEYS = {
  columns: 'reg-table-columns',
  pageSize: 'reg-table-page-size',
  sortBy: 'reg-table-sort-by',
  sortOrder: 'reg-table-sort-order'
}

// Default columns
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'select', label: '', visible: true, sortable: false },
  { key: 'attendee', label: 'Attendee', visible: true, sortable: true },
  { key: 'registrationId', label: 'Reg ID', visible: true, sortable: true },
  { key: 'type', label: 'Type', visible: true, sortable: true },
  { key: 'status', label: 'Status', visible: true, sortable: true },
  { key: 'paymentType', label: 'Payment Type', visible: true, sortable: true },
  { key: 'date', label: 'Date', visible: true, sortable: true },
  { key: 'amount', label: 'Amount', visible: true, sortable: true },
  { key: 'actions', label: '', visible: true, sortable: false }
]

// Loading Skeleton Component
function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-slate-100 dark:bg-slate-800 p-3">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5].map(row => (
          <div key={row} className="p-4 border-t flex gap-4 items-center">
            <Skeleton className="h-4 w-4" />
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Status Badge Component with theme colors
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    paid: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: <CheckCircle className="h-3 w-3" /> },
    confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: <CheckCircle className="h-3 w-3" /> },
    pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: <Clock className="h-3 w-3" /> },
    'pending-payment': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: <Clock className="h-3 w-3" /> },
    cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: <X className="h-3 w-3" /> }
  }
  const c = config[status] || config.pending
  return (
    <Badge className={`${c.bg} ${c.text} border-0 flex items-center gap-1 font-medium`}>
      {c.icon}
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </Badge>
  )
}

// Payment Type Badge with theme colors
function PaymentTypeBadge({ type, sponsorName }: { type?: string; sponsorName?: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    regular: { 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-700 dark:text-blue-300', 
      icon: <DollarSign className="h-3 w-3" />,
      label: 'Online'
    },
    online: { 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-700 dark:text-blue-300', 
      icon: <DollarSign className="h-3 w-3" />,
      label: 'Online'
    },
    'bank-transfer': { 
      bg: 'bg-orange-100 dark:bg-orange-900/30', 
      text: 'text-orange-700 dark:text-orange-300', 
      icon: <FileText className="h-3 w-3" />,
      label: 'Bank Transfer'
    },
    complementary: { 
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-500', 
      text: 'text-white', 
      icon: <Gift className="h-3 w-3" />,
      label: 'Complimentary'
    },
    complimentary: { 
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-500', 
      text: 'text-white', 
      icon: <Gift className="h-3 w-3" />,
      label: 'Complimentary'
    },
    sponsored: { 
      bg: 'bg-gradient-to-r from-purple-500 to-indigo-500', 
      text: 'text-white', 
      icon: <Award className="h-3 w-3" />,
      label: 'Sponsored'
    },
    pending: { 
      bg: 'bg-amber-100 dark:bg-amber-900/30', 
      text: 'text-amber-700 dark:text-amber-300', 
      icon: <Clock className="h-3 w-3" />,
      label: 'Pending'
    }
  }
  
  const normalizedType = type?.toLowerCase() || 'pending'
  const c = config[normalizedType] || config.pending
  
  return (
    <div className="flex flex-col gap-1">
      <Badge className={`${c.bg} ${c.text} border-0 flex items-center gap-1 font-medium`}>
        {c.icon}
        {c.label}
      </Badge>
      {sponsorName && (
        <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={sponsorName}>
          {sponsorName}
        </span>
      )}
    </div>
  )
}

// Registration Type Badge
function TypeBadge({ type }: { type: string }) {
  const label = getCategoryLabel(type) || type.charAt(0).toUpperCase() + type.slice(1)
  return (
    <Badge variant="outline" className="font-medium border-slate-300 dark:border-slate-600">
      {label}
    </Badge>
  )
}

// Main Component
export function RegistrationTable() {
  // State
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Server-side stats (from API - reflects total database, not just current page)
  const [serverStats, setServerStats] = useState({
    total: 0,
    confirmed: 0,
    paid: 0,
    pendingPayment: 0,
    cancelled: 0,
    sponsored: 0,
    complimentary: 0,
    workshopRegistrations: 0,
    accompanyingPersons: 0
  })
  
  // Sponsors list for filter
  const [sponsors, setSponsors] = useState<Array<{ _id: string; companyName: string }>>([])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all")
  const [sponsorFilter, setSponsorFilter] = useState("all")
  const [specializationFilter, setSpecializationFilter] = useState("all")
  const [sortBy, setSortBy] = useState("registrationDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  
  // Column visibility
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.columns)
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS
    }
    return DEFAULT_COLUMNS
  })
  
  // Modals
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false)
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  const [isAddRegistrationOpen, setIsAddRegistrationOpen] = useState(false)
  const [isAddingRegistration, setIsAddingRegistration] = useState(false)
  
  // Add registration form
  const [newRegistration, setNewRegistration] = useState({
    email: '',
    password: '',
    title: 'Dr.',
    firstName: '',
    lastName: '',
    phone: '',
    designation: 'Consultant',
    specialization: 'not-specified',
    institution: '',
    mciNumber: '',
    city: '',
    state: '',
    country: 'India',
    registrationType: 'delegate',
    paymentType: 'pending' as 'pending' | 'complimentary' | 'bank-transfer',
    amount: 0,
    remarks: ''
  })
  
  const { toast } = useToast()

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPageSize = localStorage.getItem(STORAGE_KEYS.pageSize)
      const savedSortBy = localStorage.getItem(STORAGE_KEYS.sortBy)
      const savedSortOrder = localStorage.getItem(STORAGE_KEYS.sortOrder)
      
      if (savedPageSize) setPagination(p => ({ ...p, limit: parseInt(savedPageSize) }))
      if (savedSortBy) setSortBy(savedSortBy)
      if (savedSortOrder) setSortOrder(savedSortOrder as "asc" | "desc")
    }
  }, [])

  // Fetch sponsors list for filter dropdown
  useEffect(() => {
    const fetchSponsors = async () => {
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
      }
    }
    fetchSponsors()
  }, [])

  // Save preferences
  const savePreference = useCallback((key: string, value: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
    }
  }, [])

  // Fetch registrations with server-side pagination
  const fetchRegistrations = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(paymentTypeFilter !== 'all' && { paymentType: paymentTypeFilter }),
        ...(sponsorFilter !== 'all' && { sponsorId: sponsorFilter }),
        ...(specializationFilter !== 'all' && { specialization: specializationFilter })
      })
      
      const response = await fetch(`/api/admin/registrations?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setRegistrations(data.data)
        setPagination(p => ({
          ...p,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
        // Update server-side stats
        if (data.stats) {
          setServerStats({
            total: data.stats.total || 0,
            confirmed: data.stats.confirmed || 0,
            paid: data.stats.paid || 0,
            pendingPayment: data.stats.pendingPayment || 0,
            cancelled: data.stats.cancelled || 0,
            sponsored: data.stats.sponsored || 0,
            complimentary: data.stats.complimentary || 0,
            workshopRegistrations: data.stats.workshopRegistrations || 0,
            accompanyingPersons: data.stats.accompanyingPersons || 0
          })
        }
      } else {
        setError(data.message || "Failed to fetch registrations")
      }
    } catch (err) {
      console.error("Fetch error:", err)
      setError("An error occurred while fetching registrations")
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, searchTerm, statusFilter, typeFilter, paymentTypeFilter, sponsorFilter, specializationFilter])

  useEffect(() => {
    const debounce = setTimeout(fetchRegistrations, 300)
    return () => clearTimeout(debounce)
  }, [fetchRegistrations])

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? registrations.map(r => r._id) : [])
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id))
  }

  const isAllSelected = registrations.length > 0 && selectedIds.length === registrations.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < registrations.length

  // Sort handler
  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortBy(column)
    setSortOrder(newOrder)
    savePreference(STORAGE_KEYS.sortBy, column)
    savePreference(STORAGE_KEYS.sortOrder, newOrder)
  }

  // Column visibility toggle
  const toggleColumn = (key: string) => {
    const updated = columns.map(c => c.key === key ? { ...c, visible: !c.visible } : c)
    setColumns(updated)
    savePreference(STORAGE_KEYS.columns, JSON.stringify(updated))
  }

  // Page size change
  const handlePageSizeChange = (size: string) => {
    const newLimit = parseInt(size)
    setPagination(p => ({ ...p, limit: newLimit, page: 1 }))
    savePreference(STORAGE_KEYS.pageSize, size)
  }

  // Row Actions
  const handleViewDetails = (reg: Registration) => {
    setSelectedRegistration(reg)
    setIsDetailsOpen(true)
  }

  const handleSendEmail = (reg: Registration) => {
    setSelectedRegistration(reg)
    setIsEmailDialogOpen(true)
  }

  const handleVerifyPayment = async (reg: Registration) => {
    try {
      // Use approve endpoint which updates status, sends email with invoice
      const response = await fetch(`/api/admin/registrations/${reg._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: 'Payment verified by admin' })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast({ 
          title: "Payment Verified", 
          description: `${reg.profile.firstName}'s payment has been verified and confirmation email sent` 
        })
        fetchRegistrations()
      } else {
        throw new Error(data.message || 'Failed to verify payment')
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to verify payment", variant: "destructive" })
    }
  }

  const handleCancelRegistration = async (reg: Registration) => {
    if (!confirm(`Are you sure you want to permanently delete the registration for ${reg.profile.firstName} ${reg.profile.lastName}? This cannot be undone.`)) return
    try {
      const response = await fetch(`/api/admin/users/${reg._id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (response.ok && result.success) {
        toast({ title: "Registration Deleted", description: result.message || "The registration has been permanently removed" })
        fetchRegistrations()
      } else {
        toast({ title: "Error", description: result.message || "Failed to delete registration", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete registration", variant: "destructive" })
    }
  }

  const handleGenerateBadge = async (reg: Registration) => {
    toast({ title: "Generating Badge...", description: `Creating badge for ${reg.profile.firstName}` })
    try {
      const response = await fetch(`/api/admin/registrations/${reg._id}/badge`, { method: 'POST' })
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `badge-${reg.registration.registrationId}.pdf`
        a.click()
        toast({ title: "Badge Generated", description: "Badge PDF has been downloaded" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate badge", variant: "destructive" })
    }
  }

  const handleGenerateCertificate = async (reg: Registration) => {
    toast({ title: "Generating Certificate...", description: `Creating certificate for ${reg.profile.firstName}` })
    try {
      const response = await fetch(`/api/admin/registrations/${reg._id}/certificate`, { method: 'POST' })
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificate-${reg.registration.registrationId}.pdf`
        a.click()
        toast({ title: "Certificate Generated", description: "Certificate PDF has been downloaded" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate certificate", variant: "destructive" })
    }
  }

  const handleGenerateInvoice = async (reg: Registration) => {
    toast({ title: "Generating Invoice...", description: `Creating invoice for ${reg.profile.firstName}` })
    try {
      const response = await fetch(`/api/admin/registrations/${reg._id}/invoice`, { method: 'POST' })
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${reg.registration.registrationId}.pdf`
        a.click()
        toast({ title: "Invoice Generated", description: "Invoice PDF has been downloaded" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate invoice", variant: "destructive" })
    }
  }

  // Bulk Actions
  const handleBulkEmail = () => {
    if (selectedIds.length === 0) {
      toast({ title: "No Selection", description: "Please select registrations first", variant: "destructive" })
      return
    }
    setIsBulkEmailOpen(true)
  }

  const handleBulkExport = async () => {
    if (selectedIds.length === 0) {
      toast({ title: "No Selection", description: "Please select registrations first", variant: "destructive" })
      return
    }
    setIsBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/export/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `registrations-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        toast({ title: "Export Complete", description: `Exported ${selectedIds.length} registrations` })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to export", variant: "destructive" })
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const handleBulkBadges = async () => {
    if (selectedIds.length === 0) return
    setIsBulkActionLoading(true)
    toast({ title: "Generating Badges...", description: `Creating ${selectedIds.length} badges` })
    
    let success = 0, failed = 0
    for (const id of selectedIds) {
      try {
        const response = await fetch(`/api/admin/registrations/${id}/badge`, { method: 'POST' })
        if (response.ok) success++
        else failed++
      } catch { failed++ }
    }
    
    toast({
      title: success > 0 ? "Badges Generated" : "Generation Failed",
      description: `Success: ${success}, Failed: ${failed}`,
      variant: failed > 0 ? "destructive" : "default"
    })
    setIsBulkActionLoading(false)
    setSelectedIds([])
  }

  const handleBulkCertificates = async () => {
    if (selectedIds.length === 0) return
    setIsBulkActionLoading(true)
    toast({ title: "Generating Certificates...", description: `Creating ${selectedIds.length} certificates` })
    
    let success = 0, failed = 0
    for (const id of selectedIds) {
      try {
        const response = await fetch(`/api/admin/registrations/${id}/certificate`, { method: 'POST' })
        if (response.ok) success++
        else failed++
      } catch { failed++ }
    }
    
    toast({
      title: success > 0 ? "Certificates Generated" : "Generation Failed",
      description: `Success: ${success}, Failed: ${failed}`,
      variant: failed > 0 ? "destructive" : "default"
    })
    setIsBulkActionLoading(false)
    setSelectedIds([])
  }

  // Validation state for add registration form
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Phone validation (10 digits, numbers only)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/
    return phoneRegex.test(phone.replace(/[\s\-\+]/g, '').slice(-10))
  }

  // Check email availability
  const checkEmailAvailability = async (email: string) => {
    if (!email || !validateEmail(email)) {
      setEmailAvailable(null)
      return
    }
    
    setCheckingEmail(true)
    try {
      const response = await fetch(`/api/admin/users/search?email=${encodeURIComponent(email)}`)
      const data = await response.json()
      setEmailAvailable(!data.user) // Available if user not found
    } catch {
      setEmailAvailable(null)
    } finally {
      setCheckingEmail(false)
    }
  }

  // Validate form field
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'email':
        if (!value) return 'Email is required'
        if (!validateEmail(value)) return 'Invalid email format'
        if (emailAvailable === false) return 'Email already registered'
        return ''
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
        return ''
      case 'firstName':
        if (!value) return 'First name is required'
        if (value.length < 2) return 'First name must be at least 2 characters'
        return ''
      case 'lastName':
        if (!value) return 'Last name is required'
        if (value.length < 2) return 'Last name must be at least 2 characters'
        return ''
      case 'phone':
        if (!value) return 'Phone number is required'
        if (!validatePhone(value)) return 'Phone must be 10 digits'
        return ''
      case 'institution':
        if (!value) return 'Institution is required'
        return ''
      default:
        return ''
    }
  }

  // Handle field change with validation
  const handleFieldChange = (field: string, value: string) => {
    setNewRegistration(prev => ({ ...prev, [field]: value }))
    
    // Validate on change
    const error = validateField(field, value)
    setFormErrors(prev => ({ ...prev, [field]: error }))
    
    // Check email availability with debounce
    if (field === 'email' && validateEmail(value)) {
      const timeoutId = setTimeout(() => checkEmailAvailability(value), 500)
      return () => clearTimeout(timeoutId)
    }
  }

  // Add new registration
  const handleAddRegistration = async () => {
    // Validate all required fields
    const errors: Record<string, string> = {}
    errors.email = validateField('email', newRegistration.email)
    errors.password = validateField('password', newRegistration.password)
    errors.firstName = validateField('firstName', newRegistration.firstName)
    errors.lastName = validateField('lastName', newRegistration.lastName)
    errors.phone = validateField('phone', newRegistration.phone)
    errors.institution = validateField('institution', newRegistration.institution)
    
    // Check if any errors
    const hasErrors = Object.values(errors).some(e => e)
    if (hasErrors) {
      setFormErrors(errors)
      const firstError = Object.values(errors).find(e => e)
      toast({ title: "Validation Error", description: firstError, variant: "destructive" })
      return
    }

    // Check email availability one more time
    if (emailAvailable === false) {
      toast({ title: "Email Taken", description: "This email is already registered", variant: "destructive" })
      return
    }

    setIsAddingRegistration(true)
    try {
      const registrationData = {
        email: newRegistration.email.toLowerCase().trim(),
        password: newRegistration.password,
        profile: {
          title: newRegistration.title || 'Dr.',
          firstName: newRegistration.firstName.trim(),
          lastName: newRegistration.lastName.trim(),
          phone: newRegistration.phone.trim(),
          designation: newRegistration.designation || 'Consultant',
          specialization: newRegistration.specialization === 'not-specified' ? '' : (newRegistration.specialization || ''),
          institution: newRegistration.institution.trim(),
          mciNumber: newRegistration.mciNumber?.trim() || 'N/A',
          address: {
            street: '',
            city: newRegistration.city?.trim() || '',
            state: newRegistration.state?.trim() || '',
            country: newRegistration.country || 'India',
            pincode: ''
          }
        },
        registration: {
          type: newRegistration.registrationType || 'delegate',
          status: newRegistration.paymentType === 'complimentary' ? 'paid' : 'pending-payment',
          paymentType: newRegistration.paymentType === 'complimentary' ? 'complimentary' : 
                       newRegistration.paymentType === 'bank-transfer' ? 'bank-transfer' : 'pending',
          source: 'admin-created',
          paymentRemarks: newRegistration.remarks?.trim() || '',
          workshopSelections: [],
          accompanyingPersons: []
        },
        payment: newRegistration.paymentType !== 'complimentary' ? {
          method: newRegistration.paymentType === 'bank-transfer' ? 'bank-transfer' : 'online',
          status: 'pending',
          amount: newRegistration.amount || 0
        } : undefined
      }

      const response = await fetch('/api/admin/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      })

      const data = await response.json()
      
      if (data.success) {
        toast({ 
          title: "Registration Created", 
          description: `Registration ID: ${data.data.registration.registrationId}` 
        })
        setIsAddRegistrationOpen(false)
        // Reset all form state
        setFormErrors({})
        setEmailAvailable(null)
        setNewRegistration({
          email: '',
          password: '',
          title: 'Dr.',
          firstName: '',
          lastName: '',
          phone: '',
          designation: 'Consultant',
          specialization: '',
          institution: '',
          mciNumber: '',
          city: '',
          state: '',
          country: 'India',
          registrationType: 'delegate',
          paymentType: 'pending',
          amount: 0,
          remarks: ''
        })
        fetchRegistrations()
      } else {
        toast({ title: "Error", description: data.message || "Failed to create registration", variant: "destructive" })
      }
    } catch (err) {
      console.error('Registration error:', err)
      toast({ title: "Error", description: "Failed to create registration", variant: "destructive" })
    } finally {
      setIsAddingRegistration(false)
    }
  }

  // Generate payment link
  const handleGeneratePaymentLink = async (reg: Registration) => {
    const paymentUrl = `${window.location.origin}/register/status?email=${encodeURIComponent(reg.email)}`
    try {
      await navigator.clipboard.writeText(paymentUrl)
      toast({ title: "Link Copied", description: "Payment link copied to clipboard" })
    } catch {
      toast({ title: "Payment Link", description: paymentUrl })
    }
  }

  const handleExportAll = async () => {
    try {
      const response = await fetch('/api/admin/export/registrations')
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `all-registrations-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        toast({ title: "Export Complete", description: "All registrations exported" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to export", variant: "destructive" })
    }
  }

  // Export with current filters (including sponsor filter)
  const handleExportFiltered = async () => {
    try {
      const params = new URLSearchParams()
      if (sponsorFilter !== 'all') params.append('sponsorId', sponsorFilter)
      if (paymentTypeFilter !== 'all') params.append('paymentType', paymentTypeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (specializationFilter !== 'all') params.append('specialization', specializationFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      
      const url = `/api/admin/export/registrations${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        const sponsorName = sponsorFilter !== 'all' ? sponsors.find(s => s._id === sponsorFilter)?.companyName || 'sponsor' : 'filtered'
        a.download = `registrations-${sponsorName}-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        toast({ title: "Export Complete", description: "Filtered registrations exported" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to export", variant: "destructive" })
    }
  }

  // Stats - use server stats for all totals (reflects entire database, not just current page)
  const stats = useMemo(() => ({
    paid: serverStats.paid,
    confirmed: serverStats.confirmed,
    pending: serverStats.pendingPayment,
    total: serverStats.total,
    workshops: serverStats.workshopRegistrations,
    accompanying: serverStats.accompanyingPersons
  }), [serverStats])

  // Format currency
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`

  // Render sort icon
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-xl">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.primary}20` }}>
                  <Users className="h-5 w-5" style={{ color: theme.primary }} />
                </div>
                Registrations
                <Badge variant="secondary" className="ml-2">{pagination.total}</Badge>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
                Manage conference registrations and attendee information
              </CardDescription>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => setIsAddRegistrationOpen(true)}
                className="gap-2"
                style={{ backgroundColor: theme.primary }}
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Registration</span>
              </Button>
              <VerifiedImportDialog onImportComplete={fetchRegistrations} />
              <SponsoredImportDialog onImportComplete={fetchRegistrations} />
              <Button variant="outline" size="sm" onClick={handleExportAll} className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export All</span>
              </Button>
              {(sponsorFilter !== 'all' || paymentTypeFilter !== 'all' || statusFilter !== 'all' || specializationFilter !== 'all' || typeFilter !== 'all') && (
                <Button variant="outline" size="sm" onClick={handleExportFiltered} className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50">
                  <FileDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Export Filtered</span>
                </Button>
              )}
              
              {/* Column Visibility */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Columns className="h-4 w-4" />
                    <span className="hidden sm:inline">Columns</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="end">
                  <div className="space-y-2">
                    <p className="text-sm font-medium mb-2">Toggle Columns</p>
                    {columns.filter(c => c.key !== 'select' && c.key !== 'actions').map(col => (
                      <div key={col.key} className="flex items-center gap-2">
                        <Checkbox
                          id={`col-${col.key}`}
                          checked={col.visible}
                          onCheckedChange={() => toggleColumn(col.key)}
                        />
                        <Label htmlFor={`col-${col.key}`} className="text-sm cursor-pointer">{col.label}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="outline" size="sm" onClick={fetchRegistrations} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {isLoading && registrations.length === 0 ? (
            <TableSkeleton />
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.paid}</div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300">Paid</div>
                </div>
                <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.confirmed}</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">Confirmed</div>
                </div>
                <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">Pending</div>
                </div>
                <div className="p-3 rounded-lg border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.workshops}</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">Workshop Regs</div>
                </div>
                <div className="p-3 rounded-lg border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.accompanying}</div>
                  <div className="text-xs text-indigo-700 dark:text-indigo-300">Accompanying</div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, ID, phone, institution..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                    className="pl-10 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination(p => ({ ...p, page: 1 })) }}>
                    <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="pending-payment">Pending Payment</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPagination(p => ({ ...p, page: 1 })) }}>
                    <SelectTrigger className="w-[150px] bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {conferenceConfig.registration.categories.map(cat => (
                        <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={paymentTypeFilter} onValueChange={(v) => { setPaymentTypeFilter(v); setPagination(p => ({ ...p, page: 1 })) }}>
                    <SelectTrigger className="w-[150px] bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Payment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Types</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="complementary">Complimentary</SelectItem>
                      <SelectItem value="sponsored">Sponsored</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {sponsors.length > 0 && (
                    <Select value={sponsorFilter} onValueChange={(v) => { setSponsorFilter(v); setPagination(p => ({ ...p, page: 1 })) }}>
                      <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900">
                        <Award className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Sponsor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sponsors</SelectItem>
                        {sponsors.map(sponsor => (
                          <SelectItem key={sponsor._id} value={sponsor._id}>{sponsor.companyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Select value={specializationFilter} onValueChange={(v) => { setSpecializationFilter(v); setPagination(p => ({ ...p, page: 1 })) }}>
                    <SelectTrigger className="w-[160px] bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specializations</SelectItem>
                      <SelectItem value="Neurology">Neurology</SelectItem>
                      <SelectItem value="Neurosurgery">Neurosurgery</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || paymentTypeFilter !== 'all' || sponsorFilter !== 'all' || specializationFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("")
                        setStatusFilter("all")
                        setTypeFilter("all")
                        setPaymentTypeFilter("all")
                        setSponsorFilter("all")
                        setSpecializationFilter("all")
                        setPagination(p => ({ ...p, page: 1 }))
                      }}
                    >
                      <X className="h-4 w-4 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Bulk Actions Bar */}
              <AnimatePresence>
                {selectedIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg border-2"
                    style={{ backgroundColor: `${theme.secondary}10`, borderColor: theme.secondary }}
                  >
                    <Badge variant="secondary" className="font-medium">
                      {selectedIds.length} selected
                    </Badge>
                    <div className="flex-1" />
                    <Button size="sm" variant="outline" onClick={handleBulkEmail} disabled={isBulkActionLoading}>
                      <Mail className="h-4 w-4 mr-1" /> Email
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleBulkExport} disabled={isBulkActionLoading}>
                      <FileDown className="h-4 w-4 mr-1" /> Export
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleBulkBadges} disabled={isBulkActionLoading}>
                      <BadgeCheck className="h-4 w-4 mr-1" /> Badges
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleBulkCertificates} disabled={isBulkActionLoading}>
                      <ScrollText className="h-4 w-4 mr-1" /> Certificates
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      {columns.find(c => c.key === 'select')?.visible && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                            className={isSomeSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                          />
                        </TableHead>
                      )}
                      {columns.find(c => c.key === 'attendee')?.visible && (
                        <TableHead className="min-w-[200px]">
                          <button onClick={() => handleSort('firstName')} className="flex items-center font-medium hover:text-primary">
                            Attendee <SortIcon column="firstName" />
                          </button>
                        </TableHead>
                      )}
                      {columns.find(c => c.key === 'registrationId')?.visible && (
                        <TableHead>
                          <button onClick={() => handleSort('registrationId')} className="flex items-center font-medium hover:text-primary">
                            Reg ID <SortIcon column="registrationId" />
                          </button>
                        </TableHead>
                      )}
                      {columns.find(c => c.key === 'type')?.visible && (
                        <TableHead>
                          <button onClick={() => handleSort('type')} className="flex items-center font-medium hover:text-primary">
                            Type <SortIcon column="type" />
                          </button>
                        </TableHead>
                      )}
                      {columns.find(c => c.key === 'status')?.visible && (
                        <TableHead>
                          <button onClick={() => handleSort('status')} className="flex items-center font-medium hover:text-primary">
                            Status <SortIcon column="status" />
                          </button>
                        </TableHead>
                      )}
                      {columns.find(c => c.key === 'paymentType')?.visible && (
                        <TableHead>Payment Type</TableHead>
                      )}
                      {columns.find(c => c.key === 'date')?.visible && (
                        <TableHead>
                          <button onClick={() => handleSort('registrationDate')} className="flex items-center font-medium hover:text-primary">
                            Date <SortIcon column="registrationDate" />
                          </button>
                        </TableHead>
                      )}
                      {columns.find(c => c.key === 'amount')?.visible && (
                        <TableHead>
                          <button onClick={() => handleSort('amount')} className="flex items-center font-medium hover:text-primary">
                            Amount <SortIcon column="amount" />
                          </button>
                        </TableHead>
                      )}
                      {columns.find(c => c.key === 'actions')?.visible && (
                        <TableHead className="w-12"></TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.filter(c => c.visible).length} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Users className="h-8 w-8 opacity-50" />
                            <p>No registrations found</p>
                            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || sponsorFilter !== 'all') && (
                              <Button variant="link" onClick={() => { setSearchTerm(""); setStatusFilter("all"); setTypeFilter("all"); setPaymentTypeFilter("all"); setSponsorFilter("all") }}>
                                Clear filters
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      registrations.map((reg) => (
                        <TableRow key={reg._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          {columns.find(c => c.key === 'select')?.visible && (
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.includes(reg._id)}
                                onCheckedChange={(checked) => handleSelectOne(reg._id, checked as boolean)}
                              />
                            </TableCell>
                          )}
                          {columns.find(c => c.key === 'attendee')?.visible && (
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                                  style={{ backgroundColor: theme.primary }}>
                                  {reg.profile.firstName[0]}{reg.profile.lastName[0]}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 dark:text-white truncate">
                                    {reg.profile.title} {reg.profile.firstName} {reg.profile.lastName}
                                  </div>
                                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{reg.email}</div>
                                  <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{reg.profile.institution}</div>
                                </div>
                              </div>
                            </TableCell>
                          )}
                          {columns.find(c => c.key === 'registrationId')?.visible && (
                            <TableCell>
                              <button
                                onClick={() => handleViewDetails(reg)}
                                className="font-mono text-sm px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                style={{ color: theme.primary }}
                              >
                                {reg.registration.registrationId}
                              </button>
                            </TableCell>
                          )}
                          {columns.find(c => c.key === 'type')?.visible && (
                            <TableCell><TypeBadge type={reg.registration.type} /></TableCell>
                          )}
                          {columns.find(c => c.key === 'status')?.visible && (
                            <TableCell><StatusBadge status={reg.registration.status} /></TableCell>
                          )}
                          {columns.find(c => c.key === 'paymentType')?.visible && (
                            <TableCell>
                              <PaymentTypeBadge 
                                type={reg.registration.paymentType === 'regular' && reg.payment?.method ? reg.payment.method : reg.registration.paymentType} 
                                sponsorName={reg.registration.sponsorName} 
                              />
                            </TableCell>
                          )}
                          {columns.find(c => c.key === 'date')?.visible && (
                            <TableCell>
                              <div className="text-sm">{new Date(reg.registration.registrationDate).toLocaleDateString()}</div>
                              {reg.registration.paymentDate && (
                                <div className="text-xs text-muted-foreground">
                                  Paid: {new Date(reg.registration.paymentDate).toLocaleDateString()}
                                </div>
                              )}
                            </TableCell>
                          )}
                          {columns.find(c => c.key === 'amount')?.visible && (
                            <TableCell>
                              {reg.paymentInfo ? (
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(reg.paymentInfo.amount)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          {columns.find(c => c.key === 'actions')?.visible && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewDetails(reg)}>
                                    <Eye className="h-4 w-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSendEmail(reg)}>
                                    <Mail className="h-4 w-4 mr-2" /> Send Email
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {reg.registration.status !== 'paid' && (
                                    <DropdownMenuItem onClick={() => handleVerifyPayment(reg)}>
                                      <CheckCircle className="h-4 w-4 mr-2" /> Verify Payment
                                    </DropdownMenuItem>
                                  )}
                                  {reg.registration.status !== 'paid' && (
                                    <DropdownMenuItem onClick={() => handleGeneratePaymentLink(reg)}>
                                      <Link className="h-4 w-4 mr-2" /> Copy Payment Link
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleGenerateBadge(reg)}>
                                    <BadgeCheck className="h-4 w-4 mr-2" /> Generate Badge
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleGenerateCertificate(reg)}>
                                    <ScrollText className="h-4 w-4 mr-2" /> Generate Certificate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleGenerateInvoice(reg)}>
                                    <FileText className="h-4 w-4 mr-2" /> Generate Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleCancelRegistration(reg)} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Registration
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows per page:</span>
                  <Select value={pagination.limit.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="ml-2">
                    {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(p => ({ ...p, page: 1 }))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                          style={pagination.page === pageNum ? { backgroundColor: theme.primary } : {}}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(p => ({ ...p, page: p.totalPages }))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <RegistrationDetailsModal
        registration={selectedRegistration}
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedRegistration(null) }}
        onRefresh={fetchRegistrations}
      />

      {/* Email Dialog */}
      {selectedRegistration && (
        <EmailDialog
          isOpen={isEmailDialogOpen}
          registration={selectedRegistration}
          onClose={() => { setIsEmailDialogOpen(false); setSelectedRegistration(null) }}
          onEmailSent={() => { setIsEmailDialogOpen(false); setSelectedRegistration(null) }}
        />
      )}

      {/* Bulk Email Dialog */}
      <BulkEmailDialog
        isOpen={isBulkEmailOpen}
        selectedIds={selectedIds}
        registrations={registrations}
        onClose={() => setIsBulkEmailOpen(false)}
        onSent={() => { setIsBulkEmailOpen(false); setSelectedIds([]) }}
      />

      {/* Add Registration Dialog */}
      <Dialog open={isAddRegistrationOpen} onOpenChange={(open) => {
        setIsAddRegistrationOpen(open)
        if (!open) {
          // Reset form state when closing
          setFormErrors({})
          setEmailAvailable(null)
          setNewRegistration({
            email: '',
            password: '',
            title: 'Dr.',
            firstName: '',
            lastName: '',
            phone: '',
            designation: 'Consultant',
            specialization: '',
            institution: '',
            mciNumber: '',
            city: '',
            state: '',
            country: 'India',
            registrationType: 'delegate',
            paymentType: 'pending',
            amount: 0,
            remarks: ''
          })
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" style={{ color: theme.primary }} />
              Add New Registration
            </DialogTitle>
            <DialogDescription>
              Create a new registration manually. The user will receive login credentials via email.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="reg-email">Email *</Label>
              <div className="relative">
                <Input
                  id="reg-email"
                  type="email"
                  value={newRegistration.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => newRegistration.email && checkEmailAvailability(newRegistration.email)}
                  placeholder="user@example.com"
                  className={formErrors.email ? 'border-red-500' : emailAvailable === true ? 'border-green-500' : ''}
                />
                {checkingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
                {!checkingEmail && emailAvailable === true && newRegistration.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                )}
                {!checkingEmail && emailAvailable === false && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
              {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              {emailAvailable === false && <p className="text-xs text-red-500 mt-1">This email is already registered</p>}
            </div>

            <div className="col-span-2">
              <Label htmlFor="reg-password">Password * (min 8 characters)</Label>
              <Input
                id="reg-password"
                type="text"
                value={newRegistration.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                placeholder="Enter password for user"
                className={formErrors.password ? 'border-red-500' : ''}
              />
              {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
              <p className="text-xs text-muted-foreground mt-1">This password will be shared with the user for login</p>
            </div>

            <div>
              <Label htmlFor="reg-title">Title *</Label>
              <Select 
                value={newRegistration.title} 
                onValueChange={(v) => setNewRegistration(prev => ({ ...prev, title: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div>
              <Label htmlFor="reg-designation">Designation *</Label>
              <Select 
                value={newRegistration.designation} 
                onValueChange={(v) => {
                  // Auto-select registration type based on designation
                  const regType = v === 'PG/Student' ? 'resident' : 'delegate'
                  setNewRegistration(prev => ({ ...prev, designation: v, registrationType: regType }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultant">Consultant</SelectItem>
                  <SelectItem value="PG/Student">PG/Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reg-specialization">Specialization</Label>
              <Select 
                value={newRegistration.specialization} 
                onValueChange={(v) => setNewRegistration(prev => ({ ...prev, specialization: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-specified">Not specified</SelectItem>
                  <SelectItem value="Neurology">Neurology</SelectItem>
                  <SelectItem value="Neurosurgery">Neurosurgery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reg-firstName">First Name *</Label>
              <Input
                id="reg-firstName"
                value={newRegistration.firstName}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                placeholder="First name"
                className={formErrors.firstName ? 'border-red-500' : ''}
              />
              {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
            </div>

            <div>
              <Label htmlFor="reg-lastName">Last Name *</Label>
              <Input
                id="reg-lastName"
                value={newRegistration.lastName}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                placeholder="Last name"
                className={formErrors.lastName ? 'border-red-500' : ''}
              />
              {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
            </div>

            <div>
              <Label htmlFor="reg-phone">Phone * (10 digits)</Label>
              <Input
                id="reg-phone"
                value={newRegistration.phone}
                onChange={(e) => {
                  // Only allow numbers
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
                  handleFieldChange('phone', value)
                }}
                placeholder="9876543210"
                maxLength={10}
                className={formErrors.phone ? 'border-red-500' : ''}
              />
              {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              {newRegistration.phone && !formErrors.phone && (
                <p className="text-xs text-green-500 mt-1">{newRegistration.phone.length}/10 digits</p>
              )}
            </div>

            <div>
              <Label htmlFor="reg-mci">MCI/Registration Number</Label>
              <Input
                id="reg-mci"
                value={newRegistration.mciNumber}
                onChange={(e) => setNewRegistration(prev => ({ ...prev, mciNumber: e.target.value }))}
                placeholder="MCI number"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="reg-institution">Institution *</Label>
              <Input
                id="reg-institution"
                value={newRegistration.institution}
                onChange={(e) => handleFieldChange('institution', e.target.value)}
                placeholder="Hospital/Institution name"
                className={formErrors.institution ? 'border-red-500' : ''}
              />
              {formErrors.institution && <p className="text-xs text-red-500 mt-1">{formErrors.institution}</p>}
            </div>

            <div>
              <Label htmlFor="reg-city">City</Label>
              <Input
                id="reg-city"
                value={newRegistration.city}
                onChange={(e) => setNewRegistration(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>

            <div>
              <Label htmlFor="reg-state">State</Label>
              <Input
                id="reg-state"
                value={newRegistration.state}
                onChange={(e) => setNewRegistration(prev => ({ ...prev, state: e.target.value }))}
                placeholder="State"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="reg-type">Registration Type *</Label>
              <Select 
                value={newRegistration.registrationType} 
                onValueChange={(v) => setNewRegistration(prev => ({ ...prev, registrationType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conferenceConfig.registration.categories
                    .filter(cat => {
                      // Filter based on designation
                      if (newRegistration.designation === 'PG/Student') {
                        return cat.key === 'resident'
                      }
                      return cat.key === 'delegate'
                    })
                    .map(cat => (
                      <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {newRegistration.designation === 'PG/Student' 
                  ? 'PG/Students are registered as Residents' 
                  : 'Consultants are registered as Delegates'}
              </p>
            </div>

            <div className="col-span-2">
              <Label>Payment Type *</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div
                  onClick={() => setNewRegistration(prev => ({ ...prev, paymentType: 'pending' }))}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    newRegistration.paymentType === 'pending'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className={`h-4 w-4 ${newRegistration.paymentType === 'pending' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-medium text-sm">Pending Payment</span>
                  </div>
                  <p className="text-xs text-gray-500">User will pay later</p>
                </div>
                <div
                  onClick={() => setNewRegistration(prev => ({ ...prev, paymentType: 'bank-transfer' }))}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    newRegistration.paymentType === 'bank-transfer'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className={`h-4 w-4 ${newRegistration.paymentType === 'bank-transfer' ? 'text-orange-600' : 'text-gray-400'}`} />
                    <span className="font-medium text-sm">Bank Transfer</span>
                  </div>
                  <p className="text-xs text-gray-500">Manual verification</p>
                </div>
                <div
                  onClick={() => setNewRegistration(prev => ({ ...prev, paymentType: 'complimentary' }))}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    newRegistration.paymentType === 'complimentary'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className={`h-4 w-4 ${newRegistration.paymentType === 'complimentary' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className="font-medium text-sm">Complimentary</span>
                  </div>
                  <p className="text-xs text-gray-500">No payment required</p>
                </div>
              </div>
            </div>

            {newRegistration.paymentType !== 'complimentary' && (
              <div>
                <Label htmlFor="reg-amount">Amount (₹)</Label>
                <Input
                  id="reg-amount"
                  type="number"
                  value={newRegistration.amount}
                  onChange={(e) => setNewRegistration(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            )}

            <div className={newRegistration.paymentType !== 'complimentary' ? '' : 'col-span-2'}>
              <Label htmlFor="reg-remarks">Remarks</Label>
              <Input
                id="reg-remarks"
                value={newRegistration.remarks}
                onChange={(e) => setNewRegistration(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRegistrationOpen(false)} disabled={isAddingRegistration}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddRegistration} 
              disabled={isAddingRegistration || !newRegistration.email || !newRegistration.password || !newRegistration.firstName || !newRegistration.lastName || !newRegistration.phone || !newRegistration.institution}
              style={{ backgroundColor: theme.primary }}
            >
              {isAddingRegistration ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" /> Create Registration</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// Bulk Email Dialog Component
function BulkEmailDialog({
  isOpen,
  selectedIds,
  registrations,
  onClose,
  onSent
}: {
  isOpen: boolean
  selectedIds: string[]
  registrations: Registration[]
  onClose: () => void
  onSent: () => void
}) {
  const [template, setTemplate] = useState('custom')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const templates: Record<string, { subject: string; message: string }> = {
    confirmation: {
      subject: `Registration Confirmation - ${conferenceConfig.shortName}`,
      message: `Dear {name},\n\nThank you for registering for ${conferenceConfig.shortName}!\n\nYour Registration ID: {registrationId}\nEmail: {email}\nInstitution: {institution}\n\nWe look forward to seeing you at the conference.\n\nBest regards,\n${conferenceConfig.organizationName}`
    },
    reminder: {
      subject: `Payment Reminder - ${conferenceConfig.shortName}`,
      message: `Dear {name},\n\nThis is a friendly reminder regarding your registration payment for ${conferenceConfig.shortName}.\n\nRegistration ID: {registrationId}\n\nPlease complete your payment to confirm your participation.\n\nBest regards,\n${conferenceConfig.organizationName}`
    },
    update: {
      subject: `Important Update - ${conferenceConfig.shortName}`,
      message: `Dear {name},\n\nWe have an important update regarding ${conferenceConfig.shortName}.\n\n[Your update here]\n\nBest regards,\n${conferenceConfig.organizationName}`
    },
    custom: { subject: '', message: '' }
  }

  const handleTemplateChange = (t: string) => {
    setTemplate(t)
    setSubject(templates[t].subject)
    setMessage(templates[t].message)
  }

  const handleSend = async () => {
    if (!subject || !message) {
      toast({ title: "Missing Fields", description: "Please fill in subject and message", variant: "destructive" })
      return
    }

    setIsSending(true)
    let success = 0, failed = 0

    for (const id of selectedIds) {
      try {
        const response = await fetch(`/api/admin/registrations/${id}/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: template, subject, message })
        })
        if (response.ok) success++
        else failed++
      } catch { failed++ }
    }

    toast({
      title: success > 0 ? "Emails Sent" : "Send Failed",
      description: `Success: ${success}, Failed: ${failed}`,
      variant: failed > 0 ? "destructive" : "default"
    })

    setIsSending(false)
    if (success > 0) onSent()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" style={{ color: theme.secondary }} />
            Send Bulk Email
          </DialogTitle>
          <DialogDescription>
            Send email to {selectedIds.length} selected registration{selectedIds.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{selectedIds.length} Recipients</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmation">Registration Confirmation</SelectItem>
                <SelectItem value="reminder">Payment Reminder</SelectItem>
                <SelectItem value="update">Event Update</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject..." />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} placeholder="Email message..." />
            <p className="text-xs text-muted-foreground">
              Variables: {'{name}'}, {'{email}'}, {'{registrationId}'}, {'{institution}'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>Cancel</Button>
          <Button onClick={handleSend} disabled={isSending || !subject || !message} style={{ backgroundColor: theme.secondary }}>
            {isSending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send to {selectedIds.length} Recipients
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
