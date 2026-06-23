"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/conference-backend-core/components/ui/card'
import { Label } from '@/conference-backend-core/components/ui/label'
import { Switch } from '@/conference-backend-core/components/ui/switch'
import { Input } from '@/conference-backend-core/components/ui/input'
import { Textarea } from '@/conference-backend-core/components/ui/textarea'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { Separator } from '@/conference-backend-core/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/conference-backend-core/components/ui/dialog'
import { 
  ArrowLeft, Save, Loader2, Eye, EyeOff, Layout, 
  Award, CheckCircle, Settings, Mail, Send, Edit, FileText
} from 'lucide-react'
import { toast } from 'sonner'

interface PendingEmail {
  abstractId: string
  type: 'acceptance' | 'rejection'
  createdAt: string
}

interface ReviewerConfig {
  blindReview: boolean
  reviewerLayout: 'split-screen' | 'new-tab'
  approvalOptions: Array<{ key: string; label: string; enabled: boolean }>
  scoringCriteria: Array<{ key: string; label: string; maxScore: number; enabled: boolean }>
  requireRejectionComment: boolean
  allowReviewEdit: boolean
  showTotalScore: boolean
  emailNotificationMode: 'immediate' | 'manual'
  pendingEmailsCount?: number
  pendingEmails?: PendingEmail[]
  // Email templates
  acceptanceEmailSubject?: string
  acceptanceEmailBody?: string
  rejectionEmailSubject?: string
  rejectionEmailBody?: string
}

const defaultConfig: ReviewerConfig = {
  blindReview: false,
  reviewerLayout: 'new-tab',
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
  allowReviewEdit: false,
  showTotalScore: true,
  emailNotificationMode: 'immediate',
  pendingEmailsCount: 0,
  pendingEmails: [],
  acceptanceEmailSubject: 'Congratulations! Your Abstract {abstractId} Has Been Accepted - ISSH Midterm CME 2026',
  acceptanceEmailBody: `Dear {name},

Congratulations! We are pleased to inform you that your abstract titled "{title}" (ID: {abstractId}) has been ACCEPTED for presentation at ISSH Midterm CME 2026.

Presentation Type: {approvedFor}

Please log in to your dashboard to view the details and complete any required next steps for your final submission.

Dashboard: {dashboardUrl}

Best regards,
ISSH 2026 Organizing Committee`,
  rejectionEmailSubject: 'Update on Your Abstract Submission {abstractId} - ISSH Midterm CME 2026',
  rejectionEmailBody: `Dear {name},

Thank you for submitting your abstract titled "{title}" (ID: {abstractId}) to ISSH Midterm CME 2026.

After careful review by our scientific committee, we regret to inform you that your abstract has not been selected for presentation at this year's conference.

We appreciate your interest in ISSH Midterm CME 2026 and encourage you to submit again in the future.

Best regards,
ISSH 2026 Organizing Committee`
}

export default function ReviewerSettingsPage() {
  const router = useRouter()
  const [config, setConfig] = useState<ReviewerConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingEmails, setSendingEmails] = useState(false)
  const [showPendingEmailsModal, setShowPendingEmailsModal] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<'acceptance' | 'rejection'>('acceptance')

  // Fetch config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/reviewer/config')
        const data = await response.json()
        if (data.success && data.data) {
          setConfig({ ...defaultConfig, ...data.data })
        }
      } catch (error) {
        console.error('Error fetching config:', error)
        toast.error('Failed to load configuration')
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  // Save config
  const handleSave = async () => {
    setSaving(true)
    try {
      console.log('Saving config:', {
        emailNotificationMode: config.emailNotificationMode,
        blindReview: config.blindReview
      })
      
      const response = await fetch('/api/reviewer/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      console.log('Save response:', data)
      
      if (data.success) {
        toast.success('Reviewer settings saved successfully')
        // Update local state with returned data to ensure sync
        if (data.data) {
          setConfig(prev => ({ ...prev, ...data.data }))
        }
      } else {
        toast.error(data.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Toggle approval option
  const toggleApprovalOption = (key: string) => {
    setConfig(prev => ({
      ...prev,
      approvalOptions: prev.approvalOptions.map(opt =>
        opt.key === key ? { ...opt, enabled: !opt.enabled } : opt
      )
    }))
  }

  // Toggle scoring criteria
  const toggleScoringCriteria = (key: string) => {
    setConfig(prev => ({
      ...prev,
      scoringCriteria: prev.scoringCriteria.map(crit =>
        crit.key === key ? { ...crit, enabled: !crit.enabled } : crit
      )
    }))
  }

  // Update scoring criteria label
  const updateCriteriaLabel = (key: string, label: string) => {
    setConfig(prev => ({
      ...prev,
      scoringCriteria: prev.scoringCriteria.map(crit =>
        crit.key === key ? { ...crit, label } : crit
      )
    }))
  }

  // Send all pending emails
  const sendPendingEmails = async () => {
    setSendingEmails(true)
    try {
      const response = await fetch('/api/admin/abstracts/send-pending-emails', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        toast.success(`${data.sentCount} emails sent successfully`)
        // Refresh config to update pending count
        const configResponse = await fetch('/api/reviewer/config')
        const configData = await configResponse.json()
        if (configData.success && configData.data) {
          setConfig({ ...defaultConfig, ...configData.data })
        }
      } else {
        toast.error(data.message || 'Failed to send emails')
      }
    } catch (error) {
      console.error('Error sending emails:', error)
      toast.error('Failed to send pending emails')
    } finally {
      setSendingEmails(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Reviewer Settings</h1>
              <p className="text-gray-500">Configure the reviewer portal behavior</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Changes</>
            )}
          </Button>
        </div>

        {/* Blind Review */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {config.blindReview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              Blind Review Mode
            </CardTitle>
            <CardDescription>
              When enabled, reviewer cannot see author details (name, email, institution, co-authors)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Blind Review</Label>
                <p className="text-sm text-gray-500">Hide all author information from reviewers</p>
              </div>
              <Switch
                checked={config.blindReview}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, blindReview: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Layout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5" />
              Review Layout
            </CardTitle>
            <CardDescription>
              Choose how abstracts open for review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setConfig(prev => ({ ...prev, reviewerLayout: 'new-tab' }))}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  config.reviewerLayout === 'new-tab'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className={`w-5 h-5 ${config.reviewerLayout === 'new-tab' ? 'text-blue-600' : 'text-gray-300'}`} />
                  <span className="font-semibold">New Page</span>
                </div>
                <p className="text-sm text-gray-500">
                  Opens abstract in a dedicated review page with full details
                </p>
              </div>
              <div
                onClick={() => setConfig(prev => ({ ...prev, reviewerLayout: 'split-screen' }))}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  config.reviewerLayout === 'split-screen'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className={`w-5 h-5 ${config.reviewerLayout === 'split-screen' ? 'text-blue-600' : 'text-gray-300'}`} />
                  <span className="font-semibold">Split Screen</span>
                </div>
                <p className="text-sm text-gray-500">
                  Shows abstract details in a side panel (legacy mode)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Notification Settings
            </CardTitle>
            <CardDescription>
              Configure when review decision emails are sent to authors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setConfig(prev => ({ ...prev, emailNotificationMode: 'immediate' }))}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  config.emailNotificationMode === 'immediate'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className={`w-5 h-5 ${config.emailNotificationMode === 'immediate' ? 'text-blue-600' : 'text-gray-300'}`} />
                  <span className="font-semibold">Immediate</span>
                </div>
                <p className="text-sm text-gray-500">
                  Send email notification immediately after review decision
                </p>
              </div>
              <div
                onClick={() => setConfig(prev => ({ ...prev, emailNotificationMode: 'manual' }))}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  config.emailNotificationMode === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className={`w-5 h-5 ${config.emailNotificationMode === 'manual' ? 'text-blue-600' : 'text-gray-300'}`} />
                  <span className="font-semibold">Manual / Bulk</span>
                </div>
                <p className="text-sm text-gray-500">
                  Queue emails and send them later in bulk
                </p>
              </div>
            </div>

            {config.emailNotificationMode === 'manual' && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-amber-800">Pending Emails</p>
                    <p className="text-sm text-amber-600">
                      {config.pendingEmailsCount || 0} emails waiting to be sent
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(config.pendingEmailsCount || 0) > 0 && (
                      <Button 
                        variant="outline"
                        onClick={() => setShowPendingEmailsModal(true)}
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        <Eye className="w-4 h-4 mr-2" /> View Queue
                      </Button>
                    )}
                    <Button 
                      onClick={sendPendingEmails} 
                      disabled={sendingEmails || !config.pendingEmailsCount}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {sendingEmails ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" /> Send All Pending</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Email Templates
            </CardTitle>
            <CardDescription>
              Customize the email templates sent to authors. Use placeholders: {'{name}'}, {'{title}'}, {'{abstractId}'}, {'{approvedFor}'}, {'{dashboardUrl}'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Acceptance Email Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-green-700">Acceptance Email Template</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setEditingTemplate('acceptance'); setShowTemplateEditor(true) }}
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Subject:</p>
                <p className="text-sm text-green-700 mb-2">{config.acceptanceEmailSubject}</p>
                <p className="text-sm font-medium text-green-800 mb-1">Preview:</p>
                <p className="text-xs text-green-600 whitespace-pre-line line-clamp-3">{config.acceptanceEmailBody}</p>
              </div>
            </div>

            <Separator />

            {/* Rejection Email Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-red-700">Rejection Email Template</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setEditingTemplate('rejection'); setShowTemplateEditor(true) }}
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">Subject:</p>
                <p className="text-sm text-red-700 mb-2">{config.rejectionEmailSubject}</p>
                <p className="text-sm font-medium text-red-800 mb-1">Preview:</p>
                <p className="text-xs text-red-600 whitespace-pre-line line-clamp-3">{config.rejectionEmailBody}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Approval Options
            </CardTitle>
            <CardDescription>
              Presentation types available when approving an abstract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {config.approvalOptions.map((option) => (
              <div key={option.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={option.enabled}
                    onCheckedChange={() => toggleApprovalOption(option.key)}
                  />
                  <span className={option.enabled ? 'text-gray-900' : 'text-gray-400'}>
                    {option.label}
                  </span>
                </div>
                <Badge variant={option.enabled ? 'default' : 'secondary'}>
                  {option.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Scoring Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Scoring Criteria
            </CardTitle>
            <CardDescription>
              Configure the review scoring criteria (each out of 10 marks)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {config.scoringCriteria.map((criteria, index) => (
              <div key={criteria.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Switch
                  checked={criteria.enabled}
                  onCheckedChange={() => toggleScoringCriteria(criteria.key)}
                />
                <span className="text-gray-500 w-6">{index + 1})</span>
                <Input
                  value={criteria.label}
                  onChange={(e) => updateCriteriaLabel(criteria.key, e.target.value)}
                  className={`flex-1 ${!criteria.enabled && 'opacity-50'}`}
                  disabled={!criteria.enabled}
                />
                <Badge variant="outline">{criteria.maxScore} marks</Badge>
              </div>
            ))}

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Total Score</Label>
                <p className="text-sm text-gray-500">Display calculated total score to reviewer</p>
              </div>
              <Switch
                checked={config.showTotalScore}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showTotalScore: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Other Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Other Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Rejection Comment</Label>
                <p className="text-sm text-gray-500">Reviewer must provide a comment when rejecting</p>
              </div>
              <Switch
                checked={config.requireRejectionComment}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, requireRejectionComment: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Review Edit</Label>
                <p className="text-sm text-gray-500">Allow reviewers to edit their submitted reviews</p>
              </div>
              <Switch
                checked={config.allowReviewEdit}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, allowReviewEdit: checked }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Emails Modal */}
      <Dialog open={showPendingEmailsModal} onOpenChange={setShowPendingEmailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pending Email Queue</DialogTitle>
            <DialogDescription>
              These emails will be sent when you click "Send All Pending"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {config.pendingEmails && config.pendingEmails.length > 0 ? (
              config.pendingEmails.map((email, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    email.type === 'acceptance' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={email.type === 'acceptance' ? 'default' : 'destructive'}>
                        {email.type === 'acceptance' ? 'Acceptance' : 'Rejection'}
                      </Badge>
                      <span className="font-medium">{email.abstractId}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(email.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No pending emails in queue</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPendingEmailsModal(false)}>
              Close
            </Button>
            <Button 
              onClick={() => { sendPendingEmails(); setShowPendingEmailsModal(false) }} 
              disabled={sendingEmails || !config.pendingEmailsCount}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {sendingEmails ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send All ({config.pendingEmailsCount || 0})</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Template Editor Modal */}
      <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editingTemplate === 'acceptance' ? 'Acceptance' : 'Rejection'} Email Template
            </DialogTitle>
            <DialogDescription>
              Customize the email sent to authors. Available placeholders: {'{name}'}, {'{title}'}, {'{abstractId}'}, {'{approvedFor}'}, {'{dashboardUrl}'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-subject">Subject</Label>
              <Input
                id="template-subject"
                value={editingTemplate === 'acceptance' ? config.acceptanceEmailSubject : config.rejectionEmailSubject}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  [editingTemplate === 'acceptance' ? 'acceptanceEmailSubject' : 'rejectionEmailSubject']: e.target.value
                }))}
                placeholder="Email subject..."
              />
            </div>
            <div>
              <Label htmlFor="template-body">Email Body</Label>
              <Textarea
                id="template-body"
                value={editingTemplate === 'acceptance' ? config.acceptanceEmailBody : config.rejectionEmailBody}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  [editingTemplate === 'acceptance' ? 'acceptanceEmailBody' : 'rejectionEmailBody']: e.target.value
                }))}
                rows={12}
                placeholder="Email body..."
              />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Available Placeholders:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <span><code>{'{name}'}</code> - Author's name</span>
                <span><code>{'{title}'}</code> - Abstract title</span>
                <span><code>{'{abstractId}'}</code> - Abstract ID</span>
                <span><code>{'{approvedFor}'}</code> - Presentation type</span>
                <span><code>{'{dashboardUrl}'}</code> - Dashboard link</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateEditor(false)}>
              Cancel
            </Button>
            <Button onClick={() => { handleSave(); setShowTemplateEditor(false) }}>
              <Save className="w-4 h-4 mr-2" /> Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
