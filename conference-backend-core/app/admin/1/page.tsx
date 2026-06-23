import { Metadata } from "next"
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"
import { ComprehensiveAdminPanel } from "../../../components/admin/ComprehensiveAdminPanel"
import { Navigation } from "../../../components/Navigation"
import { conferenceConfig } from "../../../config/conference.config"

export const metadata: Metadata = {
  title: `Old Admin Panel | ${conferenceConfig.shortName}`,
  description: `Legacy admin dashboard (backup)`,
}

export default function OldAdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <Navigation />
        
        <main className="pt-16">
          <div className="container mx-auto px-4 py-4">
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h2 className="text-lg font-semibold text-amber-900">Old Admin Panel (Backup)</h2>
              <p className="text-amber-700 text-sm mt-1">
                You're viewing the legacy admin dashboard. 
                <a href="/admin" className="text-blue-600 hover:underline ml-2 font-medium">
                  ← Go to new modern admin panel
                </a>
              </p>
            </div>
          </div>
          <ComprehensiveAdminPanel />
        </main>
      </div>
    </ProtectedRoute>
  )
}
