import type { SpotField, SpotValues } from '@/conference-backend-core/lib/certificates/spot-fields'

export interface SpotTemplate {
  id: string
  name: string
  fileName: string
  pageWidth: number
  pageHeight: number
  fields: SpotField[]
  emailSubject: string
  emailBody: string
  updatedAt: string
}

export interface LookupAbstract {
  abstractId: string
  title: string
  track: string
  status: string
}

export interface LookupPerson {
  userId: string
  name: string
  email: string
  registrationId: string
  registrationStatus: string
  abstracts: LookupAbstract[]
}

export type SendSource = 'manual' | 'lookup' | 'csv' | 'resend'

export interface SendRecipient extends SpotValues {
  email: string
}

export interface SendResult {
  index: number
  name: string
  email: string
  success: boolean
  error?: string
  warnings?: string[]
  logId?: string
}

export interface LogRow {
  id: string
  templateId: string
  templateName: string
  name: string
  email: string
  values: SpotValues
  status: 'sent' | 'failed'
  error: string
  source: SendSource
  sentByEmail: string
  createdAt: string
}

const BASE = '/api/admin/spot-certificates'

async function readJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || body?.error || `Request failed (${res.status})`)
  }
  return body as T
}

const jsonInit = (method: string, payload: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})

export const spotApi = {
  async listTemplates(): Promise<SpotTemplate[]> {
    return (await readJson<{ data: SpotTemplate[] }>(await fetch(`${BASE}/templates`, { cache: 'no-store' }))).data
  },

  async uploadTemplate(file: File, name: string): Promise<SpotTemplate> {
    const form = new FormData()
    form.append('file', file)
    form.append('name', name)
    return (await readJson<{ data: SpotTemplate }>(await fetch(`${BASE}/templates`, { method: 'POST', body: form }))).data
  },

  async saveTemplate(
    id: string,
    patch: Partial<Pick<SpotTemplate, 'name' | 'fields' | 'emailSubject' | 'emailBody'>>
  ): Promise<SpotTemplate> {
    return (await readJson<{ data: SpotTemplate }>(await fetch(`${BASE}/templates/${id}`, jsonInit('PUT', patch)))).data
  },

  async deleteTemplate(id: string): Promise<void> {
    await readJson(await fetch(`${BASE}/templates/${id}`, { method: 'DELETE' }))
  },

  async templateFile(id: string): Promise<ArrayBuffer> {
    const res = await fetch(`${BASE}/templates/${id}/file`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Could not load the template PDF (${res.status})`)
    return res.arrayBuffer()
  },

  /** Render a certificate PDF. Pass `fields` to preview unsaved layout changes. */
  async render(templateId: string, values: SpotValues, fields?: SpotField[]): Promise<{ blob: Blob; warnings: string[] }> {
    const res = await fetch(`${BASE}/render`, jsonInit('POST', { templateId, values, fields }))
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message || `Preview failed (${res.status})`)
    }
    let warnings: string[] = []
    try {
      warnings = JSON.parse(decodeURIComponent(res.headers.get('X-Certificate-Warnings') || '%5B%5D'))
    } catch {
      /* warnings are advisory */
    }
    return { blob: await res.blob(), warnings }
  },

  async send(templateId: string, recipients: SendRecipient[], source: SendSource) {
    return readJson<{ sent: number; failed: number; results: SendResult[] }>(
      await fetch(`${BASE}/send`, jsonInit('POST', { templateId, recipients, source }))
    )
  },

  async lookup(q: string, signal?: AbortSignal): Promise<LookupPerson[]> {
    const res = await fetch(`${BASE}/lookup?q=${encodeURIComponent(q)}`, { signal, cache: 'no-store' })
    return (await readJson<{ data: LookupPerson[] }>(res)).data
  },

  async log(limit = 100) {
    return readJson<{ data: LogRow[]; totals: { sent: number; failed: number } }>(
      await fetch(`${BASE}/log?limit=${limit}`, { cache: 'no-store' })
    )
  },
}
