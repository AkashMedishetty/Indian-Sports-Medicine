/**
 * Performance monitoring component for development
 */

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Zap, Clock, Eye } from "lucide-react"
import { cn } from "@/conference-backend-core/lib/utils"
import { usePerformanceMonitor, useMemoryUsage } from "@/conference-backend-core/hooks/use-performance"

interface PerformanceMonitorProps {
  enabled?: boolean
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  className?: string
}

export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === "development",
  position = "bottom-right",
  className,
}: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const metrics = usePerformanceMonitor()
  const memoryInfo = useMemoryUsage()

  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [enabled])

  if (!enabled || !isVisible) return null

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return "text-green-600"
    if (fps >= 30) return "text-yellow-600"
    return "text-red-600"
  }

  const getMemoryColor = (usage: number) => {
    if (usage < 50) return "text-green-600"
    if (usage < 80) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className={cn("fixed z-50", positionClasses[position], className)}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/80 backdrop-blur-sm text-white rounded-lg shadow-lg overflow-hidden"
        >
          {/* Collapsed view */}
          {!isExpanded && (
            <motion.button
              onClick={() => setIsExpanded(true)}
              className="p-3 hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              <span className={cn("text-sm font-mono", getFPSColor(metrics.fps))}>
                {metrics.fps} FPS
              </span>
            </motion.button>
          )}

          {/* Expanded view */}
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="p-4 space-y-3 min-w-[200px]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Performance</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>

              {/* FPS */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-blue-400" />
                  <span className="text-xs">FPS</span>
                </div>
                <span className={cn("text-xs font-mono", getFPSColor(metrics.fps))}>
                  {metrics.fps}
                </span>
              </div>

              {/* Memory Usage */}
              {memoryInfo && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-purple-400" />
                    <span className="text-xs">Memory</span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono",
                      getMemoryColor(
                        (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
                      )
                    )}
                  >
                    {formatBytes(memoryInfo.usedJSHeapSize)}
                  </span>
                </div>
              )}

              {/* Load Time */}
              {metrics.loadTime > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-orange-400" />
                    <span className="text-xs">Load</span>
                  </div>
                  <span className="text-xs font-mono text-white/80">
                    {(metrics.loadTime / 1000).toFixed(2)}s
                  </span>
                </div>
              )}

              {/* Memory Progress Bar */}
              {memoryInfo && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Heap Usage</span>
                    <span>
                      {Math.round(
                        (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
                      )}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1">
                    <div
                      className={cn(
                        "h-1 rounded-full transition-all duration-300",
                        getMemoryColor(
                          (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
                        ).replace("text-", "bg-")
                      )}
                      style={{
                        width: `${Math.min(
                          (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function WebVitalsMonitor() {
  const [vitals, setVitals] = useState<{
    CLS: number
    FID: number
    FCP: number
    LCP: number
    TTFB: number
  } | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "web-vitals" in window) {
      // @ts-ignore
      import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        const vitalsData = { CLS: 0, FID: 0, FCP: 0, LCP: 0, TTFB: 0 }

        getCLS((metric: any) => {
          vitalsData.CLS = metric.value
          setVitals({ ...vitalsData })
        })

        getFID((metric: any) => {
          vitalsData.FID = metric.value
          setVitals({ ...vitalsData })
        })

        getFCP((metric: any) => {
          vitalsData.FCP = metric.value
          setVitals({ ...vitalsData })
        })

        getLCP((metric: any) => {
          vitalsData.LCP = metric.value
          setVitals({ ...vitalsData })
        })

        getTTFB((metric: any) => {
          vitalsData.TTFB = metric.value
          setVitals({ ...vitalsData })
        })
      })
    }
  }, [])

  if (!vitals || process.env.NODE_ENV !== "development") return null

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white rounded-lg p-3 text-xs font-mono">
      <div className="space-y-1">
        <div>CLS: {vitals.CLS.toFixed(3)}</div>
        <div>FID: {vitals.FID.toFixed(0)}ms</div>
        <div>FCP: {vitals.FCP.toFixed(0)}ms</div>
        <div>LCP: {vitals.LCP.toFixed(0)}ms</div>
        <div>TTFB: {vitals.TTFB.toFixed(0)}ms</div>
      </div>
    </div>
  )
}