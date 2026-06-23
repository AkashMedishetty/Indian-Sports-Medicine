/**
 * Fully accessible modal component with WCAG 2.1 AA compliance
 */

"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/conference-backend-core/lib/utils"
import { useFocusTrap, useKeyboardNavigation, useScreenReader, useReducedMotion } from "@/conference-backend-core/hooks/use-accessibility"
import { modalVariants, backdropVariants } from "@/conference-backend-core/lib/animations"

interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  initialFocus?: React.RefObject<HTMLElement>
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  initialFocus,
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const focusTrapRef = useFocusTrap(isOpen)
  const { announce } = useScreenReader()
  const prefersReducedMotion = useReducedMotion()

  // Handle keyboard navigation
  useKeyboardNavigation(
    closeOnEscape ? onClose : undefined
  )

  // Announce modal state changes to screen readers
  useEffect(() => {
    if (isOpen) {
      announce(`Modal opened: ${title}`, "assertive")
    } else {
      announce("Modal closed", "polite")
    }
  }, [isOpen, title, announce])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      document.body.setAttribute("aria-hidden", "true")
    } else {
      document.body.style.overflow = ""
      document.body.removeAttribute("aria-hidden")
    }

    return () => {
      document.body.style.overflow = ""
      document.body.removeAttribute("aria-hidden")
    }
  }, [isOpen])

  // Focus management
  useEffect(() => {
    if (isOpen) {
      if (initialFocus?.current) {
        initialFocus.current.focus()
      } else if (titleRef.current) {
        titleRef.current.focus()
      }
    }
  }, [isOpen, initialFocus])

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]",
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={prefersReducedMotion ? undefined : backdropVariants}
            initial={prefersReducedMotion ? { opacity: 1 } : "initial"}
            animate={prefersReducedMotion ? { opacity: 1 } : "animate"}
            exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={focusTrapRef as React.RefObject<HTMLDivElement>}
            variants={prefersReducedMotion ? undefined : modalVariants}
            initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : "initial"}
            animate={prefersReducedMotion ? { opacity: 1, scale: 1 } : "animate"}
            exit={prefersReducedMotion ? { opacity: 0, scale: 1 } : "exit"}
            className={cn(
              "relative w-full bg-white rounded-2xl shadow-2xl",
              "border border-slate-200/50 backdrop-blur-xl",
              "max-h-[90vh] overflow-hidden",
              sizeClasses[size],
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby={description ? "modal-description" : undefined}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
              <div className="flex-1 min-w-0">
                <h2
                  ref={titleRef}
                  id="modal-title"
                  className="text-xl font-semibold text-slate-900 truncate"
                  tabIndex={-1}
                >
                  {title}
                </h2>
                {description && (
                  <p
                    id="modal-description"
                    className="mt-1 text-sm text-slate-600"
                  >
                    {description}
                  </p>
                )}
              </div>

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={cn(
                    "ml-4 p-2 text-slate-400 hover:text-slate-600",
                    "rounded-lg hover:bg-slate-100 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  )}
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface AccessibleAlertDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

export function AccessibleAlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: AccessibleAlertDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const { announce } = useScreenReader()

  useEffect(() => {
    if (isOpen) {
      announce(`Alert: ${title}`, "assertive")
    }
  }, [isOpen, title, announce])

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      closeOnBackdropClick={false}
      showCloseButton={false}
      initialFocus={confirmButtonRef}
    >
      <div className="space-y-6">
        <p className="text-slate-700">{description}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className={cn(
              "px-4 py-2 text-sm font-medium text-slate-700",
              "bg-white border border-slate-300 rounded-lg",
              "hover:bg-slate-50 focus:outline-none focus:ring-2",
              "focus:ring-blue-500 focus:ring-offset-2",
              "transition-colors"
            )}
          >
            {cancelText}
          </button>

          <button
            ref={confirmButtonRef}
            onClick={handleConfirm}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              "transition-colors",
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-[#25406b] hover:bg-[#1d3357] focus:ring-blue-500"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </AccessibleModal>
  )
}