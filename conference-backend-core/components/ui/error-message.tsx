import { Alert, AlertDescription } from "./alert"
import { Button } from "./button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"
import { cn } from "@/conference-backend-core/lib/utils"

interface ErrorMessageProps {
  title?: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  showHomeLink?: boolean
  className?: string
  variant?: "default" | "destructive"
}

export function ErrorMessage({
  title = "Something went wrong",
  message,
  action,
  showHomeLink = false,
  className,
  variant = "destructive"
}: ErrorMessageProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <Alert variant={variant}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">{title}</p>
            <p className="text-sm">{message}</p>
          </div>
        </AlertDescription>
      </Alert>
      
      {(action || showHomeLink) && (
        <div className="flex gap-2">
          {action && (
            <Button onClick={action.onClick} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          )}
          {showHomeLink && (
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export function PageError({
  title = "Page Error",
  message = "We encountered an error while loading this page.",
  onRetry,
  className
}: {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn(
      "min-h-[50vh] flex items-center justify-center p-4",
      className
    )}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export function InlineError({
  message,
  className
}: {
  message: string
  className?: string
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800",
      className
    )}>
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}