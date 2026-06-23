"use client"

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import { Navigation } from '../../../components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Search, RefreshCw, Clock, FileText, Mail, Gift, XCircle, Download, Users } from 'lucide-react'

interface PendingUser {
  _id: string
  email: string
  name: string
  phone: string
  institution: string
  registrationId: string
  registrationType: string
  daysPending: number
  hasAbstract: boolean
  abstractCount: number
  abstracts: Array<{ title: string; status: string }>
  createdAt: string
}

interface Stats {
  total: number
  withAbstracts: number
  withoutAbstracts: number
  pending7Days: number
  pending14Days: number
  avgDaysPending: number
}

export default function PendingUsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Navigation />
      <div className="container mx-auto p-4">
        <PendingUsersContent />
      </div>
    </ProtectedRoute>
  )
}

function PendingUsersContent() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [hasAbstractFilter, setHasAbstractFilter] = useState('all')
  const [daysFilter, setDaysFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  // Action modal
  const [actionModal, setActionModal] = useState<{ user: PendingUser; action: string } | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (hasAbstractFilter !== 'all') params.set('hasAbstract', hasAbstractFilter)
      if (daysFilter !== 'all') params.set('days', daysFilter)
      
      const res = await fetch(`/api/admin/pending-users?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setUsers(data.users)
        setStats(data.stats)
      } else {
        toast.error(data.message || 'Failed to fetch pending users')
      }
    } catch (error) {
      toast.error('Failed to fetch pending users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [hasAbstractFilter, daysFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleAction = async () => {
    if (!actionModal) return
    
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/pending-users/${actionModal.user._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionModal.action, reason: actionReason })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(data.message)
        setActionModal(null)
        setActionReason('')
        fetchUsers()
      } else {
        toast.error(data.message || 'Action failed')
      }
    } catch (error) {
      toast.error('Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = ['Registration ID', 'Name', 'Email', 'Phone', 'Institution', 'Days Pending', 'Has Abstract', 'Created']
    const rows = users.map(u => [
      u.registrationId, u.name, u.email, u.phone, u.institution, 
      u.daysPending, u.hasAbstract ? 'Yes' : 'No', new Date(u.createdAt).toLocaleDateString()
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pending-users.csv'
    a.click()
  }

  const getDaysBadge = (days: number) => {
    if (days >= 14) return <Badge variant="destructive">{days} days</Badge>
    if (days >= 7) return <Badge className="bg-yellow-500">{days} days</Badge>
    return <Badge variant="outline">{days} days</Badge>
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pending Registrations</h1>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.withAbstracts}</div>
              <div className="text-sm text-muted-foreground">With Abstracts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-500">{stats.withoutAbstracts}</div>
              <div className="text-sm text-muted-foreground">Without Abstracts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending7Days}</div>
              <div className="text-sm text-muted-foreground">&gt;7 Days</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.pending14Days}</div>
              <div className="text-sm text-muted-foreground">&gt;14 Days</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.avgDaysPending}</div>
              <div className="text-sm text-muted-foreground">Avg Days</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name, email, registration ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={hasAbstractFilter} onValueChange={setHasAbstractFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Abstracts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">With Abstract</SelectItem>
                <SelectItem value="no">No Abstract</SelectItem>
              </SelectContent>
            </Select>
            <Select value={daysFilter} onValueChange={setDaysFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Days Pending" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="7">&gt;7 Days</SelectItem>
                <SelectItem value="14">&gt;14 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
            <Button type="button" variant="ghost" onClick={fetchUsers}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox 
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedUsers(checked ? users.map(u => u._id) : [])
                    }}
                  />
                </TableHead>
                <TableHead>Registration ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Abstract</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No pending registrations found
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user._id} className={user.daysPending >= 14 ? 'bg-red-50' : user.daysPending >= 7 ? 'bg-yellow-50' : ''}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedUsers.includes(user._id)}
                        onCheckedChange={(checked) => {
                          setSelectedUsers(prev => 
                            checked ? [...prev, user._id] : prev.filter(id => id !== user._id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono">{user.registrationId}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.institution}</TableCell>
                    <TableCell>{getDaysBadge(user.daysPending)}</TableCell>
                    <TableCell>
                      {user.hasAbstract ? (
                        <Badge variant="default" className="gap-1">
                          <FileText className="w-3 h-3" /> {user.abstractCount}
                        </Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" title="Send Reminder"
                          onClick={() => setActionModal({ user, action: 'send-reminder' })}>
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Convert to Complimentary"
                          onClick={() => setActionModal({ user, action: 'convert-complimentary' })}>
                          <Gift className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Cancel Registration"
                          onClick={() => setActionModal({ user, action: 'cancel' })}>
                          <XCircle className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Dialog open={!!actionModal} onOpenChange={() => setActionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal?.action === 'send-reminder' && 'Send Payment Reminder'}
              {actionModal?.action === 'convert-complimentary' && 'Convert to Complimentary'}
              {actionModal?.action === 'cancel' && 'Cancel Registration'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p><strong>User:</strong> {actionModal?.user.name}</p>
              <p><strong>Email:</strong> {actionModal?.user.email}</p>
              <p><strong>Registration ID:</strong> {actionModal?.user.registrationId}</p>
            </div>
            {(actionModal?.action === 'convert-complimentary' || actionModal?.action === 'cancel') && (
              <div>
                <Label>Reason (optional)</Label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button 
              onClick={handleAction} 
              disabled={actionLoading}
              variant={actionModal?.action === 'cancel' ? 'destructive' : 'default'}
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
