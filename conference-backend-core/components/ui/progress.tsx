"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/conference-backend-core/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-ocean-100 dark:bg-midnight-800",
        glass: "glass",
        gradient: "bg-gradient-to-r from-ocean-100 to-sapphire-100 dark:from-midnight-800 dark:to-midnight-700",
      },
      size: {
        sm: "h-2 rounded-full",
        default: "h-3 rounded-full",
        lg: "h-4 rounded-xl",
        xl: "h-6 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-ocean-600 to-sapphire-600",
        success: "bg-gradient-to-r from-emerald-500 to-emerald-600",
        warning: "bg-gradient-to-r from-amber-400 to-amber-500",
        danger: "bg-gradient-to-r from-coral-500 to-coral-600",
        coral: "bg-gradient-to-r from-coral-400 to-amber-500",
        glass: "bg-gradient-to-r from-ocean-600/80 to-sapphire-600/80 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorVariant?: VariantProps<typeof progressIndicatorVariants>["variant"]
  showValue?: boolean
  label?: string
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, size, indicatorVariant, showValue, label, ...props }, ref) => (
  <div className="space-y-2">
    {(label || showValue) && (
      <div className="flex justify-between items-center">
        {label && (
          <span className="text-fluid-sm font-medium text-midnight-700 dark:text-midnight-300">
            {label}
          </span>
        )}
        {showValue && (
          <span className="text-fluid-sm font-semibold text-ocean-600 dark:text-ocean-400">
            {value}%
          </span>
        )}
      </div>
    )}
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ variant, size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(progressIndicatorVariants({ variant: indicatorVariant || "default" }))}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

// Enhanced step progress component
export interface StepProgressProps {
  steps: Array<{
    label: string
    completed: boolean
    current?: boolean
  }>
  className?: string
}

export function StepProgress({ steps, className }: StepProgressProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center space-y-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  step.completed
                    ? "gradient-ocean text-white shadow-lg"
                    : step.current
                    ? "border-2 border-ocean-500 text-ocean-600 bg-ocean-50"
                    : "border-2 border-midnight-200 text-midnight-400 bg-white"
                )}
              >
                {step.completed ? "✓" : index + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center max-w-20",
                  step.completed || step.current
                    ? "text-ocean-600"
                    : "text-midnight-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 transition-all duration-300",
                  steps[index + 1]?.completed || step.completed
                    ? "bg-gradient-to-r from-ocean-600 to-sapphire-600"
                    : "bg-midnight-200"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export { Progress, progressVariants }
