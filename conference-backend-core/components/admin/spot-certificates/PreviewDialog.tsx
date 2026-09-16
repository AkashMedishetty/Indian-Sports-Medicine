'use client'

import { useEffect, useMemo } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import { Button } from '../../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog'

export interface PreviewState {
  blob: Blob
  warnings: string[]
  fileName: string
}

export function PreviewDialog({ preview, onClose }: { preview: PreviewState | null; onClose: () => void }) {
  const url = useMemo(() => (preview ? URL.createObjectURL(preview.blob) : ''), [preview])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  return (
    <Dialog open={!!preview} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Certificate preview</DialogTitle>
          <DialogDescription>This is exactly the PDF that gets attached to the email.</DialogDescription>
        </DialogHeader>
        {preview && preview.warnings.length > 0 && (
          <div className="space-y-1 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            {preview.warnings.map((w, i) => (
              <p key={i} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{w}</p>
            ))}
          </div>
        )}
        {url && <iframe title="Certificate preview" src={url} className="h-[68vh] w-full rounded border" />}
        <div className="flex justify-end">
          <a href={url} download={preview?.fileName}>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" />Download PDF</Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
