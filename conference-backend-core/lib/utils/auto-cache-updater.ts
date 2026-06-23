/**
 * Automatic Cache Updater
 * Handles automatic cache invalidation and updates in production
 */

export interface CacheManifest {
  version: string;
  timestamp: number;
  deployedAt: string;
  forceUpdate: boolean;
}

export class AutoCacheUpdater {
  private static instance: AutoCacheUpdater;
  private currentVersion: string | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  static getInstance(): AutoCacheUpdater {
    if (!AutoCacheUpdater.instance) {
      AutoCacheUpdater.instance = new AutoCacheUpdater();
    }
    return AutoCacheUpdater.instance;
  }

  /**
   * Initialize automatic cache checking
   */
  async initialize(): Promise<void> {
    if (!this.isProduction) {
      console.log('🔧 AutoCacheUpdater: Development mode - skipping cache checks');
      return;
    }

    console.log('🚀 AutoCacheUpdater: Initializing production cache management');
    
    // Get current version
    this.currentVersion = await this.getCurrentVersion();
    
    // Check immediately
    await this.checkForUpdates();
    
    // Set up periodic checks (every 5 minutes)
    this.startPeriodicChecks();
    
    // Listen for visibility changes to check when user returns
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });
  }

  /**
   * Get current cache version from manifest
   */
  private async getCurrentVersion(): Promise<string | null> {
    try {
      const response = await fetch('/cache-manifest.json', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const manifest: CacheManifest = await response.json();
        return manifest.version;
      }
    } catch (error) {
      console.warn('Could not fetch cache manifest:', error);
    }
    return null;
  }

  /**
   * Check for cache updates
   */
  private async checkForUpdates(): Promise<void> {
    try {
      const latestVersion = await this.getCurrentVersion();
      
      if (!latestVersion) {
        return;
      }

      // If this is the first check, store the version
      if (!this.currentVersion) {
        this.currentVersion = latestVersion;
        localStorage.setItem('app-cache-version', latestVersion);
        return;
      }

      // Check stored version vs current
      const storedVersion = localStorage.getItem('app-cache-version');
      
      if (storedVersion !== latestVersion) {
        console.log('🔄 New version detected:', latestVersion);
        await this.forceUpdate(latestVersion);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  /**
   * Force cache update and reload
   */
  private async forceUpdate(newVersion: string): Promise<void> {
    console.log('🔄 Forcing cache update to version:', newVersion);
    
    try {
      // Show user notification
      this.showUpdateNotification();
      
      // Clear all caches
      await this.clearAllCaches();
      
      // Update stored version
      localStorage.setItem('app-cache-version', newVersion);
      this.currentVersion = newVersion;
      
      // Force service worker update
      await this.updateServiceWorker();
      
      // Reload page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error during force update:', error);
      // Fallback: just reload
      window.location.reload();
    }
  }

  /**
   * Clear all application caches
   */
  private async clearAllCaches(): Promise<void> {
    try {
      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ All caches cleared');
      }
      
      // Clear localStorage items (except user preferences)
      const keysToKeep = ['user-preferences', 'theme', 'language'];
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }

  /**
   * Update service worker
   */
  private async updateServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
        }
        
        // Register new service worker
        await navigator.serviceWorker.register('/sw-force-update.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        console.log('✅ Service worker updated');
      } catch (error) {
        console.error('Error updating service worker:', error);
      }
    }
  }

  /**
   * Show update notification to user
   */
  private showUpdateNotification(): void {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div>
          <div style="font-weight: 600;">Updating Application</div>
          <div style="font-size: 12px; opacity: 0.9;">Loading latest version...</div>
        </div>
      </div>
    `;
    
    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  /**
   * Start periodic update checks
   */
  private startPeriodicChecks(): void {
    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop periodic checks
   */
  public stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Manual update check
   */
  public async checkNow(): Promise<void> {
    await this.checkForUpdates();
  }
}

// Export singleton instance
export const autoCacheUpdater = AutoCacheUpdater.getInstance();