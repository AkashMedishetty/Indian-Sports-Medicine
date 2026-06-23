/**
 * Multi-Device Session Manager
 * Ensures each device maintains independent sessions
 */

interface DeviceSession {
  sessionId: string
  deviceId: string
  deviceFingerprint: string
  userId: string
  loginTime: number
  lastActivity: number
  userAgent?: string
  ipAddress?: string
}

class MultiDeviceSessionManager {
  private static instance: MultiDeviceSessionManager
  private activeSessions: Map<string, DeviceSession> = new Map()

  static getInstance(): MultiDeviceSessionManager {
    if (!MultiDeviceSessionManager.instance) {
      MultiDeviceSessionManager.instance = new MultiDeviceSessionManager()
    }
    return MultiDeviceSessionManager.instance
  }

  /**
   * Register a new device session
   */
  registerSession(session: DeviceSession): void {
    const key = `${session.userId}_${session.deviceFingerprint}`
    this.activeSessions.set(key, {
      ...session,
      lastActivity: Date.now()
    })

    console.log('📱 Multi-device session registered:', {
      userId: session.userId,
      deviceId: session.deviceId,
      sessionId: session.sessionId,
      totalSessions: this.getActiveSessionsForUser(session.userId).length
    })
  }

  /**
   * Update session activity
   */
  updateActivity(userId: string, deviceFingerprint: string): void {
    const key = `${userId}_${deviceFingerprint}`
    const session = this.activeSessions.get(key)
    
    if (session) {
      session.lastActivity = Date.now()
      this.activeSessions.set(key, session)
    }
  }

  /**
   * Get all active sessions for a user
   */
  getActiveSessionsForUser(userId: string): DeviceSession[] {
    const userSessions: DeviceSession[] = []
    
    for (const [key, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        // Check if session is still active (within 30 days)
        const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
        if (Date.now() - session.lastActivity < maxAge) {
          userSessions.push(session)
        } else {
          // Remove expired session
          this.activeSessions.delete(key)
        }
      }
    }
    
    return userSessions
  }

  /**
   * Check if a session is valid and doesn't conflict with others
   */
  validateSession(userId: string, sessionId: string, deviceFingerprint: string): boolean {
    const key = `${userId}_${deviceFingerprint}`
    const session = this.activeSessions.get(key)
    
    if (!session) {
      return false
    }
    
    // Validate session ID matches
    if (session.sessionId !== sessionId) {
      console.warn('⚠️ Session ID mismatch for device:', {
        userId,
        deviceFingerprint,
        expected: session.sessionId,
        received: sessionId
      })
      return false
    }
    
    // Update activity
    this.updateActivity(userId, deviceFingerprint)
    return true
  }

  /**
   * Remove a specific device session
   */
  removeSession(userId: string, deviceFingerprint: string): void {
    const key = `${userId}_${deviceFingerprint}`
    const removed = this.activeSessions.delete(key)
    
    if (removed) {
      console.log('📱 Multi-device session removed:', {
        userId,
        deviceFingerprint,
        remainingSessions: this.getActiveSessionsForUser(userId).length
      })
    }
  }

  /**
   * Remove all sessions for a user (logout from all devices)
   */
  removeAllUserSessions(userId: string): void {
    const keysToRemove: string[] = []
    
    for (const [key, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => this.activeSessions.delete(key))
    
    console.log('📱 All sessions removed for user:', {
      userId,
      removedSessions: keysToRemove.length
    })
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalSessions: number
    uniqueUsers: number
    averageSessionsPerUser: number
  } {
    const totalSessions = this.activeSessions.size
    const uniqueUsers = new Set(
      Array.from(this.activeSessions.values()).map(s => s.userId)
    ).size
    
    return {
      totalSessions,
      uniqueUsers,
      averageSessionsPerUser: uniqueUsers > 0 ? totalSessions / uniqueUsers : 0
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now()
    const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
    const keysToRemove: string[] = []
    
    for (const [key, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => this.activeSessions.delete(key))
    
    if (keysToRemove.length > 0) {
      console.log('🧹 Cleaned up expired sessions:', {
        removedSessions: keysToRemove.length,
        remainingSessions: this.activeSessions.size
      })
    }
  }
}

// Global instance
export const multiDeviceSessionManager = MultiDeviceSessionManager.getInstance()

// Helper functions
export const registerDeviceSession = (session: DeviceSession) => {
  multiDeviceSessionManager.registerSession(session)
}

export const validateDeviceSession = (userId: string, sessionId: string, deviceFingerprint: string) => {
  return multiDeviceSessionManager.validateSession(userId, sessionId, deviceFingerprint)
}

export const removeDeviceSession = (userId: string, deviceFingerprint: string) => {
  multiDeviceSessionManager.removeSession(userId, deviceFingerprint)
}

export const getUserActiveSessions = (userId: string) => {
  return multiDeviceSessionManager.getActiveSessionsForUser(userId)
}

// Auto-cleanup expired sessions every hour
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    multiDeviceSessionManager.cleanupExpiredSessions()
  }, 60 * 60 * 1000) // 1 hour
}