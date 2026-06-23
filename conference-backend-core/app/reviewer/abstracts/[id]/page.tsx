"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/conference-backend-core/components/ui/card'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { Textarea } from '@/conference-backend-core/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/conference-backend-core/components/ui/select'
import { Label } from '@/conference-backend-core/components/ui/label'
import { Separator } from '@/conference-backend-core/components/ui/separator'
import { 
  ArrowLeft, User, Users, FileText, Award, Loader2, 
  CheckCircle, XCircle, Eye, EyeOff, Download, ExternalLink,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

// Helper: Get preview URL for documents (PDF, Word, PPT)
function getPreviewUrl(fileUrl: string | undefined, fileName: string | undefined): string | null {
  if (!fileUrl || !fileName) return null
  const ext = fileName.toLowerCase().split('.').pop() || ''
  if (ext === 'pdf') return fileUrl
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
  }
  return fileUrl // Fallback to direct URL
}

interface AbstractData {
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
    profile?: { 
      firstName?: string
      lastName?: string
      institution?: string
      title?: string
    }
    registration?: { registrationId: string }
  }
  initial: { 
    notes?: string
    introduction?: string
    methods?: string
    results?: string
    conclusion?: string
    file?: { 
      originalName: string
      blobUrl?: string
      storagePath?: string 
    } 
  }
  existingReview?: {
    decision: string
    approvedFor?: string
    rejectionComment?: string
    scores?: {
      originality?: number
      levelOfEvidence?: number
      scientificImpact?: number
      socialSignificance?: number
      qualityOfManuscript?: number
      total?: number
    }
    reviewedAt: string
  }
}

interface ReviewerConfig {
  blindReview: boolean
  scoringCriteria: Array<{ key: string; label: string; maxScore: number; enabled: boolean }>
  requireRejectionComment: boolean
  showTotalScore: boolean
}

interface AbstractsConfig {
  submissionCategories: Array<{ key: string; label: string; enabled: boolean }>
}

const defaultConfig: ReviewerConfig = {
  blindReview: false,
  scoringCriteria: [
    { key: 'originality', label: 'Originality of the Study', maxScore: 10, enabled: true },
    { key: 'levelOfEvidence', label: 'Level of Evidence of Study', maxScore: 10, enabled: true },
    { key: 'scientificImpact', label: 'Scientific Impact', maxScore: 10, enabled: true },
    { key: 'socialSignificance', label: 'Social Significance', maxScore: 10, enabled: true },
    { key: 'qualityOfManuscript', label: 'Quality of Manuscript + Abstract & Study', maxScore: 10, enabled: true }
  ],
  requireRejectionComment: true,
  showTotalScore: true
}

const defaultAbstractsConfig: AbstractsConfig = {
  submissionCategories: [
    { key: 'award-paper', label: 'Award Paper', enabled: true },
    { key: 'free-paper', label: 'Free Paper', enabled: true },
    { key: 'poster-presentation', label: 'Poster Presentation', enabled: true }
  ]
}

export default function AbstractReviewPage() {
  const router = useRouter()
  const params = useParams()
  const abstractId = params.id as string

  const [abstract, setAbstract] = useState<AbstractData | null>(null)
  const [config, setConfig] = useState<ReviewerConfig>(defaultConfig)
  const [abstractsConfig, setAbstractsConfig] = useState<AbstractsConfig>(defaultAbstractsConfig)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Blind mode toggle (local override)
  const [hideAuthorDetails, setHideAuthorDetails] = useState(false)
  const [hideCoAuthors, setHideCoAuthors] = useState(false)

  // Review form state
  const [scores, setScores] = useState<Record<string, number>>({})
  const [decision, setDecision] = useState<'approve' | 'reject' | ''>('')
  const [approvedFor, setApprovedFor] = useState('')
  const [rejectionComment, setRejectionComment] = useState('')

  // Fetch abstract and config
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch reviewer config
        const configRes = await fetch('/api/reviewer/config')
        const configData = await configRes.json()
        if (configData.success && configData.data) {
          setConfig(configData.data)
          // Set initial hide state based on blind review setting
          if (configData.data.blindReview) {
            setHideAuthorDetails(true)
            setHideCoAuthors(true)
          }
        }

        // Fetch abstracts config for submission categories
        const abstractsConfigRes = await fetch('/api/abstracts/config')
        const abstractsConfigData = await abstractsConfigRes.json()
        if (abstractsConfigData.success && abstractsConfigData.data) {
          setAbstractsConfig(abstractsConfigData.data)
        }

        // Fetch abstract
        const abstractRes = await fetch(`/api/reviewer/abstracts/${abstractId}`)
        const abstractData = await abstractRes.json()
        
        if (abstractData.success && abstractData.data) {
          setAbstract(abstractData.data)
          
          // Pre-fill if already reviewed
          if (abstractData.data.existingReview) {
            const review = abstractData.data.existingReview
            if (review.scores) {
              setScores(review.scores)
            }
            setDecision(review.decision === 'accept' ? 'approve' : review.decision)
            if (review.approvedFor) setApprovedFor(review.approvedFor)
            if (review.rejectionComment) setRejectionComment(review.rejectionComment)
          }
        } else {
          toast.error('Abstract not found')
          router.push('/reviewer')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load abstract')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [abstractId, router])

  // Calculate total score
  const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0)
  const maxTotalScore = config.scoringCriteria.filter(c => c.enabled).length * 10

  // Handle score change
  const handleScoreChange = (key: string, value: string) => {
    setScores(prev => ({ ...prev, [key]: parseInt(value) }))
  }

  // Validate form
  const validateForm = () => {
    // Check all scores are filled
    const enabledCriteria = config.scoringCriteria.filter(c => c.enabled)
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

    if (decision === 'reject' && config.requireRejectionComment && !rejectionComment.trim()) {
      toast.error('Please provide a comment for rejection')
      return false
    }

    return true
  }

  // Submit review
  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/reviewer/abstracts/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abstractId: abstract?._id,
          decision,
          approvedFor: decision === 'approve' ? approvedFor : undefined,
          rejectionComment: decision === 'reject' ? rejectionComment : undefined,
          scores
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          decision === 'approve' 
            ? '✅ Abstract approved successfully!' 
            : '❌ Abstract rejected successfully!'
        )
        // Redirect back to abstracts list
        router.push('/reviewer')
      } else {
        toast.error(data.message || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  // Download file
  const handleDownload = async () => {
    if (!abstract?.initial?.file?.blobUrl) return
    
    try {
      const response = await fetch(`/api/abstracts/download/${abstract._id}?type=initial`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = abstract.initial.file.originalName || 'abstract.pdf'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('File downloaded')
      }
    } catch {
      toast.error('Download failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading abstract...</p>
        </div>
      </div>
    )
  }

  if (!abstract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Abstract not found</p>
          <Button onClick={() => router.push('/reviewer')} className="mt-4">
            Back to Abstracts
          </Button>
        </div>
      </div>
    )
  }

  const isAlreadyReviewed = !!abstract.existingReview

  return (
    <div 
      className="min-h-screen pb-8"
      style={{
        background: 'linear-gradient(135deg, #e8eef5 0%, #f0f4f8 25%, #f8f0f5 50%, #f0f4f8 75%, #e8eef5 100%)',
      }}
    >
      {/* Header */}
      <div 
        className="w-full py-4 px-6 text-white shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${conferenceConfig.theme.primary} 0%, ${conferenceConfig.theme.secondary} 100%)` 
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/reviewer')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Abstracts
            </Button>
            <Separator orientation="vertical" className="h-6 bg-white/30" />
            <span className="font-mono text-sm opacity-80">{abstract.abstractId}</span>
          </div>
          <div className="text-right">
            <p className="font-semibold">{conferenceConfig.shortName}</p>
            <p className="text-sm opacity-80">Abstract Review</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Already Reviewed Banner */}
        {isAlreadyReviewed && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-800">This abstract has already been reviewed</p>
                  <p className="text-sm text-amber-700">
                    Decision: {abstract.existingReview?.decision === 'approve' ? 'Approved' : 'Rejected'}
                    {abstract.existingReview?.approvedFor && ` for ${abstract.existingReview.approvedFor.replace('-', ' ')}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Author Details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Author Details
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideAuthorDetails(!hideAuthorDetails)}
                className="text-gray-500"
              >
                {hideAuthorDetails ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                {hideAuthorDetails ? 'Show' : 'Hide'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {hideAuthorDetails ? (
              <p className="text-gray-500 italic">Author details hidden (Blind Review Mode)</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-sm">Name</Label>
                  <p className="font-medium">
                    {abstract.userId?.profile?.title} {abstract.userId?.profile?.firstName} {abstract.userId?.profile?.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Email</Label>
                  <p className="font-medium">{abstract.userId?.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Institution</Label>
                  <p className="font-medium">{abstract.userId?.profile?.institution || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Registration ID</Label>
                  <p className="font-mono">{abstract.userId?.registration?.registrationId || 'N/A'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Co-Authors */}
        {abstract.authors && abstract.authors.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  Co-Authors
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHideCoAuthors(!hideCoAuthors)}
                  className="text-gray-500"
                >
                  {hideCoAuthors ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                  {hideCoAuthors ? 'Show' : 'Hide'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hideCoAuthors ? (
                <p className="text-gray-500 italic">Co-authors hidden (Blind Review Mode)</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {abstract.authors.map((author, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                      {author}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Abstract Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Abstract Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-500 text-sm">Category</Label>
                <p className="font-medium capitalize">{abstract.submittingFor || abstract.track || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-gray-500 text-sm">Abstract Type</Label>
                <Badge variant="outline" className="mt-1">
                  <Award className="w-3 h-3 mr-1" />
                  {abstract.submissionCategory?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-500 text-sm">Topic</Label>
                <p className="font-medium">{abstract.submissionTopic || 'N/A'}</p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-gray-500 text-sm">Abstract Title</Label>
              <h2 className="text-xl font-semibold mt-1">{abstract.title}</h2>
            </div>

            {/* Abstract Content Sections */}
            <div className="grid grid-cols-1 gap-4 mt-4">
              {abstract.initial?.introduction && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-gray-600 font-semibold">Introduction</Label>
                  <p className="mt-2 text-gray-800 whitespace-pre-wrap">{abstract.initial.introduction}</p>
                </div>
              )}
              
              {abstract.initial?.methods && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-gray-600 font-semibold">Methods</Label>
                  <p className="mt-2 text-gray-800 whitespace-pre-wrap">{abstract.initial.methods}</p>
                </div>
              )}
              
              {abstract.initial?.results && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <Label className="text-blue-700 font-semibold">Results *</Label>
                  <p className="mt-2 text-gray-800 whitespace-pre-wrap">{abstract.initial.results}</p>
                </div>
              )}
              
              {abstract.initial?.conclusion && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <Label className="text-blue-700 font-semibold">Conclusion *</Label>
                  <p className="mt-2 text-gray-800 whitespace-pre-wrap">{abstract.initial.conclusion}</p>
                </div>
              )}

              {/* Fallback to notes if structured content not available */}
              {!abstract.initial?.introduction && !abstract.initial?.methods && abstract.initial?.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-gray-600 font-semibold">Abstract Content</Label>
                  <p className="mt-2 text-gray-800 whitespace-pre-wrap">{abstract.initial.notes}</p>
                </div>
              )}
            </div>

            {/* File Download & Preview */}
            {abstract.initial?.file && (
              <div className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Abstract File
                  </Button>
                  {abstract.initial.file.blobUrl && (
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(abstract.initial.file?.blobUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                  )}
                </div>

                {/* Inline Document Preview */}
                {abstract.initial.file.blobUrl && (
                  <div className="mt-4">
                    <Label className="text-gray-600 font-semibold mb-2 block">Document Preview</Label>
                    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white" style={{ height: '500px' }}>
                      <iframe
                        src={getPreviewUrl(abstract.initial.file.blobUrl, abstract.initial.file.originalName) || undefined}
                        className="w-full h-full border-0"
                        title="Abstract Document Preview"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Scoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5" />
              Review Score
              {config.showTotalScore && (
                <Badge variant="secondary" className="ml-auto text-base">
                  Total: {totalScore} / {maxTotalScore}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.scoringCriteria.filter(c => c.enabled).map((criteria, idx) => (
              <div key={criteria.key} className="flex items-center justify-between gap-4">
                <Label className="flex-1">
                  {idx + 1}) {criteria.label} - {criteria.maxScore} Marks
                </Label>
                <Select
                  value={scores[criteria.key]?.toString() || ''}
                  onValueChange={(value) => handleScoreChange(criteria.key, value)}
                  disabled={isAlreadyReviewed}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Score" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Decision */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Decision</Label>
              <Select
                value={decision}
                onValueChange={(value: 'approve' | 'reject') => {
                  setDecision(value)
                  if (value === 'approve') setRejectionComment('')
                  if (value === 'reject') setApprovedFor('')
                }}
                disabled={isAlreadyReviewed}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
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
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <Label className="text-green-800">Approved For</Label>
                <Select
                  value={approvedFor}
                  onValueChange={setApprovedFor}
                  disabled={isAlreadyReviewed}
                >
                  <SelectTrigger className="w-full md:w-80 mt-2">
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
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <Label className="text-red-800">
                  Comment to Author {config.requireRejectionComment && <span className="text-red-600">*</span>}
                </Label>
                <Textarea
                  placeholder="Please provide feedback for the author explaining the rejection..."
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                  disabled={isAlreadyReviewed}
                  className="mt-2 min-h-[120px]"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        {!isAlreadyReviewed && (
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/reviewer')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !decision}
              className="min-w-[200px]"
              style={{ 
                background: decision === 'approve' 
                  ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                  : decision === 'reject'
                  ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                  : `linear-gradient(135deg, ${conferenceConfig.theme.primary} 0%, ${conferenceConfig.theme.secondary} 100%)`
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {decision === 'approve' && <CheckCircle className="w-4 h-4 mr-2" />}
                  {decision === 'reject' && <XCircle className="w-4 h-4 mr-2" />}
                  Submit Review
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
