"use client"

import { useState } from "react"
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"
import { Navigation } from "../../../components/Navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { toast } from "sonner"
import { Loader2, Mail, Send, CheckCircle, XCircle } from "lucide-react"

const EMAIL_TYPES = [
  { id: 'acceptance', label: 'Abstract Acceptance', description: 'Sends 3 emails: Free Paper, Award Paper, E-Poster acceptance with final submission link & template download', count: 3 },
  { id: 'schedule', label: 'Presentation Schedule', description: 'Schedule email with time, hall, date table and venue details', count: 1 },
  { id: 'sponsored', label: 'Sponsored Registration', description: 'Sponsored registration confirmation with QR code, login credentials, and company name', count: 1 },
]

export default function TestEmailsPage() {
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState<string | null>(null)
  const [results, setResults] = useState<Array<{ type: string; success: boolean; error?: string }>>([])

  const sendTest = async (emailType: string) => {
    if (!testEmail || !testEmail.includes('@')) { toast.error('Enter a valid email'); return }
    setSending(emailType)
    setResults([])
    try {
      const res = await fetch('/api/admin/test-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail, emailType })
      })
      const data = await res.json()
      if (data.success) {
        setResults(data.data)
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch { toast.error('Failed to send') } finally { setSending(null) }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Test Email Templates</h1>
              <p className="text-gray-600 mt-1">Preview all email templates by sending test emails to yourself</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Mail className="w-5 h-5" /> Recipient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">Send test emails to:</Label>
                    <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="your-email@example.com" type="email" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => sendTest('all')} disabled={!!sending || !testEmail} className="bg-[#25406b] hover:bg-[#1d3357]">
                      {sending === 'all' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Send All (5 emails)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {EMAIL_TYPES.map(type => (
              <Card key={type.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{type.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{type.count} email(s)</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => sendTest(type.id)} disabled={!!sending || !testEmail}>
                      {sending === type.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {results.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Results</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.map((r, i) => (
                      <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded ${r.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {r.success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
                        <span>{r.type}</span>
                        {r.error && <span className="text-xs ml-auto">{r.error}</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
