"use client"

import { useState } from "react"
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"
import { Navigation } from "../../../components/Navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { toast } from "sonner"
import { Loader2, Mail, Send, CheckCircle, XCircle, AlertTriangle, Calendar, Award, RefreshCw, GraduationCap, Ticket, Search, Download } from "lucide-react"

export default function EmailOperationsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)
  const [dryRunData, setDryRunData] = useState<any>(null)
  const [facultyTestEmail, setFacultyTestEmail] = useState('')

  // Presentation schedule test state
  const [schedTestEmail, setSchedTestEmail] = useState('')
  const [schedSelectedPresenter, setSchedSelectedPresenter] = useState('')

  // Reminder state
  const [reminderTestEmail, setReminderTestEmail] = useState('')
  const [reminderProgress, setReminderProgress] = useState<{ page: number; totalPages: number; sent: number; failed: number } | null>(null)
  const [reminderSending, setReminderSending] = useState(false)

  // Certificate state
  const [certData, setCertData] = useState<any>(null)
  const [certCategory, setCertCategory] = useState<string>('all')
  const [certTestEmail, setCertTestEmail] = useState('')
  const [certSending, setCertSending] = useState(false)
  const [certProgress, setCertProgress] = useState<{ page: number; totalPages: number; sent: number; failed: number } | null>(null)
  const [certResults, setCertResults] = useState<any>(null)
  const [certManualName, setCertManualName] = useState('')
  const [certManualEmail, setCertManualEmail] = useState('')
  const [certManualCategory, setCertManualCategory] = useState('eposter')
  const [certManualTitle, setCertManualTitle] = useState('')
  const [certSelectedRecipient, setCertSelectedRecipient] = useState('')

  // Conference Kit state
  const [kitDryRun, setKitDryRun] = useState<any>(null)
  const [kitTestEmail, setKitTestEmail] = useState('')
  const [kitSelectedUser, setKitSelectedUser] = useState('')
  const [kitUserSearch, setKitUserSearch] = useState('')
  const [kitResults, setKitResults] = useState<any>(null)
  const [kitProgress, setKitProgress] = useState<{ page: number; totalPages: number; sent: number; failed: number; errors: any[]; sentList: any[] } | null>(null)
  const [kitSending, setKitSending] = useState(false)

  const runOperation = async (endpoint: string, body: any, key: string) => {
    setLoading(key)
    setResults(null)
    setDryRunData(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success) {
        if (body.dryRun) {
          setDryRunData(data.data)
          toast.success(`Dry run complete — ${data.data?.matched?.length || 0} matched, ${data.data?.unmatched?.length || 0} unmatched`)
        } else {
          setResults(data.data || data)
          toast.success(data.message)
        }
      } else {
        toast.error(data.message || 'Operation failed')
      }
    } catch { toast.error('Request failed') } finally { setLoading(null) }
  }

  const runKitOperation = async (body: any, key: string) => {
    setLoading(key)
    if (key === 'kit-dry') { setKitDryRun(null); setKitResults(null); setKitProgress(null) }
    try {
      const res = await fetch('/api/admin/conference-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success) {
        if (body.dryRun) {
          setKitDryRun(data.data)
          toast.success(`Dry run: ${data.data.total} users ready`)
        } else if (body.testEmail) {
          toast.success(data.message)
        }
      } else {
        toast.error(data.message || 'Operation failed')
      }
    } catch { toast.error('Request failed') } finally { setLoading(null) }
  }

  const sendAllKit = async () => {
    if (!confirm('This will send registration summary emails to ALL confirmed registrants in batches. Continue?')) return
    setKitSending(true)
    setKitResults(null)
    const progress = { page: 0, totalPages: 1, sent: 0, failed: 0, errors: [] as any[], sentList: [] as any[] }
    setKitProgress({ ...progress })

    let done = false
    let currentPage = 0

    while (!done) {
      try {
        const res = await fetch('/api/admin/conference-kit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: currentPage, pageSize: 15 })
        })
        const data = await res.json()
        if (!data.success) { toast.error(data.message); break }

        progress.page = data.data.currentPage + 1
        progress.totalPages = data.data.totalPages
        progress.sent += data.data.sent
        progress.failed += data.data.failed
        progress.errors.push(...(data.data.errors || []))
        progress.sentList.push(...(data.data.sentList || []))
        setKitProgress({ ...progress })

        done = data.data.done
        currentPage++

        toast.success(`Batch ${progress.page}/${progress.totalPages}: ${data.data.sent} sent`)
      } catch (e) {
        toast.error(`Batch ${currentPage + 1} failed — retrying in 5s...`)
        await new Promise(r => setTimeout(r, 5000))
      }
    }

    setKitResults({ sent: progress.sent, failed: progress.failed, errors: progress.errors, sentList: progress.sentList, total: progress.sent + progress.failed })
    setKitSending(false)
    setKitProgress(null)
    toast.success(`Done! ${progress.sent} sent, ${progress.failed} failed`)
  }

  const sendAllReminders = async () => {
    if (!confirm('This will send reminder emails to ALL confirmed registrants. Continue?')) return
    setReminderSending(true)
    const progress = { page: 0, totalPages: 1, sent: 0, failed: 0 }
    setReminderProgress({ ...progress })
    let done = false, currentPage = 0
    while (!done) {
      try {
        const res = await fetch('/api/admin/send-reminder', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: currentPage, pageSize: 30 })
        })
        const data = await res.json()
        if (!data.success) { toast.error(data.message); break }
        progress.page = data.data.currentPage + 1
        progress.totalPages = data.data.totalPages
        progress.sent += data.data.sent
        progress.failed += data.data.failed
        setReminderProgress({ ...progress })
        done = data.data.done
        currentPage++
        toast.success(`Reminder batch ${progress.page}/${progress.totalPages}: ${data.data.sent} sent`)
      } catch { toast.error(`Batch ${currentPage + 1} failed`); break }
    }
    setReminderSending(false)
    setReminderProgress(null)
    toast.success(`Reminders done! ${progress.sent} sent, ${progress.failed} failed`)
  }

  const loadCertRecipients = async (cat: string) => {
    setCertCategory(cat)
    setLoading('cert-load')
    try {
      const res = await fetch(`/api/admin/certificates?category=${cat}`)
      const data = await res.json()
      console.log('[cert UI] response:', JSON.stringify(data).slice(0, 200))
      if (data.success) setCertData(data.data)
      else toast.error(data.message || 'Failed to load')
    } catch { toast.error('Failed to load') } finally { setLoading(null) }
  }

  const sendCertSingle = async (recipientId: string, category: string) => {
    setLoading(`cert-single-${recipientId}`)
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-single', category, recipientId })
      })
      const data = await res.json()
      if (data.success) toast.success(data.message)
      else toast.error(data.message)
    } catch { toast.error('Failed') } finally { setLoading(null) }
  }

  const sendCertManual = async () => {
    if (!certManualName || !certManualEmail) { toast.error('Name and email required'); return }
    setLoading('cert-manual')
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-manual', manualRecipient: { name: certManualName, email: certManualEmail, category: certManualCategory, title: certManualTitle } })
      })
      const data = await res.json()
      if (data.success) { toast.success(data.message); setCertManualName(''); setCertManualEmail(''); setCertManualTitle('') }
      else toast.error(data.message)
    } catch { toast.error('Failed') } finally { setLoading(null) }
  }

  const sendAllCerts = async (category: string) => {
    if (!confirm(`Send certificate emails to ALL recipients in ${CERTIFICATE_CATEGORIES[category] || category}?`)) return
    setCertSending(true); setCertResults(null)
    setCertProgress({ page: 1, totalPages: 1, sent: 0, failed: 0 })
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-all', category })
      })
      const data = await res.json()
      if (data.success) {
        setCertResults({ sent: data.data.sent, failed: data.data.failed, errors: data.data.errors, sentList: data.data.sentList })
        toast.success(`Certificates done! ${data.data.sent} sent, ${data.data.failed} failed`)
      } else {
        toast.error(data.message)
      }
    } catch { toast.error('Request failed') } finally {
      setCertSending(false); setCertProgress(null)
    }
  }

  const CERTIFICATE_CATEGORIES: Record<string, string> = {
    'eposter': 'E-Poster',
    'free-paper': 'Free Paper',
    'award-paper': 'Award Paper',
    'workshop-sawbone': 'Saw Bone Workshop',
    'workshop-tendon': 'Tendon Workshop',
  }

  const filteredKitUsers = kitDryRun?.users?.filter((u: any) => {
    if (!kitUserSearch) return true
    const q = kitUserSearch.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.registrationId.toLowerCase().includes(q)
  }) || []

  const exportCSV = (rows: any[], filename: string) => {
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Email Operations</h1>
              <p className="text-gray-600 mt-1">Send bulk emails for schedules, acceptance notifications, and more</p>
            </div>

            {/* ═══ Registration Summary Email ═══ */}
            <Card className="border-2 border-[#25406b]">
              <CardHeader className="bg-gradient-to-r from-[#25406b] to-[#152843] text-white rounded-t-lg">
                <CardTitle className="text-base flex items-center gap-2"><Ticket className="w-5 h-5" /> Send Registration Summary Emails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-sm text-gray-600">
                  Sends a comprehensive email to every confirmed registrant with: registration details, QR code, invoice PDF, faculty schedule (if applicable), presentation schedule, accepted abstracts, workshops, accommodation, and programme link.
                </p>

                {/* Step 1: Dry Run */}
                <div className="flex gap-3 flex-wrap">
                  <Button variant="outline" onClick={() => runKitOperation({ dryRun: true }, 'kit-dry')} disabled={!!loading}>
                    {loading === 'kit-dry' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                    Dry Run (Preview)
                  </Button>
                  <Button className="bg-[#25406b] hover:bg-[#1d3357]" onClick={sendAllKit} disabled={!!loading || kitSending}>
                    {kitSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {kitSending ? 'Sending...' : 'Send All Emails'}
                  </Button>
                </div>

                {/* Progress Bar */}
                {kitProgress && (
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Batch {kitProgress.page} of {kitProgress.totalPages}</span>
                      <span>{kitProgress.sent} sent, {kitProgress.failed} failed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-[#25406b] h-3 rounded-full transition-all duration-500"
                        style={{ width: `${kitProgress.totalPages > 0 ? (kitProgress.page / kitProgress.totalPages) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Dry Run Results */}
                {kitDryRun && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <p className="text-xl font-bold text-blue-700">{kitDryRun.total}</p>
                        <p className="text-[10px] text-blue-600">Total</p>
                      </div>
                      <div className="bg-purple-50 p-2 rounded-lg">
                        <p className="text-xl font-bold text-purple-700">{kitDryRun.faculty}</p>
                        <p className="text-[10px] text-purple-600">Faculty</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded-lg">
                        <p className="text-xl font-bold text-green-700">{kitDryRun.presenters}</p>
                        <p className="text-[10px] text-green-600">Presenters</p>
                      </div>
                      <div className="bg-amber-50 p-2 rounded-lg">
                        <p className="text-xl font-bold text-amber-700">{kitDryRun.withAbstracts}</p>
                        <p className="text-[10px] text-amber-600">Abstracts</p>
                      </div>
                      <div className="bg-cyan-50 p-2 rounded-lg">
                        <p className="text-xl font-bold text-cyan-700">{kitDryRun.withWorkshops}</p>
                        <p className="text-[10px] text-cyan-600">Workshops</p>
                      </div>
                    </div>

                    {/* Test Email with User Picker */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold text-sm">🧪 Send Test Email</h4>
                      <div className="flex gap-2 items-center">
                        <Input placeholder="Your test email" value={kitTestEmail} onChange={e => setKitTestEmail(e.target.value)} className="h-9 w-56" />
                        <Button variant="outline" size="sm" onClick={() => {
                          if (!kitTestEmail) { toast.error('Enter test email'); return }
                          runKitOperation({ testEmail: kitTestEmail, testRegistrationId: kitSelectedUser || undefined }, 'kit-test')
                        }} disabled={!!loading}>
                          {loading === 'kit-test' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                          Send Test
                        </Button>
                      </div>

                      {/* User picker */}
                      <div>
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <Input
                            placeholder="Search user by name, email, or reg ID..."
                            value={kitUserSearch}
                            onChange={e => setKitUserSearch(e.target.value)}
                            className="h-8 pl-8 text-xs"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {filteredKitUsers.slice(0, 50).map((u: any, i: number) => (
                            <div
                              key={i}
                              onClick={() => setKitSelectedUser(u.registrationId)}
                              className={`flex items-center justify-between text-xs p-2 rounded cursor-pointer transition-colors ${
                                kitSelectedUser === u.registrationId ? 'bg-blue-100 border border-blue-300' : 'bg-white hover:bg-gray-100 border border-transparent'
                              }`}
                            >
                              <div>
                                <span className="font-medium">{u.name}</span>
                                <span className="text-gray-400 ml-2">{u.registrationId}</span>
                              </div>
                              <div className="flex gap-1">
                                {u.isFaculty && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px]">Faculty ({u.facultySessions})</span>}
                                {u.isPresenter && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px]">Presenter ({u.presentationSlots})</span>}
                                {u.abstracts > 0 && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px]">Abs ({u.abstracts})</span>}
                                {u.workshops > 0 && <span className="bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded text-[10px]">WS ({u.workshops})</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        {kitSelectedUser && (
                          <p className="text-xs text-blue-600 mt-1">Selected: {kitSelectedUser} — test email will use this user's data</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Kit Send Results */}
                {kitResults && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{kitResults.sent || 0}</p>
                        <p className="text-xs text-green-600">Sent</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-red-700">{kitResults.failed || 0}</p>
                        <p className="text-xs text-red-600">Failed</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-gray-700">{kitResults.total || 0}</p>
                        <p className="text-xs text-gray-600">Total</p>
                      </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {kitResults.sentList?.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => exportCSV(kitResults.sentList, `sent-emails-${new Date().toISOString().slice(0,10)}.csv`)}>
                          <Download className="w-3 h-3 mr-1" /> Export Sent ({kitResults.sentList.length})
                        </Button>
                      )}
                      {kitResults.errors?.length > 0 && (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-300" onClick={() => exportCSV(kitResults.errors, `failed-emails-${new Date().toISOString().slice(0,10)}.csv`)}>
                          <Download className="w-3 h-3 mr-1" /> Export Failed ({kitResults.errors.length})
                        </Button>
                      )}
                      {(kitResults.sentList?.length > 0 || kitResults.errors?.length > 0) && (
                        <Button variant="outline" size="sm" onClick={() => {
                          const all = [
                            ...(kitResults.sentList || []).map((s: any) => ({ ...s, status: 'sent' })),
                            ...(kitResults.errors || []).map((e: any) => ({ ...e, status: 'failed' }))
                          ]
                          exportCSV(all, `all-emails-${new Date().toISOString().slice(0,10)}.csv`)
                        }}>
                          <Download className="w-3 h-3 mr-1" /> Export All
                        </Button>
                      )}
                    </div>

                    {/* Sent List */}
                    {kitResults.sentList?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-green-800">✅ Sent ({kitResults.sentList.length})</h4>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {kitResults.sentList.map((s: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-green-50 p-2 rounded">
                              <span className="font-medium">{s.name}</span>
                              <span className="text-gray-500">{s.email} • {s.registrationId}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Failed List */}
                    {kitResults.errors?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-red-800">❌ Failed ({kitResults.errors.length})</h4>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {kitResults.errors.map((e: any, i: number) => (
                            <div key={i} className="text-xs bg-red-50 p-2 rounded text-red-700 flex justify-between">
                              <span className="font-medium">{e.name} ({e.registrationId})</span>
                              <span>{e.error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Schedule Emails */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600" /> Send Presentation Schedule Emails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Reads Free Paper, Award Paper CSVs and E-Poster abstracts from DB, matches to registered users, and sends their schedule.</p>
                <div className="flex gap-3 flex-wrap">
                  <Button variant="outline" onClick={() => runOperation('/api/admin/abstracts/send-schedule', { dryRun: true }, 'schedule-dry')} disabled={!!loading}>
                    {loading === 'schedule-dry' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                    Dry Run (Preview)
                  </Button>
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Test email" value={schedTestEmail} onChange={e => setSchedTestEmail(e.target.value)} className="h-9 w-56" />
                    <Button variant="outline" onClick={() => {
                      if (!schedTestEmail) { toast.error('Enter test email'); return }
                      runOperation('/api/admin/abstracts/send-schedule', { testEmail: schedTestEmail, testPresenter: schedSelectedPresenter || undefined }, 'schedule-test')
                    }} disabled={!!loading}>
                      {loading === 'schedule-test' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                      Send Test
                    </Button>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                    if (!confirm('This will send schedule emails to ALL matched presenters. Continue?')) return
                    runOperation('/api/admin/abstracts/send-schedule', {}, 'schedule-send')
                  }} disabled={!!loading}>
                    {loading === 'schedule-send' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send All
                  </Button>
                </div>
                {/* Presenter picker from dry run */}
                {dryRunData?.matched && dryRunData.freePapers !== undefined && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Select a presenter for test email ({dryRunData.matched.length} matched):</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {dryRunData.matched.map((m: any, i: number) => (
                        <div
                          key={i}
                          onClick={() => setSchedSelectedPresenter(m.presenter)}
                          className={`flex items-center justify-between text-xs p-1.5 rounded cursor-pointer ${
                            schedSelectedPresenter === m.presenter ? 'bg-blue-100 border border-blue-300' : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          <span className="font-medium">{m.presenter || m.name}</span>
                          <span className="text-gray-400">{m.email} • {m.slots} slot(s) {m.categories && `• ${m.categories}`}</span>
                        </div>
                      ))}
                    </div>
                    {schedSelectedPresenter && <p className="text-xs text-blue-600 mt-1">Selected: {schedSelectedPresenter}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Faculty Schedule Emails */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="w-5 h-5 text-purple-600" /> Send Faculty Schedule Emails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Reads the Faculty Details CSV, matches faculty to registered users (by phone/name), fills missing emails from DB, and sends personalized session schedules.</p>
                <div className="flex gap-3 flex-wrap">
                  <Button variant="outline" onClick={() => runOperation('/api/admin/faculty/send-schedule', { dryRun: true }, 'faculty-dry')} disabled={!!loading}>
                    {loading === 'faculty-dry' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                    Dry Run (Preview)
                  </Button>
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Test email" value={facultyTestEmail} onChange={e => setFacultyTestEmail(e.target.value)} className="h-9 w-56" />
                    <Button variant="outline" onClick={() => {
                      if (!facultyTestEmail) { toast.error('Enter test email'); return }
                      runOperation('/api/admin/faculty/send-schedule', { testEmail: facultyTestEmail }, 'faculty-test')
                    }} disabled={!!loading}>
                      {loading === 'faculty-test' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                      Send Test
                    </Button>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                    if (!confirm('This will send faculty schedule emails to ALL matched faculty. Continue?')) return
                    runOperation('/api/admin/faculty/send-schedule', {}, 'faculty-send')
                  }} disabled={!!loading}>
                    {loading === 'faculty-send' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send All Faculty Emails
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resend Acceptance Emails */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Award className="w-5 h-5 text-green-600" /> Resend Acceptance Emails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Resends acceptance emails to ALL accepted abstracts with the correct "Accepted For" category (Award Paper, Free Paper, E-Poster), final submission link, and template downloads.</p>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => {
                  if (!confirm('This will resend acceptance emails to ALL accepted abstracts. Continue?')) return
                  runOperation('/api/admin/abstracts/resend-status', { filter: 'all-accepted' }, 'resend')
                }} disabled={!!loading}>
                  {loading === 'resend' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Resend All Acceptance Emails
                </Button>
              </CardContent>
            </Card>

            {/* Conference Reminder */}
            <Card className="border-2 border-orange-300">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-600" /> Send Conference Reminder (Day Before)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Sends a "See You Tomorrow" reminder to all confirmed registrants with venue directions (Google Maps), programme link, and check-in reminders. No workshop info.</p>
                <div className="flex gap-3 flex-wrap">
                  <Button variant="outline" onClick={() => runOperation('/api/admin/send-reminder', { dryRun: true }, 'reminder-dry')} disabled={!!loading || reminderSending}>
                    {loading === 'reminder-dry' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                    Dry Run
                  </Button>
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Test email" value={reminderTestEmail} onChange={e => setReminderTestEmail(e.target.value)} className="h-9 w-56" />
                    <Button variant="outline" onClick={() => {
                      if (!reminderTestEmail) { toast.error('Enter test email'); return }
                      runOperation('/api/admin/send-reminder', { testEmail: reminderTestEmail }, 'reminder-test')
                    }} disabled={!!loading || reminderSending}>
                      {loading === 'reminder-test' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                      Send Test
                    </Button>
                  </div>
                  <Button className="bg-orange-600 hover:bg-orange-700" onClick={sendAllReminders} disabled={!!loading || reminderSending}>
                    {reminderSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {reminderSending ? 'Sending...' : 'Send All Reminders'}
                  </Button>
                </div>
                {reminderProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Batch {reminderProgress.page} of {reminderProgress.totalPages}</span>
                      <span>{reminderProgress.sent} sent, {reminderProgress.failed} failed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-orange-500 h-3 rounded-full transition-all duration-500" style={{ width: `${reminderProgress.totalPages > 0 ? (reminderProgress.page / reminderProgress.totalPages) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ═══ Certificate Emails ═══ */}
            <Card className="border-2 border-amber-400">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-lg">
                <CardTitle className="text-base flex items-center gap-2"><Award className="w-5 h-5" /> Certificate Emails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-sm text-gray-600">Load recipients from Excel files, preview all certificates, send individually or in bulk.</p>

                {/* Category selector */}
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(CERTIFICATE_CATEGORIES).map(([key, label]) => (
                    <Button key={key} variant={certCategory === key ? 'default' : 'outline'} size="sm"
                      onClick={() => loadCertRecipients(key)}
                      disabled={!!loading}
                      className={certCategory === key ? 'bg-amber-600' : ''}
                    >
                      {loading === 'cert-load' && certCategory === key ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                      {label}
                    </Button>
                  ))}
                </div>

                {/* Recipients preview */}
                {certData && certData.recipients && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{certData.recipients.length} recipients loaded</h4>
                      <div className="flex gap-2">
                        <Input placeholder="Test email" value={certTestEmail} onChange={e => setCertTestEmail(e.target.value)} className="h-8 w-48 text-xs" />
                        <Button size="sm" variant="outline" onClick={() => {
                          if (!certTestEmail) { toast.error('Enter test email'); return }
                          const selectedRow = certData.recipients.find((r: any) => r.id === certSelectedRecipient)
                          fetch('/api/admin/certificates', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'test', category: certCategory, testEmail: certTestEmail, recipientId: certSelectedRecipient || undefined })
                          }).then(r => r.json()).then(d => d.success ? toast.success(d.message) : toast.error(d.message))
                        }} disabled={!!loading}>
                          <Mail className="w-3 h-3 mr-1" /> Test {certSelectedRecipient ? '(selected)' : '(first)'}
                        </Button>
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => sendAllCerts(certCategory)} disabled={certSending || !!loading}>
                          {certSending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                          Send All
                        </Button>
                      </div>
                    </div>

                    {/* Progress */}
                    {certProgress && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Batch {certProgress.page}/{certProgress.totalPages}</span>
                          <span>{certProgress.sent} sent, {certProgress.failed} failed</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${certProgress.totalPages > 0 ? (certProgress.page / certProgress.totalPages) * 100 : 0}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Results */}
                    {certResults && (
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-green-50 p-2 rounded"><p className="text-lg font-bold text-green-700">{certResults.sent}</p><p className="text-[10px] text-green-600">Sent</p></div>
                        <div className="bg-red-50 p-2 rounded"><p className="text-lg font-bold text-red-700">{certResults.failed}</p><p className="text-[10px] text-red-600">Failed</p></div>
                      </div>
                    )}

                    {/* Recipients table */}
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Email</th>
                            <th className="p-2 text-left">Title/Details</th>
                            <th className="p-2 text-center w-20">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {certData.recipients.map((r: any) => (
                            <tr key={r.id} className={`border-t cursor-pointer transition-colors ${certSelectedRecipient === r.id ? 'bg-amber-50 border-l-2 border-l-amber-500' : 'hover:bg-gray-50'}`}
                              onClick={() => setCertSelectedRecipient(certSelectedRecipient === r.id ? '' : r.id)}>
                              <td className="p-2 font-medium">{r.name}</td>
                              <td className="p-2 text-gray-500">{r.email || <span className="text-red-500">No email</span>}</td>
                              <td className="p-2 text-gray-500 truncate max-w-[200px]">{r.title || r.registrationId || '—'}</td>
                              <td className="p-2 text-center">
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]"
                                  onClick={() => sendCertSingle(r.id, certCategory)}
                                  disabled={!r.email || loading === `cert-single-${r.id}`}
                                >
                                  {loading === `cert-single-${r.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Manual send */}
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <h4 className="font-semibold text-xs text-gray-700">📤 Send to someone not in the list</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Name" value={certManualName} onChange={e => setCertManualName(e.target.value)} className="h-8 text-xs" />
                    <Input placeholder="Email" value={certManualEmail} onChange={e => setCertManualEmail(e.target.value)} className="h-8 text-xs" />
                    <Input placeholder="Title (optional)" value={certManualTitle} onChange={e => setCertManualTitle(e.target.value)} className="h-8 text-xs" />
                    <select value={certManualCategory} onChange={e => setCertManualCategory(e.target.value)} className="h-8 text-xs border rounded px-2">
                      {Object.entries(CERTIFICATE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <Button size="sm" onClick={sendCertManual} disabled={loading === 'cert-manual'}>
                    {loading === 'cert-manual' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                    Send Certificate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dry Run Results */}
            {dryRunData && (
              <Card className="border-yellow-300">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-600" /> Dry Run Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{dryRunData.matched?.length || dryRunData.matchedCount || 0}</p>
                      <p className="text-xs text-green-600">Matched</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-red-700">{dryRunData.unmatched?.length || dryRunData.unmatchedCount || 0}</p>
                      <p className="text-xs text-red-600">Unmatched</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">{dryRunData.totalPresenters || dryRunData.withSessions || dryRunData.total || 0}</p>
                      <p className="text-xs text-blue-600">Total</p>
                    </div>
                  </div>

                  {/* Extra stats for presentation schedule */}
                  {(dryRunData.freePapers !== undefined || dryRunData.ePosters !== undefined) && (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <p className="text-lg font-bold text-blue-700">{dryRunData.freePapers || 0}</p>
                        <p className="text-[10px] text-blue-600">Free Papers</p>
                      </div>
                      <div className="bg-amber-50 p-2 rounded-lg">
                        <p className="text-lg font-bold text-amber-700">{dryRunData.awardPapers || 0}</p>
                        <p className="text-[10px] text-amber-600">Award Papers</p>
                      </div>
                      <div className="bg-purple-50 p-2 rounded-lg">
                        <p className="text-lg font-bold text-purple-700">{dryRunData.ePosters || 0}</p>
                        <p className="text-[10px] text-purple-600">E-Posters ({dryRunData.ePosterAbstractsFound || 0} found in DB)</p>
                      </div>
                    </div>
                  )}

                  {dryRunData.matched?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-green-800">✅ Matched ({dryRunData.matched.length})</h4>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {dryRunData.matched.map((m: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-green-50 p-2 rounded">
                            <span className="font-medium">{m.presenter || m.name}</span>
                            <span className="text-gray-500">
                              {m.email}
                              {m.registrationId && ` • ${m.registrationId}`}
                              {m.slots && ` • ${m.slots} slot(s)`}
                              {m.categories && ` • ${m.categories}`}
                              {m.sessions && ` • ${m.sessions} session(s)`}
                              {m.source && ` • ${m.source}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dryRunData.unmatched?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-red-800">❌ Unmatched ({dryRunData.unmatched.length})</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {dryRunData.unmatched.map((item: any, i: number) => (
                          <div key={i} className="text-xs bg-red-50 p-2 rounded text-red-700 flex justify-between">
                            <span className="font-medium">{typeof item === 'string' ? item : item.name}</span>
                            {typeof item === 'object' && (
                              <span className="text-red-500">{item.phone && `📞 ${item.phone}`} {item.reason && `• ${item.reason}`}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Send Results */}
            {results && (
              <Card className="border-green-300">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Send Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{results.sent || 0}</p>
                      <p className="text-xs text-green-600">Sent</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-red-700">{results.failed || 0}</p>
                      <p className="text-xs text-red-600">Failed</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-gray-700">{results.total || (results.sent || 0) + (results.failed || 0)}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                  </div>

                  {results.unmatched?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1 text-red-800">Unmatched presenters:</h4>
                      <div className="text-xs text-red-700 space-y-1">
                        {results.unmatched.map((item: any, i: number) => (
                          <div key={i} className="bg-red-50 p-1 rounded flex justify-between">
                            <span>{typeof item === 'string' ? item : item.name}</span>
                            {typeof item === 'object' && item.reason && <span className="text-red-500">{item.reason}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.errors?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1 text-red-800">Errors:</h4>
                      <div className="text-xs text-red-700 space-y-1">
                        {results.errors.map((e: any, i: number) => (
                          <div key={i} className="bg-red-50 p-1 rounded flex justify-between">
                            <span>{e.abstractId || e.presenter}</span>
                            <span>{e.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
