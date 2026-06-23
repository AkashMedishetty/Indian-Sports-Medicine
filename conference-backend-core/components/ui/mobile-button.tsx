/**
 * Mobile-optimized button component with enhanced touch interactions
 */

"use client"

import { forwardRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/conference-backend-core/lib/utils"
import { Button, ButtonProps } from "./button"
import { useTouchDevice, useIsMobile } from "@/conference-backend-core/hooks/use-mobile-optimization"
import { buttonPress } from "@/conference-backend-core/lib/animations"

interface MobileButtonProps extends ButtonProps {
  hapticFeedback?: boolean
  touchOptimized?: boolean
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, hapticFeedback = true, touchOptimized = true, children, ...props }, ref) => {
    const isTouchDevice = useTouchDevice()
    const isMobile = useIsMobile()

    const handleTouchStart = () => {
      if (hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate(10) // Light haptic feedback
      }
    }

    if (isTouchDevice && touchOptimized) {
      return (
        <motion.div
          variants={buttonPress}
          initial="initial"
          whileTap="tap"
          className="inline-block"
        >
          <Button
            ref={ref}
            className={cn(
              // Enhanced touch targets for mobile
              isMobile && "min-h-[44px] min-w-[44px] px-6 py-3",
              // Better touch feedback
              "active:scale-95 transition-transform duration-100",
              // Improved spacing for touch
              "touch-manipulation select-none",
              className
            )}
            onTouchStart={handleTouchStart}
            {...props}
          >
            {children}
          </Button>
        </motion.div>
      )
    }

    return (
      <Button
        ref={ref}
        className={cn(
          isMobile && "min-h-[44px] min-w-[44px] px-6 py-3",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

MobileButton.displayName = "MobileButton"