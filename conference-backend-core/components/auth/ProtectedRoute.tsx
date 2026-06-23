"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, useRef, ReactNode } from "react"
import { Loader2 } from "lucide-react"


interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: "user" | "admin" | "reviewer" | "manager"
  fallbackUrl?: string
}

export function ProtectedRoute({
  children,
  requiredRole = "user",
  fallbackUrl = "/auth/login"
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Simple, fast authentication check
    if (status === "loading") return

    if (status === "unauthenticated") {
      if (!isRedirecting) {
        setIsRedirecting(true)
        const returnUrl = encodeURIComponent(pathname)
        const loginUrl = `${fallbackUrl}?callbackUrl=${returnUrl}`
        router.push(loginUrl)
      }
      return
    }

    if (session?.user) {
      // Quick role check
      const userRole = (session.user as any).role || "user"

      if (requiredRole === "admin" && userRole !== "admin") {
        router.push("/dashboard")
        return
      }

      if (requiredRole === "reviewer" && !["admin", "reviewer"].includes(userRole)) {
        router.push("/dashboard")
        return
      }

      // Manager role: only managers and admins can access manager routes
      if (requiredRole === "manager" && !["admin", "manager"].includes(userRole)) {
        router.push("/dashboard")
        return
      }
    }
  }, [session, status, router, pathname, requiredRole, fallbackUrl, isRedirecting])

  // Simple loading state - no blocking screens
  if (status === "loading") {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-[#25406b]" />
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  // Don't block content while redirecting
  if (status === "unauthenticated" || isRedirecting) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-[#25406b]" />
          <span className="text-sm text-gray-600">Redirecting...</span>
        </div>
      </div>
    )
  }

  // Check role access
  if (session?.user) {
    const userRole = (session.user as any).role || "user"

    if (requiredRole === "admin" && (session.user as any).role !== "admin") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    if (requiredRole === "reviewer" && !["admin", "reviewer"].includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-gray-600">You don't have reviewer permissions.</p>
          </div>
        </div>
      )
    }

    // Manager role access check
    if (requiredRole === "manager" && !["admin", "manager"].includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-gray-600">You don't have manager permissions.</p>
          </div>
        </div>
      )
    }
  }

  // Render protected content
  return <>{children}</>
}

// HOC version for easier usage
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: "user" | "admin" | "reviewer" | "manager" = "user"
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}