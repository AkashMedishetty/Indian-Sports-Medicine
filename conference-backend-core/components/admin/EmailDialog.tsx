"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Mail, Send, AlertCircle, Clock, MessageSquare, FileText } from "lucide-react"
import { useToast } from "../ui/use-toast"
import { conferenceConfig } from "../../config/conference.config"

interface Registration {
  _id: string
  email: string
  profile: {
    title: string
    firstName: string
    lastName: string
    phone: string
    institution: string
    address: {
      city: string
      state: string
      country: string
    }
    dietaryRequirements?: string
    specialNeeds?: string
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
    registrationDate: string
    paymentDate?: string
    paymentType?: 'regular' | 'pending' | 'online' | 'bank-transfer' | 'complementary' | 'complimentary' | 'sponsored'
    sponsorName?: string
    sponsorCategory?: string
    paymentRemarks?: string
  }
  paymentInfo?: {
    amount: number
    currency: string
    transactionId: string
    status?: string
    breakdown?: {
      baseAmount?: number
      workshopFees?: Array<{ name: string; amount: number }>
      accompanyingPersonFees?: number
      discountsApplied?: Array<{ type: string; percentage: number; amount: number }>
    }
  }
}

interface EmailDialogProps {
  isOpen: boolean
  onClose: () => void
  registration: Registration | null
  onEmailSent?: () => void
}

interface EmailTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  defaultSubject: string
  fields: string[]
}

const emailTemplates: EmailTemplate[] = [
  {
    id: "registrationConfirmation",
    name: "Registration Confirmation",
    description: "Send a registration confirmation email with all details",
    icon: <FileText className="h-4 w-4" />,
    defaultSubject: "Registration Confirmation - ${conferenceConfig.shortName}",
    fields: []
  },
  {
    id: "paymentReminder",
    name: "Payment Reminder",
    description: "Send a payment reminder with due amount and deadline",
    icon: <Clock className="h-4 w-4" />,
    defaultSubject: "Payment Reminder - ${conferenceConfig.shortName}",
    fields: ["amount", "currency", "daysOverdue"]
  },
  {
    id: "customMessage",
    name: "Custom Message",
    description: "Send a personalized message to the participant",
    icon: <MessageSquare className="h-4 w-4" />,
    defaultSubject: "Message from ${conferenceConfig.shortName} Team",
    fields: ["message", "senderName"]
  }
]

export function EmailDialog({ isOpen, onClose, registration, onEmailSent }: EmailDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [subject, setSubject] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [currency, setCurrency] = useState<string>("INR")
  const [daysOverdue, setDaysOverdue] = useState<string>("")
  const [senderName, setSenderName] = useState<string>(`${conferenceConfig.shortName} Team`)
  const [isSending, setIsSending] = useState(false)
  
  const { toast } = useToast()

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = emailTemplates.find(t => t.id === templateId)
    if (template) {
      setSubject(template.defaultSubject)
      // Reset form fields
      setMessage("")
      setAmount("")
      setDaysOverdue("")
      setSenderName(`${conferenceConfig.shortName} Team`)
    }
  }

  const handleSendEmail = async () => {
    if (!registration || !selectedTemplate) return

    setIsSending(true)
    
    try {
      const templateData: any = {}
      
      // Prepare template-specific data
      if (selectedTemplate === "paymentReminder") {
        if (amount) templateData.amount = parseFloat(amount)
        if (currency) templateData.currency = currency
        if (daysOverdue) templateData.daysOverdue = parseInt(daysOverdue)
      } else if (selectedTemplate === "customMessage") {
        templateData.senderName = senderName
      }

      const response = await fetch(`/api/admin/registrations/${registration._id}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: selectedTemplate,
          subject,
          message,
          templateData
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Email Sent",
          description: "Email has been sent successfully to the participant."
        })
        onEmailSent?.()
        onClose()
      } else {
        toast({
          title: "Email Failed",
          description: data.message || "Failed to send email",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Send email error:", error)
      toast({
        title: "Error",
        description: "An error occurred while sending email",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const selectedTemplateData = emailTemplates.find(t => t.id === selectedTemplate)
  const isFormValid = selectedTemplate && subject && (selectedTemplate !== "customMessage" || message)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email
          </DialogTitle>
          <DialogDescription>
            {registration && (
              <span>
                Send an email to {registration.profile.title} {registration.profile.firstName} {registration.profile.lastName} ({registration.email})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label>Email Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an email template" />
              </SelectTrigger>
              <SelectContent>
                {emailTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      {template.icon}
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Preview */}
          {selectedTemplateData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {selectedTemplateData.icon}
                  {selectedTemplateData.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedTemplateData.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject */}
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                  />
                </div>

                {/* Template-specific fields */}
                {selectedTemplate === "paymentReminder" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="amount">Amount Due</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="daysOverdue">Days Overdue</Label>
                      <Input
                        id="daysOverdue"
                        type="number"
                        value={daysOverdue}
                        onChange={(e) => setDaysOverdue(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {selectedTemplate === "customMessage" && (
                  <>
                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter your custom message here..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="senderName">Sender Name</Label>
                      <Input
                        id="senderName"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder={`${conferenceConfig.shortName} Team`}
                      />
                    </div>
                  </>
                )}

                {selectedTemplate === "registrationConfirmation" && (
                  <div className="p-3 bg-[#f0f3f8] dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-[#1d3357] dark:text-blue-300">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Automatic Template</span>
                    </div>
                    <p className="text-xs text-[#25406b] dark:text-blue-400 mt-1">
                      This template will automatically include registration details, workshop selections, and conference information.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={!isFormValid || isSending}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}