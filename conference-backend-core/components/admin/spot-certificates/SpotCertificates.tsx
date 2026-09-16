'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Award, FileUp, History, Loader2, PenTool, Send, Upload } from 'lucide-react'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { spotApi, type SpotTemplate } from './api'
import { IssuePanel } from './IssuePanel'
import { SendLog } from './SendLog'
import { TemplateEditor } from './TemplateEditor'

type Tab = 'issue' | 'design' | 'log'
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

export function SpotCertificates() {
  const [templates, setTemplates] = useState<SpotTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('issue')
  const [designDirty, setDesignDirty] = useState(false)
  const [logRefresh, setLogRefresh] = useState(0)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    spotApi
      .listTemplates()
      .then((list) => {
        setTemplates(list)
        setSelectedId((id) => id ?? list[0]?.id ?? null)
        if (!list.length) setTab('design')
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Could not load templates'))
      .finally(() => setLoading(false))
  }, [])

  const selected = templates.find((t) => t.id === selectedId) ?? null
  const confirmDiscard = () => !designDirty || window.confirm('You have unsaved design changes. Discard them?')

  const selectTemplate = (id: string) => {
    if (id === selectedId || !confirmDiscard()) return
    setDesignDirty(false)
    setSelectedId(id)
  }

  const changeTab = (next: Tab) => {
    if (tab === 'design' && next !== 'design') {
      if (!confirmDiscard()) return
      setDesignDirty(false)
    }
    setTab(next)
  }

  const openUpload = () => { if (confirmDiscard()) setUploadOpen(true) }

  const upload = async () => {
    if (!uploadFile) return
    setUploading(true)
    try {
      const created = await spotApi.uploadTemplate(uploadFile, uploadName.trim())
      setTemplates((list) => [created, ...list])
      setDesignDirty(false)
      setSelectedId(created.id)
      setTab('design')
      setUploadOpen(false)
      setUploadName('')
      setUploadFile(null)
      toast.success('Template uploaded — drag the name into place, then Save')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeTemplate = (id: string) => {
    const next = templates.filter((t) => t.id !== id)
    setDesignDirty(false)
    setTemplates(next)
    setSelectedId(next[0]?.id ?? null)
    setTab('issue')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Templates</CardTitle>
          <Button size="sm" onClick={openUpload}><Upload className="mr-1.5 h-4 w-4" />Upload</Button>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {loading ? (
            <p className="flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</p>
          ) : loadError ? (
            <p className="text-sm text-red-600">{loadError}</p>
          ) : !templates.length ? (
            <p className="text-sm text-gray-500">No templates yet.</p>
          ) : (
            templates.map((t) => {
              const enabled = t.fields.filter((f) => f.enabled).length
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTemplate(t.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left transition ${
                    t.id === selectedId ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {t.pageWidth >= t.pageHeight ? 'Landscape' : 'Portrait'} · {enabled} field{enabled === 1 ? '' : 's'}
                  </p>
                </button>
              )
            })
          )}
        </CardContent>
      </Card>

      <div className="min-w-0">
        {!loading && !selected ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Award className="mb-3 h-10 w-10 text-gray-400" />
              <p className="font-medium">Upload a certificate template to get started</p>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                Export the certificate design as a PDF with the name area left blank. You&apos;ll drag the name and details into place next.
              </p>
              <Button className="mt-4" onClick={openUpload}><FileUp className="mr-2 h-4 w-4" />Upload PDF template</Button>
            </CardContent>
          </Card>
        ) : selected ? (
          <Tabs value={tab} onValueChange={(v) => changeTab(v as Tab)}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="min-w-0 truncate text-lg font-semibold">{selected.name}</h2>
              <TabsList>
                <TabsTrigger value="issue"><Send className="mr-1.5 h-4 w-4" />Issue</TabsTrigger>
                <TabsTrigger value="design"><PenTool className="mr-1.5 h-4 w-4" />Design</TabsTrigger>
                <TabsTrigger value="log"><History className="mr-1.5 h-4 w-4" />Send log</TabsTrigger>
              </TabsList>
            </div>
            {/* Issue stays mounted so an in-progress list send keeps its progress while you check the log. */}
            <TabsContent value="issue" forceMount className="data-[state=inactive]:hidden">
              <IssuePanel key={selected.id} template={selected} onSent={() => setLogRefresh((n) => n + 1)} />
            </TabsContent>
            <TabsContent value="design">
              <TemplateEditor
                key={selected.id}
                template={selected}
                onDirtyChange={setDesignDirty}
                onSaved={(t) => setTemplates((list) => list.map((x) => (x.id === t.id ? t : x)))}
                onDeleted={removeTemplate}
              />
            </TabsContent>
            <TabsContent value="log">
              <SendLog templates={templates} refreshKey={logRefresh} />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>

      <Dialog open={uploadOpen} onOpenChange={(open) => !uploading && setUploadOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload certificate template</DialogTitle>
            <DialogDescription>A PDF under 4 MB. Only the first page is used — leave the name area blank in the design.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="upload-name">Template name</Label>
              <Input id="upload-name" value={uploadName} placeholder="e.g. E-Poster Presentation" onChange={(e) => setUploadName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="upload-file">PDF file</Label>
              <Input
                id="upload-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  if (file && file.size > MAX_UPLOAD_BYTES) {
                    toast.error(`That PDF is ${(file.size / 1048576).toFixed(1)} MB — templates must be under 4 MB`)
                    e.target.value = ''
                    setUploadFile(null)
                    return
                  }
                  setUploadFile(file)
                  if (file && !uploadName.trim()) setUploadName(file.name.replace(/\.pdf$/i, ''))
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={upload} disabled={!uploadFile || uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
