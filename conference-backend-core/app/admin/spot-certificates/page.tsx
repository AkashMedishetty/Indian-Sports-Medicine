"use client"

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import { SpotCertificates } from '../../../components/admin/spot-certificates/SpotCertificates'

export default function SpotCertificatesPage() {
  return (
    // "manager" admits both managers and admins (desk staff issue certificates on the spot).
    <ProtectedRoute requiredRole="manager">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-1 text-3xl font-bold text-gray-800 dark:text-gray-100">Spot Certificates</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a certificate PDF, place the name and details on it, then preview and email it.
          </p>
        </div>
        <SpotCertificates />
      </div>
    </ProtectedRoute>
  )
}
