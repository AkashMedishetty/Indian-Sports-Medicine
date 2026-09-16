'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CERT_LABEL,
  CERT_TYPES,
  type DeskRecord,
  type DeskStats,
} from '@/conference-backend-core/lib/certificate-desk/types'

/**
 * Admin control for the certificate desks: issue the shared code, watch live
 * counts per type and per desk, and download the distribution workbook.
 */

const BRAND = '#1D528C'
const GOLD = '#C18D21'
const RED = '#AC1D26'

interface Settings {
  hasCode: boolean
  codeHint: string
  codeVersion: number
  enabled: boolean
  rotatedAt: string | null
  rotatedBy: string
}

export default function CertificateDeskAdminPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [stats, setStats] = useState<DeskStats | null>(null)
  const [recent, setRecent] = useState<DeskRecord[]>([])
  const [freshCode, setFreshCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/certificate-desk/settings', { cache: 'no-store' })
      const data = await res.json()
      if (!data.success) throw new Error(data.message ?? 'Could not load')
      setSettings(data.settings)
      setStats(data.stats)
      setRecent(data.recent ?? [])
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [load])

  const act = async (action: string) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/certificate-desk/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message ?? 'Failed')
      if (data.code) setFreshCode(data.code)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const scanUrl = typeof window !== 'undefined' ? `${window.location.origin}/scan` : '/scan'

  return (
    <main style={{ padding: 24, maxWidth: 1180, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: BRAND, fontSize: 26, margin: 0 }}>Certificate desks</h1>
      <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
        Poster, paper and participation certificate collection. Desks join at{' '}
        <code style={{ background: '#f0f2f5', padding: '2px 6px', borderRadius: 4 }}>{scanUrl}</code>
      </p>

      {error && <div style={{ background: '#fdecea', color: RED, padding: 12, borderRadius: 8, marginTop: 12 }}>{error}</div>}

      {/* ---------------------------------------------------------- access */}
      <section style={{ background: '#fff', border: '1px solid #e3e7ec', borderRadius: 12, padding: 18, marginTop: 18 }}>
        <h2 style={{ margin: 0, fontSize: 17, color: BRAND }}>Desk access code</h2>
        {settings && (
          <p style={{ color: '#666', fontSize: 13.5, marginTop: 6 }}>
            {settings.hasCode
              ? `A code is set (ends ${settings.codeHint}), version ${settings.codeVersion}. Scanning is ${settings.enabled ? 'ENABLED' : 'DISABLED'}.`
              : 'No code has been generated yet — desks cannot join until you generate one.'}
            {settings.rotatedAt && ` Last rotated ${new Date(settings.rotatedAt).toLocaleString('en-IN')} by ${settings.rotatedBy}.`}
          </p>
        )}

        {freshCode && (
          <div style={{ background: '#fff8e6', border: `2px solid ${GOLD}`, borderRadius: 10, padding: 16, margin: '12px 0' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: '#8a6a00' }}>
              New desk code — shown once, copy it now
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 4, fontFamily: 'ui-monospace, monospace', margin: '6px 0' }}>
              {freshCode}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              It is stored hashed and cannot be shown again. Every desk that was already open must enter this new code.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          <button
            onClick={() => void act('rotate')}
            disabled={busy}
            style={{ padding: '10px 16px', fontWeight: 700, color: '#fff', background: BRAND, border: 0, borderRadius: 8, cursor: 'pointer' }}
          >
            {settings?.hasCode ? 'Generate a new code' : 'Generate the desk code'}
          </button>
          {settings?.hasCode && (
            <button
              onClick={() => void act(settings.enabled ? 'disable' : 'enable')}
              disabled={busy}
              style={{ padding: '10px 16px', fontWeight: 700, border: '1px solid #ccc', background: '#fff', borderRadius: 8, cursor: 'pointer' }}
            >
              {settings.enabled ? 'Disable scanning' : 'Enable scanning'}
            </button>
          )}
          <a
            href="/api/admin/certificate-desk/export"
            style={{ padding: '10px 16px', fontWeight: 700, color: '#fff', background: GOLD, borderRadius: 8, textDecoration: 'none' }}
          >
            Download XLSX
          </a>
        </div>
      </section>

      {/* ----------------------------------------------------------- counts */}
      {stats && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            {CERT_TYPES.map((t) => {
              const s = stats.types[t]
              const pending = Math.max(0, s.eligible - s.collected)
              return (
                <div key={t} style={{ flex: '1 1 220px', background: '#fff', border: '1px solid #e3e7ec', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#888' }}>{CERT_LABEL[t]}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: BRAND }}>
                    {s.collected}
                    <span style={{ fontSize: 15, color: '#888', fontWeight: 500 }}> / {s.eligible}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>{pending} pending</div>
                  {s.overrides > 0 && <div style={{ fontSize: 12, color: GOLD }}>{s.overrides} override{s.overrides === 1 ? '' : 's'}</div>}
                </div>
              )
            })}
          </div>

          <section style={{ background: '#fff', border: '1px solid #e3e7ec', borderRadius: 12, padding: 18, marginTop: 18 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 17, color: BRAND }}>Per desk</h2>
            {stats.desks.length === 0 && <p style={{ color: '#888', fontSize: 14, margin: 0 }}>No desk has scanned yet.</p>}
            {stats.desks.map((d) => (
              <div key={d.deskName} style={{ display: 'flex', gap: 12, borderTop: '1px solid #eee', padding: '8px 0', fontSize: 14 }}>
                <strong style={{ flex: 1 }}>{d.deskName}</strong>
                <span style={{ color: '#666' }}>
                  {CERT_TYPES.filter((t) => d.byType[t]).map((t) => `${CERT_LABEL[t]} ${d.byType[t]}`).join(' · ')}
                </span>
                <strong style={{ color: BRAND, minWidth: 40, textAlign: 'right' }}>{d.total}</strong>
              </div>
            ))}
          </section>
        </>
      )}

      {/* ----------------------------------------------------------- recent */}
      <section style={{ background: '#fff', border: '1px solid #e3e7ec', borderRadius: 12, padding: 18, marginTop: 18 }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 17, color: BRAND }}>All desks — latest {recent.length}</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                <th style={{ padding: '6px 8px' }}>Time</th>
                <th style={{ padding: '6px 8px' }}>Reg ID</th>
                <th style={{ padding: '6px 8px' }}>Name</th>
                <th style={{ padding: '6px 8px' }}>Type</th>
                <th style={{ padding: '6px 8px' }}>Abstract</th>
                <th style={{ padding: '6px 8px' }}>Desk</th>
                <th style={{ padding: '6px 8px' }}>Flags</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #eee', opacity: r.active ? 1 : 0.45 }}>
                  <td style={{ padding: '6px 8px', color: '#666' }}>{new Date(r.collectedAt).toLocaleTimeString('en-IN', { hour12: true })}</td>
                  <td style={{ padding: '6px 8px' }}>{r.registrationId}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '6px 8px' }}>{CERT_LABEL[r.type]}</td>
                  <td style={{ padding: '6px 8px', color: '#666' }}>{r.abstractId}</td>
                  <td style={{ padding: '6px 8px' }}>{r.deskName}</td>
                  <td style={{ padding: '6px 8px' }}>
                    {r.override && <span style={{ color: GOLD, fontWeight: 700 }}>OVERRIDE </span>}
                    {!r.active && <span style={{ color: RED, fontWeight: 700 }}>UNDONE</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
