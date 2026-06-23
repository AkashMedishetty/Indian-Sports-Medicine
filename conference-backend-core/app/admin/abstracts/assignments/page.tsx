"use client"

import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import useSWR from 'swr'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ReviewerAssignmentsPage() {
  const { data, mutate } = useSWR('/api/admin/abstracts/assignments', fetcher)
  const [json, setJson] = useState('')

  const current = data?.data || []

  async function save() {
    try {
      const parsed = JSON.parse(json)
      const res = await fetch('/api/admin/abstracts/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      })
      await res.json()
      mutate()
      setJson('')
    } catch (e) {
      alert('Invalid JSON')
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto py-8 space-y-4">
        <h1 className="text-2xl font-semibold">Reviewer Assignments</h1>
        <p className="text-sm text-gray-500">Rules: [&#123;&#123; track, category?, subcategory?, reviewerIds: [userId], reviewersPerAbstract &#125;&#125;]</p>
        <pre className="text-xs bg-muted p-3 rounded">{JSON.stringify(current, null, 2)}</pre>
        <textarea value={json} onChange={e => setJson(e.target.value)} placeholder="Paste JSON to update" className="w-full h-48 border p-2 rounded" />
        <button onClick={save} className="px-4 py-2 bg-orange-600 text-white rounded">Save</button>
      </div>
    </ProtectedRoute>
  )
}


