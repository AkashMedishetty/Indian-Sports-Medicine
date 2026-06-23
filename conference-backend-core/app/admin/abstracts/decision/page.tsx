"use client"

import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import useSWR from 'swr'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminDecisionPage() {
  const { data, mutate } = useSWR('/api/admin/abstracts/export', fetcher)
  const [processing, setProcessing] = useState<string | null>(null)

  async function decide(abstractId: string, decision: 'accepted' | 'rejected') {
    setProcessing(abstractId)
    try {
      await fetch('/api/admin/abstracts/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abstractId, decision })
      })
      mutate()
    } finally {
      setProcessing(null)
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto py-8 space-y-4">
        <h1 className="text-2xl font-semibold">Abstract Decisions</h1>
        <ul className="space-y-2">
          {(data?.data || []).map((a: any) => (
            <li key={a.abstractId} className="p-3 border rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-xs text-gray-500">{a.abstractId} · {a.status}</div>
                </div>
                <div className="flex gap-2">
                  <button disabled={!!processing} onClick={() => decide(a.abstractId, 'accepted')} className="px-3 py-1 bg-green-600 text-white rounded">{processing === a.abstractId ? '...' : 'Accept'}</button>
                  <button disabled={!!processing} onClick={() => decide(a.abstractId, 'rejected')} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ProtectedRoute>
  )
}


