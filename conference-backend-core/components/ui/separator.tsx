"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/conference-backend-core/lib/utils"

const separatorVariants = cva(
  "shrink-0",
  {
    variants: {
      variant: {
        default: "bg-border",
        gradient: "bg-gradient-to-r from-transparent via-ocean-300 to-transparent",
        dashed: "border-dashed border-t border-border bg-transparent",
        dotted: "border-dotted border-t border-border bg-transparent",
        thick: "bg-ocean-200 dark:bg-midnight-700",
        glow: "bg-gradient-to-r from-ocean-400 via-sapphire-500 to-ocean-400 shadow-glow",
      },
      size: {
        thin: "",
        default: "",
        thick: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
    VariantProps<typeof separatorVariants> {}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  (
    { className, orientation = "horizontal", decorative = true, variant, size, ...props },
    ref
  ) => {
    const getSizeClasses = () => {
      if (orientation === "horizontal") {
        switch (size) {
          case "thin":
            return "h-px w-full"
          case "thick":
            return "h-1 w-full"
          default:
            return "h-[1px] w-full"
        }
      } else {
        switch (size) {
          case "thin":
            return "h-full w-px"
          case "thick":
            return "h-full w-1"
          default:
            return "h-full w-[1px]"
        }
      }
    }

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          separatorVariants({ variant }),
          getSizeClasses(),
          className
        )}
        {...props}
      />
    )
  }
)
Separator.displayName = SeparatorPrimitive.Root.displayName

// Enhanced separator with text
export interface SeparatorWithTextProps {
  children: React.ReactNode
  className?: string
  variant?: VariantProps<typeof separatorVariants>["variant"]
}

export function SeparatorWithText({ 
  children, 
  className, 
  variant = "default" 
}: SeparatorWithTextProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <div className="flex-grow">
        <Separator variant={variant} />
      </div>
      <span className="flex-shrink mx-4 text-fluid-sm text-midnight-500 dark:text-midnight-400 font-medium bg-background px-2">
        {children}
      </span>
      <div className="flex-grow">
        <Separator variant={variant} />
      </div>
    </div>
  )
}

// Decorative separator with icon
export interface DecorativeSeparatorProps {
  icon?: React.ReactNode
  className?: string
  variant?: VariantProps<typeof separatorVariants>["variant"]
}

export function DecorativeSeparator({ 
  icon, 
  className, 
  variant = "gradient" 
}: DecorativeSeparatorProps) {
  return (
    <div className={cn("relative flex items-center justify-center py-8", className)}>
      <Separator variant={variant} className="absolute inset-x-0" />
      {icon && (
        <div className="relative bg-background px-4 text-ocean-500">
          {icon}
        </div>
      )}
    </div>
  )
}

export { Separator, separatorVariants }
