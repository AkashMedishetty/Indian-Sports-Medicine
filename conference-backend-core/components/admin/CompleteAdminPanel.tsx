'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ModernAdminLayout } from './ModernAdminLayout'
import { StunningDashboard } from './StunningDashboard'
import { QuickSettings } from './QuickSettings'
import { EnhancedExport } from './EnhancedExport'
import { RegistrationTable } from './RegistrationTable'
import { PricingTiersManager } from './PricingTiersManager'
import { WorkshopManager } from './WorkshopManager'
import { AbstractsSubmissionsManager } from './AbstractsSubmissionsManager'
import { AbstractsSettingsManager } from './AbstractsSettingsManager'
import { ProgramManager } from './ProgramManager'
import { ContactMessagesManager } from './ContactMessagesManager'
import { BadgeDesigner } from './BadgeDesigner'
import { CertificateDesigner } from './CertificateDesigner'
import { BulkCertificateEmailer } from './BulkCertificateEmailer'
import { AdvancedBulkEmailSystem } from './AdvancedBulkEmailSystem'
import { StunningAnalyticsDashboard } from './StunningAnalyticsDashboard'
import { AccommodationManager } from './AccommodationManager'
import { PaymentTable } from './PaymentTable'
import { PaymentSettingsManager } from './PaymentSettingsManager'
import { SponsorManager } from './SponsorManager'
import { FacultyManager } from './FacultyManager'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { AlertCircle, RefreshCw, Settings, Mail, Bell, MessageCircle, TrendingUp, DollarSign } from 'lucide-react'

interface DashboardStats {
  totalRegistrations: number
  paidRegistrations: number
  confirmedRegistrations: number
  pendingPayments: number
  totalRevenue: number
  totalAbstracts: number
  currency: string
  workshopRegistrations: number
  accompanyingPersons: number
  registrationsByCategory: Record<string, number>
  dailyRegistrations: Array<{ date: string; count: number }>
  paymentsByMethod: Record<string, number>
}

export function CompleteAdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/dashboard')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      
      if (result.success) {
        setDashboardStats(result.data)
      } else {
        throw new Error(result.message || 'Failed to load dashboard')
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading && !dashboardStats) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#181818] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !dashboardStats) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#181818] flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">{error}</p>
            <Button onClick={fetchDashboardData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <StunningDashboard />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <QuickSettings />
              <EnhancedExport />
            </div>
          </motion.div>
        )

      case 'registrations':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <RegistrationTable />
          </motion.div>
        )

      case 'payments':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <PaymentTable />
          </motion.div>
        )

      case 'pricing':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <PricingTiersManager />
          </motion.div>
        )

      case 'workshops':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <WorkshopManager />
          </motion.div>
        )

      case 'faculty':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <FacultyManager />
          </motion.div>
        )

      case 'accommodation':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AccommodationManager />
          </motion.div>
        )

      case 'abstracts':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AbstractsSubmissionsManager />
          </motion.div>
        )

      case 'abstracts-settings':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AbstractsSettingsManager />
          </motion.div>
        )

      case 'reviewer-settings':
        // Redirect to reviewer settings page
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/settings/reviewer'
        }
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
              <CardContent className="p-12">
                <div className="text-center">
                  <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-600 dark:text-slate-400">Redirecting to Reviewer Settings...</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )

      case 'program':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ProgramManager />
          </motion.div>
        )

      case 'settings':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  Configuration Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuickSettings />
              </CardContent>
            </Card>
          </motion.div>
        )

      case 'badges':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <BadgeDesigner />
          </motion.div>
        )

      case 'certificates':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <CertificateDesigner />
          </motion.div>
        )

      case 'bulk-emailer':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdvancedBulkEmailSystem />
          </motion.div>
        )

      case 'messages':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  Message Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContactMessagesManager />
              </CardContent>
            </Card>
          </motion.div>
        )

      case 'analytics':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <StunningAnalyticsDashboard />
          </motion.div>
        )

      case 'payment-settings':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <PaymentSettingsManager />
          </motion.div>
        )

      case 'sponsors':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <SponsorManager />
          </motion.div>
        )

      default:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
              <CardContent className="p-12">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">Tab Not Found</h3>
                  <p className="text-slate-500 dark:text-slate-400">The requested tab could not be found.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
    }
  }

  return (
    <ModernAdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={fetchDashboardData}
    >
      {renderTabContent()}
    </ModernAdminLayout>
  )
}
