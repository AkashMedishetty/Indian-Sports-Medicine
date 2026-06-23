/**
 * Mobile-optimized form components
 */

"use client"

import { forwardRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/conference-backend-core/lib/utils"
import { Input, InputProps } from "./input"
import { Label } from "./label"
import { useIsMobile, useTouchDevice } from "@/conference-backend-core/hooks/use-mobile-optimization"

interface MobileInputProps extends InputProps {
  label?: string
  error?: string
  success?: string
  touchOptimized?: boolean
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, label, error, success, touchOptimized = true, ...props }, ref) => {
    const isMobile = useIsMobile()
    const isTouchDevice = useTouchDevice()

    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={props.id}
            className={cn(
              "text-sm font-medium",
              isMobile && "text-base" // Larger text on mobile
            )}
          >
            {label}
          </Label>
        )}
        
        <Input
          // @ts-ignore - ref forwarding type mismatch
          ref={ref}
          className={cn(
            // Enhanced mobile styling
            isMobile && [
              "min-h-[48px]", // Larger touch target
              "text-base", // Prevent zoom on iOS
              "px-4 py-3", // Better padding
              "rounded-xl", // More rounded corners
            ],
            // Touch device optimizations
            isTouchDevice && touchOptimized && [
              "touch-manipulation",
              "select-text",
              "focus:ring-2 focus:ring-blue-500/20",
              "focus:border-[#f0f3f8]0",
              "transition-all duration-200",
            ],
            // Error state
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            // Success state
            success && "border-green-500 focus:border-green-500 focus:ring-green-500/20",
            className
          )}
          {...props}
        />

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 flex items-center gap-2"
          >
            <span className="w-1 h-1 bg-red-600 rounded-full" />
            {error}
          </motion.p>
        )}

        {/* Success message */}
        {success && !error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-green-600 flex items-center gap-2"
          >
            <span className="w-1 h-1 bg-green-600 rounded-full" />
            {success}
          </motion.p>
        )}
      </div>
    )
  }
)

MobileInput.displayName = "MobileInput"

interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  success?: string
  touchOptimized?: boolean
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ className, label, error, success, touchOptimized = true, ...props }, ref) => {
    const isMobile = useIsMobile()
    const isTouchDevice = useTouchDevice()

    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={props.id}
            className={cn(
              "text-sm font-medium",
              isMobile && "text-base"
            )}
          >
            {label}
          </Label>
        )}
        
        <textarea
          // @ts-ignore - ref forwarding type mismatch
          ref={ref}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            // Enhanced mobile styling
            isMobile && [
              "min-h-[120px]", // Larger on mobile
              "text-base", // Prevent zoom on iOS
              "px-4 py-3", // Better padding
              "rounded-xl", // More rounded corners
            ],
            // Touch device optimizations
            isTouchDevice && touchOptimized && [
              "touch-manipulation",
              "select-text",
              "focus:ring-2 focus:ring-blue-500/20",
              "focus:border-[#f0f3f8]0",
              "transition-all duration-200",
              "resize-none", // Disable resize on mobile
            ],
            // Error state
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            // Success state
            success && "border-green-500 focus:border-green-500 focus:ring-green-500/20",
            className
          )}
          {...props}
        />

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 flex items-center gap-2"
          >
            <span className="w-1 h-1 bg-red-600 rounded-full" />
            {error}
          </motion.p>
        )}

        {/* Success message */}
        {success && !error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-green-600 flex items-center gap-2"
          >
            <span className="w-1 h-1 bg-green-600 rounded-full" />
            {success}
          </motion.p>
        )}
      </div>
    )
  }
)

MobileTextarea.displayName = "MobileTextarea"

interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  success?: string
  options: Array<{ value: string; label: string }>
  touchOptimized?: boolean
}

export const MobileSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(
  ({ className, label, error, success, options, touchOptimized = true, ...props }, ref) => {
    const isMobile = useIsMobile()
    const isTouchDevice = useTouchDevice()

    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={props.id}
            className={cn(
              "text-sm font-medium",
              isMobile && "text-base"
            )}
          >
            {label}
          </Label>
        )}
        
        <select
          // @ts-ignore - ref forwarding type mismatch
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            // Enhanced mobile styling
            isMobile && [
              "min-h-[48px]", // Larger touch target
              "text-base", // Prevent zoom on iOS
              "px-4 py-3", // Better padding
              "rounded-xl", // More rounded corners
            ],
            // Touch device optimizations
            isTouchDevice && touchOptimized && [
              "touch-manipulation",
              "focus:ring-2 focus:ring-blue-500/20",
              "focus:border-[#f0f3f8]0",
              "transition-all duration-200",
            ],
            // Error state
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            // Success state
            success && "border-green-500 focus:border-green-500 focus:ring-green-500/20",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 flex items-center gap-2"
          >
            <span className="w-1 h-1 bg-red-600 rounded-full" />
            {error}
          </motion.p>
        )}

        {/* Success message */}
        {success && !error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-green-600 flex items-center gap-2"
          >
            <span className="w-1 h-1 bg-green-600 rounded-full" />
            {success}
          </motion.p>
        )}
      </div>
    )
  }
)

MobileSelect.displayName = "MobileSelect"