/**
 * Redirect Guard - Prevents infinite redirect loops and stuck states
 */

interface RedirectAttempt {
  url: string
  timestamp: number
  count: number
}

class RedirectGuard {
  private static instance: RedirectGuard
  private attempts: Map<string, RedirectAttempt> = new Map()
  private readonly MAX_REDIRECTS = 3
  private readonly TIMEOUT_MS = 30000 // 30 seconds
  private readonly COOLDOWN_MS = 5000 // 5 seconds between same redirects

  static getInstance(): RedirectGuard {
    if (!RedirectGuard.instance) {
      RedirectGuard.instance = new RedirectGuard()
    }
    return RedirectGuard.instance
  }

  /**
   * Check if redirect is safe to perform
   */
  canRedirect(targetUrl: string, sourceContext: string = 'unknown'): boolean {
    const now = Date.now()
    const key = `${sourceContext}:${targetUrl}`
    const attempt = this.attempts.get(key)

    // Clean up old attempts
    this.cleanup()

    if (!attempt) {
      // First attempt - allow it
      this.attempts.set(key, {
        url: targetUrl,
        timestamp: now,
        count: 1
      })
      console.log(`🔄 First redirect attempt: ${targetUrl} from ${sourceContext}`)
      return true
    }

    // Check if we're in cooldown period
    if (now - attempt.timestamp < this.COOLDOWN_MS) {
      console.warn(`🚫 Redirect blocked (cooldown): ${targetUrl} from ${sourceContext}`)
      return false
    }

    // Check if we've exceeded max attempts
    if (attempt.count >= this.MAX_REDIRECTS) {
      console.error(`🚫 Redirect blocked (max attempts): ${targetUrl} from ${sourceContext}`)
      this.showLoopError(targetUrl, sourceContext)
      return false
    }

    // Update attempt count
    attempt.count++
    attempt.timestamp = now
    console.log(`🔄 Redirect attempt ${attempt.count}/${this.MAX_REDIRECTS}: ${targetUrl} from ${sourceContext}`)
    
    return true
  }

  /**
   * Reset redirect attempts for a specific URL
   */
  resetAttempts(targetUrl: string, sourceContext?: string): void {
    if (sourceContext) {
      this.attempts.delete(`${sourceContext}:${targetUrl}`)
    } else {
      // Reset all attempts for this URL
      for (const key of this.attempts.keys()) {
        if (key.includes(targetUrl)) {
          this.attempts.delete(key)
        }
      }
    }
  }

  /**
   * Clear all redirect attempts (use on successful navigation)
   */
  clearAll(): void {
    this.attempts.clear()
  }

  /**
   * Clean up old attempts
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, attempt] of this.attempts.entries()) {
      if (now - attempt.timestamp > this.TIMEOUT_MS) {
        this.attempts.delete(key)
      }
    }
  }

  /**
   * Show error when redirect loop detected
   */
  private showLoopError(targetUrl: string, sourceContext: string): void {
    if (typeof window !== 'undefined') {
      // Create a toast or alert
      const event = new CustomEvent('redirectLoopDetected', {
        detail: { targetUrl, sourceContext }
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * Get current redirect statistics for debugging
   */
  getStats(): { [key: string]: RedirectAttempt } {
    const stats: { [key: string]: RedirectAttempt } = {}
    for (const [key, attempt] of this.attempts.entries()) {
      stats[key] = { ...attempt }
    }
    return stats
  }
}

export const redirectGuard = RedirectGuard.getInstance()

/**
 * Safe redirect function that prevents loops
 */
export function safeRedirect(
  targetUrl: string, 
  sourceContext: string,
  method: 'router' | 'window' | 'next' = 'router'
): boolean {
  if (!redirectGuard.canRedirect(targetUrl, sourceContext)) {
    console.warn(`Redirect blocked to prevent loop: ${targetUrl}`)
    return false
  }

  try {
    switch (method) {
      case 'window':
        if (typeof window !== 'undefined') {
          window.location.href = targetUrl
        }
        break
      case 'next':
        // For Next.js redirects (server-side)
        if (typeof window === 'undefined') {
          // This would be handled by the calling code
          return true
        }
        break
      default:
        // Router redirect would be handled by the calling code
        return true
    }
  } catch (error) {
    console.error('Redirect failed:', error)
    return false
  }

  return true
}

/**
 * Create a timeout promise for stuck states
 */
export function createTimeoutPromise(ms: number, operation: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timeout: ${operation} took longer than ${ms}ms`))
    }, ms)
  })
}

/**
 * Wrapper for authentication operations with timeout
 */
export async function withAuthTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number = 10000,
  operationName: string = 'Authentication'
): Promise<T> {
  const timeoutPromise = createTimeoutPromise(timeoutMs, operationName)
  
  try {
    const result = await Promise.race([operation, timeoutPromise])
    return result as T
  } catch (error) {
    console.error(`${operationName} failed:`, error)
    throw error
  }
}