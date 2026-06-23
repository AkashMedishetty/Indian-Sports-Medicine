"use client"
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/conference-backend-core/components/ui/card'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { Input } from '@/conference-backend-core/components/ui/input'
import { Textarea } from '@/conference-backend-core/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/conference-backend-core/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/conference-backend-core/components/ui/dialog'
import { AbstractDetailsModal } from '@/conference-backend-core/components/abstracts/AbstractDetailsModal'
import { 
  FileText, 
  Eye, 
  Download, 
  Search, 
  Filter,
  Upload,
  User,
  Calendar,
  Mail,
  ExternalLink,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  Plus,
  AlertCircle,
  Loader
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

// Note: This function is kept for backwards compatibility but feature check is now dynamic
const isAbstractSubmissionOpenStatic = (): boolean => {
  // Always return true — the actual open/close check is done via the API (isFeatureEnabled + isCurrentlyOpen)
  return true
}

interface Abstract {
  _id: string
  abstractId: string
  title: string
  track: string
  authors: string[]
  status: 'submitted' | 'under-review' | 'accepted' | 'rejected' | 'final-submitted'
  submittedAt: string
  wordCount?: number
  averageScore?: number
  decisionAt?: string
  initial: {
    file?: {
      originalName: string
      uploadedAt: string
    }
    notes?: string
  }
  final?: {
    file?: {
      originalName: string
      uploadedAt: string
    }
    submittedAt?: string
    displayId?: string
  }
}

export function AbstractsDashboard() {
  const [abstracts, setAbstracts] = useState<Abstract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAbstract, setSelectedAbstract] = useState<Abstract | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [finalSubmissionAbstract, setFinalSubmissionAbstract] = useState<Abstract | null>(null)
  const [finalSubmissionFile, setFinalSubmissionFile] = useState<File | null>(null)
  const [finalSubmissionNotes, setFinalSubmissionNotes] = useState('')
  const [submittingFinal, setSubmittingFinal] = useState(false)
  
  // Initial submission states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [submitTitle, setSubmitTitle] = useState('')
  const [submitTrack, setSubmitTrack] = useState('')
  const [submitCategory, setSubmitCategory] = useState('')
  const [submitSubcategory, setSubmitSubcategory] = useState('')
  const [submitFile, setSubmitFile] = useState<File | null>(null)
  const [submittingInitial, setSubmittingInitial] = useState(false)
  const [tracks, setTracks] = useState<any[]>([])
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(true) // Track if abstract submission is enabled in admin
  const [abstractsConfig, setAbstractsConfig] = useState<any>(null) // Full config including guidelines and templates
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
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/abstracts/config')
      const data = await response.json()
      if (data.success && data.data?.tracks) {
        setTracks(data.data.tracks)
      }
      // Check if feature is enabled AND submissions are currently open from database
      if (data.data?.featureEnabled !== undefined) {
        setIsFeatureEnabled(data.data.featureEnabled && data.data.isCurrentlyOpen !== false)
      }
      // Store full config for guidelines and templates
      if (data.success && data.data) {
        setAbstractsConfig(data.data)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    }
  }

  const fetchAbstracts = async () => {
    try {
      const response = await fetch('/api/abstracts')
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

  const getWorkflowProgress = (status: string) => {
    const progressMap = {
      'submitted': 25,
      'under-review': 50,
      'accepted': 75,
      'rejected': 100,
      'final-submitted': 100
    }
    return progressMap[status as keyof typeof progressMap] || 0
  }

  const canSubmitFinal = (abstract: Abstract) => {
    return abstract.status === 'accepted' && !abstract.final?.submittedAt
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

  const submitInitialAbstract = async () => {
    // Check if submission is open (dynamic feature check + static window check)
    if (!isFeatureEnabled || !isAbstractSubmissionOpenStatic()) {
      toast.error('Abstract submission is currently closed')
      return
    }
    
    if (!submitTitle.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!submitTrack) {
      toast.error('Please select a track')
      return
    }

    setSubmittingInitial(true)
    try {
      // Create abstract
      const response = await fetch('/api/abstracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: submitTitle, 
          track: submitTrack, 
          category: submitCategory,
          subcategory: submitSubcategory
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to submit abstract')
      }

      // Upload file if provided
      if (submitFile) {
        const formData = new FormData()
        formData.append('abstractId', data.data.abstractId)
        formData.append('stage', 'initial')
        formData.append('file', submitFile)

        const uploadResponse = await fetch('/api/abstracts/upload', { 
          method: 'POST', 
          body: formData 
        })

        const uploadData = await uploadResponse.json()
        if (!uploadData.success) {
          throw new Error(uploadData.message || 'Upload failed')
        }
      }

      toast.success('Abstract submitted successfully!')
      setIsSubmitModalOpen(false)
      setSubmitTitle('')
      setSubmitTrack('')
      setSubmitCategory('')
      setSubmitSubcategory('')
      setSubmitFile(null)
      fetchAbstracts() // Refresh the list
    } catch (error: any) {
      console.error('Initial submission error:', error)
      toast.error(error.message || 'Error submitting abstract')
    } finally {
      setSubmittingInitial(false)
    }
  }

  const submitFinalPresentation = async () => {
    if (!finalSubmissionAbstract || !finalSubmissionFile) {
      toast.error('Please select a file to upload')
      return
    }

    if (finalSubmissionFile.size > 4.5 * 1024 * 1024) {
      toast.error('File size must be under 4.5MB. Please compress your file and try again.')
      return
    }

    setSubmittingFinal(true)
    try {
      const formData = new FormData()
      formData.append('abstractId', finalSubmissionAbstract._id)
      formData.append('file', finalSubmissionFile)
      formData.append('notes', finalSubmissionNotes)

      const response = await fetch('/api/abstracts/final-submission', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Final presentation submitted successfully!')
        setFinalSubmissionAbstract(null)
        setFinalSubmissionFile(null)
        setFinalSubmissionNotes('')
        fetchAbstracts() // Refresh the list
      } else {
        toast.error(data.message || 'Failed to submit final presentation')
      }
    } catch (error) {
      console.error('Final submission error:', error)
      toast.error('Error submitting final presentation')
    } finally {
      setSubmittingFinal(false)
    }
  }

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-midnight-600 dark:text-midnight-400">Total Submissions</p>
                  <p className="text-2xl font-bold text-midnight-800 dark:text-midnight-100">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-midnight-600 dark:text-midnight-400">Under Review</p>
                  <p className="text-2xl font-bold text-midnight-800 dark:text-midnight-100">{stats.underReview}</p>
                </div>
                <Eye className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-midnight-600 dark:text-midnight-400">Accepted</p>
                  <p className="text-2xl font-bold text-midnight-800 dark:text-midnight-100">{stats.accepted}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Submit New Abstract */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Abstract Submissions</span>
            <div className="flex flex-col items-end gap-1">
              {(!isFeatureEnabled || !isAbstractSubmissionOpenStatic()) ? (
                <>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Submit New Abstract
                  </Button>
                  <p className="text-xs text-red-600">
                    Submissions currently {!isFeatureEnabled ? 'disabled' : 'closed'}
                  </p>
                </>
              ) : (
                <Link href="/abstracts">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit New Abstract
                  </Button>
                </Link>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {abstracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-midnight-800 dark:text-midnight-100 mb-2">
                No Abstracts Yet
              </h3>
              <p className="text-midnight-600 dark:text-midnight-400 mb-6">
                Start by submitting your first abstract for review
              </p>
              {(!isFeatureEnabled || !isAbstractSubmissionOpenStatic()) ? (
                <>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Your First Abstract
                  </Button>
                  <p className="text-sm text-red-600 mt-2">
                    Abstract submission is currently {!isFeatureEnabled ? 'disabled' : 'closed'}
                  </p>
                </>
              ) : (
                <Link href="/abstracts">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Your First Abstract
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {abstracts.map((abstract, index) => (
                <motion.div
                  key={abstract._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border border-midnight-200 dark:border-midnight-700 rounded-lg p-6"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="mb-4">
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-midnight-800 dark:text-midnight-100 mb-2 break-words">
                            {abstract.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <Badge variant="outline" className="text-xs sm:text-sm">{abstract.track}</Badge>
                            {getStatusBadge(abstract.status)}
                            <span className="text-xs sm:text-sm text-midnight-500">ID: {abstract.abstractId}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-midnight-700 dark:text-midnight-300">
                            Submission Progress
                          </span>
                          <span className="text-sm text-midnight-500">
                            {getWorkflowProgress(abstract.status)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${getWorkflowProgress(abstract.status)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-midnight-600 dark:text-midnight-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span><strong>Authors:</strong> {abstract.authors.join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span><strong>Submitted:</strong> {new Date(abstract.submittedAt).toLocaleDateString()}</span>
                        </div>
                        {abstract.wordCount && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span><strong>Word Count:</strong> {abstract.wordCount}</span>
                          </div>
                        )}
                        {abstract.averageScore && (
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            <span><strong>Review Score:</strong> {abstract.averageScore.toFixed(1)}/10</span>
                          </div>
                        )}
                      </div>

                      {/* Files */}
                      <div className="mt-4 space-y-2">
                        {abstract.initial.file && (
                          <div className="flex items-center gap-2 text-sm">
                            <Download className="w-4 h-4 text-[#25406b]" />
                            <span className="text-midnight-600 dark:text-midnight-400">
                              <strong>Initial File:</strong> {abstract.initial.file.originalName}
                            </span>
                            <span className="text-xs text-midnight-500">
                              ({new Date(abstract.initial.file.uploadedAt).toLocaleDateString()})
                            </span>
                          </div>
                        )}
                        {abstract.final?.file && (
                          <div className="flex items-center gap-2 text-sm">
                            <Download className="w-4 h-4 text-green-600" />
                            <span className="text-midnight-600 dark:text-midnight-400">
                              <strong>Final File:</strong> {abstract.final.file.originalName}
                            </span>
                            <span className="text-xs text-midnight-500">
                              ({new Date(abstract.final.file.uploadedAt).toLocaleDateString()})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Messages */}
                      {abstract.status === 'rejected' && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                            <XCircle className="w-4 h-4" />
                            <span className="font-medium">Abstract Rejected</span>
                          </div>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            Your abstract was not accepted for presentation. You can submit a new abstract if needed.
                          </p>
                        </div>
                      )}

                      {abstract.status === 'accepted' && !abstract.final?.submittedAt && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">Abstract Accepted!</span>
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Congratulations! Your abstract has been accepted. You can now submit your final presentation.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 lg:gap-2 w-full lg:min-w-[200px]">
                      {canSubmitFinal(abstract) && (
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setFinalSubmissionAbstract(abstract)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Submit Final Version
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline"
                        onClick={() => viewDetails(abstract)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>

                      {abstract.initial.file && (
                        <Button 
                          variant="ghost"
                          size="sm"
                          disabled={downloading === `${abstract._id}-initial`}
                          onClick={() => downloadFile(abstract._id, 'initial')}
                        >
                          {downloading === `${abstract._id}-initial` ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download File
                            </>
                          )}
                        </Button>
                      )}

                      {abstract.final?.file && (
                        <Button 
                          variant="ghost"
                          size="sm"
                          disabled={downloading === `${abstract._id}-final`}
                          onClick={() => downloadFile(abstract._id, 'final')}
                        >
                          {downloading === `${abstract._id}-final` ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download Final
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#25406b]" />
            Submission Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#d8e0ed] rounded-full flex items-center justify-center mx-auto mb-2">
                <Upload className="w-6 h-6 text-[#25406b]" />
              </div>
              <h4 className="font-semibold text-midnight-800 dark:text-midnight-100">1. Submit Initial</h4>
              <p className="text-sm text-midnight-600 dark:text-midnight-400">Upload your abstract document</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Eye className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="font-semibold text-midnight-800 dark:text-midnight-100">2. Under Review</h4>
              <p className="text-sm text-midnight-600 dark:text-midnight-400">Reviewers evaluate your submission</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-midnight-800 dark:text-midnight-100">3. Decision</h4>
              <p className="text-sm text-midnight-600 dark:text-midnight-400">Accept/reject notification</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6 text-theme-accent-600" />
              </div>
              <h4 className="font-semibold text-midnight-800 dark:text-midnight-100">4. Final Submission</h4>
              <p className="text-sm text-midnight-600 dark:text-midnight-400">Submit final presentation</p>
            </div>
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
        showAdminDetails={false}
      />

      {/* Initial Submission Modal */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              Submit New Abstract
            </DialogTitle>
            <DialogDescription>
              Submit your initial abstract for review. Please fill in all required fields.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abstract Title *
              </label>
              <Input
                placeholder="Enter your abstract title..."
                value={submitTitle}
                onChange={(e) => setSubmitTitle(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Track Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Track *
              </label>
              <Select value={submitTrack} onValueChange={setSubmitTrack}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a track" />
                </SelectTrigger>
                <SelectContent>
                  {tracks.map((track: any) => (
                    <SelectItem key={track.key} value={track.key}>
                      {track.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            {submitTrack && tracks.find(t => t.key === submitTrack)?.categories && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <Select value={submitCategory} onValueChange={setSubmitCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {tracks.find(t => t.key === submitTrack)?.categories.map((cat: string) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subcategory */}
            {submitTrack && tracks.find(t => t.key === submitTrack)?.subcategories && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <Select value={submitSubcategory} onValueChange={setSubmitSubcategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {tracks.find(t => t.key === submitTrack)?.subcategories.map((sub: string) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abstract File (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="initial-file-upload"
                />
                <label htmlFor="initial-file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF or Word documents (Max 4.5MB)
                  </p>
                </label>
                {submitFile && (
                  <div className="mt-3 p-2 bg-emerald-50 rounded border border-emerald-200">
                    <p className="text-sm text-emerald-700 font-medium">
                      Selected: {submitFile.name}
                    </p>
                    <p className="text-xs text-emerald-600">
                      Size: {(submitFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">ðŸ“‹ Submission Guidelines</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>â€¢ Abstract title should be concise and descriptive</li>
                <li>â€¢ Select the most appropriate track for your research</li>
                <li>â€¢ File upload is optional at this stage</li>
                <li>â€¢ Ensure your file format is PDF or Word</li>
              </ul>
            </div>

            {/* Template Download - Track-specific or default */}
            {(() => {
              // Find track-specific template first (if track is selected)
              const trackTemplate = submitTrack 
                ? abstractsConfig?.fileRequirements?.trackTemplates?.find(
                    (t: any) => t.trackKey === submitTrack
                  )
                : null
              const initialTemplateUrl = trackTemplate?.initialTemplateUrl || abstractsConfig?.fileRequirements?.templateUrl
              const initialTemplateFileName = trackTemplate?.initialTemplateFileName || abstractsConfig?.fileRequirements?.templateFileName
              const trackLabel = trackTemplate?.trackLabel || tracks.find(t => t.key === submitTrack)?.label || 'Abstract'

              if (!initialTemplateUrl) return null

              return (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-800 mb-2">ðŸ“¥ Download Template</h4>
                  <p className="text-sm text-emerald-700 mb-3">
                    {submitTrack && trackTemplate 
                      ? `Use the official template for ${trackLabel} submissions.`
                      : 'Use the official template to ensure your submission follows the correct format.'}
                  </p>
                  <a 
                    href={initialTemplateUrl} 
                    download={initialTemplateFileName || 'abstract-template'}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download {submitTrack && trackTemplate ? trackLabel : 'Abstract'} Template
                  </a>
                </div>
              )
            })()}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={submitInitialAbstract}
                disabled={!submitTitle.trim() || !submitTrack || submittingInitial || !isFeatureEnabled || !isAbstractSubmissionOpenStatic()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {submittingInitial ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Abstract
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSubmitModalOpen(false)
                  setSubmitTitle('')
                  setSubmitTrack('')
                  setSubmitCategory('')
                  setSubmitSubcategory('')
                  setSubmitFile(null)
                }}
                disabled={submittingInitial}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Final Submission Modal */}
      <Dialog open={!!finalSubmissionAbstract} onOpenChange={() => setFinalSubmissionAbstract(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Submit Final Presentation
            </DialogTitle>
            <DialogDescription>
              Upload your final presentation materials for: <strong>{finalSubmissionAbstract?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Abstract Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Abstract Details</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>ID:</strong> {finalSubmissionAbstract?.abstractId}</p>
                <p><strong>Track:</strong> {finalSubmissionAbstract?.track}</p>
                <p><strong>Status:</strong> <span className="text-green-600 font-semibold">ACCEPTED</span></p>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Final Presentation File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={(e) => setFinalSubmissionFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="final-file-upload"
                />
                <label htmlFor="final-file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, PowerPoint, or Word documents (Max 4.5MB)
                  </p>
                </label>
                {finalSubmissionFile && (
                  <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-sm text-green-700 font-medium">
                      Selected: {finalSubmissionFile.name}
                    </p>
                    <p className="text-xs text-green-600">
                      Size: {(finalSubmissionFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <Textarea
                placeholder="Any additional information about your final submission..."
                value={finalSubmissionNotes}
                onChange={(e) => setFinalSubmissionNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Guidelines */}
            <div className="bg-[#f0f3f8] border border-[#b0c1db] rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">ðŸ“‹ Submission Guidelines</h4>
              {abstractsConfig?.guidelines?.finalSubmission?.instructions ? (
                <div className="text-sm text-[#1d3357] whitespace-pre-wrap">
                  {abstractsConfig.guidelines.finalSubmission.instructions}
                </div>
              ) : (
                <ul className="text-sm text-[#1d3357] space-y-1">
                  <li>â€¢ Ensure your presentation follows the conference format guidelines</li>
                  <li>â€¢ Include all necessary references and citations</li>
                  <li>â€¢ File size should not exceed 4.5MB</li>
                  <li>â€¢ Supported formats: PDF, PowerPoint (.ppt, .pptx), Word (.doc, .docx)</li>
                </ul>
              )}
              {abstractsConfig?.guidelines?.finalSubmission?.requirements?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#b0c1db]">
                  <p className="font-medium text-[#152843] mb-1">Requirements:</p>
                  <ul className="text-sm text-[#1d3357] space-y-1">
                    {abstractsConfig.guidelines.finalSubmission.requirements.map((req: string, idx: number) => (
                      <li key={idx}>â€¢ {req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Template Download - Track-specific or default */}
            {(() => {
              // Find track-specific template first
              const trackTemplate = abstractsConfig?.fileRequirements?.trackTemplates?.find(
                (t: any) => t.trackKey === finalSubmissionAbstract?.track
              )
              const finalTemplateUrl = trackTemplate?.finalTemplateUrl || abstractsConfig?.fileRequirements?.finalTemplateUrl
              const finalTemplateFileName = trackTemplate?.finalTemplateFileName || abstractsConfig?.fileRequirements?.finalTemplateFileName
              const trackLabel = trackTemplate?.trackLabel || finalSubmissionAbstract?.track

              if (!finalTemplateUrl) {
                // Fallback: show both templates
                return (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">📥 Download Templates</h4>
                    <p className="text-sm text-green-700 mb-3">
                      Download the official presentation templates for your submission.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a href="/Paper Template..pptx" download="Paper Template.pptx" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                        <Download className="w-4 h-4" /> Paper Template (.pptx)
                      </a>
                      <a href="/Poster Template.pptx" download="Poster Template.pptx" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm">
                        <Download className="w-4 h-4" /> Poster Template (.pptx)
                      </a>
                    </div>
                  </div>
                )
              }

              return (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">ðŸ“¥ Download Template</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Use the official template for <strong>{trackLabel}</strong> to ensure your submission follows the correct format.
                  </p>
                  <a 
                    href={finalTemplateUrl} 
                    download={finalTemplateFileName || 'final-template'}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download {trackLabel} Template
                  </a>
                </div>
              )
            })()}

            {/* Presentation Guidelines */}
            {finalSubmissionAbstract && (() => {
              const isAward = (finalSubmissionAbstract as any).approvedFor === 'award-paper' || (finalSubmissionAbstract as any).submissionCategory === 'award-paper'
              const isPoster = (finalSubmissionAbstract as any).approvedFor?.includes('poster') || (finalSubmissionAbstract as any).submissionCategory?.includes('poster') || (finalSubmissionAbstract as any).approvedFor === 'e-poster' || (finalSubmissionAbstract as any).submissionCategory === 'e-poster'
              
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-3">
                    📋 {isAward ? 'Award (Medal) Paper' : isPoster ? 'Poster Presentation' : 'Free Paper'} Guidelines
                  </h4>
                  <div className="space-y-3 text-sm">
                    {isPoster ? (
                      <>
                        <div className="bg-white rounded p-3 border border-amber-200">
                          <p className="font-semibold text-amber-900 mb-2">Format & Timing</p>
                          <div className="text-amber-800 space-y-1">
                            <div>Presentation: <strong>5 minutes</strong> (PowerPoint, standard mode)</div>
                            <div>Maximum Slides: <strong>3 slides</strong></div>
                          </div>
                          <p className="text-xs text-red-600 mt-2 font-semibold">Exceeding 3 slides may lead to disqualification or penalty.</p>
                        </div>
                        <div>
                          <p className="font-semibold text-amber-900 mb-1">Poster Guidelines</p>
                          <ul className="text-amber-800 text-xs space-y-1">
                            <li>• Poster should include only the author's name</li>
                            <li>• The author name should be the one presenting</li>
                            <li className="font-semibold">• Institution names must NOT be mentioned anywhere</li>
                            <li>• Keep content clear, concise, and visually engaging</li>
                            <li>• Ensure originality of work</li>
                            <li>• Be ready before your turn to avoid delays</li>
                          </ul>
                        </div>
                        <p className="text-xs text-red-600 font-semibold">Note: Failure to follow guidelines may affect evaluation.</p>
                      </>
                    ) : (
                      <>
                        <div className="bg-white rounded p-3 border border-amber-200">
                          <p className="font-semibold text-amber-900 mb-2">Format & Timing</p>
                          <div className="grid grid-cols-2 gap-2 text-amber-800">
                            <div>Presentation: <strong>{isAward ? '8 minutes' : '5 minutes'}</strong></div>
                            <div>Discussion: <strong>2 minutes</strong></div>
                          </div>
                        </div>
                        <div className="bg-red-50 rounded p-3 border border-red-200">
                          <p className="font-semibold text-red-800 mb-1">⏱️ Time Warning</p>
                          <ul className="text-red-700 text-xs space-y-1">
                            <li>• Warning at {isAward ? '7' : '4'} minutes</li>
                            <li>• Stop at {isAward ? '8' : '5'} minutes — strict adherence required</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-amber-900 mb-1">Presentation Instructions</p>
                          <ul className="text-amber-800 text-xs space-y-1">
                            <li>• Begin with greeting and introduction</li>
                            <li>• Clearly state title and objectives</li>
                            <li>• Present key results and conclusion</li>
                            <li>• Keep slides concise and readable</li>
                            <li className="font-semibold">• Paper should include only presenter name; institution name must not be mentioned anywhere</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-amber-900 mb-1">General Instructions</p>
                          <ul className="text-amber-800 text-xs space-y-1">
                            <li>• Be present 15 minutes early</li>
                            <li>• Submit presentation in advance</li>
                            <li>• Follow moderator instructions</li>
                            <li>• Answer questions from judges briefly and clearly</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={submitFinalPresentation}
                disabled={!finalSubmissionFile || submittingFinal}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {submittingFinal ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Final Presentation
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFinalSubmissionAbstract(null)
                  setFinalSubmissionFile(null)
                  setFinalSubmissionNotes('')
                }}
                disabled={submittingFinal}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
