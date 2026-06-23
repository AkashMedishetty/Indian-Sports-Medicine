"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { useToast } from '../ui/use-toast'

type ReviewerRow = {
  id: string
  email: string
  name: string
  role?: string
  expertise: string[]
  maxConcurrentAssignments: number
  assignedCount: number
  completedReviews: number
}

export function ReviewerManager() {
  const [rows, setRows] = useState<ReviewerRow[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteEmails, setInviteEmails] = useState('')
  const [expertiseInput, setExpertiseInput] = useState('')
  const [capacityInput, setCapacityInput] = useState<number | ''>('')
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reviewers', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setRows(data.data)
      else throw new Error(data.message || 'Failed to load reviewers')
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load reviewers', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const totalAssigned = useMemo(() => rows.reduce((s, r) => s + r.assignedCount, 0), [rows])
  const totalCompleted = useMemo(() => rows.reduce((s, r) => s + r.completedReviews, 0), [rows])

  const invite = async () => {
    const emails = inviteEmails.split(/[,\s]+/).map(e => e.trim()).filter(Boolean)
    if (emails.length === 0) {
      toast({ title: 'No emails', description: 'Enter at least one email' })
      return
    }
    try {
      const res = await fetch('/api/admin/reviewers/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewers: emails.map(e => ({ email: e })) })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Invitations sent', description: `Created: ${data.created?.length || 0}, Updated: ${data.updated?.length || 0}` })
        setInviteEmails('')
        load()
      } else throw new Error(data.message || 'Invite failed')
    } catch (e) {
      toast({ title: 'Invite error', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    }
  }

  const updateReviewer = async (id: string, changes: Partial<ReviewerRow> & { role?: 'user' | 'reviewer' | 'admin' }) => {
    try {
      const res = await fetch('/api/admin/reviewers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          ...('role' in changes ? { role: changes.role } : {}),
          ...('expertise' in changes ? { expertise: changes.expertise } : {}),
          ...('maxConcurrentAssignments' in changes ? { maxConcurrentAssignments: changes.maxConcurrentAssignments } : {})
        })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Update failed')
      toast({ title: 'Updated', description: 'Reviewer updated' })
      load()
    } catch (e) {
      toast({ title: 'Update error', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    }
  }

  const makeReviewer = (id: string) => updateReviewer(id, { role: 'reviewer' })
  const makeUser = (id: string) => updateReviewer(id, { role: 'user' })
  const setExpertise = (id: string) => {
    const list = expertiseInput.split(',').map(s => s.trim()).filter(Boolean)
    if (list.length === 0) return
    updateReviewer(id, { expertise: list } as any)
    setExpertiseInput('')
  }
  const setCapacity = (id: string) => {
    const cap = typeof capacityInput === 'number' ? capacityInput : Number(capacityInput)
    if (!Number.isFinite(cap) || cap <= 0) return
    updateReviewer(id, { maxConcurrentAssignments: cap } as any)
    setCapacityInput('')
  }

  const importCsv = async (file: File) => {
    const fd = new FormData()
    fd.set('file', file)
    try {
      const res = await fetch('/api/admin/reviewers/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Import failed')
      toast({ title: 'Import complete', description: `Created ${data.createdCount}, Updated ${data.updatedCount}` })
      load()
    } catch (e) {
      toast({ title: 'Import error', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviewer Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-end flex-wrap">
          <div className="grow">
            <Label>Invite reviewers (comma or space separated emails)</Label>
            <Input placeholder="a@ex.com, b@ex.com" value={inviteEmails} onChange={(e) => setInviteEmails(e.target.value)} />
          </div>
          <Button onClick={invite} disabled={loading}>Send Invites</Button>
          <div>
            <Label className="block">Import CSV</Label>
            <Input type="file" accept=".csv" onChange={(e) => e.target.files && e.target.files[0] && importCsv(e.target.files[0])} />
          </div>
        </div>

        <Separator />

        <div className="text-sm text-muted-foreground">Total assigned: {totalAssigned} • Total completed reviews: {totalCompleted}</div>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="border rounded p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{r.name || r.email}</div>
                  <div className="text-sm text-muted-foreground">{r.email} • {r.role}</div>
                </div>
                <div className="flex gap-3 text-sm">
                  <Badge variant="secondary">Assigned {r.assignedCount}</Badge>
                  <Badge variant="outline">Completed {r.completedReviews}</Badge>
                  <Badge>Capacity {r.maxConcurrentAssignments}</Badge>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => makeReviewer(r.id)}>Make Reviewer</Button>
                <Button size="sm" variant="ghost" onClick={() => makeUser(r.id)}>Make User</Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {r.expertise.length ? r.expertise.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>) : <span className="text-muted-foreground text-sm">No expertise set</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 items-end">
                <div className="min-w-[260px]">
                  <Label>Set expertise (comma-separated)</Label>
                  <Input value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)} placeholder="e.g. Spine, Brain, Trauma" />
                </div>
                <Button variant="secondary" onClick={() => setExpertise(r.id)}>Update Expertise</Button>
                <div>
                  <Label>Set capacity</Label>
                  <Input type="number" min={1} value={capacityInput} onChange={(e) => setCapacityInput(e.target.value === '' ? '' : Number(e.target.value))} className="w-28" />
                </div>
                <Button variant="secondary" onClick={() => setCapacity(r.id)}>Update Capacity</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


