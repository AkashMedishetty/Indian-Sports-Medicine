"use client"

import { useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Navigation } from "../../components/Navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error for diagnostics
    // Reason: help capture intermittent client-only navigation crashes
    console.error("Register page error boundary caught: ", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-sapphire-50 text-gray-800 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 pt-24 text-center">
        <h1 className="text-3xl font-semibold mb-3">Something went wrong</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The register page encountered an issue. You can retry or reload the page safely.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => reset()}>Try again</Button>
          <Button onClick={() => {
            // Force full navigation as a fallback
            if (typeof window !== "undefined") {
              window.location.assign("/register")
            }
          }}>Reload Register Page</Button>
        </div>
        {process.env.NODE_ENV !== "production" && (
          <pre className="mt-6 text-left bg-white/70 dark:bg-black/40 p-4 rounded-lg overflow-auto text-xs">
            {String(error?.message || "")}
          </pre>
        )}
      </div>
    </div>
  )
}


