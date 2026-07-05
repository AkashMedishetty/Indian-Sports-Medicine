/**
 * Main Navigation Component
 * Responsive navigation with all links — premium (home-matched) styling.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu'
import { Menu, X, LogOut, User, LayoutDashboard, ChevronDown, Shield, ClipboardList } from 'lucide-react'
import { ThemeToggle } from '@/components/concepts/premium/ThemeToggle'
import { MobileMenu } from './MobileResponsive'

const linkBase =
  'ismc-mono rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors'

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/program-schedule', label: 'Program' },
    { href: '/abstracts', label: 'Abstracts' },
    { href: '/pricing', label: 'Fees' },
    { href: '/venue', label: 'Venue' },
    { href: '/contact', label: 'Contact' }
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav
      className="ismc-body sticky top-0 z-50 border-b"
      style={{
        borderColor: 'var(--p-border)',
        background: 'var(--p-glass)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        color: 'var(--p-text)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="ismc-display text-lg font-bold tracking-tight" style={{ color: 'var(--p-text)' }}>
            TASMC<span style={{ color: 'var(--p-accent)' }}>26</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-0.5 md:flex">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkBase}
                style={{
                  color: isActive(link.href) ? 'var(--p-text)' : 'var(--p-text-muted)',
                  background: isActive(link.href) ? 'var(--p-glass-border)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[var(--p-glass-border)]">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback style={{ background: 'var(--p-accent)', color: '#0a1e40' }}>
                        {session.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="ismc-body hidden text-sm font-medium lg:inline">{session.user?.name}</span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" style={{ background: 'var(--p-surface)', borderColor: 'var(--p-border)', color: 'var(--p-text)' }}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs" style={{ color: 'var(--p-text-muted)' }}>{session.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {(session.user as any)?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/manager')} className="cursor-pointer">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Manager Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  {(session.user as any)?.role === 'manager' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/manager')} className="cursor-pointer">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Manager Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  {(session.user as any)?.role === 'reviewer' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/reviewer')} className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Reviewer Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer text-red-600 dark:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/login"
                  className={linkBase}
                  style={{ color: 'var(--p-text-muted)' }}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="p-neon ismc-mono rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-transform hover:-translate-y-px"
                  style={{ background: 'var(--p-accent)', color: '#0a1e40' }}
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-[var(--p-glass-border)]"
              style={{ borderColor: 'var(--p-glass-border)', color: 'var(--p-text)' }}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <div className="ismc-body space-y-1 px-4 py-6" style={{ color: 'var(--p-text)' }}>
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl px-3 py-2.5 text-base font-medium transition-colors hover:bg-[var(--p-glass-border)]"
              style={isActive(link.href) ? { background: 'var(--p-glass-border)' } : {}}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--p-border)' }}>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="block rounded-xl px-3 py-2.5 text-base font-medium transition-colors hover:bg-[var(--p-glass-border)]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {(session.user as any)?.role === 'admin' && (
                  <>
                    <Link href="/admin" className="block rounded-xl px-3 py-2.5 text-base font-medium transition-colors hover:bg-[var(--p-glass-border)]" onClick={() => setMobileMenuOpen(false)}>
                      Admin Panel
                    </Link>
                    <Link href="/manager" className="block rounded-xl px-3 py-2.5 text-base font-medium transition-colors hover:bg-[var(--p-glass-border)]" onClick={() => setMobileMenuOpen(false)}>
                      Manager Dashboard
                    </Link>
                  </>
                )}
                {(session.user as any)?.role === 'manager' && (
                  <Link href="/manager" className="block rounded-xl px-3 py-2.5 text-base font-medium transition-colors hover:bg-[var(--p-glass-border)]" onClick={() => setMobileMenuOpen(false)}>
                    Manager Dashboard
                  </Link>
                )}
                {(session.user as any)?.role === 'reviewer' && (
                  <Link href="/reviewer" className="block rounded-xl px-3 py-2.5 text-base font-medium transition-colors hover:bg-[var(--p-glass-border)]" onClick={() => setMobileMenuOpen(false)}>
                    Reviewer Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false) }}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-base font-medium text-red-600 transition-colors hover:bg-[var(--p-glass-border)] dark:text-red-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block rounded-xl px-3 py-2.5 text-base font-medium transition-colors hover:bg-[var(--p-glass-border)]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="mt-1 block rounded-full px-3 py-2.5 text-center text-base font-semibold"
                  style={{ background: 'var(--p-accent)', color: '#0a1e40' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </MobileMenu>
    </nav>
  )
}

export default Navigation
