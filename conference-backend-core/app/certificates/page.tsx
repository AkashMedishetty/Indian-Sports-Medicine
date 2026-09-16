"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { AlertTriangle, Award, Camera, Download, ExternalLink, Eye, FileText, Loader2, Presentation, Search } from "lucide-react"
import { Navigation } from "../../components/Navigation"
import { conferenceConfig } from "../../config/conference.config"
import { EVENT_PHOTOS_URL, PHOTO_STEPS } from "../../lib/certificates/post-event"

type Kind = "participation" | "poster" | "paper"

interface Certificate {
  kind: Kind
  label: string
  abstractId: string
  title: string
  url: string
}

interface Found {
  name: string
  registrationId: string
  certificates: Certificate[]
}

const KIND_ICON = { participation: Award, poster: Presentation, paper: FileText } as const

const NOTICES: Record<string, string> = {
  expired: "That download link has expired. Search again to get a fresh one.",
  unavailable: "That certificate isn't available. Search again, or contact us if this keeps happening.",
  busy: "Too many downloads from your network. Please wait a few minutes and try again.",
  error: "Something went wrong preparing your certificate. Please try again.",
}

export default function CertificatesPage() {
  const { shortName, contact } = conferenceConfig
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState<Found | null>(null)
  const inFlight = useRef<AbortController | null>(null)

  const search = useCallback(async (raw: string) => {
    const q = raw.trim()
    if (!q) {
      setError("Enter your registration ID or email address.")
      return
    }
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller
    setLoading(true)
    setError(null)
    setFound(null)
    try {
      const res = await fetch("/api/certificates/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        setError(json?.message || "Something went wrong. Please try again.")
        return
      }
      setFound(json.data)
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Couldn't reach the server. Check your connection and try again.")
    } finally {
      if (inFlight.current === controller) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Email links carry the registration ID in the fragment, which never reaches the server.
    let fromHash = ""
    try {
      fromHash = decodeURIComponent(window.location.hash.replace(/^#/, "")).trim()
    } catch {
      /* malformed fragment: ignore */
    }
    const notice = new URLSearchParams(window.location.search).get("notice")
    if (notice && NOTICES[notice]) setError(NOTICES[notice])
    if (fromHash || notice) window.history.replaceState(null, "", window.location.pathname)
    if (fromHash) {
      setQuery(fromHash)
      search(fromHash)
    }
  }, [search])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    search(query)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="mx-auto max-w-3xl px-4 pt-28 pb-16 lg:pt-32">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Award className="h-3.5 w-3.5" aria-hidden />
            {shortName}
          </span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">Download your certificates</h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-gray-300">
            Enter your registration ID or the email address you registered with. No password is needed.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900">
          <label htmlFor="certificate-query" className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Registration ID or email
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="certificate-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="IASMCON2026-123 or you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="email"
              className="h-12 w-full min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
              {loading ? "Searching" : "Find certificates"}
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Every delegate can download a participation certificate. Paper and poster presenters can also download a
            certificate for their presentation.
          </p>
        </form>

        <div aria-live="polite">
          {error && (
            <div className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>{error}</p>
            </div>
          )}

          {found && (
            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">Certificates for</p>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{found.name}</h2>
              {found.registrationId && <p className="text-sm text-gray-500 dark:text-gray-400">{found.registrationId}</p>}

              {found.certificates.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  No certificates are available yet. Please write to{" "}
                  <a className="text-primary underline" href={`mailto:${contact.email}`}>{contact.email}</a>.
                </p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {found.certificates.map((c) => {
                    const Icon = KIND_ICON[c.kind]
                    return (
                      <li key={`${c.kind}:${c.abstractId}`} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center dark:border-gray-700">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white">{c.label}</p>
                            {c.title && (
                              <p className="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                                {c.abstractId && <span className="font-medium">{c.abstractId} · </span>}
                                {c.title}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <a
                            href={`${c.url}&view=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:flex-none dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <Eye className="h-4 w-4" aria-hidden />
                            View
                          </a>
                          <a
                            href={c.url}
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 sm:flex-none"
                          >
                            <Download className="h-4 w-4" aria-hidden />
                            Download
                          </a>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}
        </div>

        <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Camera className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Event photos</h2>
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Browse every photo from {shortName} and find the ones you're in.</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
            {PHOTO_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <a
            href={EVENT_PHOTOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-primary px-4 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            Open event photos
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </section>

      </main>
    </div>
  )
}
