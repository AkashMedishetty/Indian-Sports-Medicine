import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/conference-backend-core/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-xl border bg-background px-4 py-3 text-fluid-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input hover:border-ocean-300 focus-visible:border-ocean-500",
        glass: "glass border-white/20 hover:border-white/30 focus-visible:border-ocean-400",
        outline: "border-2 border-ocean-200 hover:border-ocean-300 focus-visible:border-ocean-500",
        filled: "bg-ocean-50 border-ocean-100 hover:bg-ocean-100 focus-visible:bg-white focus-visible:border-ocean-500",
      },
      inputSize: {
        sm: "h-9 px-3 py-2 text-sm rounded-lg",
        default: "h-11 px-4 py-3",
        lg: "h-13 px-5 py-4 text-lg rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
