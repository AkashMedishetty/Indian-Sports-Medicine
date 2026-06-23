"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FinalRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/abstracts')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to abstracts page...</p>
      </div>
    </div>
  )
}

/*
// Old code removed - final submission now handled via modal in AbstractsDashboard

export default function SubmitFinalAbstractPage() {
  const { data } = useSWR('/api/abstracts', fetcher)
  const [abstractId, setAbstractId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/abstracts/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abstractId })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed')
      if (file) {
        const fd = new FormData()
        fd.append('abstractId', abstractId)
        fd.append('stage', 'final')
        fd.append('file', file)
        const up = await fetch('/api/abstracts/upload', { method: 'POST', body: fd })
        const upd = await up.json()
        if (!upd.success) throw new Error(upd.message || 'Upload failed')
      }
      setMessage('Final submitted')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="user">
      <MainLayout currentPage="abstracts" showSearch={true}>
        <div className="container mx-auto py-8 space-y-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-xl font-semibold">Submit Final Abstract</h1>
            <select value={abstractId} onChange={e => setAbstractId(e.target.value)} className="border p-2 w-full">
              <option value="">Select accepted abstract</option>
              {(data?.data || []).filter((a: any) => a.status === 'accepted').map((a: any) => (
                <option key={a.abstractId} value={a.abstractId}>{a.abstractId} · {a.title}</option>
              ))}
            </select>
            <input type="file" accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={e => setFile(e.target.files?.[0] || null)} />
            <button disabled={loading} onClick={submit} className="px-4 py-2 bg-gray-800 text-white rounded">
              {loading ? 'Submitting...' : 'Submit Final'}
            </button>
            {message && <p className="text-sm text-gray-600">{message}</p>}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
*/
