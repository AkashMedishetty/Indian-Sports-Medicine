"use client"

import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { ReviewerDashboard } from '../../components/reviewer/ReviewerDashboard'
import { Navigation } from "../../components/Navigation"

export default function ReviewerPage() {
  return (
    <ProtectedRoute requiredRole="reviewer">
      <Navigation />
      <div className="pt-16">
        <ReviewerDashboard />
      </div>
    </ProtectedRoute>
  )
}
