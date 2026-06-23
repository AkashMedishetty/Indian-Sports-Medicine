/**
 * Enhanced skeleton loading components with animations
 */

"use client"

import { motion } from "framer-motion"
import { cn } from "@/conference-backend-core/lib/utils"
import { skeletonPulse } from "@/conference-backend-core/lib/animations"

interface SkeletonProps {
  className?: string
  variant?: "default" | "shimmer" | "pulse" | "wave"
}

export function Skeleton({ className, variant = "shimmer" }: SkeletonProps) {
  if (variant === "pulse") {
    return (
      <motion.div
        variants={skeletonPulse}
        animate="animate"
        className={cn(
          "bg-slate-200 rounded-lg",
          className
        )}
      />
    )
  }

  if (variant === "wave") {
    return (
      <div
        className={cn(
          "bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-lg animate-wave",
          className
        )}
        style={{
          backgroundSize: "200px 100%",
          animation: "wave 1.5s ease-in-out infinite",
        }}
      />
    )
  }

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-lg animate-shimmer",
        className
      )}
      style={{
        backgroundSize: "200px 100%",
      }}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number
  columns?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-4",
                colIndex === 0 ? "w-1/4" : "flex-1"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonAvatar({ 
  size = "md",
  className 
}: { 
  size?: "sm" | "md" | "lg" | "xl"
  className?: string 
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  }

  return (
    <Skeleton 
      className={cn(
        "rounded-full",
        sizeClasses[size],
        className
      )} 
    />
  )
}

export function SkeletonText({ 
  lines = 3,
  className 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 && "w-3/4",
            i === 1 && "w-full",
            i === 2 && "w-2/3",
            i > 2 && "w-5/6"
          )}
        />
      ))}
    </div>
  )
}

export function SkeletonButton({ 
  size = "md",
  className 
}: { 
  size?: "sm" | "md" | "lg"
  className?: string 
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-28",
  }

  return (
    <Skeleton 
      className={cn(
        "rounded-lg",
        sizeClasses[size],
        className
      )} 
    />
  )
}

export function SkeletonDashboard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <SkeletonAvatar size="sm" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 border rounded-xl space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="p-6 border rounded-xl space-y-4">
          <Skeleton className="h-6 w-28" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <SkeletonTable rows={8} columns={5} />
      </div>
    </div>
  )
}