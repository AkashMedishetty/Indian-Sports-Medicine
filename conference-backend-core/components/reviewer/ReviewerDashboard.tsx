"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { Textarea } from '@/conference-backend-core/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/conference-backend-core/components/ui/select'
import { Input } from '@/conference-backend-core/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/conference-backend-core/components/ui/tabs'
import {
  FileText, Eye, CheckCircle, XCircle, Clock, Download, Search,
  Brain, Stethoscope, Award, Loader2, ChevronRight, Users, Calendar,
  Mail, Hash, X, RefreshCw, Maximize2, GripVertical,
  FileIcon, ExternalLink, AlertCircle, Filter, FileDown, Keyboard,
  FolderDown, Focus, Shrink
} from 'lucide-react'
import { toast } from 'sonner'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { defaultAbstractsSettings } from '@/conference-backend-core/lib/config/abstracts'

// Types
interface AbstractForReview {
  _id: string
  abstractId: string
  title: string
  track: string
  submittingFor?: string
  submissionCategory?: string
  submissionTopic?: string
  authors: string[]
  keywords?: string[]
  status: string
  submittedAt: string
  wordCount?: number
  userId: {
    _id: string
    email: string
    profile?: { firstName?: string; lastName?: string; institution?: string }
    registration?: { registrationId: string }
  }
  initial: { notes?: string; file?: { originalName: string; blobUrl?: string; storagePath?: string } }
  final?: { file?: { originalName: string; blobUrl?: string }; submittedAt?: string }
  existingReview?: { 
    decision: string
    approvedFor?: string
    scores?: {
      originality?: number
      levelOfEvidence?: number
      scientificImpact?: number
      socialSignificance?: number
      qualityOfManuscript?: number
      total?: number
    }
    comments?: string
    rejectionComment?: string
    reviewedAt: string 
  }
}

// Glass styles - more opaque for better readability
const glassCard = {
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  boxShadow: '0 8px 32px rgba(30, 58, 95, 0.12)'
}

const glassCardLight = {
  background: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(12px) saturate(150%)',
  WebkitBackdropFilter: 'blur(12px) saturate(150%)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  boxShadow: '0 4px 16px rgba(30, 58, 95, 0.08)'
}

// Helper: Get preview URL for documents (PDF, Word, PPT)
function getPreviewUrl(fileUrl: string | undefined, fileName: string | undefined): string | null {
  if (!fileUrl || !fileName) return null
  const ext = fileName.toLowerCase().split('.').pop() || ''
  if (ext === 'pdf') return fileUrl
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
  }
  return null
}

// Skeleton components
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl p-6 animate-pulse" style={glassCardLight}>
          <div className="h-4 bg-gray-300/50 rounded w-24 mb-3" />
          <div className="h-10 bg-gray-300/50 rounded w-16" />
        </div>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-xl p-4 animate-pulse" style={glassCardLight}>
          <div className="h-4 bg-gray-300/50 rounded w-3/4 mb-3" />
          <div className="h-3 bg-gray-300/50 rounded w-1/2 mb-3" />
          <div className="flex gap-2">
            <div className="h-5 bg-gray-300/50 rounded-full w-20" />
            <div className="h-5 bg-gray-300/50 rounded-full w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}



// Document Preview Component - Uses createPortal for true fullscreen
function DocumentPreview({
  fileUrl,
  fileName,
  isFullScreen,
  onToggleFullScreen
}: {
  fileUrl: string | undefined
  fileName: string | undefined
  isFullScreen: boolean
  onToggleFullScreen: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure we're on client side for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(false)
  }, [fileUrl])

  // Handle escape key to exit fullscreen
  useEffect(() => {
    if (!isFullScreen) return
    console.log('[DocumentPreview] Fullscreen mode activated')
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[DocumentPreview] Escape pressed, exiting fullscreen')
        onToggleFullScreen()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isFullScreen, onToggleFullScreen])

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isFullScreen) {
      console.log('[DocumentPreview] Locking body scroll')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isFullScreen])

  if (!fileUrl || !fileName) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
        <FileIcon className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No document available</p>
        <p className="text-sm text-gray-400 mt-1">Upload a file to preview</p>
      </div>
    )
  }

  const previewUrl = getPreviewUrl(fileUrl, fileName)
  console.log('[DocumentPreview] Preview URL:', previewUrl, 'File:', fileName)

  if (!previewUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
        <AlertCircle className="w-16 h-16 mb-4 text-amber-500" />
        <p className="text-lg font-medium">Preview not available</p>
        <p className="text-sm text-gray-400 mt-2 mb-4">This file type cannot be previewed</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          Download to View
        </a>
      </div>
    )
  }

  // Fullscreen overlay - rendered via portal
  const fullscreenOverlay = (
    <div 
      className="fixed inset-0 bg-black/95 flex flex-col"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        width: '100vw', 
        height: '100vh',
        zIndex: 99999,
        isolation: 'isolate'
      }}
      onClick={(e) => {
        // Close if clicking backdrop
        if (e.target === e.currentTarget) onToggleFullScreen()
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 bg-gray-900/80 shrink-0">
        <div className="text-white font-medium truncate flex-1">
          {fileName}
        </div>
        <div className="flex gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4 text-white" />
          </a>
          <a
            href={fileUrl}
            download={fileName}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
            title="Download"
          >
            <Download className="w-4 h-4 text-white" />
          </a>
          <button
            onClick={onToggleFullScreen}
            className="p-2.5 rounded-xl bg-red-500 hover:bg-red-600 transition-all"
            title="Close (Esc)"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="flex-1 p-4 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-white mb-3" />
              <p className="text-white font-medium">Loading document...</p>
            </div>
          </div>
        )}
        <iframe
          src={previewUrl}
          className="w-full h-full rounded-xl border-0 bg-white"
          onLoad={() => { setLoading(false); console.log('[DocumentPreview] Fullscreen iframe loaded') }}
          onError={() => { setLoading(false); setError(true); console.log('[DocumentPreview] Fullscreen iframe error') }}
          title="Document Preview Fullscreen"
        />
      </div>

      {/* Footer hint */}
      <div className="p-2 text-center text-gray-400 text-sm bg-gray-900/80 shrink-0">
        Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">Esc</kbd> or click outside to exit
      </div>
    </div>
  )

  return (
    <>
      {/* Normal view - uses full available height */}
      <div className="relative flex flex-col h-full" style={{ minHeight: '400px' }}>
        {/* Controls */}
        <div className="absolute top-3 right-3 z-20 flex gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-105"
            title="Open preview in new tab"
          >
            <ExternalLink className="w-4 h-4 text-gray-700" />
          </a>
          <a
            href={fileUrl}
            download={fileName}
            className="p-2.5 rounded-xl bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-105"
            title="Download file"
          >
            <Download className="w-4 h-4 text-gray-700" />
          </a>
          <button
            onClick={onToggleFullScreen}
            className="p-2.5 rounded-xl bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-105"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-xl z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
              <p className="text-gray-600 font-medium">Loading document...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 rounded-xl z-10">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <p className="text-gray-700 font-medium mb-4">Failed to load preview</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Download Instead
            </a>
          </div>
        )}

        {/* iframe container - simple, no zoom transform */}
        <div className="flex-1 rounded-xl bg-gray-50 overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 bg-white"
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true) }}
            title="Document Preview"
          />
        </div>
      </div>

      {/* Fullscreen portal */}
      {isFullScreen && mounted && typeof document !== 'undefined' && createPortal(fullscreenOverlay, document.body)}
    </>
  )
}


// Main Component
export function ReviewerDashboard() {
  // State
  const [abstracts, setAbstracts] = useState<AbstractForReview[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [abstractsConfig, setAbstractsConfig] = useState(defaultAbstractsSettings)

  // Reviewer config state
  const [reviewerConfig, setReviewerConfig] = useState<{
    blindReview: boolean
    reviewerLayout: 'split-screen' | 'new-tab'
    approvalOptions: Array<{ key: string; label: string; enabled: boolean }>
    scoringCriteria: Array<{ key: string; label: string; maxScore: number; enabled: boolean }>
    requireRejectionComment: boolean
    showTotalScore: boolean
  }>({
    blindReview: false,
    reviewerLayout: 'split-screen',
    approvalOptions: [
      { key: 'award-paper', label: 'Award Paper Presentation', enabled: true },
      { key: 'podium', label: 'Podium Presentation', enabled: true },
      { key: 'poster', label: 'Poster Presentation', enabled: true }
    ],
    scoringCriteria: [
      { key: 'originality', label: 'Originality of the Study', maxScore: 10, enabled: true },
      { key: 'levelOfEvidence', label: 'Level of Evidence of Study', maxScore: 10, enabled: true },
      { key: 'scientificImpact', label: 'Scientific Impact', maxScore: 10, enabled: true },
      { key: 'socialSignificance', label: 'Social Significance', maxScore: 10, enabled: true },
      { key: 'qualityOfManuscript', label: 'Quality of Manuscript + Abstract & Study', maxScore: 10, enabled: true }
    ],
    requireRejectionComment: true,
    showTotalScore: true
  })

  // Filters - using config-driven options
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTopic, setFilterTopic] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Selected abstract & panel
  const [selectedAbstract, setSelectedAbstract] = useState<AbstractForReview | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [activeTab, setActiveTab] = useState('details')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [focusMode, setFocusMode] = useState(false) // false = split-screen, true = detail only

  // Review form - new scoring system
  const [scores, setScores] = useState<Record<string, number>>({})
  const [decision, setDecision] = useState<'approve' | 'reject' | ''>('')
  const [approvedFor, setApprovedFor] = useState('')
  const [rejectionComment, setRejectionComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState<'approve' | 'reject' | null>(null)

  // Resizable panel
  const [panelWidth, setPanelWidth] = useState(55)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Config-driven options from API (fallback to defaults)
  const specialtyOptions = abstractsConfig.submittingForOptions.filter(o => o.enabled)
  const categoryOptions = abstractsConfig.submissionCategories.filter(o => o.enabled)
  const topicsBySpecialty = abstractsConfig.topicsBySpecialty

  // Fetch reviewer config on mount
  useEffect(() => {
    const fetchReviewerConfig = async () => {
      try {
        const response = await fetch('/api/reviewer/config')
        const data = await response.json()
        if (data.success && data.data) {
          setReviewerConfig(prev => ({ ...prev, ...data.data }))
        }
      } catch (error) {
        console.error('Error fetching reviewer config:', error)
      }
    }
    fetchReviewerConfig()
  }, [])

  // Fetch abstracts config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/abstracts/config')
        const data = await response.json()
        if (data.success && data.data) {
          setAbstractsConfig(data.data)
        }
      } catch (error) {
        console.error('Error fetching abstracts config:', error)
        // Use defaults
      }
    }
    fetchConfig()
  }, [])

  // Calculate total score
  const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0)
  const maxTotalScore = reviewerConfig.scoringCriteria.filter(c => c.enabled).length * 10

  // Computed stats
  const stats = {
    assigned: abstracts.length,
    reviewed: abstracts.filter(a => a.existingReview).length,
    pending: abstracts.filter(a => !a.existingReview).length
  }

  // Toggle browser fullscreen for focus mode
  const toggleBrowserFullscreen = useCallback(async (enterFullscreen: boolean) => {
    try {
      if (enterFullscreen) {
        await document.documentElement.requestFullscreen()
      } else if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.log('Fullscreen not supported or denied')
    }
  }, [])

  // Handle focus mode toggle with browser fullscreen
  const handleFocusModeToggle = useCallback(() => {
    const newFocusMode = !focusMode
    setFocusMode(newFocusMode)
    toggleBrowserFullscreen(newFocusMode)
  }, [focusMode, toggleBrowserFullscreen])

  // Exit focus mode when exiting browser fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && focusMode) {
        setFocusMode(false)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [focusMode])

  // Fetch abstracts
  const fetchAbstracts = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const response = await fetch('/api/reviewer/abstracts')
      const data = await response.json()
      if (data.success) {
        setAbstracts(data.data || [])
        if (showRefresh) toast.success('Abstracts refreshed successfully')
      } else {
        toast.error('Failed to fetch abstracts')
      }
    } catch {
      toast.error('Failed to fetch abstracts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAbstracts() }, [fetchAbstracts])

  // Reset topic when specialty changes
  useEffect(() => { setFilterTopic('all') }, [filterSpecialty])

  // Get available topics based on specialty (config-driven)
  const getAvailableTopics = useCallback(() => {
    if (filterSpecialty === 'neurosurgery') return topicsBySpecialty.neurosurgery
    if (filterSpecialty === 'neurology') return topicsBySpecialty.neurology
    return [...new Set([...topicsBySpecialty.neurosurgery, ...topicsBySpecialty.neurology])]
  }, [filterSpecialty, topicsBySpecialty])

  // Filter abstracts
  const filteredAbstracts = abstracts.filter(abstract => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      const matches = abstract.title.toLowerCase().includes(s) ||
        abstract.abstractId.toLowerCase().includes(s) ||
        abstract.authors.some(a => a.toLowerCase().includes(s)) ||
        abstract.userId?.email?.toLowerCase().includes(s)
      if (!matches) return false
    }
    if (filterSpecialty !== 'all' && abstract.submittingFor !== filterSpecialty) return false
    if (filterCategory !== 'all' && abstract.submissionCategory !== filterCategory) return false
    if (filterTopic !== 'all' && abstract.submissionTopic !== filterTopic) return false
    if (filterStatus === 'pending' && abstract.existingReview) return false
    if (filterStatus === 'reviewed' && !abstract.existingReview) return false
    return true
  })

  // Handle resize
  const handleMouseDown = () => { isDragging.current = true }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = ((rect.right - e.clientX) / rect.width) * 100
      setPanelWidth(Math.min(Math.max(newWidth, 35), 70))
    }
    const handleMouseUp = () => { isDragging.current = false }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key.toLowerCase()) {
        case 'j': // Next abstract
          e.preventDefault()
          if (filteredAbstracts.length > 0) {
            const newIndex = Math.min(selectedIndex + 1, filteredAbstracts.length - 1)
            setSelectedIndex(newIndex)
            handleSelectAbstract(filteredAbstracts[newIndex], newIndex)
          }
          break
        case 'k': // Previous abstract
          e.preventDefault()
          if (filteredAbstracts.length > 0 && selectedIndex > 0) {
            const newIndex = selectedIndex - 1
            setSelectedIndex(newIndex)
            handleSelectAbstract(filteredAbstracts[newIndex], newIndex)
          }
          break
        case 'a': // Approve
          e.preventDefault()
          if (selectedAbstract && !selectedAbstract.existingReview && !submitting) {
            submitReview('approve')
          }
          break
        case 'r': // Reject
          e.preventDefault()
          if (selectedAbstract && !selectedAbstract.existingReview && !submitting) {
            submitReview('reject')
          }
          break
        case 'escape': // Close panel
          e.preventDefault()
          setSelectedAbstract(null)
          setSelectedIndex(-1)
          break
        case 'p': // Toggle preview tab
          e.preventDefault()
          if (selectedAbstract) {
            setActiveTab(activeTab === 'preview' ? 'details' : 'preview')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredAbstracts, selectedIndex, selectedAbstract, submitting, activeTab])

  // Select abstract - handle new-tab mode
  const handleSelectAbstract = (abstract: AbstractForReview, index: number) => {
    // If new-tab mode is enabled, open in a new browser window
    if (reviewerConfig.reviewerLayout === 'new-tab') {
      window.open(`/reviewer/abstracts/${abstract._id}`, '_blank', 'width=1200,height=900')
      return
    }
    
    // Split-screen mode - show in panel
    setSelectedAbstract(abstract)
    setSelectedIndex(index)
    // Reset review form
    setScores({})
    setDecision('')
    setApprovedFor('')
    setRejectionComment('')
    setActiveTab('details')
    setReviewSuccess(null)
  }

  // Validate review form
  const validateReviewForm = () => {
    // Check all scores are filled
    const enabledCriteria = reviewerConfig.scoringCriteria.filter(c => c.enabled)
    for (const criteria of enabledCriteria) {
      if (!scores[criteria.key] || scores[criteria.key] < 1 || scores[criteria.key] > 10) {
        toast.error(`Please provide a score for "${criteria.label}"`)
        return false
      }
    }

    if (!decision) {
      toast.error('Please select a decision (Approve or Reject)')
      return false
    }

    if (decision === 'approve' && !approvedFor) {
      toast.error('Please select what the abstract is approved for')
      return false
    }

    if (decision === 'reject' && reviewerConfig.requireRejectionComment && !rejectionComment.trim()) {
      toast.error('Please provide a comment for rejection')
      return false
    }

    return true
  }

  // Submit review with new scoring system
  const submitReview = async (decisionOverride?: 'approve' | 'reject') => {
    if (!selectedAbstract) return
    
    const finalDecision = decisionOverride || decision
    if (!finalDecision) {
      toast.error('Please select a decision')
      return
    }

    // For keyboard shortcuts, we need to validate
    if (!decisionOverride && !validateReviewForm()) return

    setSubmitting(true)
    setReviewSuccess(null)

    try {
      const response = await fetch('/api/reviewer/abstracts/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abstractId: selectedAbstract._id,
          decision: finalDecision,
          approvedFor: finalDecision === 'approve' ? approvedFor : undefined,
          rejectionComment: finalDecision === 'reject' ? rejectionComment : undefined,
          scores
        })
      })
      const data = await response.json()
      if (data.success) {
        setReviewSuccess(finalDecision as 'approve' | 'reject')
        toast.success(
          finalDecision === 'approve'
            ? '✅ Abstract approved successfully!'
            : '❌ Abstract rejected successfully!',
          { duration: 3000 }
        )
        // Update local state immediately for instant feedback
        setSelectedAbstract(prev => prev ? {
          ...prev,
          existingReview: { decision: finalDecision, comments: rejectionComment, reviewedAt: new Date().toISOString() }
        } : null)
        // Refresh list after short delay
        setTimeout(() => {
          fetchAbstracts()
          setReviewSuccess(null)
          // Close panel after successful review
          setSelectedAbstract(null)
          setSelectedIndex(-1)
        }, 1500)
      } else {
        toast.error(data.message || 'Failed to submit review')
      }
    } catch {
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  // Download file
  const handleDownload = async (abstractId: string, fileType: 'initial' | 'final') => {
    try {
      toast.info('Starting download...')
      const response = await fetch(`/api/abstracts/download/${abstractId}?type=${fileType}`)
      if (!response.ok) {
        toast.error('Download failed')
        return
      }
      const blob = await response.blob()
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `abstract-${fileType}.pdf`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('File downloaded successfully')
    } catch {
      toast.error('Download failed')
    }
  }

  // Export filtered abstracts as CSV
  const handleExportCSV = async () => {
    try {
      toast.info('Preparing CSV export...')
      const params = new URLSearchParams()
      if (filterSpecialty !== 'all') params.append('specialty', filterSpecialty)
      if (filterCategory !== 'all') params.append('category', filterCategory)
      if (filterTopic !== 'all') params.append('topic', filterTopic)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/abstracts/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reviewer-abstracts-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('CSV exported successfully')
      } else {
        toast.error('Failed to export CSV')
      }
    } catch {
      toast.error('Error exporting CSV')
    }
  }

  // Export all abstracts with files as ZIP (files renamed to abstract IDs)
  const handleExportZip = async () => {
    try {
      toast.info('Preparing ZIP export with files... This may take a moment.')
      const params = new URLSearchParams()
      params.append('includeFiles', 'true')
      params.append('renameToAbstractId', 'true')
      if (filterSpecialty !== 'all') params.append('specialty', filterSpecialty)
      if (filterCategory !== 'all') params.append('category', filterCategory)
      if (filterTopic !== 'all') params.append('topic', filterTopic)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/abstracts/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `abstracts-with-files-${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('ZIP with files exported successfully')
      } else {
        toast.error('Failed to export ZIP')
      }
    } catch {
      toast.error('Error exporting ZIP')
    }
  }

  // Format category label
  const formatCategory = (cat: string | undefined) => {
    if (!cat) return 'N/A'
    return cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // Get status badge
  const getStatusBadge = (abstract: AbstractForReview) => {
    if (abstract.existingReview) {
      // Check for both 'approve' (new) and 'accept' (legacy) values
      const isAccepted = abstract.existingReview.decision === 'approve' || abstract.existingReview.decision === 'accept'
      return (
        <Badge className={`${isAccepted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'} text-xs font-medium`}>
          {isAccepted ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
          {isAccepted ? 'Accepted' : 'Rejected'}
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-medium">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    )
  }

  // Get specialty icon
  const getSpecialtyIcon = (specialty: string | undefined) => {
    if (specialty === 'neurosurgery') return <Brain className="w-3.5 h-3.5" />
    if (specialty === 'neurology') return <Stethoscope className="w-3.5 h-3.5" />
    return <FileText className="w-3.5 h-3.5" />
  }


  // RENDER
  return (
    <div
      className="min-h-screen text-gray-800 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #e8eef5 0%, #f0f4f8 25%, #f8f0f5 50%, #f0f4f8 75%, #e8eef5 100%)',
      }}
    >
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '50%', height: '50%', borderRadius: '50%', background: `radial-gradient(circle, ${conferenceConfig.theme.primary}66 0%, ${conferenceConfig.theme.primary}26 50%, transparent 70%)`, filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '45%', height: '45%', borderRadius: '50%', background: `radial-gradient(circle, ${conferenceConfig.theme.secondary}59 0%, ${conferenceConfig.theme.secondary}1a 50%, transparent 70%)`, filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '5%', width: '55%', height: '55%', borderRadius: '50%', background: `radial-gradient(circle, ${conferenceConfig.theme.primary}59 0%, ${conferenceConfig.theme.primary}1a 50%, transparent 70%)`, filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '0%', left: '-5%', width: '40%', height: '40%', borderRadius: '50%', background: `radial-gradient(circle, ${conferenceConfig.theme.secondary}40 0%, ${conferenceConfig.theme.secondary}14 50%, transparent 70%)`, filter: 'blur(80px)' }} />
      </div>

      <div className={`relative z-10 ${focusMode ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
        {/* Header - minimal in focus mode */}
        <div className={focusMode ? 'px-2 py-1' : 'mb-6'}>
          <div className={`flex items-center justify-between ${focusMode ? '' : 'mb-2'}`}>
            {!focusMode && (
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reviewer Portal</h1>
                <p className="text-gray-600 mt-1">{conferenceConfig.shortName} - Abstract Review Dashboard</p>
              </div>
            )}
            <div className={`flex items-center gap-2 ${focusMode ? 'w-full justify-end' : ''}`}>
              {/* Keyboard shortcuts hint */}
              {!focusMode && (
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 bg-white/30 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>J/K navigate • A accept • R reject • Esc close</span>
                </div>
              )}
              {/* Focus Mode Toggle - Browser Fullscreen */}
              <Button
                onClick={handleFocusModeToggle}
                variant="outline"
                size={focusMode ? 'sm' : 'default'}
                className={`rounded-xl border-white/40 backdrop-blur-sm transition-all ${focusMode
                  ? 'bg-pink-500/20 hover:bg-pink-500/30 border-pink-300'
                  : 'bg-white/30 hover:bg-white/50'
                  }`}
                title={focusMode ? 'Exit focus mode' : 'Enter focus mode (fullscreen)'}
              >
                {focusMode ? (
                  <><Shrink className="w-4 h-4 mr-1" />Exit</>
                ) : (
                  <><Focus className="w-4 h-4 mr-2" />Focus Mode</>
                )}
              </Button>
              {!focusMode && (
                <Button
                  onClick={() => fetchAbstracts(true)}
                  disabled={refreshing}
                  variant="outline"
                  className="rounded-xl border-white/40 bg-white/30 hover:bg-white/50 backdrop-blur-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards - hidden in focus mode */}
        <AnimatePresence>
          {!focusMode && (loading ? <StatsSkeleton /> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-6"
                style={glassCard}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Assigned</p>
                    <motion.p
                      key={stats.assigned}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-gray-900"
                    >
                      {stats.assigned}
                    </motion.p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl p-6"
                style={glassCard}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/20">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Reviewed</p>
                    <motion.p
                      key={stats.reviewed}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-gray-900"
                    >
                      {stats.reviewed}
                    </motion.p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl p-6"
                style={glassCard}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/20">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Pending</p>
                    <motion.p
                      key={stats.pending}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-gray-900"
                    >
                      {stats.pending}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </AnimatePresence>

        {/* Filter Bar - hidden in focus mode */}
        {!focusMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-4 mb-6"
            style={glassCard}
          >
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Filters</span>
              <span className="text-xs text-gray-500 ml-auto">{filteredAbstracts.length} of {abstracts.length} abstracts</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search title, ID, author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-white/40 bg-white/50 focus:bg-white/70"
                />
              </div>

              {/* Specialty - config-driven */}
              <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                <SelectTrigger className="rounded-xl border-white/40 bg-white/50">
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {specialtyOptions.map(opt => (
                    <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category - config-driven */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="rounded-xl border-white/40 bg-white/50">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Topic - config-driven based on specialty */}
              <Select value={filterTopic} onValueChange={setFilterTopic}>
                <SelectTrigger className="rounded-xl border-white/40 bg-white/50">
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {getAvailableTopics().map(topic => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="rounded-xl border-white/40 bg-white/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Buttons */}
            <div className="flex justify-end mt-3 gap-2">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="rounded-xl border-white/40 bg-white/30 hover:bg-white/50"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={handleExportZip}
                variant="outline"
                size="sm"
                className="rounded-xl border-white/40 bg-white/30 hover:bg-white/50"
              >
                <FolderDown className="w-4 h-4 mr-2" />
                Export ZIP with Files
              </Button>
            </div>
          </motion.div>
        )}

        {/* Main Content - Always split-screen when abstract selected */}
        <div
          ref={containerRef}
          className={`flex gap-0 relative ${focusMode ? 'px-1' : ''}`}
          style={{
            height: focusMode ? 'calc(100vh - 40px)' : 'calc(100vh - 380px)',
            minHeight: '500px'
          }}
        >
          {/* Abstract List - Always visible */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={`overflow-hidden flex flex-col relative z-10 ${focusMode ? 'p-2 rounded-none' : 'p-4 rounded-2xl'}`}
            style={{
              ...glassCard,
              width: selectedAbstract ? (focusMode ? '30%' : `${100 - panelWidth}%`) : '100%',
              height: '100%',
              transition: isDragging.current ? 'none' : 'width 0.3s ease'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold text-gray-800 ${focusMode ? 'text-base' : 'text-lg'}`}>Abstracts</h2>
              <Badge variant="secondary" className="bg-white/50">{filteredAbstracts.length}</Badge>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loading ? <ListSkeleton /> : filteredAbstracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mb-3 opacity-50" />
                  <p className="font-medium">No abstracts found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters</p>
                </div>
              ) : (
                filteredAbstracts.map((abstract, index) => (
                  <motion.div
                    key={abstract._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelectAbstract(abstract, index)}
                    className={`rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01] ${selectedIndex === index
                      ? 'ring-2 ring-pink-400 bg-white/50'
                      : 'hover:bg-white/40'
                      }`}
                    style={glassCardLight}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500">{abstract.abstractId}</span>
                          {getStatusBadge(abstract)}
                        </div>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{abstract.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {abstract.submittingFor && (
                            <Badge variant="outline" className="text-xs bg-blue-50/50 border-blue-200 text-blue-700">
                              {getSpecialtyIcon(abstract.submittingFor)}
                              <span className="ml-1 capitalize">{abstract.submittingFor}</span>
                            </Badge>
                          )}
                          {abstract.submissionCategory && (
                            <Badge variant="outline" className="text-xs bg-purple-50/50 border-purple-200 text-purple-700">
                              {abstract.submissionCategory === 'award-paper' && <Award className="w-3 h-3 mr-1" />}
                              {formatCategory(abstract.submissionCategory)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Resize Handle - Hidden in focus mode */}
          {selectedAbstract && !focusMode && (
            <div
              onMouseDown={handleMouseDown}
              className="w-2 cursor-col-resize flex items-center justify-center hover:bg-pink-200/50 transition-colors z-10 mx-1"
              style={{ touchAction: 'none' }}
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
          )}

          {/* Detail Panel */}
          <AnimatePresence>
            {selectedAbstract && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`overflow-hidden flex flex-col relative z-10 ${focusMode ? 'rounded-none' : 'rounded-2xl'}`}
                style={{
                  ...glassCard,
                  width: focusMode ? '70%' : `${panelWidth}%`,
                  height: '100%',
                  transition: isDragging.current ? 'none' : 'width 0.3s ease'
                }}
              >
                {/* Panel Header */}
                <div className={`border-b border-white/20 flex items-center justify-between ${focusMode ? 'p-2' : 'p-4'}`}>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-mono text-gray-500">{selectedAbstract.abstractId}</span>
                    <h2 className={`font-semibold text-gray-900 line-clamp-1 ${focusMode ? 'text-sm' : ''}`}>{selectedAbstract.title}</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedAbstract(null); setSelectedIndex(-1) }}
                    className="rounded-lg hover:bg-white/30 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="mx-4 mt-3 bg-white/30 rounded-xl p-1 flex-shrink-0">
                    <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-white/70 flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      Details & Review
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="rounded-lg data-[state=active]:bg-white/70 flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </TabsTrigger>
                  </TabsList>

                  {/* Details Tab */}
                  <TabsContent value="details" className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Abstract Info */}
                    <div className="rounded-xl p-4 space-y-3" style={glassCardLight}>
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Abstract Information
                      </h3>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Abstract ID</span>
                          <p className="font-mono font-medium text-gray-900">{selectedAbstract.abstractId}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Status</span>
                          <div className="mt-0.5">{getStatusBadge(selectedAbstract)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Specialty</span>
                          <p className="font-medium text-gray-900 capitalize flex items-center gap-1">
                            {getSpecialtyIcon(selectedAbstract.submittingFor)}
                            {selectedAbstract.submittingFor || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Category</span>
                          <p className="font-medium text-gray-900">{formatCategory(selectedAbstract.submissionCategory)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Topic</span>
                          <p className="font-medium text-gray-900">{selectedAbstract.submissionTopic || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Word Count</span>
                          <p className="font-medium text-gray-900">
                            {selectedAbstract.wordCount || 'N/A'}
                            {selectedAbstract.wordCount && selectedAbstract.wordCount > 250 && (
                              <span className="text-red-500 text-xs ml-1">(exceeds 250)</span>
                            )}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Submitted</span>
                          <p className="font-medium text-gray-900 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(selectedAbstract.submittedAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {!reviewerConfig.blindReview && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Authors</span>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {selectedAbstract.authors.join(', ')}
                            </p>
                          </div>
                        )}
                        {selectedAbstract.keywords && selectedAbstract.keywords.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Keywords</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {selectedAbstract.keywords.map((kw, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-gray-50/50">{kw}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Author Info - Hidden in blind review mode */}
                    {!reviewerConfig.blindReview && (
                      <div className="rounded-xl p-4 space-y-3" style={glassCardLight}>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Submitter Info
                        </h3>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{selectedAbstract.userId?.email || 'N/A'}</span>
                          </div>
                          {selectedAbstract.userId?.profile?.firstName && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">
                                {selectedAbstract.userId.profile.firstName} {selectedAbstract.userId.profile.lastName || ''}
                              </span>
                            </div>
                          )}
                          {selectedAbstract.userId?.profile?.institution && (
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{selectedAbstract.userId.profile.institution}</span>
                            </div>
                          )}
                          {selectedAbstract.userId?.registration?.registrationId && (
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900 font-mono">{selectedAbstract.userId.registration.registrationId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Blind Review Notice */}
                    {reviewerConfig.blindReview && (
                      <div className="rounded-xl p-4 bg-amber-50/50 border border-amber-200" style={glassCardLight}>
                        <p className="text-amber-700 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Blind Review Mode - Author details are hidden
                        </p>
                      </div>
                    )}

                    {/* Download */}
                    {selectedAbstract.initial?.file && (
                      <div className="rounded-xl p-4" style={glassCardLight}>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                          <Download className="w-4 h-4" />
                          Files
                        </h3>
                        <Button
                          onClick={() => handleDownload(selectedAbstract._id, 'initial')}
                          variant="outline"
                          className="w-full justify-start rounded-xl bg-white/50 hover:bg-white/70"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {selectedAbstract.initial.file.originalName}
                          <Download className="w-4 h-4 ml-auto" />
                        </Button>
                        {selectedAbstract.final?.file && (
                          <Button
                            onClick={() => handleDownload(selectedAbstract._id, 'final')}
                            variant="outline"
                            className="w-full justify-start rounded-xl bg-emerald-50/50 hover:bg-emerald-100/70 mt-2 border-emerald-200"
                          >
                            <FileText className="w-4 h-4 mr-2 text-emerald-600" />
                            <span className="text-emerald-700">Final: {selectedAbstract.final.file.originalName}</span>
                            <Download className="w-4 h-4 ml-auto text-emerald-600" />
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Review Section */}
                    <div className="rounded-xl p-4" style={glassCardLight}>
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <CheckCircle className="w-4 h-4" />
                        Review
                        {reviewerConfig.showTotalScore && decision && (
                          <Badge variant="secondary" className="ml-auto text-sm">
                            Total: {totalScore} / {maxTotalScore}
                          </Badge>
                        )}
                      </h3>

                      {selectedAbstract.existingReview ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`p-4 rounded-xl ${selectedAbstract.existingReview.decision === 'accept' || selectedAbstract.existingReview.decision === 'approve'
                            ? 'bg-emerald-50 border border-emerald-200'
                            : 'bg-red-50 border border-red-200'
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            {selectedAbstract.existingReview.decision === 'accept' || selectedAbstract.existingReview.decision === 'approve' ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className={`font-semibold ${selectedAbstract.existingReview.decision === 'accept' || selectedAbstract.existingReview.decision === 'approve' ? 'text-emerald-700' : 'text-red-700'
                              }`}>
                              {selectedAbstract.existingReview.decision === 'accept' || selectedAbstract.existingReview.decision === 'approve' ? 'Approved' : 'Rejected'}
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              {new Date(selectedAbstract.existingReview.reviewedAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {/* Approved For */}
                          {(selectedAbstract.existingReview as any).approvedFor && (
                            <div className="mb-3 p-2 bg-emerald-100/50 rounded-lg">
                              <span className="text-xs text-emerald-600 font-medium">Approved For:</span>
                              <p className="text-sm font-semibold text-emerald-800 capitalize">
                                {(selectedAbstract.existingReview as any).approvedFor.replace('-', ' ')}
                              </p>
                            </div>
                          )}
                          
                          {/* Scores */}
                          {(selectedAbstract.existingReview as any).scores && (
                            <div className="mb-3 space-y-1">
                              <span className="text-xs text-gray-600 font-medium">Review Scores:</span>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {(selectedAbstract.existingReview as any).scores.originality && (
                                  <div className="flex justify-between p-1.5 bg-white/50 rounded">
                                    <span className="text-gray-600">Originality</span>
                                    <span className="font-semibold">{(selectedAbstract.existingReview as any).scores.originality}/10</span>
                                  </div>
                                )}
                                {(selectedAbstract.existingReview as any).scores.levelOfEvidence && (
                                  <div className="flex justify-between p-1.5 bg-white/50 rounded">
                                    <span className="text-gray-600">Evidence</span>
                                    <span className="font-semibold">{(selectedAbstract.existingReview as any).scores.levelOfEvidence}/10</span>
                                  </div>
                                )}
                                {(selectedAbstract.existingReview as any).scores.scientificImpact && (
                                  <div className="flex justify-between p-1.5 bg-white/50 rounded">
                                    <span className="text-gray-600">Scientific Impact</span>
                                    <span className="font-semibold">{(selectedAbstract.existingReview as any).scores.scientificImpact}/10</span>
                                  </div>
                                )}
                                {(selectedAbstract.existingReview as any).scores.socialSignificance && (
                                  <div className="flex justify-between p-1.5 bg-white/50 rounded">
                                    <span className="text-gray-600">Social Significance</span>
                                    <span className="font-semibold">{(selectedAbstract.existingReview as any).scores.socialSignificance}/10</span>
                                  </div>
                                )}
                                {(selectedAbstract.existingReview as any).scores.qualityOfManuscript && (
                                  <div className="flex justify-between p-1.5 bg-white/50 rounded">
                                    <span className="text-gray-600">Quality</span>
                                    <span className="font-semibold">{(selectedAbstract.existingReview as any).scores.qualityOfManuscript}/10</span>
                                  </div>
                                )}
                                {(selectedAbstract.existingReview as any).scores.total && (
                                  <div className="col-span-2 flex justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                    <span className="text-blue-700 font-medium">Total Score</span>
                                    <span className="font-bold text-blue-800">{(selectedAbstract.existingReview as any).scores.total}/50</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Comments */}
                          {(selectedAbstract.existingReview.comments || (selectedAbstract.existingReview as any).rejectionComment) && (
                            <div className="mt-2 p-2 bg-white/50 rounded-lg">
                              <span className="text-xs text-gray-600 font-medium">Comments:</span>
                              <p className="text-sm text-gray-700 mt-1">
                                {selectedAbstract.existingReview.comments || (selectedAbstract.existingReview as any).rejectionComment}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          {/* Scoring Criteria */}
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700 block">
                              Review Scores
                            </label>
                            {reviewerConfig.scoringCriteria.filter(c => c.enabled).map((criteria, idx) => (
                              <div key={criteria.key} className="flex items-center justify-between gap-3 p-2 bg-white/50 rounded-lg">
                                <span className="text-sm text-gray-700 flex-1">
                                  {idx + 1}) {criteria.label}
                                </span>
                                <Select
                                  value={scores[criteria.key]?.toString() || ''}
                                  onValueChange={(value) => setScores(prev => ({ ...prev, [criteria.key]: parseInt(value) }))}
                                >
                                  <SelectTrigger className="w-20 h-8 text-sm">
                                    <SelectValue placeholder="--" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>

                          {/* Decision */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Decision
                            </label>
                            <Select
                              value={decision}
                              onValueChange={(value: 'approve' | 'reject') => {
                                setDecision(value)
                                if (value === 'approve') setRejectionComment('')
                                if (value === 'reject') setApprovedFor('')
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select decision" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="approve">
                                  <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    Approve
                                  </span>
                                </SelectItem>
                                <SelectItem value="reject">
                                  <span className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    Reject
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Approved For - shown only when Approve is selected */}
                          {decision === 'approve' && (
                            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                              <label className="text-sm font-medium text-emerald-800 mb-2 block">
                                Approved For
                              </label>
                              <Select value={approvedFor} onValueChange={setApprovedFor}>
                                <SelectTrigger className="w-full bg-white">
                                  <SelectValue placeholder="Select presentation type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {abstractsConfig.submissionCategories.filter(o => o.enabled).map(option => (
                                    <SelectItem key={option.key} value={option.key}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Rejection Comment - shown only when Reject is selected */}
                          {decision === 'reject' && (
                            <div className="p-3 bg-red-50/50 rounded-lg border border-red-200">
                              <label className="text-sm font-medium text-red-800 mb-2 block">
                                Comment to Author {reviewerConfig.requireRejectionComment && <span className="text-red-600">*</span>}
                              </label>
                              <Textarea
                                placeholder="Please provide feedback for the author..."
                                value={rejectionComment}
                                onChange={(e) => setRejectionComment(e.target.value)}
                                className="bg-white min-h-[80px]"
                              />
                            </div>
                          )}

                          <AnimatePresence>
                            {reviewSuccess && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`p-4 rounded-xl text-center ${reviewSuccess === 'approve' ? 'bg-emerald-100' : 'bg-red-100'
                                  }`}
                              >
                                {reviewSuccess === 'approve' ? (
                                  <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                                ) : (
                                  <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
                                )}
                                <p className={`font-semibold ${reviewSuccess === 'approve' ? 'text-emerald-700' : 'text-red-700'
                                  }`}>
                                  {reviewSuccess === 'approve' ? 'Abstract Approved!' : 'Abstract Rejected'}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {!reviewSuccess && (
                            <Button
                              onClick={() => submitReview()}
                              disabled={submitting || !decision}
                              className={`w-full rounded-xl h-12 font-semibold ${
                                decision === 'approve' 
                                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                                  : decision === 'reject'
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-gray-400'
                              } text-white`}
                            >
                              {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <>
                                  {decision === 'approve' && <CheckCircle className="w-5 h-5 mr-2" />}
                                  {decision === 'reject' && <XCircle className="w-5 h-5 mr-2" />}
                                  Submit Review
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Preview Tab - Full height */}
                  <TabsContent value="preview" className="flex-1 p-4 overflow-hidden">
                    <DocumentPreview
                      fileUrl={selectedAbstract.initial?.file?.blobUrl || selectedAbstract.initial?.file?.storagePath}
                      fileName={selectedAbstract.initial?.file?.originalName}
                      isFullScreen={isFullScreen}
                      onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                    />
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
