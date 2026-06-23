"use client"

import { ProtectedRoute } from '@/conference-backend-core/components/auth/ProtectedRoute'
import { AbstractsDashboard } from '@/conference-backend-core/components/dashboard/AbstractsDashboard'
import { MainLayout } from '@/conference-backend-core/components/layout/MainLayout'

export default function UserAbstractsDashboardPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <MainLayout currentPage="abstracts" showSearch={false}>
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              My Abstracts
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your abstract submissions and manage the review process
            </p>
          </div>
          
          <AbstractsDashboard />
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}


