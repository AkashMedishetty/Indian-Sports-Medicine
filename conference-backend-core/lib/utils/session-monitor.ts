/**
 * Session Monitor - Tracks and logs session-related issues
 * Helps debug multi-user authentication conflicts
 */

interface SessionEvent {
  type: 'login' | 'logout' | 'error' | 'conflict' | 'recovery'
  userId?: string
  sessionId?: string
  deviceId?: string
  error?: string
  timestamp: number
  userAgent?: string
  ip?: string
}

class SessionMonitor {
  private events: SessionEvent[] = []
  private readonly MAX_EVENTS = 100
  private conflictThreshold = 5 // Number of rapid events that indicate a conflict

  /**
   * Log a session event
   */
  logEvent(event: Omit<SessionEvent, 'timestamp'>) {
    const fullEvent: SessionEvent = {
      ...event,
      timestamp: Date.now()
    }

    this.events.push(fullEvent)

    // Keep only the most recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift()
    }

    // Check for potential conflicts
    this.detectConflicts()

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 SessionMonitor:', fullEvent)
    }
  }

  /**
   * Detect potential session conflicts
   */
  private detectConflicts() {
    const recentEvents = this.events.filter(
      event => Date.now() - event.timestamp < 10000 // Last 10 seconds
    )

    // Check for rapid error events
    const errorEvents = recentEvents.filter(event => event.type === 'error')
    if (errorEvents.length >= this.conflictThreshold) {
      console.warn('🚨 SessionMonitor: Potential session conflict detected', {
        errorCount: errorEvents.length,
        timeWindow: '10 seconds',
        errors: errorEvents.map(e => e.error)
      })

      this.logEvent({
        type: 'conflict',
        error: `${errorEvents.length} errors in 10 seconds`
      })
    }

    // Check for multiple login events from different users
    const loginEvents = recentEvents.filter(event => event.type === 'login')
    const uniqueUsers = new Set(loginEvents.map(e => e.userId).filter(Boolean))
    
    if (uniqueUsers.size > 1) {
      console.warn('🚨 SessionMonitor: Multiple user logins detected', {
        userCount: uniqueUsers.size,
        users: Array.from(uniqueUsers),
        timeWindow: '10 seconds'
      })

      this.logEvent({
        type: 'conflict',
        error: `Multiple users (${uniqueUsers.size}) logged in simultaneously`
      })
    }
  }

  /**
   * Get recent events for debugging
   */
  getRecentEvents(minutes: number = 5): SessionEvent[] {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return this.events.filter(event => event.timestamp > cutoff)
  }

  /**
   * Get session statistics
   */
  getStats() {
    const recentEvents = this.getRecentEvents(30) // Last 30 minutes
    
    const stats = {
      totalEvents: recentEvents.length,
      loginCount: recentEvents.filter(e => e.type === 'login').length,
      errorCount: recentEvents.filter(e => e.type === 'error').length,
      conflictCount: recentEvents.filter(e => e.type === 'conflict').length,
      uniqueUsers: new Set(recentEvents.map(e => e.userId).filter(Boolean)).size,
      uniqueDevices: new Set(recentEvents.map(e => e.deviceId).filter(Boolean)).size,
      errorRate: 0
    }

    stats.errorRate = stats.totalEvents > 0 ? (stats.errorCount / stats.totalEvents) * 100 : 0

    return stats
  }

  /**
   * Clear all events (for testing)
   */
  clear() {
    this.events = []
  }

  /**
   * Export events for analysis
   */
  exportEvents(): SessionEvent[] {
    return [...this.events]
  }
}

// Global instance
export const sessionMonitor = new SessionMonitor()

// Helper functions for common logging scenarios
export const logSessionLogin = (userId: string, sessionId: string, deviceId: string, userAgent?: string) => {
  sessionMonitor.logEvent({
    type: 'login',
    userId,
    sessionId,
    deviceId,
    userAgent
  })
}

export const logSessionError = (error: string, userId?: string, sessionId?: string) => {
  sessionMonitor.logEvent({
    type: 'error',
    error,
    userId,
    sessionId
  })
}

export const logSessionLogout = (userId?: string, sessionId?: string) => {
  sessionMonitor.logEvent({
    type: 'logout',
    userId,
    sessionId
  })
}

export const logSessionRecovery = (userId?: string, sessionId?: string, error?: string) => {
  sessionMonitor.logEvent({
    type: 'recovery',
    userId,
    sessionId,
    error
  })
}