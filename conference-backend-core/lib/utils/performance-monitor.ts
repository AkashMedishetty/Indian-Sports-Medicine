/**
 * Simple Performance Monitor
 * Helps identify performance bottlenecks
 */

interface PerformanceMetric {
    name: string
    startTime: number
    endTime?: number
    duration?: number
}

class PerformanceMonitor {
    private static instance: PerformanceMonitor
    private metrics: Map<string, PerformanceMetric> = new Map()

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor()
        }
        return PerformanceMonitor.instance
    }

    /**
     * Start timing an operation
     */
    start(name: string): void {
        this.metrics.set(name, {
            name,
            startTime: performance.now()
        })
    }

    /**
     * End timing an operation
     */
    end(name: string): number | null {
        const metric = this.metrics.get(name)
        if (!metric) return null

        const endTime = performance.now()
        const duration = endTime - metric.startTime

        metric.endTime = endTime
        metric.duration = duration

        // Log slow operations
        if (duration > 1000) {
            console.warn(`🐌 Slow operation: ${name} took ${duration.toFixed(2)}ms`)
        } else if (process.env.NODE_ENV === 'development') {
            console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`)
        }

        return duration
    }

    /**
     * Get all metrics
     */
    getMetrics(): PerformanceMetric[] {
        return Array.from(this.metrics.values())
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics.clear()
    }

    /**
     * Get slow operations (> 500ms)
     */
    getSlowOperations(): PerformanceMetric[] {
        return Array.from(this.metrics.values()).filter(
            metric => metric.duration && metric.duration > 500
        )
    }
}

// Global instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Helper functions
export const startTimer = (name: string) => performanceMonitor.start(name)
export const endTimer = (name: string) => performanceMonitor.end(name)

/**
 * Decorator for timing functions
 */
export function timed(name?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value
        const timerName = name || `${target.constructor.name}.${propertyKey}`

        descriptor.value = async function (...args: any[]) {
            startTimer(timerName)
            try {
                const result = await originalMethod.apply(this, args)
                return result
            } finally {
                endTimer(timerName)
            }
        }

        return descriptor
    }
}

/**
 * Simple timing wrapper for functions
 */
export async function timeFunction<T>(
    name: string,
    fn: () => Promise<T> | T
): Promise<T> {
    startTimer(name)
    try {
        return await fn()
    } finally {
        endTimer(name)
    }
}

/**
 * Monitor page load performance
 */
export function monitorPageLoad() {
    if (typeof window === 'undefined') return

    // Monitor initial page load
    window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

        console.log('📊 Page Load Metrics:', {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            totalTime: navigation.loadEventEnd - navigation.fetchStart,
            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcpConnect: navigation.connectEnd - navigation.connectStart,
            serverResponse: navigation.responseEnd - navigation.requestStart
        })
    })

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const slowResources = entries.filter(entry => entry.duration > 1000)

        if (slowResources.length > 0) {
            console.warn('🐌 Slow resources detected:', slowResources.map(entry => ({
                name: entry.name,
                duration: entry.duration,
                type: entry.entryType
            })))
        }
    })

    observer.observe({ entryTypes: ['resource'] })
}

// Auto-start page load monitoring
if (typeof window !== 'undefined') {
    monitorPageLoad()
}