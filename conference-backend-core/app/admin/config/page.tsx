import { Metadata } from "next"
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"
import { ConfigManager } from "../../../components/admin/ConfigManager"
import { Navigation } from "../../../components/Navigation"
import { conferenceConfig } from "../../../config/conference.config"  

export const metadata: Metadata = {
  title: `System Configuration | ${conferenceConfig.shortName}`,
  description: `Configure system settings and preferences for ${conferenceConfig.shortName} conference`,
}

export default function ConfigPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">System Configuration</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage pricing, discounts, email settings, and other system configurations
              </p>
            </div>

            {/* Config Manager */}
            <ConfigManager />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}