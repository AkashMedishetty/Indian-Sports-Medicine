'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { useToast } from '../ui/use-toast'
import { 
  Mail, Send, Award, Users, Filter, 
  CheckCircle, XCircle, RefreshCw, Eye, Download 
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Recipient {
  _id: string
  email: string
  name: string
  registrationId: string
  registrationType: string
  status: string
}

export function BulkCertificateEmailer() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [filters, setFilters] = useState({
    status: 'paid',
    category: 'all',
    hasCertificate: 'no'
  })
  const [emailContent, setEmailContent] = useState({
    subject: 'Your Certificate of Participation - NEUROVASCON 2026',
    message: 'Dear {name},\n\nThank you for participating in NEUROVASCON 2026. Please find your certificate of participation attached to this email.\n\nBest regards,\nNEUROVASCON 2026 Team'
  })
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 })

  useEffect(() => {
    loadRecipients()
  }, [filters])

  const loadRecipients = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      const response = await fetch(`/api/admin/certificates/recipients?${queryParams.toString()}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setRecipients(result.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading recipients:', error)
      toast({
        title: "Error",
        description: "Failed to load recipients",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateAndSendCertificates = async () => {
    if (selectedRecipients.length === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one recipient",
        variant: "destructive"
      })
      return
    }

    try {
      setSending(true)
      setProgress({ sent: 0, failed: 0, total: selectedRecipients.length })

      const response = await fetch('/api/admin/certificates/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIds: selectedRecipients,
          emailSubject: emailContent.subject,
          emailMessage: emailContent.message
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setProgress(result.data.progress)
          toast({
            title: "Certificates Sent Successfully",
            description: `${result.data.progress.sent} certificates sent, ${result.data.progress.failed} failed`
          })
          
          // Refresh recipients
          loadRecipients()
          setSelectedRecipients([])
        }
      } else {
        throw new Error('Failed to send certificates')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send certificates. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([])
    } else {
      setSelectedRecipients(recipients.map(r => r._id))
    }
  }

  return (
    <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Bulk Certificate Emailer
            </CardTitle>
            <CardDescription className="dark:text-slate-400">
              Generate and send certificates to multiple participants
            </CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {recipients.length} Eligible
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Filter className="h-4 w-4" />
              Payment Status
            </Label>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-900 dark:text-white">Category</Label>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="cvsi-member">CVSI Member</SelectItem>
                <SelectItem value="non-member">Non Member</SelectItem>
                <SelectItem value="resident">Resident/Fellow</SelectItem>
                <SelectItem value="international">International</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-900 dark:text-white">Certificate Status</Label>
            <Select value={filters.hasCertificate} onValueChange={(value) => setFilters(prev => ({ ...prev, hasCertificate: value }))}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Already Sent</SelectItem>
                <SelectItem value="no">Not Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Email Content */}
        <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Email Content</h3>
          
          <div className="space-y-2">
            <Label className="text-slate-900 dark:text-white">Subject</Label>
            <Input
              value={emailContent.subject}
              onChange={(e) => setEmailContent(prev => ({ ...prev, subject: e.target.value }))}
              className="bg-white dark:bg-slate-900"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-900 dark:text-white">Message</Label>
            <Textarea
              value={emailContent.message}
              onChange={(e) => setEmailContent(prev => ({ ...prev, message: e.target.value }))}
              rows={5}
              className="bg-white dark:bg-slate-900"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Available variables: {'{name}'}, {'{registrationId}'}, {'{conference}'}
            </p>
          </div>
        </div>

        {/* Recipients List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Recipients ({selectedRecipients.length}/{recipients.length})
            </h3>
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {selectedRecipients.length === recipients.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              {recipients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">No eligible recipients found</p>
                </div>
              ) : (
                recipients.map((recipient, index) => (
                  <motion.div
                    key={recipient._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      selectedRecipients.includes(recipient._id)
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={selectedRecipients.includes(recipient._id)}
                        onCheckedChange={() => toggleRecipient(recipient._id)}
                      />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{recipient.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{recipient.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {recipient.registrationId}
                      </Badge>
                      <Badge className="text-xs capitalize">
                        {recipient.registrationType.replace(/-/g, ' ')}
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {sending && (
          <div className="space-y-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-900 dark:text-blue-100">Sending certificates...</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {progress.sent}/{progress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.sent / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={loadRecipients}
            disabled={sending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh List
          </Button>
          <Button
            onClick={generateAndSendCertificates}
            disabled={sending || selectedRecipients.length === 0}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
          >
            {sending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Generate & Send Certificates ({selectedRecipients.length})
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
