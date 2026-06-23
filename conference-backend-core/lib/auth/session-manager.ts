/**
 * Session Manager for database-based session management
 * Handles session monitoring and debugging for multi-user scenarios
 */

import { NextRequest } from 'next/server'

export class SessionManager {
  /**
   * Generate a unique session identifier for debugging
   */
  static generateSessionId(): string {
    return `db_sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * Enhanced logging for session debugging
   */
  static logSessionDebug(context: string, data: any): void {
    console.log(`🔍 SessionManager [${context}]:`, {
      timestamp: new Date().toISOString(),
      ...data
    })
  }

  /**
   * Check if session cookie exists
   */
  static hasSessionCookie(request: NextRequest): boolean {
    const sessionCookie = request.cookies.get(
      process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token'
    )
    return !!sessionCookie
  }

  /**
   * Get session cookie value
   */
  static getSessionCookie(request: NextRequest): string | undefined {
    const sessionCookie = request.cookies.get(
      process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token'
    )
    return sessionCookie?.value
  }
}