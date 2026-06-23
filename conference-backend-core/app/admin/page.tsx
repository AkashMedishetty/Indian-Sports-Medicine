import { Metadata } from "next"
import { ProtectedRoute } from "../../components/auth/ProtectedRoute"
import { CompleteAdminPanel } from "../../components/admin/CompleteAdminPanel"
import { conferenceConfig } from "../../config/conference.config"

export const metadata: Metadata = {
  title: `Admin Dashboard | ${conferenceConfig.shortName}`,
  description: `Comprehensive administrative dashboard for ${conferenceConfig.shortName} conference management`,
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <CompleteAdminPanel />
    </ProtectedRoute>
  )
}