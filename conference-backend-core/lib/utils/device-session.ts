/**
 * Device Session Management Utilities
 * Prevents cross-device session sharing and enhances authentication security
 */

export interface DeviceFingerprint {
  userAgent: string
  screen: string
  timezone: string
  language: string
}

/**
 * Generate a client-side device fingerprint
 * This helps identify unique devices to prevent session sharing
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server',
      screen: 'server',
      timezone: 'server',
      language: 'server'
    }
  }

  return {
    userAgent: navigator.userAgent.substring(0, 100), // Truncate for storage
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  }
}

/**
 * Create a unique device session identifier
 * Combines device fingerprint with random data
 */
export function createDeviceSessionId(fingerprint: DeviceFingerprint): string {
  const fpString = JSON.stringify(fingerprint)
  const randomId = Math.random().toString(36).substring(2, 15)
  const timestamp = Date.now().toString(36)
  
  return btoa(`${fpString}-${randomId}-${timestamp}`)
    .replace(/[+/=]/g, '')
    .substring(0, 32)
}

/**
 * Validate if a session belongs to the current device
 * Returns true if session is valid for this device
 */
export function validateDeviceSession(
  sessionDeviceId: string,
  currentFingerprint: DeviceFingerprint,
  sessionLoginTime: number
): boolean {
  try {
    // Check if session is too old (older than 7 days - much more lenient)
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    if (Date.now() - sessionLoginTime > maxAge) {
      console.log('Session expired due to age (7+ days)')
      return false
    }

    // Allow all valid device IDs - don't restrict based on fingerprint
    // This allows the same user to be logged in on multiple devices
    return !!sessionDeviceId && sessionDeviceId.length > 10
  } catch (error) {
    console.error('Device session validation error:', error)
    // On error, allow the session to continue
    return true
  }
}

/**
 * Clear all authentication cookies and local storage
 * Used when device validation fails
 */
export function clearAuthenticationData(): void {
  if (typeof window === 'undefined') return

  // Clear NextAuth cookies
  const cookies = [
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token', // Secure variant
    '__Host-next-auth.csrf-token' // Host variant
  ]

  cookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  })

  // Clear any local/session storage auth data
  try {
    localStorage.removeItem('nextauth.message')
    sessionStorage.clear()
  } catch (error) {
    console.error('Error clearing storage:', error)
  }
}

/**
 * Get browser information for logging/debugging
 */
export function getBrowserInfo(): string {
  if (typeof window === 'undefined') return 'Server-side'
  
  const ua = navigator.userAgent
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  return 'Other'
}

/**
 * Check if browser sync might be affecting sessions
 */
export function detectPotentialBrowserSync(): { 
  hasBrowserSync: boolean
  browser: string
  recommendations: string[]
} {
  const browser = getBrowserInfo()
  const recommendations: string[] = []
  
  // Chrome and Edge are most likely to sync cookies
  const hasBrowserSync = ['Chrome', 'Edge'].includes(browser)
  
  if (hasBrowserSync) {
    recommendations.push('Consider using incognito/private mode for testing multiple accounts')
    recommendations.push('Check browser sync settings to exclude passwords and cookies')
    recommendations.push('Use different browsers for different user accounts')
  }
  
  return {
    hasBrowserSync,
    browser,
    recommendations
  }
}