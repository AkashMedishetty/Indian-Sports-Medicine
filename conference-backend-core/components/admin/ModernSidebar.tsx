'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { useSession, signOut } from 'next-auth/react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  LayoutDashboard, Users, CreditCard, FileText, GraduationCap,
  BadgeCheck, Award, Mail, DollarSign, Settings, TrendingUp,
  Menu, X, ChevronRight, LogOut, User, BarChart3, Calendar, Building, Building2,
  UserCheck
} from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: any
  badge?: number
}

interface ModernSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function ModernSidebar({ activeTab, onTabChange, isOpen, onToggle }: ModernSidebarProps) {
  const { data: session } = useSession()
  const primary = conferenceConfig.theme.primary
  const accent = conferenceConfig.theme.accent
  const success = conferenceConfig.theme.success

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'registrations', label: 'Registrations', icon: Users, badge: 12 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'sponsors', label: 'Sponsors', icon: Building2 },
    { id: 'abstracts', label: 'Abstracts', icon: FileText, badge: 5 },
    { id: 'abstracts-settings', label: 'Abstracts Settings', icon: Settings },
    { id: 'reviewer-settings', label: 'Reviewer Settings', icon: UserCheck },
    { id: 'program', label: 'Program Schedule', icon: Calendar },
    { id: 'workshops', label: 'Workshops', icon: GraduationCap },
    { id: 'faculty', label: 'Faculty', icon: Award },
    { id: 'accommodation', label: 'Accommodation', icon: Building },
    { id: 'badges', label: 'Badge Designer', icon: BadgeCheck },
    { id: 'certificates', label: 'Certificate Designer', icon: Award },
    { id: 'bulk-emailer', label: 'Bulk Email', icon: Mail },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'payment-settings', label: 'Payment Settings', icon: Building },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const getItemColor = (id: string) => {
    if (id === 'analytics') return '#3b82f6' // Blue
    if (id === 'badges') return '#6366f1' // Indigo
    if (id === 'certificates') return accent
    if (id === 'bulk-emailer') return success
    if (id === 'sponsors') return '#8b5cf6' // Purple
    if (id === 'reviewer-settings') return '#10b981' // Emerald
    if (id === 'faculty') return '#f59e0b' // Amber
    return primary
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-screen w-72 bg-white dark:bg-[#1e1e1e] border-r border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Logo Section */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-[#1e1e1e] dark:to-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)` }}
                  >
                    N
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                      {conferenceConfig.shortName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Admin Info */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: primary }}
                  >
                    {session?.user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {session?.user?.name || 'Admin User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {session?.user?.email || 'admin@conference.com'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                const itemColor = getItemColor(item.id)

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id)
                      // Close sidebar on mobile after selection
                      if (window.innerWidth < 1024) {
                        onToggle()
                      }
                    }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200 group
                      ${isActive 
                        ? 'shadow-lg text-white' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }
                    `}
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${itemColor} 0%, ${itemColor}dd 100%)`
                    } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <Icon 
                        className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`}
                        style={!isActive ? { color: itemColor } : {}}
                      />
                      <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>
                        {item.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <Badge 
                          className={`text-xs px-2 ${
                            isActive 
                              ? 'bg-white/20 text-white border-white/30' 
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </div>
                  </motion.button>
                )
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e1e1e]">
              <Button
                variant="ghost"
                onClick={() => signOut()}
                className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
