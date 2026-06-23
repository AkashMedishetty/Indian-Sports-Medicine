"use client"

import { useEffect, useMemo, useState } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core'
import useSWR from 'swr'

type Track = {
  key: string
  label: string
  enabled: boolean
  categories?: { key: string; label: string; enabled: boolean; subcategories?: { key: string; label: string; enabled: boolean }[] }[]
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function AbstractsManager() {
  const { data, mutate } = useSWR('/api/admin/abstracts/config', fetcher)
  const [tracks, setTracks] = useState<Track[]>([])

  useEffect(() => {
    if (data?.data?.tracks) setTracks(data.data.tracks)
  }, [data])

  function toggleEnabled(path: string[]) {
    setTracks(prev => {
      const next = structuredClone(prev) as Track[]
      let ref: any = next
      for (let i = 0; i < path.length - 1; i++) {
        ref = ref[path[i]]
      }
      ref[path[path.length - 1]] = !ref[path[path.length - 1]]
      return next
    })
  }

  function addTrack() {
    setTracks(prev => [...prev, { key: `track-${prev.length + 1}`, label: 'New Track', enabled: true }])
  }

  async function save() {
    const payload = { ...(data?.data || {}), tracks }
    await fetch('/api/admin/abstracts/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    mutate()
  }

  const sensors = useSensors(useSensor(PointerSensor))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tracks / Categories</h2>
        <div className="space-x-2">
          <button onClick={addTrack} className="px-3 py-1 border rounded">Add Track</button>
          <button onClick={save} className="px-3 py-1 bg-[#25406b] text-white rounded">Save</button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return
        const oldIndex = tracks.findIndex(t => t.key === String(active.id))
        const newIndex = tracks.findIndex(t => t.key === String(over.id))
        setTracks(items => arrayMove(items, oldIndex, newIndex))
      }}>
        <SortableContext items={tracks.map(t => t.key)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tracks.map((t, ti) => (
              <div key={t.key} id={t.key} className="border rounded p-3">
            <div className="flex items-center gap-3">
              <input value={t.label} onChange={e => setTracks(s => { const n = [...s]; n[ti] = { ...n[ti], label: e.target.value }; return n })} className="border p-1 rounded" />
              <code className="text-xs text-gray-500">{t.key}</code>
              <label className="ml-auto text-sm flex items-center gap-2">
                <input type="checkbox" checked={t.enabled} onChange={() => setTracks(s => { const n = [...s]; n[ti] = { ...n[ti], enabled: !n[ti].enabled }; return n })} />
                Enabled
              </label>
            </div>
            <div className="mt-2 pl-4 border-l space-y-2">
                  {(t.categories || []).map((c, ci) => (
                    <div key={c.key} className="p-2 rounded border">
                  <div className="flex items-center gap-3">
                    <input value={c.label} onChange={e => setTracks(s => { const n = [...s]; (n[ti].categories = n[ti].categories || []); n[ti].categories![ci] = { ...n[ti].categories![ci], label: e.target.value }; return n })} className="border p-1 rounded" />
                    <code className="text-xs text-gray-500">{c.key}</code>
                    <label className="ml-auto text-sm flex items-center gap-2">
                      <input type="checkbox" checked={c.enabled} onChange={() => setTracks(s => { const n = [...s]; n[ti].categories![ci].enabled = !n[ti].categories![ci].enabled; return n })} />
                      Enabled
                    </label>
                  </div>
                  <div className="mt-2 pl-4 border-l space-y-1">
                    {(c.subcategories || []).map((sc, si) => (
                      <div key={sc.key} className="flex items-center gap-3">
                        <input value={sc.label} onChange={e => setTracks(s => { const n = [...s]; (n[ti].categories![ci].subcategories = n[ti].categories![ci].subcategories || []); n[ti].categories![ci].subcategories![si] = { ...n[ti].categories![ci].subcategories![si], label: e.target.value }; return n })} className="border p-1 rounded" />
                        <code className="text-xs text-gray-500">{sc.key}</code>
                        <label className="ml-auto text-sm flex items-center gap-2">
                          <input type="checkbox" checked={sc.enabled} onChange={() => setTracks(s => { const n = [...s]; n[ti].categories![ci].subcategories![si].enabled = !n[ti].categories![ci].subcategories![si].enabled; return n })} />
                          Enabled
                        </label>
                      </div>
                    ))}
                    <button onClick={() => setTracks(s => { const n = [...s]; (n[ti].categories![ci].subcategories = n[ti].categories![ci].subcategories || []); n[ti].categories![ci].subcategories!.push({ key: `sub-${(c.subcategories?.length || 0) + 1}`, label: 'New Sub', enabled: true }); return n })} className="text-xs px-2 py-1 border rounded">Add Subcategory</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setTracks(s => { const n = [...s]; (n[ti].categories = n[ti].categories || []); n[ti].categories!.push({ key: `cat-${(t.categories?.length || 0) + 1}`, label: 'New Category', enabled: true }); return n })} className="text-xs px-2 py-1 border rounded">Add Category</button>
            </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}


