"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Input } from "@/conference-backend-core/components/ui/input"
import { Label } from "@/conference-backend-core/components/ui/label"
import { Textarea } from "@/conference-backend-core/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/conference-backend-core/components/ui/select"
import { Checkbox } from "@/conference-backend-core/components/ui/checkbox"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import { 
  Mail, 
  Users, 
  Send,
  Filter,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  X
} from "lucide-react"
import { useToast } from "@/conference-backend-core/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/conference-backend-core/components/ui/dialog"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

interface Recipient {
  _id: string
  email: string
  name: string
  registrationType: string
  registrationStatus: string
}

interface EmailPreview {
  subject: string
  content: string
  recipientCount: number
  recipients: string[]
}

export function BulkEmailForm() {
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [filters, setFilters] = useState({
    registrationType: "all",
    registrationStatus: "all",
    searchTerm: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null)
  const [sendResult, setSendResult] = useState<{
    success: boolean
    sent: number
    failed: number
    errors: string[]
  } | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchRecipients()
  }, [])

  useEffect(() => {
    filterRecipients()
  }, [recipients, filters])

  const fetchRecipients = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/recipients")
      const data = await response.json()

      if (data.success) {
        setRecipients(data.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch recipients",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Recipients fetch error:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching recipients",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterRecipients = () => {
    let filtered = [...recipients]

    // Filter by registration type
    if (filters.registrationType !== "all") {
      filtered = filtered.filter(r => r.registrationType === filters.registrationType)
    }

    // Filter by registration status
    if (filters.registrationStatus !== "all") {
      filtered = filtered.filter(r => r.registrationStatus === filters.registrationStatus)
    }

    // Filter by search term
    if (filters.searchTerm) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    // Update selected recipients to only include filtered ones
    setSelectedRecipients(prev => prev.filter(id => filtered.some(r => r._id === id)))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filteredIds = getFilteredRecipients().map(r => r._id)
      setSelectedRecipients(filteredIds)
    } else {
      setSelectedRecipients([])
    }
  }

  const handleRecipientToggle = (recipientId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecipients(prev => [...prev, recipientId])
    } else {
      setSelectedRecipients(prev => prev.filter(id => id !== recipientId))
    }
  }

  const getFilteredRecipients = () => {
    let filtered = [...recipients]

    if (filters.registrationType !== "all") {
      filtered = filtered.filter(r => r.registrationType === filters.registrationType)
    }

    if (filters.registrationStatus !== "all") {
      filtered = filtered.filter(r => r.registrationStatus === filters.registrationStatus)
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const getSelectedRecipientsData = () => {
    return recipients.filter(r => selectedRecipients.includes(r._id))
  }

  const handlePreview = () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both subject and content",
        variant: "destructive"
      })
      return
    }

    if (selectedRecipients.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one recipient",
        variant: "destructive"
      })
      return
    }

    const selectedData = getSelectedRecipientsData()
    setEmailPreview({
      subject,
      content,
      recipientCount: selectedRecipients.length,
      recipients: selectedData.map(r => `${r.name} (${r.email})`)
    })
    setIsPreviewOpen(true)
  }

  const handleSendEmail = async () => {
    if (!subject.trim() || !content.trim() || selectedRecipients.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields and select recipients",
        variant: "destructive"
      })
      return
    }

    setIsSending(true)
    setIsPreviewOpen(false)

    try {
      const selectedData = getSelectedRecipientsData()
      const response = await fetch("/api/admin/bulk-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subject,
          content,
          recipients: selectedData.map(r => r.email),
          senderName: `${conferenceConfig.shortName} Team`
        })
      })

      const data = await response.json()

      if (data.success) {
        setSendResult({
          success: true,
          sent: data.sent || selectedRecipients.length,
          failed: data.failed || 0,
          errors: data.errors || []
        })
        
        toast({
          title: "Emails Sent Successfully",
          description: `Sent ${data.sent || selectedRecipients.length} emails successfully`
        })

        // Reset form
        setSubject("")
        setContent("")
        setSelectedRecipients([])
      } else {
        setSendResult({
          success: false,
          sent: 0,
          failed: selectedRecipients.length,
          errors: [data.message || "Failed to send emails"]
        })

        toast({
          title: "Email Sending Failed",
          description: data.message || "Failed to send bulk email",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Bulk email error:", error)
      setSendResult({
        success: false,
        sent: 0,
        failed: selectedRecipients.length,
        errors: ["An unexpected error occurred"]
      })

      toast({
        title: "Error",
        description: "An error occurred while sending emails",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "regular": return "Regular"
      case "student": return "Student"
      case "international": return "International"
      case "faculty": return "Faculty"
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const filteredRecipients = getFilteredRecipients()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Email Composition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-500" />
            Compose Bulk Email
          </CardTitle>
          <CardDescription>
            Send emails to multiple conference registrants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Email Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your email message here..."
              rows={8}
              disabled={isSending}
            />
            <p className="text-xs text-gray-500">
              HTML tags are supported. The email will be automatically styled with conference branding.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recipient Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#f0f3f8]0" />
                Select Recipients ({selectedRecipients.length} selected)
              </CardTitle>
              <CardDescription>
                Choose who will receive this email
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!subject.trim() || !content.trim() || selectedRecipients.length === 0 || isSending}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={!subject.trim() || !content.trim() || selectedRecipients.length === 0 || isSending}
                className="bg-gradient-to-r from-[#f0f3f8]0 to-blue-700 hover:from-[#25406b] hover:to-blue-800 flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-3 w-3" />
                Search
              </Label>
              <Input
                placeholder="Search by name or email..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                disabled={isSending}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Registration Type</Label>
              <Select 
                value={filters.registrationType} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, registrationType: value }))}
                disabled={isSending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select 
                value={filters.registrationStatus} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, registrationStatus: value }))}
                disabled={isSending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Select</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(true)}
                  disabled={filteredRecipients.length === 0 || isSending}
                >
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(false)}
                  disabled={selectedRecipients.length === 0 || isSending}
                >
                  None
                </Button>
              </div>
            </div>
          </div>

          {/* Recipients List */}
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
              <p className="text-gray-600 mt-2">Loading recipients...</p>
            </div>
          ) : filteredRecipients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recipients found matching your criteria.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  Showing {filteredRecipients.length} recipients
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedRecipients.length === filteredRecipients.length && filteredRecipients.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    disabled={isSending}
                  />
                  <Label className="text-sm">Select all visible</Label>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg">
                {filteredRecipients.map((recipient) => (
                  <div key={recipient._id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedRecipients.includes(recipient._id)}
                        onCheckedChange={(checked) => handleRecipientToggle(recipient._id, checked as boolean)}
                        disabled={isSending}
                      />
                      <div>
                        <p className="font-medium">{recipient.name}</p>
                        <p className="text-sm text-gray-600">{recipient.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {getTypeLabel(recipient.registrationType)}
                      </Badge>
                      <Badge className={getStatusColor(recipient.registrationStatus)}>
                        {recipient.registrationStatus.charAt(0).toUpperCase() + recipient.registrationStatus.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Result */}
      {sendResult && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${sendResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {sendResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              Email Send Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{sendResult.sent}</div>
                <div className="text-sm text-green-700">Successfully Sent</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{sendResult.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>

            {sendResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Errors encountered:</p>
                    <ul className="list-disc list-inside text-sm">
                      {sendResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setSendResult(null)}
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Review your email before sending to {emailPreview?.recipientCount} recipients
            </DialogDescription>
          </DialogHeader>
          
          {emailPreview && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Subject:</Label>
                <p className="font-medium">{emailPreview.subject}</p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-gray-600">Content:</Label>
                <div className="mt-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div dangerouslySetInnerHTML={{ __html: emailPreview.content.replace(/\n/g, '<br>') }} />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Recipients ({emailPreview.recipientCount}):
                </Label>
                <div className="mt-2 max-h-32 overflow-y-auto text-sm text-gray-600">
                  {emailPreview.recipients.slice(0, 10).map((recipient, index) => (
                    <div key={index}>{recipient}</div>
                  ))}
                  {emailPreview.recipients.length > 10 && (
                    <div className="text-gray-500 italic">
                      ... and {emailPreview.recipients.length - 10} more
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Edit
                </Button>
                <Button
                  onClick={handleSendEmail}
                  className="bg-gradient-to-r from-[#f0f3f8]0 to-blue-700 hover:from-[#25406b] hover:to-blue-800"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}