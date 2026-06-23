"use client"

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import { Navigation } from '../../../components/Navigation'
import { SponsorManager } from '../../../components/admin/SponsorManager'

export default function AdminSponsorsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Navigation />
      <div className="container mx-auto p-4">
        <SponsorManager />
      </div>
    </ProtectedRoute>
  )
}
