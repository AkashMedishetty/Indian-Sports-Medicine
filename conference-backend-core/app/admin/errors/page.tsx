"use client"

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import { Navigation } from '../../../components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { RefreshCw, CheckCircle, AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react'

interface ErrorLogEntry {
  _id: string
  errorId: string
  message: string
  severity: string
  category: string
  source: string
  url?: string
  endpoint?: string
  userId?: string
  userEmail?: string
  occurrences: number
  firstOccurrence: string
  lastOccurrence: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  resolutionNotes?: string
}

export default function ErrorsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Navigation />
      <div className="container mx-auto p-4">
        <ErrorsContent />
      </div>
    </ProtectedRoute>
  )
}

function ErrorsContent() {
  const [errors, setErrors] = useState<ErrorLogEntry[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [resolvedFilter, setResolvedFilter] = useState('no')
  
  const [resolveModal, setResolveModal] = useState<ErrorLogEntry | null>(null)
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolving, setResolving] = useState(false)

  const fetchErrors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (severityFilter !== 'all') params.set('severity', severityFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (resolvedFilter !== 'all') params.set('resolved', resolvedFilter)
      
      const res = await fetch(`/api/admin/errors?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setErrors(data.errors)
        setStats(data.stats)
      }
    } catch (error) {
      toast.error('Failed to fetch errors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchErrors()
  }, [severityFilter, categoryFilter, resolvedFilter])

  const handleResolve = async () => {
    if (!resolveModal) return
    setResolving(true)
    try {
      const res = await fetch(`/api/admin/errors/${resolveModal._id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: resolveNotes })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Error marked as resolved')
        setResolveModal(null)
        setResolveNotes('')
        fetchErrors()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to resolve error')
    } finally {
      setResolving(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Critical</Badge>
      case 'error': return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>
      case 'warning': return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" /> Warning</Badge>
      case 'info': return <Badge variant="outline"><Info className="w-3 h-3 mr-1" /> Info</Badge>
      default: return <Badge variant="outline">{severity}</Badge>
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Error Logs</h1>
        <Button variant="outline" onClick={fetchErrors}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setSeverityFilter('critical')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setSeverityFilter('error')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-500">{stats.error}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setSeverityFilter('warning')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setResolvedFilter('no')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">{stats.unresolved}</div>
              <div className="text-sm text-muted-foreground">Unresolved</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setResolvedFilter('yes')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="form">Form</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="no">Unresolved</SelectItem>
            <SelectItem value="yes">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Errors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Occurrences</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : errors.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No errors found</TableCell></TableRow>
              ) : (
                errors.map(error => (
                  <TableRow key={error._id} className={error.resolved ? 'opacity-60' : ''}>
                    <TableCell>{getSeverityBadge(error.severity)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{error.message}</TableCell>
                    <TableCell><Badge variant="outline">{error.category}</Badge></TableCell>
                    <TableCell>{error.userEmail || '-'}</TableCell>
                    <TableCell>{error.occurrences}</TableCell>
                    <TableCell>{new Date(error.lastOccurrence).toLocaleString()}</TableCell>
                    <TableCell>
                      {!error.resolved && (
                        <Button size="sm" variant="ghost" onClick={() => setResolveModal(error)}>
                          <CheckCircle className="w-4 h-4 text-green-600" />
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

      {/* Resolve Modal */}
      <Dialog open={!!resolveModal} onOpenChange={() => setResolveModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark as Resolved</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Error:</p>
              <p className="font-medium">{resolveModal?.message}</p>
            </div>
            <div>
              <Label>Resolution Notes</Label>
              <Textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Describe how this was resolved..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveModal(null)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={resolving}>
              {resolving ? 'Resolving...' : 'Mark Resolved'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
