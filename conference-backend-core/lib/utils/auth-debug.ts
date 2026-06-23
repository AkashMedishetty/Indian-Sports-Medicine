/**
 * Authentication Debug Utility
 * Helps debug production authentication issues
 */

interface AuthDebugInfo {
  timestamp: string
  environment: string
  url: string
  userAgent?: string
  cookies: string[]
  sessionInfo?: {
    hasSession: boolean
    userId?: string
    sessionId?: string
    deviceId?: string
  }
  error?: string
  // Additional debug properties
  cookieName?: string
  [key: string]: any // Allow additional properties for debugging
}

class AuthDebugger {
  private static instance: AuthDebugger
  private logs: AuthDebugInfo[] = []
  private readonly MAX_LOGS = 50

  static getInstance(): AuthDebugger {
    if (!AuthDebugger.instance) {
      AuthDebugger.instance = new AuthDebugger()
    }
    return AuthDebugger.instance
  }

  /**
   * Log authentication debug information
   */
  log(info: Partial<AuthDebugInfo>, context: string = 'unknown') {
    const debugInfo: AuthDebugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent?.substring(0, 50) : undefined,
      cookies: typeof document !== 'undefined' 
        ? document.cookie.split(';').map(c => c.trim().split('=')[0])
        : [],
      ...info
    }

    this.logs.push(debugInfo)

    // Keep only recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift()
    }

    // Log to console in development or with reduced frequency in production
    if (process.env.NODE_ENV === 'development' || Math.random() < 0.1) {
      console.log(`🔍 AuthDebug [${context}]:`, debugInfo)
    }
  }

  /**
   * Log authentication error
   */
  logError(error: string | Error, context: string = 'unknown', additionalInfo?: any) {
    const errorMessage = error instanceof Error ? error.message : error
    
    this.log({
      error: errorMessage,
      ...additionalInfo
    }, `ERROR-${context}`)

    // Always log errors
    console.error(`🚨 AuthDebug Error [${context}]:`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      additionalInfo,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log successful authentication
   */
  logSuccess(sessionInfo: AuthDebugInfo['sessionInfo'], context: string = 'unknown') {
    this.log({
      sessionInfo
    }, `SUCCESS-${context}`)
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(minutes: number = 5): AuthDebugInfo[] {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return this.logs.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    )
  }

  /**
   * Export logs for analysis
   */
  exportLogs(): AuthDebugInfo[] {
    return [...this.logs]
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = []
  }

  /**
   * Get authentication statistics
   */
  getStats() {
    const recentLogs = this.getRecentLogs(30) // Last 30 minutes
    
    return {
      totalLogs: recentLogs.length,
      errorCount: recentLogs.filter(log => log.error).length,
      successCount: recentLogs.filter(log => log.sessionInfo?.hasSession).length,
      uniqueUsers: new Set(
        recentLogs
          .filter(log => log.sessionInfo?.userId)
          .map(log => log.sessionInfo!.userId)
      ).size,
      environments: [...new Set(recentLogs.map(log => log.environment))],
      errorRate: recentLogs.length > 0 
        ? (recentLogs.filter(log => log.error).length / recentLogs.length) * 100 
        : 0
    }
  }
}

// Global instance
export const authDebugger = AuthDebugger.getInstance()

// Helper functions
export const logAuthDebug = (info: Partial<AuthDebugInfo>, context?: string) => {
  authDebugger.log(info, context)
}

export const logAuthError = (error: string | Error, context?: string, additionalInfo?: any) => {
  authDebugger.logError(error, context, additionalInfo)
}

export const logAuthSuccess = (sessionInfo: AuthDebugInfo['sessionInfo'], context?: string) => {
  authDebugger.logSuccess(sessionInfo, context)
}

/**
 * Middleware helper to log request information
 */
export const logMiddlewareDebug = (request: any, sessionInfo?: any) => {
  if (typeof window === 'undefined') { // Server-side only
    authDebugger.log({
      url: request.url,
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
      cookies: request.cookies.getAll().map((c: any) => c.name),
      sessionInfo
    }, 'MIDDLEWARE')
  }
}

/**
 * Client-side helper to log authentication state
 */
export const logClientAuthState = (session: any, context: string = 'CLIENT') => {
  if (typeof window !== 'undefined') { // Client-side only
    authDebugger.log({
      sessionInfo: {
        hasSession: !!session,
        userId: session?.user?.id,
        sessionId: session?.sessionId,
        deviceId: session?.deviceId
      }
    }, context)
  }
}