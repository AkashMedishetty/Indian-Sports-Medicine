"use client"

import { ProtectedRoute } from "../../../../components/auth/ProtectedRoute"
import { MainLayout } from "../../../../components/layout/MainLayout"
import { PaymentSettingsManager } from "../../../../components/admin/PaymentSettingsManager"

export default function PaymentSettingsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <PaymentSettingsManager />
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
