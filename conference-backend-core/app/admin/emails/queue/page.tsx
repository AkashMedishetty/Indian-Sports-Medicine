"use client"

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { Navigation } from '../../../../components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { RefreshCw, RotateCcw, Mail, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface QueuedEmail {
  _id: string
  emailId: string
  recipient: { email: string; name?: string }
  subject: string
  template: string
  status: string
  priority: string
  attempts: number
  lastAttempt?: string
  nextRetry?: string
  error?: string
  sentAt?: string
  createdAt: string
}

interface Stats {
  queued: number
  processing: number
  sent: number
  failed: number
  dead: number
}

export default function EmailQueuePage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Navigation />
      <div className="container mx-auto p-4">
        <EmailQueueContent />
      </div>
    </ProtectedRoute>
  )
}

function EmailQueueContent() {
  const [emails, setEmails] = useState<QueuedEmail[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      
      const res = await fetch(`/api/admin/emails/queue?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setEmails(data.emails)
        setStats(data.stats)
      } else {
        toast.error(data.message || 'Failed to fetch queue')
      }
    } catch (error) {
      toast.error('Failed to fetch queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [statusFilter])

  const handleRetry = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/emails/retry/${id}`, { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Email queued for retry')
        fetchQueue()
      } else {
        toast.error(data.message || 'Failed to retry')
      }
    } catch (error) {
      toast.error('Failed to retry')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued': return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Queued</Badge>
      case 'processing': return <Badge className="bg-blue-500"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>
      case 'sent': return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Sent</Badge>
      case 'failed': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>
      case 'dead': return <Badge className="bg-gray-800"><AlertTriangle className="w-3 h-3 mr-1" /> Dead</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Email Queue</h1>
        <Button variant="outline" onClick={fetchQueue}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('queued')}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.queued}</div>
                  <div className="text-sm text-muted-foreground">Queued</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('processing')}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
                  <div className="text-sm text-muted-foreground">Processing</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('sent')}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
                  <div className="text-sm text-muted-foreground">Sent</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('failed')}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('dead')}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-gray-700" />
                <div>
                  <div className="text-2xl font-bold text-gray-700">{stats.dead}</div>
                  <div className="text-sm text-muted-foreground">Dead Letter</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="dead">Dead Letter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Queue Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : emails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No emails in queue
                  </TableCell>
                </TableRow>
              ) : (
                emails.map(email => (
                  <TableRow key={email._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{email.recipient?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{email.recipient?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{email.subject}</TableCell>
                    <TableCell><Badge variant="outline">{email.template}</Badge></TableCell>
                    <TableCell>{getStatusBadge(email.status)}</TableCell>
                    <TableCell>{email.attempts}</TableCell>
                    <TableCell>{new Date(email.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {['failed', 'dead'].includes(email.status) && (
                        <Button size="sm" variant="ghost" onClick={() => handleRetry(email._id)}>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
