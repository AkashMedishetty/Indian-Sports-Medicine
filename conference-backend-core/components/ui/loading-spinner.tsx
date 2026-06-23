import { cn } from "@/conference-backend-core/lib/utils"
import { Loader2, Sparkles } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-6 w-6", 
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-ocean-600",
        primary: "text-ocean-600",
        secondary: "text-midnight-400",
        success: "text-emerald-600",
        warning: "text-amber-600",
        danger: "text-coral-600",
        white: "text-white",
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
)

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string
  text?: string
  icon?: "loader" | "sparkles"
}

export function LoadingSpinner({ 
  size = "md", 
  variant = "default",
  className,
  text,
  icon = "loader"
}: LoadingSpinnerProps) {
  const IconComponent = icon === "sparkles" ? Sparkles : Loader2

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <IconComponent className={cn(spinnerVariants({ size, variant }))} />
      {text && (
        <span className="text-fluid-sm text-midnight-600 dark:text-midnight-400 font-medium">
          {text}
        </span>
      )}
    </div>
  )
}

export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 via-white to-sapphire-50 dark:from-midnight-900 dark:via-midnight-800 dark:to-midnight-900">
      <div className="text-center space-y-6">
        {/* Enhanced loading animation */}
        <div className="relative">
          <div className="w-20 h-20 gradient-ocean rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse-glow">
            <Sparkles className="h-10 w-10 animate-spin text-white" />
          </div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-ocean-200 rounded-full animate-spin mx-auto"></div>
        </div>
        
        <div className="space-y-2">
          <p className="text-fluid-lg font-semibold text-gradient-ocean">
            {text}
          </p>
          <p className="text-fluid-sm text-midnight-600 dark:text-midnight-400">
            Please wait while we prepare your experience
          </p>
        </div>
        
        {/* Enhanced dot animation */}
        <div className="flex space-x-2 justify-center">
          <div className="w-3 h-3 bg-ocean-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-sapphire-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-ocean-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}

export function ComponentLoader({ 
  text = "Loading...",
  className 
}: { 
  text?: string
  className?: string 
}) {
  return (
    <div className={cn(
      "flex items-center justify-center p-8 glass rounded-2xl border-2 border-dashed border-ocean-200 dark:border-midnight-700",
      className
    )}>
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" variant="primary" icon="sparkles" />
        <p className="text-fluid-sm text-midnight-600 dark:text-midnight-400 font-medium">
          {text}
        </p>
      </div>
    </div>
  )
}

// New skeleton loader component
export function SkeletonLoader({ 
  lines = 3, 
  className 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-gradient-to-r from-ocean-100 via-ocean-200 to-ocean-100 rounded-lg animate-shimmer",
            i === 0 && "w-3/4",
            i === 1 && "w-full",
            i === 2 && "w-2/3",
            i > 2 && "w-5/6"
          )}
          style={{
            backgroundSize: "200px 100%",
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  )
}