/**
 * Enhanced notification system with animations
 */

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/conference-backend-core/lib/utils"
import { notificationSlide } from "@/conference-backend-core/lib/animations"
import { useEffect, useState } from "react"

export interface NotificationProps {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message?: string
  duration?: number
  onClose?: (id: string) => void
  action?: {
    label: string
    onClick: () => void
  }
}

export function Notification({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(id), 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, id, onClose])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-[#f0f3f8] border-[#b0c1db] text-blue-800",
  }

  const iconColors = {
    success: "text-emerald-600",
    error: "text-red-600",
    warning: "text-amber-600",
    info: "text-[#25406b]",
  }

  const Icon = icons[type]

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(id), 300)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={notificationSlide}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            "max-w-sm w-full backdrop-blur-xl border rounded-xl shadow-lg p-4",
            colors[type]
          )}
        >
          <div className="flex items-start gap-3">
            <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconColors[type])} />
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold">{title}</h4>
              {message && (
                <p className="text-sm opacity-90 mt-1">{message}</p>
              )}
              
              {action && (
                <button
                  onClick={action.onClick}
                  className="text-sm font-medium underline mt-2 hover:no-underline transition-all"
                >
                  {action.label}
                </button>
              )}
            </div>

            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {duration > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-xl"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function NotificationContainer({
  notifications,
  position = "top-right",
  className,
}: {
  notifications: NotificationProps[]
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
  className?: string
}) {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-3 pointer-events-none",
        positionClasses[position],
        className
      )}
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <Notification {...notification} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationProps[]>([])

  const addNotification = (notification: Omit<NotificationProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications((prev) => [...prev, { ...notification, id }])
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  }
}