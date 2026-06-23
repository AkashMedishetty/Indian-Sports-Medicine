"use client"

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import { AbstractsSubmissionsManager } from '../../../components/admin/AbstractsSubmissionsManager'

export default function AdminAbstractsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Abstract Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage submitted abstracts, review assignments, and export data
          </p>
        </div>
        
        <AbstractsSubmissionsManager />
      </div>
    </ProtectedRoute>
  )
}


