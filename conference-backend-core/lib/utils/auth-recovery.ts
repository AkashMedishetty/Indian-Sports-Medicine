/**
 * Authentication Recovery Utility
 * Handles production authentication issues and recovery mechanisms
 */

import { signOut } from 'next-auth/react'
import { forceReload, clearAuthCache } from './cache-buster'
import { logAuthError, logAuthDebug } from './auth-debug'

interface AuthRecoveryOptions {
  maxRetries?: number
  retryDelay?: number
  forceReloadOnFailure?: boolean
}

class AuthRecovery {
  private static instance: AuthRecovery
  private retryCount = 0
  private lastRecoveryTime = 0
  private readonly RECOVERY_COOLDOWN = 30000 // 30 seconds

  static getInstance(): AuthRecovery {
    if (!AuthRecovery.instance) {
      AuthRecovery.instance = new AuthRecovery()
    }
    return AuthRecovery.instance
  }

  /**
   * Attempt to recover from authentication issues
   */
  async recoverAuthentication(
    error: string,
    context: string,
    options: AuthRecoveryOptions = {}
  ): Promise<boolean> {
    const {
      maxRetries = 3,
      retryDelay = 2000,
      forceReloadOnFailure = true
    } = options

    const now = Date.now()
    
    // Prevent too frequent recovery attempts
    if (now - this.lastRecoveryTime < this.RECOVERY_COOLDOWN) {
      logAuthDebug({
        error: 'Recovery attempt blocked - too frequent'
      }, 'AUTH_RECOVERY')
      return false
    }

    this.lastRecoveryTime = now
    this.retryCount++

    logAuthError(`Authentication recovery attempt ${this.retryCount}/${maxRetries}`, context, {
      error,
      retryCount: this.retryCount
    })

    try {
      // Step 1: Clear authentication caches
      await clearAuthCache()

      // Step 2: Clear any stale session data
      await this.clearStaleSessionData()

      // Step 3: If we've exceeded retries, force sign out and reload
      if (this.retryCount >= maxRetries) {
        logAuthError('Max recovery attempts reached, forcing sign out', context)
        
        try {
          await signOut({ redirect: false })
        } catch (signOutError) {
          logAuthError('Sign out failed during recovery', context, signOutError)
        }

        if (forceReloadOnFailure) {
          setTimeout(() => {
            forceReload('auth-recovery-max-retries')
          }, 1000)
        }

        this.resetRetryCount()
        return false
      }

      // Step 4: Wait before allowing next authentication attempt
      await new Promise(resolve => setTimeout(resolve, retryDelay))

      logAuthDebug({
        message: 'Authentication recovery completed'
      }, 'AUTH_RECOVERY')

      return true
    } catch (recoveryError) {
      logAuthError('Authentication recovery failed', context, recoveryError)
      return false
    }
  }

  /**
   * Clear stale session data from storage
   */
  private async clearStaleSessionData(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // Clear localStorage
      const localStorageKeys = Object.keys(localStorage)
      const authKeys = localStorageKeys.filter(key =>
        key.includes('nextauth') ||
        key.includes('session') ||
        key.includes('auth-error') ||
        key.includes('redirect')
      )
      
      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to remove localStorage key: ${key}`, error)
        }
      })

      // Clear sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage)
      const sessionAuthKeys = sessionStorageKeys.filter(key =>
        key.includes('nextauth') ||
        key.includes('session') ||
        key.includes('auth-error') ||
        key.includes('redirect')
      )
      
      sessionAuthKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to remove sessionStorage key: ${key}`, error)
        }
      })

      logAuthDebug({
        message: 'Cleared stale session data',
        clearedKeys: [...authKeys, ...sessionAuthKeys]
      }, 'AUTH_RECOVERY')
    } catch (error) {
      logAuthError('Failed to clear stale session data', 'AUTH_RECOVERY', error)
    }
  }

  /**
   * Reset retry count (call on successful authentication)
   */
  resetRetryCount(): void {
    this.retryCount = 0
    this.lastRecoveryTime = 0
  }

  /**
   * Check if we're in a recovery state
   */
  isInRecovery(): boolean {
    return this.retryCount > 0
  }

  /**
   * Get current retry count
   */
  getRetryCount(): number {
    return this.retryCount
  }

  /**
   * Handle redirect loops by clearing all redirect-related state
   */
  async handleRedirectLoop(context: string): Promise<void> {
    logAuthError('Redirect loop detected, clearing redirect state', context)

    try {
      // Clear redirect guard state
      if (typeof window !== 'undefined') {
        // Clear any redirect-related data
        sessionStorage.removeItem('redirect-attempts')
        sessionStorage.removeItem('last-redirect')
        localStorage.removeItem('redirect-guard')
      }

      // Clear authentication state
      await this.clearStaleSessionData()

      // Force a clean reload after a short delay
      setTimeout(() => {
        forceReload('redirect-loop-recovery')
      }, 2000)
    } catch (error) {
      logAuthError('Failed to handle redirect loop', context, error)
    }
  }

  /**
   * Production-specific authentication health check
   */
  async performHealthCheck(): Promise<{
    isHealthy: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    try {
      // Check for multiple auth cookies
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const authCookies = cookies.filter(cookie =>
          cookie.includes('next-auth') || cookie.includes('session')
        )
        
        if (authCookies.length > 8) {
          issues.push('Too many authentication cookies')
          recommendations.push('Clear browser cookies for this site')
        }
      }

      // Check for stale localStorage data
      if (typeof localStorage !== 'undefined') {
        const authKeys = Object.keys(localStorage).filter(key =>
          key.includes('auth') || key.includes('session')
        )
        
        if (authKeys.length > 5) {
          issues.push('Stale authentication data in localStorage')
          recommendations.push('Clear browser storage')
        }
      }

      // Check retry count
      if (this.retryCount > 0) {
        issues.push(`Authentication recovery in progress (attempt ${this.retryCount})`)
        recommendations.push('Wait for recovery to complete or refresh page')
      }

      return {
        isHealthy: issues.length === 0,
        issues,
        recommendations
      }
    } catch (error) {
      logAuthError('Health check failed', 'AUTH_RECOVERY', error)
      return {
        isHealthy: false,
        issues: ['Health check failed'],
        recommendations: ['Refresh the page']
      }
    }
  }
}

// Global instance
export const authRecovery = AuthRecovery.getInstance()

// Helper functions
export const recoverAuthentication = (error: string, context: string, options?: AuthRecoveryOptions) => {
  return authRecovery.recoverAuthentication(error, context, options)
}

export const handleRedirectLoop = (context: string) => {
  return authRecovery.handleRedirectLoop(context)
}

export const resetAuthRecovery = () => {
  authRecovery.resetRetryCount()
}

export const isInAuthRecovery = () => {
  return authRecovery.isInRecovery()
}