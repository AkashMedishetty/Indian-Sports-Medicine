/**
 * Session Validator - Production-specific session validation
 * Helps prevent session conflicts and race conditions
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logAuthDebug, logAuthError } from './auth-debug'

interface SessionValidationResult {
    isValid: boolean
    session: any
    error?: string
    debugInfo?: any
}

/**
 * Validate session with enhanced error handling for production
 */
export async function validateSession(request?: any): Promise<SessionValidationResult> {
    try {
        const startTime = Date.now()

        // Get session with timeout to prevent hanging
        const sessionPromise = getServerSession(authOptions)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Session validation timeout')), 5000)
        })

        const session = await Promise.race([sessionPromise, timeoutPromise]) as any
        const validationTime = Date.now() - startTime

        const debugInfo = {
            validationTime,
            hasSession: !!session,
            userId: session?.user?.id,
            sessionId: session?.sessionId,
            deviceId: session?.deviceId,
            environment: process.env.NODE_ENV
        }

        // Log debug info
        logAuthDebug({
            sessionInfo: {
                hasSession: !!session,
                userId: session?.user?.id,
                sessionId: session?.sessionId,
                deviceId: session?.deviceId
            }
        }, 'SESSION_VALIDATION')

        if (session) {
            return {
                isValid: true,
                session,
                debugInfo
            }
        } else {
            return {
                isValid: false,
                session: null,
                debugInfo
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown session validation error'

        logAuthError(error instanceof Error ? error : new Error(errorMessage), 'SESSION_VALIDATION', {
            url: request?.url,
            userAgent: request?.headers?.get?.('user-agent')?.substring(0, 50)
        })

        return {
            isValid: false,
            session: null,
            error: errorMessage,
            debugInfo: {
                error: errorMessage,
                timestamp: new Date().toISOString()
            }
        }
    }
}

/**
 * Check if session is expired or invalid
 */
export function isSessionExpired(session: any): boolean {
    if (!session) return true

    try {
        const now = Date.now()
        const loginTime = session.loginTime || 0
        const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

        return (now - loginTime) > maxAge
    } catch (error) {
        logAuthError(error instanceof Error ? error : new Error('Session expiry check failed'), 'SESSION_EXPIRY_CHECK')
        return true
    }
}

/**
 * Validate session for API routes
 */
export async function validateApiSession(request: Request): Promise<SessionValidationResult> {
    try {
        const result = await validateSession(request)

        if (!result.isValid) {
            return {
                isValid: false,
                session: null,
                error: 'No valid session found',
                debugInfo: result.debugInfo
            }
        }

        if (isSessionExpired(result.session)) {
            return {
                isValid: false,
                session: null,
                error: 'Session expired',
                debugInfo: { ...result.debugInfo, expired: true }
            }
        }

        return result
    } catch (error) {
        logAuthError(error instanceof Error ? error : new Error('API session validation failed'), 'API_SESSION_VALIDATION')
        return {
            isValid: false,
            session: null,
            error: error instanceof Error ? error.message : 'API session validation failed'
        }
    }
}

/**
 * Create session response headers for debugging
 */
export function createSessionHeaders(session: any): Record<string, string> {
    const headers: Record<string, string> = {}

    if (session) {
        headers['X-Session-Valid'] = 'true'
        headers['X-Session-User'] = session.user?.id || 'unknown'
        headers['X-Session-Device'] = session.deviceId || 'unknown'

        if (process.env.NODE_ENV === 'development') {
            headers['X-Session-Debug'] = JSON.stringify({
                sessionId: session.sessionId,
                loginTime: session.loginTime,
                lastValidated: session.lastValidated
            })
        }
    } else {
        headers['X-Session-Valid'] = 'false'
    }

    return headers
}

/**
 * Middleware helper for session validation
 */
export async function validateMiddlewareSession(request: any): Promise<{
    hasValidSession: boolean
    sessionInfo?: any
    shouldRedirect: boolean
    redirectUrl?: string
}> {
    try {
        // For middleware, we can only check cookies, not full session
        const sessionCookie = request.cookies.get(
            process.env.NODE_ENV === 'production'
                ? '__Secure-next-auth.session-token'
                : 'next-auth.session-token'
        )

        const hasValidSession = !!sessionCookie

        logAuthDebug({
            sessionInfo: {
                hasSession: hasValidSession
            },
            // Add cookieName as a separate property in the debug info
            cookieName: process.env.NODE_ENV === 'production'
                ? '__Secure-next-auth.session-token'
                : 'next-auth.session-token'
        }, 'MIDDLEWARE_SESSION_CHECK')

        return {
            hasValidSession,
            sessionInfo: hasValidSession ? { hasCookie: true } : null,
            shouldRedirect: !hasValidSession,
            redirectUrl: !hasValidSession ? '/auth/login' : undefined
        }
    } catch (error) {
        logAuthError(error instanceof Error ? error : new Error('Middleware session validation failed'), 'MIDDLEWARE_SESSION_VALIDATION')
        return {
            hasValidSession: false,
            shouldRedirect: true,
            redirectUrl: '/auth/login'
        }
    }
}