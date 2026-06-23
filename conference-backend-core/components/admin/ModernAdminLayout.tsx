'use client'

import { ReactNode, useState } from 'react'
import { motion } from 'framer-motion'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { ModernSidebar } from './ModernSidebar'
import { DarkModeToggle } from './DarkModeToggle'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Menu, Search, Bell, RefreshCw, Activity } from 'lucide-react'
import { Badge } from '../ui/badge'

interface ModernAdminLayoutProps {
  children: ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  onRefresh?: () => void
}

export function ModernAdminLayout({ children, activeTab, onTabChange, onRefresh }: ModernAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const primary = conferenceConfig.theme.primary

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#181818]">
      {/* Sidebar */}
      <ModernSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div 
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-72' : 'ml-0'
        }`}
      >
        {/* Top Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#1e1e1e]/95 border-b border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left Side */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                
                {/* Search */}
                <div className="hidden md:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <Input
                      type="search"
                      placeholder="Search registrations, payments..."
                      className="pl-10 w-80 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative text-slate-700 dark:text-slate-300">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </Button>

                {/* Refresh */}
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                )}

                {/* Dark Mode */}
                <DarkModeToggle />

                {/* Live Status */}
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                  <Activity 
                    className="h-4 w-4 animate-pulse" 
                    style={{ color: primary }} 
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Live</span>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
