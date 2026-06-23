"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/conference-backend-core/lib/utils"

const floatingInputVariants = cva(
  "peer w-full rounded-xl border bg-background px-4 pt-6 pb-2 text-fluid-base ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 placeholder-transparent",
  {
    variants: {
      variant: {
        default: "border-input hover:border-ocean-300 focus-visible:border-ocean-500",
        glass: "glass border-white/20 hover:border-white/30 focus-visible:border-ocean-400",
        outline: "border-2 border-ocean-200 hover:border-ocean-300 focus-visible:border-ocean-500",
        filled: "bg-ocean-50 border-ocean-100 hover:bg-ocean-100 focus-visible:bg-white focus-visible:border-ocean-500",
      },
      inputSize: {
        sm: "h-12 px-3 pt-5 pb-1 text-sm rounded-lg",
        default: "h-14 px-4 pt-6 pb-2",
        lg: "h-16 px-5 pt-7 pb-3 text-lg rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

const floatingLabelVariants = cva(
  "absolute left-4 text-muted-foreground transition-all duration-200 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-ocean-600",
  {
    variants: {
      inputSize: {
        sm: "top-1.5 text-xs peer-placeholder-shown:text-sm peer-focus:text-xs left-3",
        default: "top-2 text-xs peer-placeholder-shown:text-base peer-focus:text-xs",
        lg: "top-2.5 text-sm peer-placeholder-shown:text-lg peer-focus:text-sm left-5",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  }
)

export interface FloatingInputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof floatingInputVariants> {
  label: string
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, type, variant, inputSize, label, id, ...props }, ref) => {
    const inputId = id || `floating-input-${React.useId()}`
    
    return (
      <div className="relative">
        <input
          type={type}
          id={inputId}
          className={cn(floatingInputVariants({ variant, inputSize, className }))}
          placeholder={label}
          ref={ref}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(floatingLabelVariants({ inputSize }))}
        >
          {label}
        </label>
      </div>
    )
  }
)
FloatingInput.displayName = "FloatingInput"

export { FloatingInput, floatingInputVariants, floatingLabelVariants }