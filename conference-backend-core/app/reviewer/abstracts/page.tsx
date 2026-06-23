"use client"

import { ProtectedRoute } from '@/conference-backend-core/components/auth/ProtectedRoute'
import { ReviewerDashboard } from '@/conference-backend-core/components/reviewer/ReviewerDashboard'
import { Navigation } from "@/conference-backend-core/components/Navigation"

export default function ReviewerAbstractsPage() {
  return (
    <ProtectedRoute requiredRole="reviewer">
      <Navigation />
      <div className="pt-16">
        <ReviewerDashboard />
      </div>
    </ProtectedRoute>
  )
}
