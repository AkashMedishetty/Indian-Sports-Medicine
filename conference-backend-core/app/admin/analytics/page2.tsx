import { Metadata } from "next"
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Analytics & Reports | NeuroVascon 2026",
  description: "Comprehensive analytics and reporting dashboard",
}

export default function AnalyticsPage() {
  // Redirect to main admin with analytics tab
  redirect('/admin?tab=analytics')
}
