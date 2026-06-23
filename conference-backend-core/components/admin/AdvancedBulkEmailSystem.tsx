'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { useToast } from '../ui/use-toast'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import {
  Mail, Send, Users, Filter, Eye, Loader2, CheckCircle, XCircle,
  Clock, Award, FileText, Bell, History, Trash2, Download, RefreshCw
} from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'custom' | 'badge' | 'certificate' | 'reminder' | 'announcement' | 'workshop' | 'payment' | 'abstract'
}

interface Recipient {
  _id: string
  email: string
  name: string
  registrationId: string
  registrationType: string
  registrationStatus: string
  workshop?: string
}

interface SendProgress {
  total: number
  sent: number
  failed: number
  current: string
  percentage: number
}

interface EmailHistoryItem {
  _id: string
  subject: string
  sentAt: string
  recipientCount: number
  successCount: number
  failureCount: number
  template: string
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'custom',
    name: 'Custom Message',
    subject: '',
    content: '',
    type: 'custom'
  },
  {
    id: 'badge',
    name: 'Badge Ready',
    subject: 'Your Event Badge is Ready!',
    content: `Dear {name},

Your event badge for ${conferenceConfig.name} is now ready!

You can download your badge from your dashboard:
1. Log in to your account
2. Go to your dashboard
3. Click on "Download Badge"

Your badge contains:
- Your registration ID: {registrationId}
- QR code for quick check-in
- Event details

Please print your badge or save it to your mobile device before arriving at the venue.

See you at the conference!

Best regards,
${conferenceConfig.shortName} Team`,
    type: 'badge'
  },
  {
    id: 'certificate',
    name: 'Certificate Available',
    subject: 'Your Participation Certificate is Available',
    content: `Dear {name},

Thank you for participating in ${conferenceConfig.name}!

Your certificate of participation is now available for download.

To download your certificate:
1. Log in to your dashboard
2. Navigate to the "Certificate" section
3. Click "Download as PDF" or "Download as PNG"

This certificate serves as official proof of your attendance and participation in the conference.

Thank you for being part of this event!

Warm regards,
${conferenceConfig.shortName} Organizing Committee`,
    type: 'certificate'
  },
  {
    id: 'reminder',
    name: 'Event Reminder',
    subject: `Reminder: ${conferenceConfig.shortName} is Coming Up!`,
    content: `Dear {name},

This is a friendly reminder that ${conferenceConfig.name} is approaching!

Event Details:
- Registration ID: {registrationId}
- Your Category: {category}
- Status: {status}

Important Reminders:
✓ Check-in opens at 8:00 AM
✓ Bring your printed badge or mobile device
✓ Review the conference schedule on our website
✓ Prepare your presentation (if applicable)

Workshop Registration:
${conferenceConfig.features.workshopBooking ? 'Don\'t forget to register for workshops if you haven\'t already!' : ''}

We look forward to seeing you!

Best regards,
${conferenceConfig.shortName} Team`,
    type: 'reminder'
  },
  {
    id: 'announcement',
    name: 'General Announcement',
    subject: `Important Update - ${conferenceConfig.shortName}`,
    content: `Dear {name},

We have an important update regarding ${conferenceConfig.name}.

[Your announcement content here]

For questions or concerns, please contact:
Email: ${conferenceConfig.contact.email}

Thank you for your attention.

Best regards,
${conferenceConfig.shortName} Organizing Committee`,
    type: 'announcement'
  },
  {
    id: 'workshop',
    name: 'Workshop Reminder',
    subject: `Workshop Reminder - ${conferenceConfig.shortName}`,
    content: `Dear {name},

This is a reminder about your registered workshop at ${conferenceConfig.name}!

Workshop: {workshop}
Registration ID: {registrationId}

Workshop Preparation:
✓ Please arrive 15 minutes before the workshop start time
✓ Bring any required materials mentioned in the workshop description
✓ Workshop materials will be provided at the venue
✓ Certificate of attendance will be issued after completion

Important Notes:
- Workshop registration is confirmed
- Seats are limited - please be punctual
- Hands-on sessions require active participation
- Contact us immediately if you cannot attend

We look forward to your participation!

Best regards,
${conferenceConfig.shortName} Workshop Committee`,
    type: 'workshop'
  },
  {
    id: 'payment',
    name: 'Payment Reminder',
    subject: `Payment Reminder - ${conferenceConfig.shortName}`,
    content: `Dear {name},

This is a friendly reminder about your pending payment for ${conferenceConfig.name}.

Registration ID: {registrationId}
Status: PENDING

Action Required:
Please complete your payment to confirm your registration and secure your spot at the conference.

Payment Methods:
- Bank Transfer
- Online Payment Gateway
- UPI Payment

Note: Please include your Registration ID in the payment reference.

If you have already made the payment, please disregard this reminder. Your payment will be verified within 10 business days.

For assistance, contact us at ${conferenceConfig.contact.email}

Best regards,
${conferenceConfig.shortName} Registration Team`,
    type: 'payment'
  },
  {
    id: 'abstract',
    name: 'Abstract Submission Reminder',
    subject: `Abstract Submission Reminder - ${conferenceConfig.shortName}`,
    content: `Dear {name},

This is a reminder about abstract submission for ${conferenceConfig.name}.

Registration ID: {registrationId}

Submission Guidelines:
- Maximum word count: 300 words
- Structured format: Background, Methods, Results, Conclusion
- All abstracts will undergo peer review
- Acceptance notifications will be sent via email

Don't miss this opportunity to present your research!

For questions about abstract submission, contact: ${conferenceConfig.contact.abstractsEmail || conferenceConfig.contact.email}

Best regards,
${conferenceConfig.shortName} Scientific Committee`,
    type: 'abstract'
  }
]

export function AdvancedBulkEmailSystem() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('compose')
  
  // Email composition
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(EMAIL_TEMPLATES[0])
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  
  // Recipients
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    registrationType: 'all',
    registrationStatus: 'all',
    workshop: 'all',
    hasWorkshop: 'all'
  })
  
  // Sending
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState<SendProgress | null>(null)
  
  // History
  const [emailHistory, setEmailHistory] = useState<EmailHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    fetchRecipients()
    if (activeTab === 'history') {
      fetchEmailHistory()
    }
  }, [activeTab])

  const fetchRecipients = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/bulk-email/recipients')
      if (response.ok) {
        const result = await response.json()
        setRecipients(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
      toast({
        title: 'Error',
        description: 'Failed to load recipients',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEmailHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/admin/bulk-email/history')
      if (response.ok) {
        const result = await response.json()
        setEmailHistory(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setSubject(template.subject)
      setContent(template.content)
    }
  }

  const getFilteredRecipients = () => {
    return recipients.filter(r => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        if (!r.name.toLowerCase().includes(searchLower) && 
            !r.email.toLowerCase().includes(searchLower)) {
          return false
        }
      }
      
      // Registration type filter
      if (filters.registrationType !== 'all' && r.registrationType !== filters.registrationType) {
        return false
      }
      
      // Registration status filter
      if (filters.registrationStatus !== 'all' && r.registrationStatus !== filters.registrationStatus) {
        return false
      }
      
      // Workshop filter
      if (filters.workshop !== 'all' && r.workshop !== filters.workshop) {
        return false
      }
      
      // Has workshop filter
      if (filters.hasWorkshop === 'yes' && !r.workshop) {
        return false
      }
      if (filters.hasWorkshop === 'no' && r.workshop) {
        return false
      }
      
      return true
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecipients(getFilteredRecipients().map(r => r._id))
    } else {
      setSelectedRecipients([])
    }
  }

  const handleSendEmail = async () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in subject and content',
        variant: 'destructive'
      })
      return
    }

    if (selectedRecipients.length === 0) {
      toast({
        title: 'No Recipients',
        description: 'Please select at least one recipient',
        variant: 'destructive'
      })
      return
    }

    setIsSending(true)
    setSendProgress({
      total: selectedRecipients.length,
      sent: 0,
      failed: 0,
      current: '',
      percentage: 0
    })

    try {
      const selectedData = recipients.filter(r => selectedRecipients.includes(r._id))
      
      // Send emails in batches with progress tracking
      const batchSize = 10
      let sent = 0
      let failed = 0

      for (let i = 0; i < selectedData.length; i += batchSize) {
        const batch = selectedData.slice(i, i + batchSize)
        
        const response = await fetch('/api/admin/bulk-email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject,
            content,
            recipients: batch.map(r => ({
              _id: r._id,  // User's MongoDB ObjectId for database lookups
              email: r.email,
              name: r.name,
              registrationId: r.registrationId,  // Actual registration ID (NV2026001, etc.)
              category: r.registrationType,
              status: r.registrationStatus
            })),
            template: selectedTemplate.id
          })
        })

        if (response.ok) {
          const result = await response.json()
          sent += result.sent || batch.length
          failed += result.failed || 0
        } else {
          failed += batch.length
        }

        setSendProgress({
          total: selectedData.length,
          sent,
          failed,
          current: batch[0]?.email || '',
          percentage: Math.round(((sent + failed) / selectedData.length) * 100)
        })
      }

      toast({
        title: 'Emails Sent',
        description: `Successfully sent ${sent} emails, ${failed} failed`
      })

      // Reset
      setSelectedRecipients([])
      fetchEmailHistory()

    } catch (error) {
      console.error('Send error:', error)
      toast({
        title: 'Send Failed',
        description: 'Failed to send emails',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
      setTimeout(() => setSendProgress(null), 3000)
    }
  }

  const filteredRecipients = getFilteredRecipients()

  return (
    <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
          <Mail className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
          Advanced Bulk Email System
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Send template-based or custom emails with live progress tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="recipients">Recipients ({selectedRecipients.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose" className="space-y-4 mt-4">
            <div>
              <Label>Email Template</Label>
              <Select value={selectedTemplate.id} onValueChange={handleTemplateChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        {template.type === 'badge' && <Award className="h-4 w-4" />}
                        {template.type === 'certificate' && <FileText className="h-4 w-4" />}
                        {template.type === 'reminder' && <Bell className="h-4 w-4" />}
                        {template.type === 'custom' && <Mail className="h-4 w-4" />}
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Choose a pre-made template or create a custom message
              </p>
            </div>

            <div>
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="mt-1"
                disabled={isSending}
              />
            </div>

            <div>
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Email content..."
                rows={15}
                className="mt-1 font-mono text-sm"
                disabled={isSending}
              />
              <p className="text-xs text-slate-500 mt-1">
                Use variables: {'{name}'}, {'{registrationId}'}, {'{category}'}, {'{status}'}
              </p>
            </div>

            {/* Send Progress */}
            {sendProgress && (
              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sending Emails...</span>
                  <span className="text-sm">{sendProgress.percentage}%</span>
                </div>
                <Progress value={sendProgress.percentage} className="mb-2" />
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 rounded bg-green-100 dark:bg-green-900/20">
                    <div className="font-bold text-green-600">{sendProgress.sent}</div>
                    <div className="text-xs">Sent</div>
                  </div>
                  <div className="text-center p-2 rounded bg-red-100 dark:bg-red-900/20">
                    <div className="font-bold text-red-600">{sendProgress.failed}</div>
                    <div className="text-xs">Failed</div>
                  </div>
                  <div className="text-center p-2 rounded bg-blue-100 dark:bg-blue-900/20">
                    <div className="font-bold text-blue-600">{sendProgress.total - sendProgress.sent - sendProgress.failed}</div>
                    <div className="text-xs">Pending</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSendEmail}
                disabled={isSending || selectedRecipients.length === 0}
                className="flex-1"
                style={{ backgroundColor: conferenceConfig.theme.primary }}
              >
                {isSending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Send to {selectedRecipients.length} Recipients</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Recipients Tab */}
          <TabsContent value="recipients" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <Label className="text-xs">Search</Label>
                <Input
                  placeholder="Name or email..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Registration Type</Label>
                <Select value={filters.registrationType} onValueChange={(v) => setFilters(prev => ({ ...prev, registrationType: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={filters.registrationStatus} onValueChange={(v) => setFilters(prev => ({ ...prev, registrationStatus: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Workshop</Label>
                <Select value={filters.hasWorkshop} onValueChange={(v) => setFilters(prev => ({ ...prev, hasWorkshop: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Has Workshop</SelectItem>
                    <SelectItem value="no">No Workshop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Quick Select</Label>
                <div className="flex gap-1 mt-1">
                  <Button size="sm" variant="outline" onClick={() => handleSelectAll(true)} className="flex-1">All</Button>
                  <Button size="sm" variant="outline" onClick={() => handleSelectAll(false)} className="flex-1">None</Button>
                </div>
              </div>
            </div>

            {/* Recipients List */}
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedRecipients.length === filteredRecipients.length && filteredRecipients.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                  <span className="text-sm font-medium">
                    {filteredRecipients.length} recipients {selectedRecipients.length > 0 && `(${selectedRecipients.length} selected)`}
                  </span>
                </div>
                <Button size="sm" variant="ghost" onClick={fetchRecipients}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </div>
                ) : filteredRecipients.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No recipients found</div>
                ) : (
                  filteredRecipients.map(recipient => (
                    <div key={recipient._id} className="flex items-center justify-between p-3 border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedRecipients.includes(recipient._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRecipients(prev => [...prev, recipient._id])
                            } else {
                              setSelectedRecipients(prev => prev.filter(id => id !== recipient._id))
                            }
                          }}
                        />
                        <div>
                          <p className="font-medium text-sm">{recipient.name}</p>
                          <p className="text-xs text-slate-500">{recipient.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{recipient.registrationType}</Badge>
                        <Badge variant={recipient.registrationStatus === 'paid' ? 'default' : 'secondary'} className="text-xs">
                          {recipient.registrationStatus}
                        </Badge>
                        {recipient.workshop && <Badge variant="outline" className="text-xs">Workshop</Badge>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Email Send History</h3>
              <Button size="sm" variant="outline" onClick={fetchEmailHistory}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {loadingHistory ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            ) : emailHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No email history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {emailHistory.map(item => (
                  <div key={item._id} className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.subject}</h4>
                        <p className="text-sm text-slate-500 mt-1">
                          Template: {item.template} • Sent {new Date(item.sentAt).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-4 w-4" />
                            <span>{item.recipientCount} recipients</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>{item.successCount} sent</span>
                          </div>
                          {item.failureCount > 0 && (
                            <div className="flex items-center gap-1 text-sm text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span>{item.failureCount} failed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
