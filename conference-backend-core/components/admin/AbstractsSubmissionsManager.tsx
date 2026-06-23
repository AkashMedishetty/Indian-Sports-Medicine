"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { AbstractDetailsModal } from '../abstracts/AbstractDetailsModal'
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  User,
  Calendar,
  Award,
  Mail,
  Upload,
  UserPlus,
  Loader2,
  Star,
  Edit,
  Save
} from 'lucide-react'
import { toast } from 'sonner'

// ISSH 2026 Abstract Categories and Topics
const SUBMISSION_CATEGORY_OPTIONS = [
  { value: 'award-paper', label: 'Award Paper' },
  { value: 'free-paper', label: 'Free Paper' },
  { value: 'poster-presentation', label: 'Poster Presentation' }
]

const NEUROSURGERY_TOPICS = [
  'Skullbase',
  'Vascular',
  'Neuro Oncology',
  'Paediatric Neurosurgery',
  'Spine',
  'Functional',
  'General Neurosurgery',
  'Miscellaneous'
]

const NEUROLOGY_TOPICS = [
  'General Neurology',
  'Neuroimmunology',
  'Stroke',
  'Neuromuscular Disorders',
  'Epilepsy',
  'Therapeutics in Neurology',
  'Movement Disorders',
  'Miscellaneous'
]

interface Review {
  _id: string
  reviewerId?: {
    firstName?: string
    lastName?: string
    email?: string
  }
  decision: 'approve' | 'reject'
  approvedFor?: 'award-paper' | 'podium' | 'poster'
  rejectionComment?: string
  scores?: {
    originality?: number
    levelOfEvidence?: number
    scientificImpact?: number
    socialSignificance?: number
    qualityOfManuscript?: number
    total?: number
  }
  submittedAt: string
}

interface Abstract {
  _id: string
  abstractId: string
  title: string
  track: string
  // New ISSH 2026 fields
  submittingFor?: 'neurosurgery' | 'neurology'
  submissionCategory?: 'award-paper' | 'free-paper' | 'poster-presentation'
  submissionTopic?: string
  authors: string[]
  status: 'submitted' | 'under-review' | 'accepted' | 'rejected' | 'final-submitted'
  submittedAt: string
  wordCount?: number
  averageScore?: number
  approvedFor?: 'award-paper' | 'podium' | 'poster'
  decisionAt?: string
  reviews?: Review[]
  userId: {
    _id: string
    firstName: string
    lastName: string
    email: string
    registration: {
      registrationId: string
    }
    profile?: { firstName?: string; lastName?: string; phone?: string; institution?: string }
  } | null
  initial: {
    file?: {
      originalName: string
      uploadedAt: string
      blobUrl?: string
    }
    notes?: string
  }
  final?: {
    file?: {
      originalName: string
      uploadedAt: string
      blobUrl?: string
    }
    submittedAt?: string
  }
}

export function AbstractsSubmissionsManager() {
  const [abstracts, setAbstracts] = useState<Abstract[]>([])
  const [filteredAbstracts, setFilteredAbstracts] = useState<Abstract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [submittingForFilter, setSubmittingForFilter] = useState<string>('all')
  const [selectedAbstract, setSelectedAbstract] = useState<Abstract | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadingZip, setDownloadingZip] = useState(false)
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  
  // Modal states
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false)
  const [isSubmitOnBehalfModalOpen, setIsSubmitOnBehalfModalOpen] = useState(false)
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  const [resendingEmails, setResendingEmails] = useState(false)
  const [editingAbstract, setEditingAbstract] = useState<Abstract | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    authors: '',
    submittingFor: '',
    submissionCategory: '',
    submissionTopic: '',
    keywords: '',
    status: '',
    approvedFor: '',
    introduction: '',
    methods: '',
    results: '',
    conclusion: '',
    notes: ''
  })
  
  // Bulk email form
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('')
  
  // Email templates
  const emailTemplates = [
    {
      id: 'acceptance',
      name: 'Acceptance Notification',
      subject: 'Congratulations! Your Abstract {abstractId} Has Been Accepted',
      message: `Dear {name},

Congratulations! We are pleased to inform you that your abstract titled "{title}" (ID: {abstractId}) has been ACCEPTED for presentation at ISSH Midterm CME 2026.

Please log in to your dashboard to view the details and complete any required next steps.

Best regards,
ISSH 2026 Organizing Committee`
    },
    {
      id: 'rejection',
      name: 'Rejection Notification',
      subject: 'Update on Your Abstract Submission {abstractId}',
      message: `Dear {name},

Thank you for submitting your abstract titled "{title}" (ID: {abstractId}) to ISSH Midterm CME 2026.

After careful review by our scientific committee, we regret to inform you that your abstract has not been selected for presentation at this year's conference.

We appreciate your interest in ISSH Midterm CME 2026 and encourage you to submit again in the future.

Best regards,
ISSH 2026 Organizing Committee`
    },
    {
      id: 'revision',
      name: 'Revision Required',
      subject: 'Revision Required for Abstract {abstractId}',
      message: `Dear {name},

Thank you for your abstract submission "{title}" (ID: {abstractId}).

Our reviewers have requested some revisions before final acceptance. Please log in to your dashboard to view the feedback and submit your revised abstract.

Best regards,
ISSH 2026 Organizing Committee`
    },
    {
      id: 'reminder',
      name: 'Final Submission Reminder',
      subject: 'Reminder: Final Submission Due for Abstract {abstractId}',
      message: `Dear {name},

This is a reminder that the final submission for your accepted abstract "{title}" (ID: {abstractId}) is due soon.

Please log in to your dashboard and complete your final submission at your earliest convenience.

Best regards,
ISSH 2026 Organizing Committee`
    },
    {
      id: 'custom',
      name: 'Custom Message',
      subject: '',
      message: ''
    }
  ]
  
  // Submit on behalf form
  const [onBehalfForm, setOnBehalfForm] = useState({
    userEmail: '',
    title: '',
    authors: '',
    submittingFor: 'neurosurgery',
    submissionCategory: 'free-paper',
    submissionTopic: '',
    introduction: '',
    methods: '',
    results: '',
    conclusion: '',
    keywords: ''
  })
  const [onBehalfFile, setOnBehalfFile] = useState<File | null>(null)
  const [searchingUser, setSearchingUser] = useState(false)
  const [foundUser, setFoundUser] = useState<{ _id: string; firstName: string; lastName: string; email: string; registration?: { registrationId: string } } | null>(null)
  
  // Edit form file
  const [editFile, setEditFile] = useState<File | null>(null)
  
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    accepted: 0,
    rejected: 0,
    finalSubmitted: 0
  })

  useEffect(() => {
    fetchAbstracts()
  }, [])

  useEffect(() => {
    filterAbstracts()
  }, [abstracts, searchTerm, statusFilter, trackFilter, submittingForFilter])

  const fetchAbstracts = async () => {
    try {
      const response = await fetch('/api/admin/abstracts/list')
      const data = await response.json()
      
      if (data.success) {
        setAbstracts(data.data)
        calculateStats(data.data)
      } else {
        toast.error('Failed to fetch abstracts')
      }
    } catch (error) {
      toast.error('Error fetching abstracts')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (abstractsData: Abstract[]) => {
    const stats = {
      total: abstractsData.length,
      submitted: abstractsData.filter(a => a.status === 'submitted').length,
      underReview: abstractsData.filter(a => a.status === 'under-review').length,
      accepted: abstractsData.filter(a => a.status === 'accepted').length,
      rejected: abstractsData.filter(a => a.status === 'rejected').length,
      finalSubmitted: abstractsData.filter(a => a.status === 'final-submitted').length
    }
    setStats(stats)
  }

  const filterAbstracts = () => {
    let filtered = abstracts

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(abstract =>
        abstract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abstract.abstractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abstract.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (abstract.userId?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (abstract.userId?.registration?.registrationId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (abstract.submissionTopic && abstract.submissionTopic.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(abstract => abstract.status === statusFilter)
    }

    // Track/Category filter
    if (trackFilter !== 'all') {
      filtered = filtered.filter(abstract => 
        abstract.track === trackFilter || abstract.submissionCategory === trackFilter
      )
    }

    // Submitting For filter (Neurosurgery/Neurology)
    if (submittingForFilter !== 'all') {
      filtered = filtered.filter(abstract => abstract.submittingFor === submittingForFilter)
    }

    setFilteredAbstracts(filtered)
  }

  const updateAbstractStatus = async (abstractId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/abstracts/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abstractId,
          status: newStatus
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Abstract status updated to ${newStatus}`)
        fetchAbstracts() // Refresh the list
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Error updating abstract status')
    }
  }

  const exportAbstracts = async () => {
    try {
      const response = await fetch('/api/admin/abstracts/export')
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Use correct extension based on content type
        const dateStr = new Date().toISOString().split('T')[0]
        if (contentType.includes('zip')) {
          a.download = `abstracts-export-${dateStr}.zip`
        } else {
          a.download = `abstracts-export-${dateStr}.csv`
        }
        
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Abstracts exported successfully')
      } else {
        toast.error('Failed to export abstracts')
      }
    } catch (error) {
      toast.error('Error exporting abstracts')
    }
  }

  const downloadAllAsZip = async () => {
    setDownloadingZip(true)
    toast.info('Preparing ZIP with all files... This may take a minute.')
    try {
      const params = new URLSearchParams({ includeFiles: 'true' })
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/admin/abstracts/export?${params.toString()}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const dateStr = new Date().toISOString().split('T')[0]
        a.download = `abstracts-with-files-${dateStr}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('ZIP downloaded successfully')
      } else {
        toast.error('Failed to download ZIP')
      }
    } catch (error) {
      toast.error('Error downloading ZIP')
    } finally {
      setDownloadingZip(false)
    }
  }

  const downloadFile = async (abstractId: string, fileType: 'initial' | 'final') => {
    setDownloading(`${abstractId}-${fileType}`)
    try {
      const response = await fetch(`/api/abstracts/download/${abstractId}?type=${fileType}`)
      
      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || 'Download failed')
        return
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `abstract-${fileType}.pdf`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed')
    } finally {
      setDownloading(null)
    }
  }

  const viewDetails = (abstract: Abstract) => {
    setSelectedAbstract(abstract)
    setIsDetailsModalOpen(true)
  }

  // Bulk selection handlers

  // Resend acceptance/status emails for all accepted abstracts
  const handleResendStatusEmails = async () => {
    if (!confirm('This will resend acceptance emails to ALL accepted abstracts with the correct "Accepted For" category. Continue?')) return
    setResendingEmails(true)
    try {
      const response = await fetch('/api/admin/abstracts/resend-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter: 'all-accepted' })
      })
      const data = await response.json()
      if (data.success) {
        toast.success(`Resent ${data.data.sent} acceptance emails${data.data.failed > 0 ? `, ${data.data.failed} failed` : ''}`)
      } else {
        toast.error(data.message || 'Failed to resend emails')
      }
    } catch {
      toast.error('Error resending emails')
    } finally {
      setResendingEmails(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAbstracts.map(a => a._id)))
    }
    setSelectAll(!selectAll)
  }

  const toggleSelectAbstract = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
    setSelectAll(newSelected.size === filteredAbstracts.length)
  }

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one abstract')
      return
    }

    setIsBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/abstracts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abstractIds: Array.from(selectedIds),
          action: 'update-status',
          status: newStatus
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`${data.updatedCount} abstracts updated to ${newStatus}`)
        setSelectedIds(new Set())
        setSelectAll(false)
        fetchAbstracts()
      } else {
        toast.error(data.message || 'Failed to update abstracts')
      }
    } catch (error) {
      toast.error('Error updating abstracts')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  // Bulk email
  const handleBulkEmail = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one abstract')
      return
    }

    if (!emailSubject || !emailMessage) {
      toast.error('Please fill in subject and message')
      return
    }

    setIsBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/abstracts/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abstractIds: Array.from(selectedIds),
          subject: emailSubject,
          message: emailMessage
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`${data.sentCount} emails sent successfully`)
        setIsBulkEmailModalOpen(false)
        setEmailSubject('')
        setEmailMessage('')
        setSelectedIds(new Set())
        setSelectAll(false)
      } else {
        toast.error(data.message || 'Failed to send emails')
      }
    } catch (error) {
      toast.error('Error sending emails')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  // Search user by email
  const searchUserByEmail = async (email: string) => {
    if (!email || email.length < 3) {
      setFoundUser(null)
      return
    }
    
    setSearchingUser(true)
    try {
      const response = await fetch(`/api/admin/users/search?email=${encodeURIComponent(email)}`)
      const data = await response.json()
      
      if (data.success && data.user) {
        setFoundUser(data.user)
      } else {
        setFoundUser(null)
      }
    } catch (error) {
      setFoundUser(null)
    } finally {
      setSearchingUser(false)
    }
  }

  // Submit on behalf
  const handleSubmitOnBehalf = async () => {
    if (!onBehalfForm.userEmail || !onBehalfForm.title || !onBehalfForm.authors) {
      toast.error('Please fill in required fields (email, title, authors)')
      return
    }

    setIsBulkActionLoading(true)
    try {
      const formData = new FormData()
      formData.append('userEmail', onBehalfForm.userEmail)
      formData.append('title', onBehalfForm.title)
      formData.append('authors', JSON.stringify(onBehalfForm.authors.split(',').map(a => a.trim())))
      formData.append('submittingFor', onBehalfForm.submittingFor)
      formData.append('submissionCategory', onBehalfForm.submissionCategory)
      formData.append('submissionTopic', onBehalfForm.submissionTopic)
      formData.append('introduction', onBehalfForm.introduction)
      formData.append('methods', onBehalfForm.methods)
      formData.append('results', onBehalfForm.results)
      formData.append('conclusion', onBehalfForm.conclusion)
      formData.append('keywords', onBehalfForm.keywords)
      
      // Add file if provided
      if (onBehalfFile) {
        formData.append('file', onBehalfFile)
      }

      const response = await fetch('/api/admin/abstracts/submit-on-behalf', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Abstract submitted: ${data.data.abstractId}`)
        setIsSubmitOnBehalfModalOpen(false)
        setOnBehalfForm({
          userEmail: '',
          title: '',
          authors: '',
          submittingFor: 'neurosurgery',
          submissionCategory: 'free-paper',
          submissionTopic: '',
          introduction: '',
          methods: '',
          results: '',
          conclusion: '',
          keywords: ''
        })
        setOnBehalfFile(null)
        setFoundUser(null)
        fetchAbstracts()
      } else {
        toast.error(data.message || 'Failed to submit abstract')
      }
    } catch (error) {
      toast.error('Error submitting abstract')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  // Bulk upload
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsBulkActionLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/abstracts/bulk-upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`${data.createdCount} of ${data.totalRows} abstracts uploaded`)
        if (data.errors?.length > 0) {
          console.error('Upload errors:', data.errors)
        }
        setIsBulkUploadModalOpen(false)
        fetchAbstracts()
      } else {
        toast.error(data.message || 'Failed to upload abstracts')
      }
    } catch (error) {
      toast.error('Error uploading abstracts')
    } finally {
      setIsBulkActionLoading(false)
      e.target.value = ''
    }
  }

  // Download template
  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/abstracts/bulk-upload')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'abstracts-upload-template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error('Error downloading template')
    }
  }

  // Open edit modal
  const openEditModal = (abstract: Abstract) => {
    setEditingAbstract(abstract)
    setEditForm({
      title: abstract.title || '',
      authors: abstract.authors?.join(', ') || '',
      submittingFor: abstract.submittingFor || '',
      submissionCategory: abstract.submissionCategory || '',
      submissionTopic: abstract.submissionTopic || '',
      keywords: (abstract as any).keywords?.join(', ') || '',
      status: abstract.status || '',
      approvedFor: abstract.approvedFor || '',
      introduction: (abstract.initial as any)?.introduction || '',
      methods: (abstract.initial as any)?.methods || '',
      results: (abstract.initial as any)?.results || '',
      conclusion: (abstract.initial as any)?.conclusion || '',
      notes: abstract.initial?.notes || ''
    })
    setIsEditModalOpen(true)
  }

  // Handle edit form submit
  const handleEditSubmit = async () => {
    if (!editingAbstract) return

    setIsBulkActionLoading(true)
    try {
      // If there's a file, use FormData, otherwise use JSON
      if (editFile) {
        const formData = new FormData()
        formData.append('abstractId', editingAbstract._id)
        formData.append('title', editForm.title)
        formData.append('authors', JSON.stringify(editForm.authors.split(',').map(a => a.trim()).filter(a => a)))
        formData.append('submittingFor', editForm.submittingFor)
        formData.append('submissionCategory', editForm.submissionCategory)
        formData.append('submissionTopic', editForm.submissionTopic)
        formData.append('keywords', JSON.stringify(editForm.keywords.split(',').map(k => k.trim()).filter(k => k)))
        formData.append('status', editForm.status)
        formData.append('introduction', editForm.introduction)
        formData.append('methods', editForm.methods)
        formData.append('results', editForm.results)
        formData.append('conclusion', editForm.conclusion)
        formData.append('notes', editForm.notes)
        if (editForm.status === 'accepted' && editForm.approvedFor) {
          formData.append('approvedFor', editForm.approvedFor)
        }
        formData.append('file', editFile)

        const response = await fetch('/api/admin/abstracts/update-with-file', {
          method: 'PUT',
          body: formData
        })

        const data = await response.json()
        if (data.success) {
          toast.success('Abstract updated successfully')
          setIsEditModalOpen(false)
          setEditingAbstract(null)
          setEditFile(null)
          fetchAbstracts()
        } else {
          toast.error(data.message || 'Failed to update abstract')
        }
      } else {
        const updates: Record<string, any> = {
          title: editForm.title,
          authors: editForm.authors.split(',').map(a => a.trim()).filter(a => a),
          submittingFor: editForm.submittingFor,
          submissionCategory: editForm.submissionCategory,
          submissionTopic: editForm.submissionTopic,
          keywords: editForm.keywords.split(',').map(k => k.trim()).filter(k => k),
          status: editForm.status,
          introduction: editForm.introduction,
          methods: editForm.methods,
          results: editForm.results,
          conclusion: editForm.conclusion,
          notes: editForm.notes
        }

        // Only include approvedFor if status is accepted
        if (editForm.status === 'accepted' && editForm.approvedFor) {
          updates.approvedFor = editForm.approvedFor
        }

        const response = await fetch('/api/admin/abstracts/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            abstractId: editingAbstract._id,
            updates
          })
        })

        const data = await response.json()
        if (data.success) {
          toast.success('Abstract updated successfully')
          setIsEditModalOpen(false)
          setEditingAbstract(null)
          setEditFile(null)
          fetchAbstracts()
        } else {
          toast.error(data.message || 'Failed to update abstract')
        }
      }
    } catch (error) {
      toast.error('Error updating abstract')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'submitted': { color: 'bg-[#d8e0ed] text-blue-800', icon: Clock, label: 'Submitted' },
      'under-review': { color: 'bg-yellow-100 text-yellow-800', icon: Eye, label: 'Under Review' },
      'accepted': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepted' },
      'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      'final-submitted': { color: 'bg-purple-100 text-purple-800', icon: Award, label: 'Final Submitted' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const uniqueTracks = [...new Set(abstracts.map(a => a.track))]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#25406b]">Submitted</p>
                <p className="text-2xl font-bold text-blue-900">{stats.submitted}</p>
              </div>
              <Clock className="w-8 h-8 text-[#25406b]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Under Review</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.underReview}</p>
              </div>
              <Eye className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Accepted</p>
                <p className="text-2xl font-bold text-green-900">{stats.accepted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-accent-600">Final</p>
                <p className="text-2xl font-bold text-purple-900">{stats.finalSubmitted}</p>
              </div>
              <Award className="w-8 h-8 text-theme-accent-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-lg sm:text-xl">Abstract Submissions Management</span>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsSubmitOnBehalfModalOpen(true)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Submit on Behalf</span>
                <span className="sm:hidden">Submit</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsBulkUploadModalOpen(true)}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Bulk Upload</span>
                <span className="sm:hidden">Upload</span>
              </Button>
              <Button onClick={exportAbstracts} className="bg-emerald-600 hover:bg-emerald-700">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              <Button 
                onClick={downloadAllAsZip} 
                disabled={downloadingZip}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {downloadingZip ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                <span className="hidden sm:inline">{downloadingZip ? 'Preparing...' : 'Download ZIP'}</span>
                <span className="sm:hidden">ZIP</span>
              </Button>
              <Button 
                onClick={handleResendStatusEmails} 
                disabled={resendingEmails}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {resendingEmails ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                <span className="hidden sm:inline">{resendingEmails ? 'Sending...' : 'Resend Acceptance Emails'}</span>
                <span className="sm:hidden">Resend</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by title, abstract ID, author, email, or registration ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="final-submitted">Final Submitted</SelectItem>
                </SelectContent>
              </Select>

              <Select value={submittingForFilter} onValueChange={setSubmittingForFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="neurosurgery">Neurosurgery</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                </SelectContent>
              </Select>

              <Select value={trackFilter} onValueChange={setTrackFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="award-paper">Award Paper</SelectItem>
                  <SelectItem value="free-paper">Free Paper</SelectItem>
                  <SelectItem value="poster-presentation">Poster Presentation</SelectItem>
                  {uniqueTracks.filter(t => !['Award Paper', 'Free Paper', 'Poster Presentation'].includes(t)).map(track => (
                    <SelectItem key={track} value={track}>{track}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <span className="text-sm font-medium text-blue-800">
                {selectedIds.size} selected
              </span>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsBulkEmailModalOpen(true)}
                  disabled={isBulkActionLoading}
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => handleBulkStatusUpdate('accepted')}
                  disabled={isBulkActionLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleBulkStatusUpdate('rejected')}
                  disabled={isBulkActionLoading}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Select onValueChange={handleBulkStatusUpdate} disabled={isBulkActionLoading}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under-review">Under Review</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="final-submitted">Final Submitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => { setSelectedIds(new Set()); setSelectAll(false) }}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Abstracts List */}
          <div className="space-y-4">
            {filteredAbstracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Abstracts Found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || trackFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'No abstracts have been submitted yet'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Select All Header */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Select All ({filteredAbstracts.length})
                  </label>
                </div>
                
                {filteredAbstracts.map((abstract, index) => (
                <motion.div
                  key={abstract._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow ${
                    selectedIds.has(abstract._id) ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      {/* Header with Checkbox */}
                      <div className="mb-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedIds.has(abstract._id)}
                            onCheckedChange={() => toggleSelectAbstract(abstract._id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 break-words">
                              {abstract.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              {abstract.submittingFor && (
                                <Badge variant="outline" className={`text-xs sm:text-sm ${
                                  abstract.submittingFor === 'neurosurgery' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}>
                                  {abstract.submittingFor === 'neurosurgery' ? 'Neurosurgery' : 'Neurology'}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs sm:text-sm">
                                {abstract.submissionCategory ? 
                                  abstract.submissionCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 
                                  abstract.track
                                }
                              </Badge>
                              {getStatusBadge(abstract.status)}
                              <span className="text-xs sm:text-sm text-gray-500">ID: {abstract.abstractId}</span>
                            </div>
                            {abstract.submissionTopic && (
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>Topic:</strong> {abstract.submissionTopic}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span><strong>Submitter:</strong> {abstract.userId?.firstName || 'Unknown'} {abstract.userId?.lastName || ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span><strong>Email:</strong> {abstract.userId?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span><strong>Reg ID:</strong> {abstract.userId?.registration?.registrationId || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span><strong>Submitted:</strong> {new Date(abstract.submittedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span><strong>Authors:</strong> {abstract.authors.join(', ')}</span>
                        </div>
                        {abstract.wordCount && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span><strong>Words:</strong> {abstract.wordCount}</span>
                          </div>
                        )}
                        {abstract.averageScore !== undefined && abstract.averageScore > 0 && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span><strong>Score:</strong> {abstract.averageScore.toFixed(1)}/50</span>
                          </div>
                        )}
                        {abstract.approvedFor && (
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-green-600" />
                            <span><strong>Approved For:</strong> {
                              abstract.approvedFor === 'award-paper' ? 'Award Paper' :
                              abstract.approvedFor === 'podium' ? 'Podium' :
                              'Poster'
                            }</span>
                          </div>
                        )}
                        {abstract.reviews && abstract.reviews.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-purple-600" />
                            <span><strong>Reviews:</strong> {abstract.reviews.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Files */}
                      <div className="space-y-2">
                        {abstract.initial.file && (
                          <div className="flex items-center gap-2 text-sm">
                            <Download className="w-4 h-4 text-[#25406b]" />
                            <span className="text-gray-600">
                              <strong>Initial File:</strong> {abstract.initial.file.originalName}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={downloading === `${abstract._id}-initial`}
                              onClick={() => downloadFile(abstract._id, 'initial')}
                            >
                              {downloading === `${abstract._id}-initial` ? (
                                <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        )}
                        {abstract.final?.file && (
                          <div className="flex items-center gap-2 text-sm">
                            <Download className="w-4 h-4 text-green-600" />
                            <span className="text-gray-600">
                              <strong>Final File:</strong> {abstract.final.file.originalName}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={downloading === `${abstract._id}-final`}
                              onClick={() => downloadFile(abstract._id, 'final')}
                            >
                              {downloading === `${abstract._id}-final` ? (
                                <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 lg:gap-2 w-full lg:min-w-[200px]">
                      <Select
                        value={abstract.status}
                        onValueChange={(value) => updateAbstractStatus(abstract._id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="under-review">Under Review</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="final-submitted">Final Submitted</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => viewDetails(abstract)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(abstract)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
              }
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <AbstractDetailsModal
        abstract={selectedAbstract}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedAbstract(null)
        }}
        showAdminDetails={true}
      />

      {/* Bulk Email Modal */}
      <Dialog open={isBulkEmailModalOpen} onOpenChange={setIsBulkEmailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Bulk Email</DialogTitle>
            <DialogDescription>
              Send email to {selectedIds.size} selected abstract authors. Use placeholders: {'{name}'}, {'{abstractId}'}, {'{title}'}, {'{status}'}, {'{registrationId}'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-template">Email Template</Label>
              <Select 
                value={selectedEmailTemplate} 
                onValueChange={(value) => {
                  setSelectedEmailTemplate(value)
                  const template = emailTemplates.find(t => t.id === value)
                  if (template && template.id !== 'custom') {
                    setEmailSubject(template.subject)
                    setEmailMessage(template.message)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template or write custom" />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g., Update on your abstract {abstractId}"
              />
            </div>
            <div>
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Dear {name},&#10;&#10;Your abstract titled '{title}' has been..."
                rows={10}
              />
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Available Placeholders:</strong>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <span>{'{name}'} - Author name</span>
                <span>{'{abstractId}'} - Abstract ID</span>
                <span>{'{title}'} - Abstract title</span>
                <span>{'{status}'} - Current status</span>
                <span>{'{registrationId}'} - Registration ID</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkEmail} disabled={isBulkActionLoading}>
              {isBulkActionLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Mail className="w-4 h-4 mr-2" /> Send Emails</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit on Behalf Modal */}
      <Dialog open={isSubmitOnBehalfModalOpen} onOpenChange={setIsSubmitOnBehalfModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Abstract on Behalf</DialogTitle>
            <DialogDescription>
              Submit an abstract for a registered user without timeline constraints
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="user-email">User Email *</Label>
              <div className="flex gap-2">
                <Input
                  id="user-email"
                  value={onBehalfForm.userEmail}
                  onChange={(e) => {
                    setOnBehalfForm(prev => ({ ...prev, userEmail: e.target.value }))
                    setFoundUser(null)
                  }}
                  placeholder="user@example.com"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => searchUserByEmail(onBehalfForm.userEmail)}
                  disabled={searchingUser || !onBehalfForm.userEmail}
                >
                  {searchingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {foundUser && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">User Found</span>
                  </div>
                  <div className="mt-1 text-green-600">
                    {foundUser.firstName} {foundUser.lastName} ({foundUser.email})
                    {foundUser.registration?.registrationId && (
                      <span className="ml-2">â€¢ Reg ID: {foundUser.registration.registrationId}</span>
                    )}
                  </div>
                </div>
              )}
              {onBehalfForm.userEmail && !foundUser && !searchingUser && (
                <p className="text-xs text-gray-500 mt-1">Click search to verify user exists</p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="abstract-title">Title *</Label>
              <Input
                id="abstract-title"
                value={onBehalfForm.title}
                onChange={(e) => setOnBehalfForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Abstract title"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="authors">Authors * (comma separated)</Label>
              <Input
                id="authors"
                value={onBehalfForm.authors}
                onChange={(e) => setOnBehalfForm(prev => ({ ...prev, authors: e.target.value }))}
                placeholder="Author One, Author Two"
              />
            </div>
            <div>
              <Label htmlFor="submitting-for">Submitting For</Label>
              <Select 
                value={onBehalfForm.submittingFor} 
                onValueChange={(v) => setOnBehalfForm(prev => ({ ...prev, submittingFor: v, submissionTopic: '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neurosurgery">Neurosurgery</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={onBehalfForm.submissionCategory} 
                onValueChange={(v) => setOnBehalfForm(prev => ({ ...prev, submissionCategory: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBMISSION_CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="topic">Topic</Label>
              <Select 
                value={onBehalfForm.submissionTopic} 
                onValueChange={(v) => setOnBehalfForm(prev => ({ ...prev, submissionTopic: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {(onBehalfForm.submittingFor === 'neurosurgery' ? NEUROSURGERY_TOPICS : NEUROLOGY_TOPICS).map(topic => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="introduction">Introduction</Label>
              <Textarea
                id="introduction"
                value={onBehalfForm.introduction}
                onChange={(e) => setOnBehalfForm(prev => ({ ...prev, introduction: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="methods">Methods</Label>
              <Textarea
                id="methods"
                value={onBehalfForm.methods}
                onChange={(e) => setOnBehalfForm(prev => ({ ...prev, methods: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="results">Results</Label>
              <Textarea
                id="results"
                value={onBehalfForm.results}
                onChange={(e) => setOnBehalfForm(prev => ({ ...prev, results: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="conclusion">Conclusion</Label>
              <Textarea
                id="conclusion"
                value={onBehalfForm.conclusion}
                onChange={(e) => setOnBehalfForm(prev => ({ ...prev, conclusion: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="keywords">Keywords (comma separated)</Label>
              <Input
                id="keywords"
                value={onBehalfForm.keywords}
                onChange={(e) => setOnBehalfForm(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="keyword1, keyword2"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="on-behalf-file">Abstract File (PDF, DOC, DOCX)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setOnBehalfFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="on-behalf-file"
                />
                <label htmlFor="on-behalf-file" className="cursor-pointer">
                  {onBehalfFile ? (
                    <div className="text-sm text-green-600 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {onBehalfFile.name}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">Click to upload file (PDF, DOC, DOCX - optional)</span>
                  )}
                </label>
                {onBehalfFile && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-red-500"
                    onClick={() => setOnBehalfFile(null)}
                  >
                    Remove file
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitOnBehalfModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitOnBehalf} disabled={isBulkActionLoading}>
              {isBulkActionLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Submit Abstract</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog open={isBulkUploadModalOpen} onOpenChange={setIsBulkUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload Abstracts</DialogTitle>
            <DialogDescription>
              Upload a CSV file with abstracts. Download the template first to see the required format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download CSV Template
            </Button>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">Upload your CSV file</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkUpload}
                className="hidden"
                id="csv-upload"
                disabled={isBulkActionLoading}
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" asChild disabled={isBulkActionLoading}>
                  <span className="cursor-pointer">
                    {isBulkActionLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      'Choose File'
                    )}
                  </span>
                </Button>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkUploadModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Abstract Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Abstract</DialogTitle>
            <DialogDescription>
              Edit abstract details. ID: {editingAbstract?.abstractId}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Abstract title"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-authors">Authors (comma separated) *</Label>
              <Input
                id="edit-authors"
                value={editForm.authors}
                onChange={(e) => setEditForm(prev => ({ ...prev, authors: e.target.value }))}
                placeholder="Author One, Author Two"
              />
            </div>
            <div>
              <Label htmlFor="edit-submitting-for">Submitting For</Label>
              <Select 
                value={editForm.submittingFor} 
                onValueChange={(v) => setEditForm(prev => ({ ...prev, submittingFor: v, submissionTopic: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neurosurgery">Neurosurgery</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select 
                value={editForm.submissionCategory} 
                onValueChange={(v) => setEditForm(prev => ({ ...prev, submissionCategory: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SUBMISSION_CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-topic">Topic</Label>
              <Select 
                value={editForm.submissionTopic} 
                onValueChange={(v) => setEditForm(prev => ({ ...prev, submissionTopic: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {(editForm.submittingFor === 'neurosurgery' ? NEUROSURGERY_TOPICS : 
                    editForm.submittingFor === 'neurology' ? NEUROLOGY_TOPICS : []).map(topic => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-keywords">Keywords (comma separated)</Label>
              <Input
                id="edit-keywords"
                value={editForm.keywords}
                onChange={(e) => setEditForm(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="keyword1, keyword2"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={editForm.status} 
                onValueChange={(v) => setEditForm(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="final-submitted">Final Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.status === 'accepted' && (
              <div>
                <Label htmlFor="edit-approved-for">Approved For</Label>
                <Select 
                  value={editForm.approvedFor} 
                  onValueChange={(v) => setEditForm(prev => ({ ...prev, approvedFor: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="award-paper">Award Paper</SelectItem>
                    <SelectItem value="free-paper">Free Paper</SelectItem>
                    <SelectItem value="poster-presentation">Poster Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2">
              <Label htmlFor="edit-introduction">Introduction</Label>
              <Textarea
                id="edit-introduction"
                value={editForm.introduction}
                onChange={(e) => setEditForm(prev => ({ ...prev, introduction: e.target.value }))}
                rows={3}
                placeholder="Introduction text..."
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-methods">Methods</Label>
              <Textarea
                id="edit-methods"
                value={editForm.methods}
                onChange={(e) => setEditForm(prev => ({ ...prev, methods: e.target.value }))}
                rows={3}
                placeholder="Methods text..."
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-results">Results</Label>
              <Textarea
                id="edit-results"
                value={editForm.results}
                onChange={(e) => setEditForm(prev => ({ ...prev, results: e.target.value }))}
                rows={3}
                placeholder="Results text..."
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-conclusion">Conclusion</Label>
              <Textarea
                id="edit-conclusion"
                value={editForm.conclusion}
                onChange={(e) => setEditForm(prev => ({ ...prev, conclusion: e.target.value }))}
                rows={3}
                placeholder="Conclusion text..."
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-notes">Additional Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>
            <div className="col-span-2">
              <Label>Current File</Label>
              {editingAbstract?.initial?.file ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{editingAbstract.initial.file.originalName}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadFile(editingAbstract._id, 'initial')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No file uploaded</p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-file">Replace File (PDF, DOC, DOCX)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="edit-file"
                />
                <label htmlFor="edit-file" className="cursor-pointer">
                  {editFile ? (
                    <div className="text-sm text-green-600 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {editFile.name}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">Click to upload new file (PDF, DOC, DOCX - optional)</span>
                  )}
                </label>
                {editFile && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-red-500"
                    onClick={() => setEditFile(null)}
                  >
                    Remove file
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isBulkActionLoading}>
              {isBulkActionLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
