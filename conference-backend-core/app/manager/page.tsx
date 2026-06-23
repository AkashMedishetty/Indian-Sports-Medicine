"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "../../components/auth/ProtectedRoute"
import { RegistrationTable } from "../../components/admin/RegistrationTable"
import { Navigation } from "../../components/Navigation"
import { Button } from "../../components/ui/button"
import { 
  RefreshCw,
  Download,
  ClipboardList,
  Users,
  CheckCircle,
  Clock,
  CreditCard,
  XCircle
} from "lucide-react"

interface RegistrationStats {
  total: number
  pending: number
  confirmed: number
  paid: number
  cancelled: number
}

export default function ManagerDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState<RegistrationStats>({ total: 0, pending: 0, confirmed: 0, paid: 0, cancelled: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/registrations")
      const data = await response.json()
      if (data.success && data.data) {
        const registrations = data.data
        setStats({
          total: registrations.length,
          pending: registrations.filter((r: any) => r.registration?.status === 'pending').length,
          confirmed: registrations.filter((r: any) => r.registration?.status === 'confirmed').length,
          paid: registrations.filter((r: any) => r.registration?.status === 'paid').length,
          cancelled: registrations.filter((r: any) => r.registration?.status === 'cancelled').length
        })
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStats()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleExport = () => {
    console.log("Export registrations")
  }

  return (
    <ProtectedRoute requiredRole="manager">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <main className="container mx-auto px-4 py-4 md:py-8">
          <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl md:text-3xl font-bold">Manager Dashboard</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1 md:mt-2 text-sm md:text-base">
                  View and manage conference registrations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export All</span>
                </Button>
              </div>
            </div>

            {/* Compact Stats Bar */}
            <div className="flex flex-wrap gap-2 md:gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{stats.total}</span>
                <span className="text-xs text-gray-500">Total</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">{stats.pending}</span>
                <span className="text-xs text-gray-500">Pending</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{stats.confirmed}</span>
                <span className="text-xs text-gray-500">Confirmed</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">{stats.paid}</span>
                <span className="text-xs text-gray-500">Paid</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">{stats.cancelled}</span>
                <span className="text-xs text-gray-500">Cancelled</span>
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
