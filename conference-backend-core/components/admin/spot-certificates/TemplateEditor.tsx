'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { toast } from 'sonner'
import { AlignCenter, AlignLeft, AlignRight, Crosshair, Eye, Loader2, Save, Trash2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Switch } from '../../ui/switch'
import { Textarea } from '../../ui/textarea'
import {
  fontCss,
  SPOT_FONTS,
  type SpotAlign,
  type SpotField,
  type SpotFieldKey,
  type SpotValues,
} from '@/conference-backend-core/lib/certificates/spot-fields'
import { spotApi, type SpotTemplate } from './api'
import { renderFirstPage } from './pdf-canvas'
import { PreviewDialog, type PreviewState } from './PreviewDialog'

const SAMPLE_VALUES: SpotValues = {
  name: 'Dr. Ramesh Kumar',
  title: 'Laparoscopic Management of Complicated Acute Appendicitis: A Prospective Study',
  abstractId: 'IASMCON2026-123-ABS-45',
  role: 'Poster Presenter',
}
const PLACEHOLDERS = ['{name}', '{title}', '{abstractId}', '{role}', '{conference}']
const SNAP_PX = 6
const r2 = (n: number) => Math.round(n * 100) / 100
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm'
const ALIGN_ICONS: Record<SpotAlign, typeof AlignLeft> = { left: AlignLeft, center: AlignCenter, right: AlignRight }

interface DragState {
  key: SpotFieldKey
  mode: 'move' | 'resize'
  startX: number
  startY: number
  orig: SpotField
}

interface Props {
  template: SpotTemplate
  onSaved: (template: SpotTemplate) => void
  onDeleted: (id: string) => void
  onDirtyChange?: (dirty: boolean) => void
}

export function TemplateEditor({ template, onSaved, onDeleted, onDirtyChange }: Props) {
  const [name, setName] = useState(template.name)
  const [fields, setFields] = useState<SpotField[]>(template.fields)
  const [emailSubject, setEmailSubject] = useState(template.emailSubject)
  const [emailBody, setEmailBody] = useState(template.emailBody)
  const [samples, setSamples] = useState<SpotValues>(SAMPLE_VALUES)
  const [selectedKey, setSelectedKey] = useState<SpotFieldKey>('name')
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [pdfError, setPdfError] = useState('')
  const [width, setWidth] = useState(0)
  const [scale, setScale] = useState(0)
  const [guide, setGuide] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const drag = useRef<DragState | null>(null)

  const pw = template.pageWidth
  const ph = template.pageHeight

  const dirty = useMemo(
    () =>
      JSON.stringify({ name, fields, emailSubject, emailBody }) !==
      JSON.stringify({ name: template.name, fields: template.fields, emailSubject: template.emailSubject, emailBody: template.emailBody }),
    [name, fields, emailSubject, emailBody, template]
  )

  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  useEffect(() => {
    let cancelled = false
    setPdfData(null)
    setPdfError('')
    setScale(0)
    spotApi
      .templateFile(template.id)
      .then((data) => { if (!cancelled) setPdfData(data) })
      .catch((e) => { if (!cancelled) setPdfError(e instanceof Error ? e.message : 'Could not load the template') })
    return () => { cancelled = true }
  }, [template.id])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout>
    const observer = new ResizeObserver((entries) => {
      clearTimeout(timer)
      timer = setTimeout(() => setWidth(Math.floor(entries[0].contentRect.width)), 120)
    })
    observer.observe(el)
    return () => { clearTimeout(timer); observer.disconnect() }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !pdfData || width < 50) return
    // Keep tall portrait pages within ~80% of the viewport height.
    const target = Math.min(width, Math.round((window.innerHeight * 0.8 * pw) / ph))
    renderFirstPage(canvas, pdfData, Math.max(280, target))
      .then((result) => { if (result) setScale(result.scale) })
      .catch((e) => setPdfError(e instanceof Error ? e.message : 'Could not draw the template'))
  }, [pdfData, width, pw, ph])

  const update = useCallback(
    (key: SpotFieldKey, patch: Partial<SpotField>) => setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f))),
    []
  )
  const selected = fields.find((f) => f.key === selectedKey) ?? fields[0]

  const startDrag = (e: PointerEvent<HTMLElement>, key: SpotFieldKey, mode: DragState['mode']) => {
    const orig = fields.find((f) => f.key === key)
    if (!orig) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    pageRef.current?.focus({ preventScroll: true })
    setSelectedKey(key)
    drag.current = { key, mode, startX: e.clientX, startY: e.clientY, orig }
  }

  const moveDrag = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || !scale) return
    const dx = (e.clientX - d.startX) / scale
    const dy = (e.clientY - d.startY) / scale
    if (d.mode === 'resize') {
      update(d.key, { width: r2(clamp(d.orig.width + dx, 20, pw - d.orig.x)) })
      return
    }
    let x = clamp(d.orig.x + dx, 0, Math.max(0, pw - d.orig.width))
    const centred = pw / 2 - d.orig.width / 2
    const snap = Math.abs(x - centred) <= SNAP_PX / scale
    if (snap) x = centred
    setGuide(snap)
    update(d.key, { x: r2(x), y: r2(clamp(d.orig.y + dy, 0, ph - 4)) })
  }

  const endDrag = () => { drag.current = null; setGuide(false) }

  const nudge = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const move = moves[e.key]
    if (!move || !selected?.enabled) return
    e.preventDefault()
    update(selected.key, {
      x: r2(clamp(selected.x + move[0], 0, Math.max(0, pw - selected.width))),
      y: r2(clamp(selected.y + move[1], 0, ph - 4)),
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const saved = await spotApi.saveTemplate(template.id, { name: name.trim() || template.name, fields, emailSubject, emailBody })
      // Adopt the server's normalised copy so the form isn't left looking dirty.
      setName(saved.name)
      setFields(saved.fields)
      setEmailSubject(saved.emailSubject)
      setEmailBody(saved.emailBody)
      onSaved(saved)
      toast.success('Template saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const runPreview = async () => {
    setPreviewing(true)
    try {
      const { blob, warnings } = await spotApi.render(template.id, samples, fields)
      setPreview({ blob, warnings, fileName: `${name || 'Certificate'} - preview.pdf` })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Preview failed')
    } finally {
      setPreviewing(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete the template “${template.name}”? Certificates already sent stay in the send log.`)) return
    try {
      await spotApi.deleteTemplate(template.id)
      toast.success('Template deleted')
      onDeleted(template.id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const insertPlaceholder = (token: string) => {
    const el = bodyRef.current
    if (!el) { setEmailBody((b) => b + token); return }
    const start = el.selectionStart ?? emailBody.length
    const end = el.selectionEnd ?? start
    setEmailBody(emailBody.slice(0, start) + token + emailBody.slice(end))
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length) })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="tpl-name" className="text-xs">Template name</Label>
          <Input id="tpl-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        </div>
        {dirty && <span className="pb-2 text-xs font-medium text-amber-600">Unsaved changes</span>}
        <Button variant="outline" onClick={runPreview} disabled={previewing || !scale}>
          {previewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}Preview PDF
        </Button>
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
        </Button>
        <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={remove}>
          <Trash2 className="mr-2 h-4 w-4" />Delete
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div ref={containerRef} className="w-full">
            {pdfError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{pdfError}</div>
            ) : (
              <div
                ref={pageRef}
                tabIndex={0}
                onKeyDown={nudge}
                className="relative mx-auto bg-white shadow-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                style={{ width: scale ? pw * scale : '100%' }}
              >
                <canvas ref={canvasRef} className={scale ? 'block' : 'hidden'} />
                {!scale && (
                  <div className="flex h-72 items-center justify-center text-sm text-gray-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading template…
                  </div>
                )}
                {scale > 0 && guide && (
                  <div className="pointer-events-none absolute inset-y-0 w-px bg-pink-500" style={{ left: (pw / 2) * scale }} />
                )}
                {scale > 0 &&
                  fields.map((f) => {
                    if (!f.enabled) return null
                    const isSelected = f.key === selectedKey
                    return (
                      <div
                        key={f.key}
                        onPointerDown={(e) => startDrag(e, f.key, 'move')}
                        onPointerMove={moveDrag}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        className={`absolute cursor-move touch-none select-none ${
                          isSelected ? 'outline outline-2 outline-blue-600' : 'outline-dashed outline-1 outline-blue-400 hover:outline-blue-600'
                        }`}
                        style={{ left: f.x * scale, top: f.y * scale, width: f.width * scale, height: f.fontSize * 1.2 * f.maxLines * scale }}
                      >
                        <div
                          className="pointer-events-none h-full w-full overflow-hidden"
                          style={{
                            ...fontCss(f.font),
                            fontSize: f.fontSize * scale,
                            lineHeight: 1.2,
                            color: f.color,
                            textAlign: f.align,
                            textTransform: f.uppercase ? 'uppercase' : 'none',
                            whiteSpace: f.maxLines > 1 ? 'normal' : 'nowrap',
                          }}
                        >
                          {samples[f.key] || f.label}
                        </div>
                        <span className="pointer-events-none absolute -top-5 left-0 whitespace-nowrap rounded bg-blue-600 px-1.5 text-[10px] font-medium leading-4 text-white">
                          {f.label}
                        </span>
                        {isSelected && (
                          <div
                            onPointerDown={(e) => startDrag(e, f.key, 'resize')}
                            onPointerMove={moveDrag}
                            onPointerUp={endDrag}
                            onPointerCancel={endDrag}
                            title="Drag to change the width"
                            className="absolute -right-1.5 top-1/2 h-5 w-3 -translate-y-1/2 cursor-ew-resize rounded-sm border border-white bg-blue-600"
                          />
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Drag a box to move it, and its right handle to change the width. Arrow keys nudge the selected box (Shift for 10pt).
            On-screen fonts are approximate — <strong>Preview PDF</strong> shows the exact result.
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Fields</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                {fields.map((f) => (
                  <div
                    key={f.key}
                    className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 ${
                      f.key === selectedKey ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <button type="button" className="flex-1 text-left text-sm font-medium" onClick={() => setSelectedKey(f.key)}>
                      {f.label}
                    </button>
                    <Switch
                      checked={f.enabled}
                      disabled={f.key === 'name'}
                      aria-label={`Print ${f.label}`}
                      onCheckedChange={(on) => { update(f.key, { enabled: on }); if (on) setSelectedKey(f.key) }}
                    />
                  </div>
                ))}
              </div>

              {selected && (
                <div className="space-y-3 border-t pt-3">
                  <div>
                    <Label className="text-xs">Sample text (for preview only)</Label>
                    <Input value={samples[selected.key] ?? ''} onChange={(e) => setSamples((s) => ({ ...s, [selected.key]: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs">Font</Label>
                      <select className={selectClass} value={selected.font} onChange={(e) => update(selected.key, { font: e.target.value as SpotField['font'] })}>
                        {SPOT_FONTS.map((font) => <option key={font} value={font}>{font.replace(/-/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Size (pt)</Label>
                      <Input type="number" min={4} max={200} step={0.5} value={selected.fontSize}
                        onChange={(e) => update(selected.key, { fontSize: clamp(Number(e.target.value) || selected.fontSize, 4, 200) })} />
                    </div>
                    <div>
                      <Label className="text-xs">Colour</Label>
                      <input type="color" className="h-9 w-full cursor-pointer rounded-md border border-input bg-background p-1" value={selected.color}
                        onChange={(e) => update(selected.key, { color: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Max lines</Label>
                      <select className={selectClass} value={selected.maxLines} onChange={(e) => update(selected.key, { maxLines: Number(e.target.value) })}>
                        {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Align</Label>
                      <div className="flex h-9 overflow-hidden rounded-md border border-input">
                        {(['left', 'center', 'right'] as SpotAlign[]).map((a) => {
                          const Icon = ALIGN_ICONS[a]
                          return (
                            <button key={a} type="button" aria-label={`Align ${a}`} onClick={() => update(selected.key, { align: a })}
                              className={`flex flex-1 items-center justify-center ${selected.align === a ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                              <Icon className="h-4 w-4" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">X (pt)</Label>
                      <Input type="number" step={1} value={selected.x} onChange={(e) => update(selected.key, { x: clamp(Number(e.target.value) || 0, 0, pw) })} />
                    </div>
                    <div>
                      <Label className="text-xs">Y (pt)</Label>
                      <Input type="number" step={1} value={selected.y} onChange={(e) => update(selected.key, { y: clamp(Number(e.target.value) || 0, 0, ph) })} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Box width (pt)</Label>
                      <Input type="number" min={20} step={1} value={selected.width}
                        onChange={(e) => update(selected.key, { width: clamp(Number(e.target.value) || selected.width, 20, pw) })} />
                    </div>
                  </div>
                  <label className="flex items-center justify-between text-sm">
                    UPPERCASE
                    <Switch checked={selected.uppercase} onCheckedChange={(on) => update(selected.key, { uppercase: on })} />
                  </label>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => update(selected.key, { x: r2((pw - selected.width) / 2) })}>
                    <Crosshair className="mr-2 h-4 w-4" />Centre horizontally
                  </Button>
                  <p className="text-xs text-gray-500">
                    Page {Math.round(pw)} × {Math.round(ph)} pt. Text that's too long shrinks to fit the box, wrapping up to the max lines.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Email</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="tpl-subject" className="text-xs">Subject</Label>
                <Input id="tpl-subject" value={emailSubject} maxLength={300} onChange={(e) => setEmailSubject(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="tpl-body" className="text-xs">Message</Label>
                <Textarea id="tpl-body" ref={bodyRef} rows={8} value={emailBody} maxLength={5000} onChange={(e) => setEmailBody(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map((p) => (
                  <button key={p} type="button" onClick={() => insertPlaceholder(p)}
                    className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[11px] text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    {p}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">The certificate is attached as a PDF. A blank line starts a new paragraph.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <PreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
