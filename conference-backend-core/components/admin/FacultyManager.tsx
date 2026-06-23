'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { useToast } from '../ui/use-toast'
import { Plus, Trash2, Upload, Mail, Search, GraduationCap, Copy, RefreshCw, Download, Users } from 'lucide-react'
import { conferenceConfig } from '../../config/conference.config'

interface FacultyMember {
  _id: string
  email: string
  profile: {
    title: string
    firstName: string
    lastName: string
    phone: string
    institution: string
    mciNumber: string
    specialization?: string
    designation: string
  }
  registration: {
    registrationId: string
    type: string
    status: string
    registrationDate: string
    accompanyingPersons?: Array<{ name: string; age: number; relationship: string }>
  }
}

export function FacultyManager() {
  const { toast } = useToast()
  const [faculty, setFaculty] = useState<FacultyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isEmailOpen, setIsEmailOpen] = useState(false)

  // Add form
  const [addForm, setAddForm] = useState({ title: 'Dr.', firstName: '', lastName: '', email: '', phone: '', institution: '', mciNumber: '', specialization: '' })
  // Import
  const [importText, setImportText] = useState('')
  const [importSendEmails, setImportSendEmails] = useState(true)
  // Email
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')

  const registrationLink = typeof window !== 'undefined' ? `${window.location.origin}/faculty/register` : `${conferenceConfig.contact.website}/faculty/register`

  const loadFaculty = useCallback(async () => {
    try {
      setLoading(true)
      const url = search ? `/api/admin/faculty?search=${encodeURIComponent(search)}` : '/api/admin/faculty'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setFaculty(data.data)
    } catch { toast({ title: 'Error', description: 'Failed to load faculty', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [search, toast])

  useEffect(() => { loadFaculty() }, [loadFaculty])

  const handleAdd = async () => {
    if (!addForm.email || !addForm.firstName || !addForm.lastName) {
      toast({ title: 'Error', description: 'Email, first name, and last name are required', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/admin/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Success', description: `Faculty member added: ${data.data.registrationId}` })
        setIsAddOpen(false)
        setAddForm({ title: 'Dr.', firstName: '', lastName: '', email: '', phone: '', institution: '', mciNumber: '', specialization: '' })
        loadFaculty()
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' })
      }
    } catch { toast({ title: 'Error', description: 'Failed to add faculty', variant: 'destructive' }) }
  }

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Remove faculty member "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch('/api/admin/faculty', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Success', description: 'Faculty member removed' })
        loadFaculty()
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' })
      }
    } catch { toast({ title: 'Error', description: 'Failed to remove', variant: 'destructive' }) }
  }

  const handleImport = async () => {
    try {
      // Parse CSV: email,firstName,lastName,phone,institution,specialization
      const lines = importText.trim().split('\n').filter(l => l.trim())
      const facultyList = lines.map(line => {
        const parts = line.split(',').map(p => p.trim())
        return {
          email: parts[0],
          firstName: parts[1] || '',
          lastName: parts[2] || '',
          phone: parts[3] || '',
          institution: parts[4] || '',
          specialization: parts[5] || ''
        }
      }).filter(f => f.email && f.firstName && f.lastName)

      if (facultyList.length === 0) {
        toast({ title: 'Error', description: 'No valid entries found. Format: email,firstName,lastName,phone,institution,specialization', variant: 'destructive' })
        return
      }

      const res = await fetch('/api/admin/faculty/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faculty: facultyList, sendEmails: importSendEmails })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Import Complete', description: data.message })
        setIsImportOpen(false)
        setImportText('')
        loadFaculty()
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' })
      }
    } catch { toast({ title: 'Error', description: 'Import failed', variant: 'destructive' }) }
  }

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage) {
      toast({ title: 'Error', description: 'Subject and message are required', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/admin/faculty/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: emailSubject, message: emailMessage })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Success', description: data.message })
        setIsEmailOpen(false)
        setEmailSubject('')
        setEmailMessage('')
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' })
      }
    } catch { toast({ title: 'Error', description: 'Failed to send emails', variant: 'destructive' }) }
  }

  const exportCSV = () => {
    const headers = ['Registration ID', 'Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Institution', 'MCI Number', 'Specialization', 'Status', 'Accompanying Persons', 'Registration Date']
    const rows = faculty.map(f => [
      f.registration.registrationId,
      f.profile.title,
      f.profile.firstName,
      f.profile.lastName,
      f.email,
      f.profile.phone,
      f.profile.institution,
      f.profile.mciNumber,
      f.profile.specialization || '',
      f.registration.status,
      f.registration.accompanyingPersons?.length || 0,
      new Date(f.registration.registrationDate).toLocaleDateString()
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `faculty-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(registrationLink)
    toast({ title: 'Copied!', description: 'Faculty registration link copied to clipboard' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6" /> Faculty Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Manage invited faculty members — {faculty.length} total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}><Copy className="h-4 w-4 mr-1" /> Copy Registration Link</Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-1" /> Email All</Button></DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-900">
              <DialogHeader>
                <DialogTitle>Send Email to All Faculty</DialogTitle>
                <DialogDescription>Use {'{name}'} for personalization</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Subject</Label><Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Email subject" className="mt-1" /></div>
                <div><Label>Message (HTML supported)</Label><Textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} placeholder="Email body..." rows={6} className="mt-1" /></div>
                <Button onClick={handleSendEmail} className="w-full bg-blue-600 hover:bg-blue-700 text-white"><Mail className="h-4 w-4 mr-2" /> Send to All Faculty</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Import</Button></DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-900">
              <DialogHeader>
                <DialogTitle>Bulk Import Faculty</DialogTitle>
                <DialogDescription>Paste CSV data: email,firstName,lastName,phone,institution,specialization (one per line)</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="john@example.com,John,Doe,9876543210,AIIMS,Hand Surgery" rows={8} />
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="send-import-emails" checked={importSendEmails} onChange={e => setImportSendEmails(e.target.checked)} className="h-4 w-4" />
                  <Label htmlFor="send-import-emails">Send welcome emails with login credentials</Label>
                </div>
                <Button onClick={handleImport} className="w-full bg-blue-600 hover:bg-blue-700 text-white"><Upload className="h-4 w-4 mr-2" /> Import Faculty</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-1" /> Add Faculty</Button></DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-900">
              <DialogHeader>
                <DialogTitle>Add Faculty Member</DialogTitle>
                <DialogDescription>Add a new invited faculty member. A welcome email with login credentials will be sent.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>First Name *</Label><Input value={addForm.firstName} onChange={e => setAddForm(p => ({ ...p, firstName: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Last Name *</Label><Input value={addForm.lastName} onChange={e => setAddForm(p => ({ ...p, lastName: e.target.value }))} className="mt-1" /></div>
                </div>
                <div><Label>Email *</Label><Input type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Phone</Label><Input value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Institution</Label><Input value={addForm.institution} onChange={e => setAddForm(p => ({ ...p, institution: e.target.value }))} className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>MCI Number</Label><Input value={addForm.mciNumber} onChange={e => setAddForm(p => ({ ...p, mciNumber: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Specialization</Label><Input value={addForm.specialization} onChange={e => setAddForm(p => ({ ...p, specialization: e.target.value }))} className="mt-1" /></div>
                </div>
                <Button onClick={handleAdd} className="w-full bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-2" /> Add & Send Email</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Registration Link Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-200">Faculty Registration Link</p>
              <p className="text-sm text-blue-600 dark:text-blue-300 font-mono break-all">{registrationLink}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search faculty by name, email, institution..." className="pl-10" />
        </div>
        <Button variant="outline" onClick={loadFaculty}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Faculty Members ({faculty.length})</CardTitle>
          <CardDescription>All invited faculty registrations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : faculty.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">No faculty members yet</p>
              <p className="text-sm mt-2">Add faculty members or share the registration link.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Accompanying</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faculty.map(f => (
                  <TableRow key={f._id}>
                    <TableCell className="font-mono text-sm">{f.registration.registrationId}</TableCell>
                    <TableCell>
                      <div className="font-medium">{f.profile.title} {f.profile.firstName} {f.profile.lastName}</div>
                      {f.profile.specialization && <div className="text-xs text-gray-500">{f.profile.specialization}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{f.email}</TableCell>
                    <TableCell className="text-sm">{f.profile.phone}</TableCell>
                    <TableCell className="text-sm">{f.profile.institution}</TableCell>
                    <TableCell>
                      <Badge className={f.registration.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {f.registration.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{f.registration.accompanyingPersons?.length || 0}</TableCell>
                    <TableCell className="text-sm">{new Date(f.registration.registrationDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(f._id, `${f.profile.firstName} ${f.profile.lastName}`)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
