"use client"

import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"
import { RegistrationTable } from "../../../components/admin/RegistrationTable"
import { Navigation } from "../../../components/Navigation"

export default function RegistrationsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <main className="container mx-auto px-4 py-4 md:py-8">
          <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Registration Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 md:mt-2 text-sm md:text-base">
                  View and manage all conference registrations
                </p>
              </div>
            </div>

            {/* Registration Table - Self-contained with filters, pagination, and all features */}
            <RegistrationTable />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
