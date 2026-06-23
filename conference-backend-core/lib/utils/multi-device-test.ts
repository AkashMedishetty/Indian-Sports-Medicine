/**
 * Multi-Device Authentication Test Utilities
 * Use these functions to test and debug multi-device session issues
 */

export interface DeviceSessionInfo {
    deviceId: string
    loginTime: number
    userAgent: string
    sessionAge: number
    isValid: boolean
}

/**
 * Get current device session information for debugging
 */
export function getCurrentDeviceSession(): DeviceSessionInfo | null {
    if (typeof window === 'undefined') return null

    try {
        // Try to get session info from NextAuth
        const cookies = document.cookie.split(';')
        const sessionCookie = cookies.find(cookie =>
            cookie.trim().startsWith('next-auth.session-token=') ||
            cookie.trim().startsWith('__Secure-next-auth.session-token=')
        )

        if (!sessionCookie) {
            console.log('No session cookie found')
            return null
        }

        // For debugging - log all auth-related cookies
        const authCookies = cookies.filter(cookie =>
            cookie.includes('next-auth') || cookie.includes('nextauth')
        )

        console.log('Auth cookies found:', authCookies.map(c => c.split('=')[0].trim()))

        return {
            deviceId: 'cookie-based-session',
            loginTime: Date.now(), // We can't decode JWT on client side easily
            userAgent: navigator.userAgent.substring(0, 50),
            sessionAge: 0,
            isValid: true
        }
    } catch (error) {
        console.error('Error getting device session info:', error)
        return null
    }
}

/**
 * Test multi-device authentication by simulating different devices
 */
export function testMultiDeviceAuth() {
    console.log('🧪 Multi-Device Authentication Test')
    console.log('=====================================')

    const deviceInfo = getCurrentDeviceSession()
    if (deviceInfo) {
        console.log('✅ Current device session:', deviceInfo)
    } else {
        console.log('❌ No active session found')
    }

    // Log browser info
    console.log('🌐 Browser Info:', {
        userAgent: navigator.userAgent.substring(0, 100),
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
    })

    // Check for potential session conflicts
    const authCookies = document.cookie.split(';').filter(cookie =>
        cookie.includes('next-auth') || cookie.includes('nextauth')
    )

    console.log('🍪 Auth Cookies:', authCookies.length)
    authCookies.forEach(cookie => {
        const [name, value] = cookie.split('=')
        console.log(`  - ${name.trim()}: ${value ? 'present' : 'empty'}`)
    })

    return {
        hasSession: !!deviceInfo,
        cookieCount: authCookies.length,
        browserInfo: navigator.userAgent.substring(0, 50)
    }
}

/**
 * Clear all authentication data for testing
 */
export function clearAllAuthData(): void {
    console.log('🧹 Clearing all authentication data...')

    // Clear cookies
    const cookies = [
        'next-auth.session-token',
        'next-auth.callback-url',
        'next-auth.csrf-token',
        '__Secure-next-auth.session-token',
        '__Secure-next-auth.callback-url',
        '__Host-next-auth.csrf-token'
    ]

    cookies.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
    })

    // Clear storage
    try {
        localStorage.clear()
        sessionStorage.clear()
    } catch (error) {
        console.error('Error clearing storage:', error)
    }

    console.log('✅ Authentication data cleared')
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
    (window as any).testMultiDeviceAuth = testMultiDeviceAuth;
    (window as any).clearAllAuthData = () => clearAllAuthData();
    (window as any).getCurrentDeviceSession = getCurrentDeviceSession;
}