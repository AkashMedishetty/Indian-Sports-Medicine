/**
 * Cache Buster Utility
 * Helps prevent caching issues in production that cause authentication problems
 */

/**
 * Force reload the page to clear any cached authentication state
 */
export function forceReload(reason: string = 'cache-bust') {
  if (typeof window !== 'undefined') {
    console.log(`🔄 Force reloading page: ${reason}`)
    
    // Clear any cached authentication data
    try {
      // Clear localStorage auth data
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('auth') || key.includes('session') || key.includes('nextauth')
      )
      authKeys.forEach(key => localStorage.removeItem(key))
      
      // Clear sessionStorage auth data
      const sessionKeys = Object.keys(sessionStorage).filter(key => 
        key.includes('auth') || key.includes('session') || key.includes('nextauth')
      )
      sessionKeys.forEach(key => sessionStorage.removeItem(key))
    } catch (error) {
      console.warn('Failed to clear storage:', error)
    }
    
    // Force reload with cache bypass
    window.location.reload()
  }
}

/**
 * Clear browser cache for authentication-related resources
 */
export async function clearAuthCache() {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await caches.keys()
      const authCaches = cacheNames.filter(name => 
        name.includes('auth') || name.includes('session') || name.includes('api')
      )
      
      await Promise.all(
        authCaches.map(cacheName => caches.delete(cacheName))
      )
      
      console.log('🧹 Cleared authentication caches:', authCaches)
    } catch (error) {
      console.warn('Failed to clear caches:', error)
    }
  }
}

/**
 * Add cache-busting parameters to URLs
 */
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  const timestamp = Date.now()
  return `${url}${separator}_cb=${timestamp}`
}

/**
 * Check if we're in a cached state that might cause auth issues
 */
export function detectCacheIssues(): {
  hasCacheIssues: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  if (typeof window !== 'undefined') {
    // Check for stale service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
          issues.push('Service worker detected - may have cached auth state')
        }
      })
    }
    
    // Check for old localStorage data
    try {
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('auth') || key.includes('session')
      )
      if (authKeys.length > 0) {
        issues.push('Old authentication data in localStorage')
      }
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Check for multiple auth cookies
    const cookies = document.cookie.split(';')
    const authCookies = cookies.filter(cookie => 
      cookie.includes('next-auth') || cookie.includes('session')
    )
    if (authCookies.length > 6) { // Normal is ~6 cookies
      issues.push('Multiple authentication cookies detected')
    }
  }
  
  return {
    hasCacheIssues: issues.length > 0,
    issues
  }
}

/**
 * Production-specific cache management
 */
export class ProductionCacheManager {
  private static instance: ProductionCacheManager
  private lastClearTime = 0
  private readonly CLEAR_INTERVAL = 5 * 60 * 1000 // 5 minutes
  
  static getInstance(): ProductionCacheManager {
    if (!ProductionCacheManager.instance) {
      ProductionCacheManager.instance = new ProductionCacheManager()
    }
    return ProductionCacheManager.instance
  }
  
  /**
   * Periodically clear auth-related caches in production
   */
  startPeriodicClear() {
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      setInterval(() => {
        this.clearIfNeeded()
      }, this.CLEAR_INTERVAL)
    }
  }
  
  /**
   * Clear caches if enough time has passed
   */
  private async clearIfNeeded() {
    const now = Date.now()
    if (now - this.lastClearTime > this.CLEAR_INTERVAL) {
      await clearAuthCache()
      this.lastClearTime = now
    }
  }
  
  /**
   * Handle authentication errors by clearing cache
   */
  async handleAuthError(error: string) {
    console.warn('🚨 Authentication error, clearing cache:', error)
    await clearAuthCache()
    
    // If we're getting repeated auth errors, force reload
    const errorCount = parseInt(sessionStorage.getItem('auth-error-count') || '0')
    sessionStorage.setItem('auth-error-count', (errorCount + 1).toString())
    
    if (errorCount >= 3) {
      sessionStorage.removeItem('auth-error-count')
      forceReload('repeated-auth-errors')
    }
  }
}

// Initialize production cache manager
if (typeof window !== 'undefined') {
  const cacheManager = ProductionCacheManager.getInstance()
  cacheManager.startPeriodicClear()
}

export const productionCacheManager = ProductionCacheManager.getInstance()