"use client"

import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"

interface SessionState {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  hasSession: boolean
  userEmail?: string
  sessionId?: string
  lastChange: number
}

/**
 * Simplified SessionStabilizer - minimal overhead for better performance
 */
export function SessionStabilizer({ children }: { children: React.ReactNode }) {
  // Just pass through children without complex stabilization logic
  return <>{children}</>
}

/**
 * Simplified hook - just returns the session directly
 */
export function useStableSession() {
  const { data: session, status } = useSession()
  
  return {
    session,
    status,
    isStable: status !== 'loading',
    isLoading: status === 'loading'
  }
}