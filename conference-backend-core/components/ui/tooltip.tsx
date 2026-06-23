"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/conference-backend-core/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const tooltipVariants = cva(
  "z-50 overflow-hidden px-3 py-2 text-fluid-sm shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "bg-midnight-900 text-white border border-midnight-700 rounded-xl",
        glass: "glass text-midnight-800 dark:text-white rounded-xl",
        primary: "gradient-ocean text-white rounded-xl",
        success: "bg-emerald-600 text-white rounded-xl",
        warning: "bg-amber-500 text-white rounded-xl",
        danger: "bg-coral-600 text-white rounded-xl",
      },
      size: {
        sm: "px-2 py-1 text-xs rounded-lg",
        default: "px-3 py-2 text-sm rounded-xl",
        lg: "px-4 py-3 text-base rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    VariantProps<typeof tooltipVariants> {}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 8, variant, size, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(tooltipVariants({ variant, size }), className)}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Enhanced tooltip with icon and title
export interface EnhancedTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  title?: string
  variant?: VariantProps<typeof tooltipVariants>["variant"]
  size?: VariantProps<typeof tooltipVariants>["size"]
  side?: "top" | "right" | "bottom" | "left"
  delayDuration?: number
}

export function EnhancedTooltip({
  children,
  content,
  title,
  variant = "default",
  size = "default",
  side = "top",
  delayDuration = 200,
}: EnhancedTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent variant={variant} size={size} side={side}>
          {title && (
            <div className="font-semibold mb-1 text-xs uppercase tracking-wide opacity-80">
              {title}
            </div>
          )}
          <div>{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, tooltipVariants }
