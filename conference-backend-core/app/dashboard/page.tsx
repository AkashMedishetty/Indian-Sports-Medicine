import { Metadata } from "next"
import { CompleteDashboard } from "../../components/dashboard/CompleteDashboard"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your conference registration and profile",
}

export default function DashboardPage() {
  return <CompleteDashboard />
}