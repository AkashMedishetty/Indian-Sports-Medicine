"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Search, Building2, Users, Edit, Eye, Power, RefreshCw, Key, Copy } from 'lucide-react'

interface Sponsor {
  _id: string
  email: string
  companyName: string
  contactPerson: string
  category: string
  allocation: { total: number; used: number }
  status: 'active' | 'inactive'
  lastActivity?: string
  createdAt: string
}

interface SponsorStats {
  total: number
  active: number
  inactive: number
  totalAllocation: number
  usedAllocation: number
}

const CATEGORIES = [
  { value: 'platinum', label: 'Platinum', color: 'bg-slate-300' },
  { value: 'gold', label: 'Gold', color: 'bg-yellow-400' },
  { value: 'silver', label: 'Silver', color: 'bg-gray-400' },
  { value: 'bronze', label: 'Bronze', color: 'bg-amber-600' },
  { value: 'exhibitor', label: 'Exhibitor', color: 'bg-blue-500' }
]

export function SponsorManager() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [stats, setStats] = useState<SponsorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null)
  const [sponsorDelegates, setSponsorDelegates] = useState<any[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    contactPerson: '',
    category: 'gold',
    allocation: 10,
    password: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  const fetchSponsors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      
      const res = await fetch(`/api/admin/sponsors?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setSponsors(data.sponsors)
        setStats(data.stats)
      } else {
        toast.error(data.message || 'Failed to fetch sponsors')
      }
    } catch (error) {
      toast.error('Failed to fetch sponsors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSponsors()
  }, [statusFilter, categoryFilter])


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchSponsors()
  }

  const handleCreate = async () => {
    if (!formData.email || !formData.companyName || !formData.contactPerson) {
      toast.error('Please fill all required fields')
      return
    }
    
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Sponsor created successfully. Welcome email sent.')
        setCreatedPassword(data.temporaryPassword)
        setFormData({ email: '', companyName: '', contactPerson: '', category: 'gold', allocation: 10, password: '' })
        fetchSponsors()
      } else {
        toast.error(data.message || 'Failed to create sponsor')
      }
    } catch (error) {
      toast.error('Failed to create sponsor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedSponsor) return
    
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/sponsors/${selectedSponsor._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Sponsor updated successfully')
        setShowEditModal(false)
        fetchSponsors()
      } else {
        toast.error(data.message || 'Failed to update sponsor')
      }
    } catch (error) {
      toast.error('Failed to update sponsor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (sponsor: Sponsor) => {
    const newStatus = sponsor.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await fetch(`/api/admin/sponsors/${sponsor._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Sponsor ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
        fetchSponsors()
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const openDetails = async (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor)
    setShowDetailsModal(true)
    
    try {
      const res = await fetch(`/api/admin/sponsors/${sponsor._id}`)
      const data = await res.json()
      if (data.success) {
        setSponsorDelegates(data.delegates || [])
      }
    } catch (error) {
      console.error('Failed to fetch sponsor details')
    }
  }

  const openEdit = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor)
    setFormData({
      email: sponsor.email,
      companyName: sponsor.companyName,
      contactPerson: sponsor.contactPerson,
      category: sponsor.category,
      allocation: sponsor.allocation.total,
      password: ''
    })
    setShowEditModal(true)
  }

  const handleResetPassword = async (sponsor: Sponsor, sendEmail: boolean = false) => {
    try {
      const res = await fetch(`/api/admin/sponsors/${sponsor._id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail })
      })
      const data = await res.json()
      
      if (data.success) {
        if (sendEmail) {
          toast.success('Password reset and email sent to sponsor')
        } else {
          // Show the new password to admin
          toast.success(
            <div>
              <p>Password reset successfully!</p>
              <p className="font-mono bg-slate-100 p-2 mt-2 rounded text-sm">
                New Password: {data.newPassword}
              </p>
              <p className="text-xs mt-1 text-muted-foreground">Copy this and share with the sponsor</p>
            </div>,
            { duration: 30000 }
          )
        }
      } else {
        toast.error(data.message || 'Failed to reset password')
      }
    } catch (error) {
      toast.error('Failed to reset password')
    }
  }

  const getCategoryBadge = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category)
    return cat ? (
      <Badge className={`${cat.color} text-white`}>{cat.label}</Badge>
    ) : (
      <Badge variant="outline">{category}</Badge>
    )
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sponsor Management</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Sponsor
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Sponsors</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
              <div className="text-sm text-muted-foreground">Inactive</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalAllocation}</div>
              <div className="text-sm text-muted-foreground">Total Allocation</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.usedAllocation}</div>
              <div className="text-sm text-muted-foreground">Used</div>
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
                placeholder="Search by company, email, contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
            <Button type="button" variant="ghost" onClick={fetchSponsors}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sponsors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Allocation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : sponsors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No sponsors found
                  </TableCell>
                </TableRow>
              ) : (
                sponsors.map(sponsor => (
                  <TableRow key={sponsor._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{sponsor.companyName}</div>
                          <div className="text-sm text-muted-foreground">{sponsor.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{sponsor.contactPerson}</TableCell>
                    <TableCell>{getCategoryBadge(sponsor.category)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{sponsor.allocation.used} / {sponsor.allocation.total}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sponsor.status === 'active' ? 'default' : 'secondary'}>
                        {sponsor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openDetails(sponsor)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(sponsor)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(sponsor)}>
                          <Power className={`w-4 h-4 ${sponsor.status === 'active' ? 'text-red-500' : 'text-green-500'}`} />
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


      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); if (!open) setCreatedPassword(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sponsor</DialogTitle>
          </DialogHeader>
          
          {createdPassword ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800 mb-2">✓ Sponsor Created Successfully!</p>
                <p className="text-sm text-green-700 mb-3">Share these credentials with the sponsor:</p>
                <div className="bg-white p-3 rounded border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="font-mono text-sm">{formData.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-yellow-100 px-2 py-1 rounded">{createdPassword}</span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(createdPassword)
                          toast.success('Password copied!')
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  A welcome email has also been sent to the sponsor.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => { setShowCreateModal(false); setCreatedPassword(null) }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <Label>Contact Person *</Label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Contact Person Name"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sponsor@company.com"
                  />
                </div>
                <div>
                  <Label>Password (optional)</Label>
                  <Input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave empty to auto-generate"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If left empty, a random password will be generated and emailed to the sponsor.
                  </p>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delegate Allocation</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.allocation}
                    onChange={(e) => setFormData({ ...formData, allocation: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Sponsor'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sponsor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Delegate Allocation (min: {selectedSponsor?.allocation.used || 0})</Label>
              <Input
                type="number"
                min={selectedSponsor?.allocation.used || 0}
                value={formData.allocation}
                onChange={(e) => setFormData({ ...formData, allocation: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSponsor?.companyName}</DialogTitle>
          </DialogHeader>
          {selectedSponsor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Contact Person</Label>
                  <div>{selectedSponsor.contactPerson}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <div>{selectedSponsor.email}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <div>{getCategoryBadge(selectedSponsor.category)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={selectedSponsor.status === 'active' ? 'default' : 'secondary'}>
                      {selectedSponsor.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Allocation</Label>
                  <div>{selectedSponsor.allocation.used} / {selectedSponsor.allocation.total} delegates</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Remaining</Label>
                  <div>{selectedSponsor.allocation.total - selectedSponsor.allocation.used} delegates</div>
                </div>
              </div>

              {/* Password Reset Section */}
              <div className="p-3 bg-slate-50 rounded-lg border">
                <Label className="text-muted-foreground">Password Management</Label>
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleResetPassword(selectedSponsor, false)}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Reset & Show Password
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleResetPassword(selectedSponsor, true)}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Reset & Email Password
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use "Reset & Show" if the sponsor has a dummy email. Use "Reset & Email" to send credentials via email.
                </p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Registered Delegates</Label>
                {sponsorDelegates.length === 0 ? (
                  <div className="text-sm text-muted-foreground mt-2">No delegates registered yet</div>
                ) : (
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Reg ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sponsorDelegates.map(d => (
                        <TableRow key={d._id}>
                          <TableCell>{d.name}</TableCell>
                          <TableCell>{d.email}</TableCell>
                          <TableCell>{d.registrationId}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{d.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
