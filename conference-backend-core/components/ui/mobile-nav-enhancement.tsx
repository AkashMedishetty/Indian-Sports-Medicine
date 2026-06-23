/**
 * Mobile navigation enhancements
 */

"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { X, Menu } from "lucide-react"
import { cn } from "@/conference-backend-core/lib/utils"
import { useIsMobile, useTouchDevice } from "@/conference-backend-core/hooks/use-mobile-optimization"

interface MobileNavEnhancementProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function MobileNavEnhancement({
  isOpen,
  onClose,
  children,
  className,
}: MobileNavEnhancementProps) {
  const isMobile = useIsMobile()
  const isTouchDevice = useTouchDevice()
  const [dragOffset, setDragOffset] = useState(0)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden"
      document.body.style.position = "fixed"
      document.body.style.width = "100%"
    } else {
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.width = ""
    }

    return () => {
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.width = ""
    }
  }, [isOpen, isMobile])

  const handleDragEnd = (event: any, info: PanInfo) => {
    const shouldClose = info.offset.x < -100 || info.velocity.x < -500
    if (shouldClose) {
      onClose()
    }
    setDragOffset(0)
  }

  const handleDrag = (event: any, info: PanInfo) => {
    if (info.offset.x < 0) {
      setDragOffset(info.offset.x)
    }
  }

  if (!isMobile) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Mobile Menu */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: dragOffset }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            drag={isTouchDevice ? "x" : false}
            dragConstraints={{ left: -200, right: 0 }}
            dragElastic={0.1}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw]",
              "bg-white/95 backdrop-blur-xl border-l border-slate-200/50",
              "shadow-2xl",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drag indicator */}
            {isTouchDevice && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-slate-300 rounded-r-full opacity-50" />
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
  swipeThreshold?: number
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
  swipeThreshold = 100,
}: SwipeableCardProps) {
  const isTouchDevice = useTouchDevice()
  const [dragOffset, setDragOffset] = useState(0)

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info

    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
      if (offset.x > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (offset.x < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }

    setDragOffset(0)
  }

  const handleDrag = (event: any, info: PanInfo) => {
    setDragOffset(info.offset.x)
  }

  if (!isTouchDevice) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={{ x: dragOffset }}
      className={cn("touch-manipulation", className)}
      style={{
        opacity: Math.max(0.5, 1 - Math.abs(dragOffset) / 200),
      }}
    >
      {children}
    </motion.div>
  )
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  className?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const isTouchDevice = useTouchDevice()

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY > 0) {
      const currentY = e.touches[0].clientY
      const distance = Math.max(0, currentY - startY)
      setPullDistance(Math.min(distance, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
    setStartY(0)
  }

  if (!isTouchDevice) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10"
            style={{ transform: `translateX(-50%) translateY(${pullDistance / 4}px)` }}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg border border-slate-200/50">
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0 }}
                className="w-6 h-6 border-2 border-[#f0f3f8]0 border-t-transparent rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: pullDistance / 2 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  )
}