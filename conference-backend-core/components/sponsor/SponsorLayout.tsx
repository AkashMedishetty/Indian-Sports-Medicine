"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Avatar, AvatarFallback } from "@/conference-backend-core/components/ui/avatar"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/conference-backend-core/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import {
  Building2, Users, UserPlus, FileSpreadsheet, LogOut, Home, 
  Menu, X, Sun, Moon, Monitor, ChevronDown, LayoutDashboard
} from "lucide-react"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

const sponsorNavItems = [
  { name: "Dashboard", href: "/sponsor/dashboard", icon: LayoutDashboard },
  { name: "All Delegates", href: "/sponsor/delegates", icon: Users },
  { name: "Register Delegate", href: "/sponsor/delegates/register", icon: UserPlus },
  { name: "Bulk Upload", href: "/sponsor/delegates/bulk", icon: FileSpreadsheet },
]

function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <Button variant="ghost" size="sm" className="w-9 h-9 p-0"><Sun className="h-4 w-4" /></Button>

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
          {theme === "light" ? <Sun className="h-4 w-4" /> : theme === "dark" ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800">
        <DropdownMenuItem onClick={() => setTheme("light")}><Sun className="mr-2 h-4 w-4" />Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}><Moon className="mr-2 h-4 w-4" />Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}><Monitor className="mr-2 h-4 w-4" />System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface SponsorLayoutProps {
  children: React.ReactNode
  sponsorData?: {
    companyName: string
    category: string
    allocation: { total: number; used: number }
  }
}

export function SponsorLayout({ children, sponsorData }: SponsorLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/sponsor/login' })
  }

  const isActivePage = (href: string) => pathname === href

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Top Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo & Company */}
            <Link href="/sponsor/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: conferenceConfig.theme.primary }}>
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-slate-900 dark:text-white">{sponsorData?.companyName || 'Sponsor Portal'}</div>
                <div className="text-xs text-slate-500">{conferenceConfig.shortName} • {sponsorData?.category || 'Sponsor'}</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {sponsorNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`text-sm font-medium ${isActivePage(item.href)
                        ? "text-white shadow-md"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      style={isActivePage(item.href) ? { backgroundColor: conferenceConfig.theme.primary } : {}}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              {/* Allocation Badge */}
              {sponsorData && (
                <Badge variant="outline" className="hidden md:flex items-center gap-1 px-3 py-1">
                  <Users className="w-3 h-3" />
                  {sponsorData.allocation.used}/{sponsorData.allocation.total} delegates
                </Badge>
              )}

              <ThemeToggle />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback style={{ backgroundColor: conferenceConfig.theme.primary }} className="text-white">
                        {sponsorData?.companyName?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white dark:bg-slate-800" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{sponsorData?.companyName}</p>
                      <p className="text-xs text-slate-500">{sponsorData?.category} Sponsor</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/sponsor/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sponsor/delegates"><Users className="mr-2 h-4 w-4" />All Delegates</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button variant="ghost" size="sm" className="lg:hidden w-9 h-9 p-0" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
            >
              <div className="container mx-auto px-4 py-4 space-y-2">
                {sponsorNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start h-12 ${isActivePage(item.href) ? "text-white" : ""}`}
                        style={isActivePage(item.href) ? { backgroundColor: conferenceConfig.theme.primary } : {}}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </Button>
                    </Link>
                  )
                })}
                <Button variant="ghost" className="w-full justify-start h-12 text-red-600" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-3" />Log out
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} {conferenceConfig.organizationName} • Sponsor Portal</p>
        </div>
      </footer>
    </div>
  )
}
