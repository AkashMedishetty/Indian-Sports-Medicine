'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, RefreshCw, RotateCw } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'
import { Input } from '../../ui/input'
import { spotApi, type LogRow, type SpotTemplate } from './api'

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function SendLog({ templates, refreshKey }: { templates: SpotTemplate[]; refreshKey: number }) {
  const [rows, setRows] = useState<LogRow[]>([])
  const [totals, setTotals] = useState({ sent: 0, failed: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [resending, setResending] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await spotApi.log(200)
      setRows(result.data)
      setTotals(result.totals)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load the send log')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const liveTemplates = useMemo(() => new Set(templates.map((t) => t.id)), [templates])
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return q ? rows.filter((r) => `${r.name} ${r.email} ${r.templateName}`.toLowerCase().includes(q)) : rows
  }, [rows, filter])

  const resend = async (row: LogRow) => {
    if (!window.confirm(`Send “${row.templateName}” to ${row.email} again?`)) return
    setResending(row.id)
    try {
      const { results } = await spotApi.send(row.templateId, [{ ...row.values, name: row.name, email: row.email }], 'resend')
      if (results[0]?.success) toast.success(`Sent again to ${row.email}`)
      else toast.error(results[0]?.error || 'Resend failed')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Resend failed')
    } finally {
      setResending(null)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-green-600 hover:bg-green-600">{totals.sent} sent</Badge>
          {totals.failed > 0 && <Badge variant="destructive">{totals.failed} failed</Badge>}
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name, email or template" className="ml-auto h-9 max-w-xs" />
          <Button variant="outline" size="sm" onClick={load} disabled={loading} aria-label="Refresh log">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loading && !rows.length ? (
          <p className="flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</p>
        ) : !visible.length ? (
          <p className="text-sm text-gray-500">{rows.length ? 'Nothing matches that filter.' : 'No certificates sent yet.'}</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Recipient</th>
                  <th className="px-3 py-2">Template</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Via</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">{when(r.createdAt)}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{r.name}</p>
                      <p className="break-all text-xs text-gray-500">{r.email}</p>
                    </td>
                    <td className="px-3 py-2 text-xs">{r.templateName}</td>
                    <td className="px-3 py-2 text-xs">
                      {r.status === 'sent' ? (
                        <span className="font-medium text-green-600">Sent</span>
                      ) : (
                        <span className="text-red-600"><span className="font-medium">Failed</span>{r.error ? ` — ${r.error}` : ''}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {r.source}
                      {r.sentByEmail && <span className="block break-all">{r.sentByEmail}</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resend(r)}
                        disabled={resending !== null || !liveTemplates.has(r.templateId)}
                        title={liveTemplates.has(r.templateId) ? 'Send this certificate again' : 'Template was deleted'}
                      >
                        {resending === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                        <span className="ml-1.5">Resend</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
