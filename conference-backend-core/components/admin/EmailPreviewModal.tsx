"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"
import {
  Mail, Copy, Download, Clock, CheckCircle, XCircle, 
  AlertTriangle, Eye, FileText, Code, Paperclip, MousePointer
} from "lucide-react"
import { useToast } from "../ui/use-toast"

interface EmailDetails {
  emailId: string
  recipient: {
    userId?: string
    email: string
    name: string
  }
  subject: string
  htmlContent: string
  plainTextContent: string
  templateName: string
  templateData: Record<string, any>
  category: string
  attachments?: Array<{
    filename: string
    contentType: string
    size: number
  }>
  status: 'sent' | 'failed' | 'bounced'
  messageId?: string
  error?: string
  sentAt: string
  tracking?: {
    openedAt?: string
    openCount: number
    lastOpenedAt?: string
    clicks: Array<{
      url: string
      clickedAt: string
    }>
  }
}

interface EmailPreviewModalProps {
  emailId: string | null
  isOpen: boolean
  onClose: () => void
}

export function EmailPreviewModal({ emailId, isOpen, onClose }: EmailPreviewModalProps) {
  const [email, setEmail] = useState<EmailDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("html")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && emailId) {
      fetchEmailDetails()
    }
  }, [isOpen, emailId])

  useEffect(() => {
    // Reset tab when modal opens
    if (isOpen) {
      setActiveTab("html")
    }
  }, [isOpen])

  const fetchEmailDetails = async () => {
    if (!emailId) return
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/admin/emails/${emailId}`)
      if (response.ok) {
        const data = await response.json()
        setEmail(data.email)
      } else {
        toast({
          title: "Error",
          description: "Failed to load email details",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching email:', error)
      toast({
        title: "Error",
        description: "Failed to load email details",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'bounced': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      registration: "bg-blue-500",
      payment: "bg-green-500",
      abstract: "bg-purple-500",
      system: "bg-gray-500",
      reminder: "bg-orange-500",
      sponsor: "bg-indigo-500"
    }
    return <Badge className={colors[category] || "bg-gray-500"}>{category}</Badge>
  }

  // Write HTML content to iframe for sandboxed rendering
  useEffect(() => {
    if (iframeRef.current && email?.htmlContent && activeTab === "html") {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 16px;
                background: white;
              }
              img { max-width: 100%; height: auto; }
              a { color: #2563eb; }
            </style>
          </head>
          <body>${email.htmlContent}</body>
          </html>
        `)
        doc.close()
      }
    }
  }, [email?.htmlContent, activeTab])

  if (!emailId) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preview
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : email ? (
          <div className="space-y-4">
            {/* Email Header Info */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(email.status)}
                    <span className="font-medium capitalize">{email.status}</span>
                    {getCategoryBadge(email.category)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(email.sentAt).toLocaleString()}
                  </span>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">To:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{email.recipient.name}</span>
                      <span className="text-muted-foreground">&lt;{email.recipient.email}&gt;</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0"
                        onClick={() => copyToClipboard(email.recipient.email, 'Email')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Subject:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{email.subject}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0"
                        onClick={() => copyToClipboard(email.subject, 'Subject')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {email.messageId && (
                  <div className="text-xs text-muted-foreground">
                    <span>Message ID: </span>
                    <code className="bg-muted px-1 rounded">{email.messageId}</code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => copyToClipboard(email.messageId!, 'Message ID')}
                    >
                      <Copy className="h-2 w-2" />
                    </Button>
                  </div>
                )}

                {email.error && (
                  <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                    <strong>Error:</strong> {email.error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tracking Info */}
            {email.tracking && (email.tracking.openCount > 0 || email.tracking.clicks.length > 0) && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {email.tracking.openCount > 0 && (
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline" className="text-green-600">
                        <Eye className="h-3 w-3 mr-1" />
                        Opened {email.tracking.openCount}x
                      </Badge>
                      {email.tracking.openedAt && (
                        <span className="text-muted-foreground">
                          First: {new Date(email.tracking.openedAt).toLocaleString()}
                        </span>
                      )}
                      {email.tracking.lastOpenedAt && email.tracking.openCount > 1 && (
                        <span className="text-muted-foreground">
                          Last: {new Date(email.tracking.lastOpenedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                  {email.tracking.clicks.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MousePointer className="h-3 w-3" />
                        Link Clicks ({email.tracking.clicks.length})
                      </div>
                      <div className="space-y-1 pl-5">
                        {email.tracking.clicks.map((click, idx) => (
                          <div key={idx} className="text-xs flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {new Date(click.clickedAt).toLocaleString()}
                            </span>
                            <a 
                              href={click.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline truncate max-w-md"
                            >
                              {click.url}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {email.attachments && email.attachments.length > 0 && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({email.attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {email.attachments.map((attachment, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 border rounded px-3 py-2 text-sm"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{attachment.filename}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(attachment.size)})
                        </span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="html" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" /> HTML Preview
                </TabsTrigger>
                <TabsTrigger value="text" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" /> Plain Text
                </TabsTrigger>
                <TabsTrigger value="source" className="text-xs">
                  <Code className="h-3 w-3 mr-1" /> Raw Source
                </TabsTrigger>
              </TabsList>

              <TabsContent value="html" className="mt-2">
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    ref={iframeRef}
                    title="Email Preview"
                    className="w-full h-[400px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              </TabsContent>

              <TabsContent value="text" className="mt-2">
                <ScrollArea className="h-[400px] border rounded-lg p-4 bg-muted/30">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {email.plainTextContent || '(No plain text version available)'}
                  </pre>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="source" className="mt-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => copyToClipboard(email.htmlContent, 'HTML Source')}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <ScrollArea className="h-[400px] border rounded-lg p-4 bg-muted/30">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {email.htmlContent}
                    </pre>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Email not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default EmailPreviewModal
