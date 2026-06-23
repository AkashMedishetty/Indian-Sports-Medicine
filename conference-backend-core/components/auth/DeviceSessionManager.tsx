'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { 
  generateDeviceFingerprint, 
  createDeviceSessionId, 
  validateDeviceSession,
  clearAuthenticationData,
  detectPotentialBrowserSync,
  getBrowserInfo
} from '@/lib/utils/device-session'
import { redirectGuard, withAuthTimeout } from '@/lib/utils/redirect-guard'

interface DeviceSessionManagerProps {
  children?: React.ReactNode
}

export function DeviceSessionManager({ children }: DeviceSessionManagerProps) {
  const { data: session, status } = useSession()

  // TEMPORARILY DISABLE ALL DEVICE SESSION VALIDATION
  // This is causing the multi-device session conflicts
  
  console.log('🔧 DeviceSessionManager: DISABLED for multi-device testing', {
    status,
    hasSession: !!session,
    userEmail: session?.user?.email
  })

  // Just render children without any validation
  return <>{children}</>
}

/**
 * Hook to get device session information
 */
export function useDeviceSession() {
  const { data: session } = useSession()
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fingerprint = generateDeviceFingerprint()
      const syncInfo = detectPotentialBrowserSync()
      
      setDeviceInfo({
        fingerprint,
        browser: getBrowserInfo(),
        syncInfo,
        sessionDeviceId: (session as any)?.deviceId,
        sessionLoginTime: (session as any)?.loginTime
      })
    }
  }, [session])

  return deviceInfo
}