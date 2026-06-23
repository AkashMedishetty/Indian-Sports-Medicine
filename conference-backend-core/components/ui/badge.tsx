import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/conference-backend-core/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm hover:shadow-md",
        secondary:
          "border-transparent bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-gray-100 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700",
        destructive:
          "border-transparent bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm hover:shadow-md",
        outline: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
        glass: "backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100",
        success: "border-transparent bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm hover:shadow-md",
        warning: "border-transparent bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm hover:shadow-md",
        coral: "border-transparent bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-sm hover:shadow-md",
      },
      size: {
        sm: "px-2 py-0.5 text-xs rounded-md",
        default: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
