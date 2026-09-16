'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Eye, Loader2, ScanLine, Search, Send, XCircle } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Textarea } from '../../ui/textarea'
import {
  EMAIL_RE,
  parseRecipientRows,
  type RecipientRow,
  type SpotValues,
} from '@/conference-backend-core/lib/certificates/spot-fields'
import { spotApi, type LookupAbstract, type LookupPerson, type SendSource, type SpotTemplate } from './api'
import { PreviewDialog, type PreviewState } from './PreviewDialog'

type Mode = 'manual' | 'lookup' | 'csv'
interface FormState { name: string; email: string; title: string; abstractId: string; role: string }
type FormKey = keyof FormState

const EMPTY: FormState = { name: '', email: '', title: '', abstractId: '', role: '' }
// Small batches keep progress responsive and each request well inside the function time limit.
const CSV_BATCH = 5

const errorText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback)

export function IssuePanel({ template, onSent }: { template: SpotTemplate; onSent: () => void }) {
  const [mode, setMode] = useState<Mode>('manual')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [source, setSource] = useState<SendSource>('manual')
  const [busy, setBusy] = useState<'preview' | 'send' | null>(null)
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const optionalFields = template.fields.filter((f) => f.enabled && f.key !== 'name')
  const printsAbstract = template.fields.some((f) => f.enabled && (f.key === 'title' || f.key === 'abstractId'))
  const setField = (key: FormKey, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const openPreview = async (values: SpotValues) => {
    setBusy('preview')
    try {
      const { blob, warnings } = await spotApi.render(template.id, values)
      setPreview({ blob, warnings, fileName: `Certificate - ${values.name || 'preview'}.pdf` })
    } catch (e) {
      toast.error(errorText(e, 'Preview failed'))
    } finally {
      setBusy(null)
    }
  }

  const formError = !form.name.trim() ? 'Enter the name to print' : !EMAIL_RE.test(form.email.trim()) ? 'Enter a valid email address' : ''

  const sendOne = async () => {
    if (formError) { toast.error(formError); return }
    setBusy('send')
    try {
      const { results } = await spotApi.send(template.id, [{ ...form, email: form.email.trim() }], source)
      const result = results[0]
      if (result?.success) {
        toast.success(`Certificate sent to ${result.email}`, { description: result.warnings?.length ? result.warnings.join(' · ') : undefined })
        setForm(EMPTY)
        setSource('manual')
        onSent()
      } else {
        toast.error(result?.error || 'The certificate could not be sent')
      }
    } catch (e) {
      toast.error(errorText(e, 'Sending failed'))
    } finally {
      setBusy(null)
    }
  }

  const pick = (person: LookupPerson, abstract?: LookupAbstract) => {
    setForm({ ...EMPTY, name: person.name, email: person.email, title: abstract?.title ?? '', abstractId: abstract?.abstractId ?? '' })
    setSource('lookup')
    setMode('manual')
  }

  return (
    <>
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList className="grid w-full grid-cols-3 sm:inline-grid sm:w-auto">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="lookup">Look up</TabsTrigger>
          <TabsTrigger value="csv">Paste list</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              {source === 'lookup' && (
                <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                  Filled from the registrant lookup — check the details before sending.
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="spot-name">Name on certificate *</Label>
                  <Input id="spot-name" value={form.name} autoComplete="off" placeholder="Dr. Ramesh Kumar" onChange={(e) => setField('name', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="spot-email">Email *</Label>
                  <Input id="spot-email" type="email" value={form.email} autoComplete="off" placeholder="name@example.com" onChange={(e) => setField('email', e.target.value)} />
                </div>
                {optionalFields.map((f) => (
                  <div key={f.key} className={f.key === 'title' ? 'sm:col-span-2' : ''}>
                    <Label htmlFor={`spot-${f.key}`}>{f.label}</Label>
                    {f.key === 'title' ? (
                      <Textarea id="spot-title" rows={2} value={form.title} onChange={(e) => setField('title', e.target.value)} />
                    ) : (
                      <Input id={`spot-${f.key}`} value={form[f.key as FormKey]} onChange={(e) => setField(f.key as FormKey, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
              {!optionalFields.length && (
                <p className="text-xs text-gray-500">This template prints the name only. Switch on more fields in the Design tab.</p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => openPreview(form)} disabled={!form.name.trim() || busy !== null}>
                  {busy === 'preview' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}Preview
                </Button>
                <Button onClick={sendOne} disabled={!!formError || busy !== null}>
                  {busy === 'send' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Send certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* forceMount keeps search results and list progress when switching tabs. */}
        <TabsContent value="lookup" forceMount className="mt-4 data-[state=inactive]:hidden">
          <LookupTab onPick={pick} printsAbstract={printsAbstract} active={mode === 'lookup'} />
        </TabsContent>

        <TabsContent value="csv" forceMount className="mt-4 data-[state=inactive]:hidden">
          <CsvTab template={template} onPreview={openPreview} previewBusy={busy !== null} onSent={onSent} />
        </TabsContent>
      </Tabs>

      <PreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </>
  )
}

function LookupTab({ onPick, printsAbstract, active }: { onPick: (p: LookupPerson, a?: LookupAbstract) => void; printsAbstract: boolean; active: boolean }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<LookupPerson[]>([])
  const [searched, setSearched] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const run = async (term: string) => {
    const t = term.trim()
    controller.current?.abort()
    if (t.length < 2) { setResults([]); setSearched(''); setLoading(false); return }
    const c = new AbortController()
    controller.current = c
    setLoading(true)
    setError('')
    try {
      setResults(await spotApi.lookup(t, c.signal))
      setSearched(t)
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') setError(errorText(e, 'Lookup failed'))
    } finally {
      if (controller.current === c) setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => run(q), 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  // Focus the box whenever the tab opens, so a badge scanner can type straight into it.
  useEffect(() => { if (active) inputRef.current?.focus() }, [active])

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            ref={inputRef}
            value={q}
            autoComplete="off"
            className="pl-9"
            placeholder="Name, email, phone, registration ID — or scan a badge"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); run(q) } }}
          />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <ScanLine className="h-3.5 w-3.5" />A badge scanner types into this box; every QR format in circulation resolves to the registration.
        </p>

        {loading && <p className="flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Searching…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && searched && !results.length && (
          <p className="text-sm text-gray-500">No registrants match “{searched}”. You can still type the details in the Manual tab.</p>
        )}

        <div className="space-y-3">
          {results.map((p) => (
            <div key={p.userId} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{p.name}</p>
                  <p className="truncate text-sm text-gray-600 dark:text-gray-400">{p.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {p.registrationId && <Badge variant="outline">{p.registrationId}</Badge>}
                    {p.registrationStatus && <Badge variant="secondary">{p.registrationStatus}</Badge>}
                  </div>
                </div>
                <Button size="sm" onClick={() => onPick(p)}>Use</Button>
              </div>
              {p.abstracts.length > 0 && (
                <div className="mt-3 space-y-1 border-t pt-2">
                  <p className="text-xs font-medium text-gray-500">
                    Abstracts{!printsAbstract && ' — switch on Presentation title / Abstract ID in Design to print them'}
                  </p>
                  {p.abstracts.map((a, i) => (
                    <button key={`${a.abstractId}-${i}`} type="button" onClick={() => onPick(p, a)}
                      className="flex w-full items-start justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                      <span className="min-w-0">
                        <span className="block truncate">{a.title || 'Untitled abstract'}</span>
                        <span className="text-xs text-gray-500">{[a.abstractId, a.track, a.status].filter(Boolean).join(' · ')}</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-blue-600">Use this</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface RowStatus { state: 'sending' | 'sent' | 'failed'; error?: string }

/** Status is keyed by row content, not line number, so editing the paste can't lose track of who was already sent. */
const rowKey = (r: RecipientRow) => [r.email, r.name, r.title, r.abstractId, r.role].join('|').toLowerCase()

function CsvTab({ template, onPreview, previewBusy, onSent }: { template: SpotTemplate; onPreview: (v: SpotValues) => void; previewBusy: boolean; onSent: () => void }) {
  const [text, setText] = useState('')
  const [statuses, setStatuses] = useState<Record<string, RowStatus>>({})
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const stop = useRef(false)

  const rows = useMemo(() => parseRecipientRows(text), [text])
  const valid = rows.filter((r) => !r.error)
  const pending = valid.filter((r) => statuses[rowKey(r)]?.state !== 'sent')
  const sentCount = valid.filter((r) => statuses[rowKey(r)]?.state === 'sent').length
  const failedCount = valid.filter((r) => statuses[rowKey(r)]?.state === 'failed').length

  const setMany = (batch: RecipientRow[], status: (r: RecipientRow) => RowStatus) =>
    setStatuses((s) => { const next = { ...s }; batch.forEach((r) => { next[rowKey(r)] = status(r) }); return next })

  const sendAll = async () => {
    if (!pending.length) return
    if (!window.confirm(`Send ${pending.length} certificate${pending.length === 1 ? '' : 's'} using “${template.name}”?`)) return
    const queue = [...pending]
    stop.current = false
    setSending(true)
    setProgress({ done: 0, total: queue.length })
    let ok = 0
    let bad = 0

    for (let i = 0; i < queue.length && !stop.current; i += CSV_BATCH) {
      const batch = queue.slice(i, i + CSV_BATCH)
      setMany(batch, () => ({ state: 'sending' }))
      try {
        const { results } = await spotApi.send(
          template.id,
          batch.map((r) => ({ name: r.name, email: r.email, title: r.title, abstractId: r.abstractId, role: r.role })),
          'csv'
        )
        const byIndex = new Map(results.map((res) => [res.index, res]))
        setMany(batch, (r) => {
          const res = byIndex.get(batch.indexOf(r))
          return res?.success ? { state: 'sent' } : { state: 'failed', error: res?.error || 'No response for this row' }
        })
        ok += results.filter((res) => res.success).length
        bad += batch.length - results.filter((res) => res.success).length
      } catch (e) {
        const message = errorText(e, 'Request failed')
        setMany(batch, () => ({ state: 'failed', error: message }))
        bad += batch.length
      }
      setProgress({ done: Math.min(i + CSV_BATCH, queue.length), total: queue.length })
    }

    setSending(false)
    onSent()
    if (bad) toast.error(`${ok} sent, ${bad} failed — fix or retry the failed rows`)
    else toast.success(`${ok} certificate${ok === 1 ? '' : 's'} sent`)
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <Label htmlFor="spot-csv">Paste rows</Label>
          <Textarea
            id="spot-csv"
            rows={7}
            value={text}
            disabled={sending}
            className="font-mono text-xs"
            onChange={(e) => setText(e.target.value)}
            placeholder={'name,email,title,abstract id,role\nDr. Ramesh Kumar,ramesh@example.com,"Appendicitis, a prospective study",IASMCON2026-123-ABS-45,Poster Presenter'}
          />
          <p className="mt-1 text-xs text-gray-500">
            Paste from Excel / Google Sheets, or CSV. Without a header row the columns are: name, email, title, abstract ID, role.
            Columns for fields switched off in Design are ignored.
          </p>
        </div>

        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{valid.length} ready</Badge>
              {rows.length > valid.length && <Badge variant="destructive">{rows.length - valid.length} with errors</Badge>}
              {sentCount > 0 && <Badge className="bg-green-600 hover:bg-green-600">{sentCount} sent</Badge>}
              {failedCount > 0 && <Badge variant="destructive">{failedCount} failed</Badge>}
              <div className="ml-auto flex items-center gap-2">
                {sending ? (
                  <>
                    <span className="text-xs text-gray-500">Sending {progress.done}/{progress.total}…</span>
                    <Button variant="outline" size="sm" onClick={() => { stop.current = true }}>Stop</Button>
                  </>
                ) : (
                  <Button size="sm" onClick={sendAll} disabled={!pending.length}>
                    <Send className="mr-2 h-4 w-4" />
                    {sentCount || failedCount ? `Send remaining ${pending.length}` : `Send ${pending.length}`}
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-[420px] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 text-left text-xs text-gray-500 dark:bg-gray-800">
                  <tr>
                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Email</th>
                    <th className="px-2 py-2">Details</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const st = r.error ? undefined : statuses[rowKey(r)]
                    return (
                      <tr key={`${r.line}-${rowKey(r)}`} className="border-t align-top">
                        <td className="px-2 py-2 text-xs text-gray-400">{r.line}</td>
                        <td className="px-2 py-2">{r.name || <span className="text-gray-400">—</span>}</td>
                        <td className="break-all px-2 py-2">{r.email || '—'}</td>
                        <td className="px-2 py-2 text-xs text-gray-600 dark:text-gray-400">{[r.title, r.abstractId, r.role].filter(Boolean).join(' · ') || '—'}</td>
                        <td className="px-2 py-2 text-xs">
                          {r.error ? (
                            <span className="text-red-600">{r.error}</span>
                          ) : !st ? (
                            <span className="text-gray-500">Ready</span>
                          ) : st.state === 'sending' ? (
                            <span className="flex items-center text-blue-600"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Sending</span>
                          ) : st.state === 'sent' ? (
                            <span className="flex items-center text-green-600"><CheckCircle2 className="mr-1 h-3 w-3" />Sent</span>
                          ) : (
                            <span className="flex items-start text-red-600"><XCircle className="mr-1 mt-0.5 h-3 w-3 shrink-0" />{st.error || 'Failed'}</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {!r.error && (
                            <Button variant="ghost" size="sm" disabled={previewBusy}
                              onClick={() => onPreview({ name: r.name, title: r.title, abstractId: r.abstractId, role: r.role })}>
                              Preview
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
