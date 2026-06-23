import { Metadata } from "next"
import { ProtectedRoute } from "@/conference-backend-core/components/auth/ProtectedRoute"
import { ProfileForm } from "@/conference-backend-core/components/dashboard/ProfileForm"
import { MainLayout } from "@/conference-backend-core/components/layout/MainLayout"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

export const metadata: Metadata = {
  title: `Profile | ${conferenceConfig.shortName}`,
  description: `Manage your ${conferenceConfig.shortName} conference profile`,
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <MainLayout currentPage="profile" showSearch={true}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your personal information and conference preferences
              </p>
            </div>
            
            <ProfileForm />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}