import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

import { cn } from "@/conference-backend-core/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-2xl border p-6 transition-all duration-300 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-5 [&>svg]:top-5 [&>svg]:h-5 [&>svg]:w-5",
  {
    variants: {
      variant: {
        default: "bg-ocean-50 border-ocean-200 text-ocean-800 [&>svg]:text-ocean-600",
        success: "bg-emerald-50 border-emerald-200 text-emerald-800 [&>svg]:text-emerald-600",
        warning: "bg-amber-50 border-amber-200 text-amber-800 [&>svg]:text-amber-600",
        destructive: "bg-coral-50 border-coral-200 text-coral-800 [&>svg]:text-coral-600",
        info: "bg-sapphire-50 border-sapphire-200 text-sapphire-800 [&>svg]:text-sapphire-600",
        glass: "glass border-white/20 text-midnight-800 dark:text-white [&>svg]:text-ocean-600",
      },
      size: {
        sm: "p-4 text-sm [&>svg]:h-4 [&>svg]:w-4 [&>svg]:top-4 [&>svg]:left-4 [&>svg~*]:pl-6",
        default: "p-6",
        lg: "p-8 text-lg [&>svg]:h-6 [&>svg]:w-6 [&>svg]:top-8 [&>svg]:left-8 [&>svg~*]:pl-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean
  onDismiss?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, size, dismissible, onDismiss, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    const handleDismiss = () => {
      setIsVisible(false)
      onDismiss?.()
    }

    const getIcon = () => {
      switch (variant) {
        case "success":
          return <CheckCircle />
        case "warning":
          return <AlertTriangle />
        case "destructive":
          return <AlertCircle />
        case "info":
          return <Info />
        default:
          return <Info />
      }
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant, size }), className)}
        {...props}
      >
        {getIcon()}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className={dismissible ? "pr-8" : ""}>{children}</div>
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-2 font-semibold leading-tight tracking-tight text-fluid-lg", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-fluid-sm leading-relaxed [&_p]:leading-relaxed opacity-90", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

// Enhanced notification alert with actions
export interface NotificationAlertProps extends AlertProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function NotificationAlert({
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
  dismissible = true,
  onDismiss,
  className,
  ...props
}: NotificationAlertProps) {
  return (
    <Alert
      variant={variant}
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={cn("shadow-lg", className)}
      {...props}
    >
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
      {(action || secondaryAction) && (
        <div className="flex gap-3 mt-4">
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 bg-current text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 border border-current rounded-lg text-sm font-medium hover:bg-current/5 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </Alert>
  )
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
