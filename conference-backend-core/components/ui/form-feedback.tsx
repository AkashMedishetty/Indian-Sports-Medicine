/**
 * Enhanced form feedback components with animations
 */

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/conference-backend-core/lib/utils"
import { fadeIn, slideInRight } from "@/conference-backend-core/lib/animations"

interface FormFeedbackProps {
  type: "success" | "error" | "warning" | "info"
  message: string
  show: boolean
  onClose?: () => void
  className?: string
}

export function FormFeedback({
  type,
  message,
  show,
  onClose,
  className,
}: FormFeedbackProps) {
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

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={slideInRight}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm",
            colors[type],
            className
          )}
        >
          <Icon className={cn("h-5 w-5 flex-shrink-0", iconColors[type])} />
          <p className="text-sm font-medium flex-1">{message}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface FieldFeedbackProps {
  error?: string
  success?: string
  className?: string
}

export function FieldFeedback({ error, success, className }: FieldFeedbackProps) {
  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div
          key="error"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn("flex items-center gap-2 mt-2", className)}
        >
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}
      {success && !error && (
        <motion.div
          key="success"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn("flex items-center gap-2 mt-2", className)}
        >
          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-600">{success}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function LoadingFeedback({
  show,
  message = "Processing...",
  className,
}: {
  show: boolean
  message?: string
  className?: string
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl bg-[#f0f3f8] border border-[#b0c1db] text-blue-800",
            className
          )}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-5 w-5 border-2 border-[#25406b] border-t-transparent rounded-full"
          />
          <p className="text-sm font-medium">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ProgressFeedback({
  progress,
  message,
  show,
  className,
}: {
  progress: number
  message?: string
  show: boolean
  className?: string
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            "p-4 rounded-xl bg-[#f0f3f8] border border-[#b0c1db]",
            className
          )}
        >
          {message && (
            <p className="text-sm font-medium text-blue-800 mb-3">{message}</p>
          )}
          <div className="w-full bg-[#b0c1db] rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-[#f0f3f8]0 to-[#25406b] h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-[#25406b] mt-2 text-right">
            {Math.round(progress)}%
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}