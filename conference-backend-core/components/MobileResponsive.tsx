/**
 * Mobile Responsive Utilities and Components
 * 
 * Provides hooks and components for mobile-responsive layouts.
 */

'use client'

import { useEffect, useState } from 'react'
import { breakpoints } from '../config/theme.config'

/**
 * Hook to detect screen size
 */
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false
  })

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth
      
      setScreenSize({
        width,
        height: window.innerHeight,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return screenSize
}

/**
 * Hook to detect mobile device
 */
export function useIsMobile() {
  const { isMobile } = useScreenSize()
  return isMobile
}

/**
 * Hook to detect touch device
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return isTouch
}

/**
 * Responsive Container Component
 */
interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}

export function ResponsiveContainer({
  children,
  className = '',
  maxWidth = 'xl',
  padding = true
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full'
  }

  return (
    <div 
      className={`
        ${maxWidthClasses[maxWidth]} 
        mx-auto 
        ${padding ? 'px-4 sm:px-6 lg:px-8' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  )
}

/**
 * Responsive Grid Component
 */
interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
}

export function ResponsiveGrid({
  children,
  className = '',
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 4
}: ResponsiveGridProps) {
  const gridCols = `
    grid-cols-${cols.xs || 1}
    ${cols.sm ? `sm:grid-cols-${cols.sm}` : ''}
    ${cols.md ? `md:grid-cols-${cols.md}` : ''}
    ${cols.lg ? `lg:grid-cols-${cols.lg}` : ''}
    ${cols.xl ? `xl:grid-cols-${cols.xl}` : ''}
  `

  return (
    <div className={`grid ${gridCols} gap-${gap} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Mobile Menu Component
 */
interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function MobileMenu({ isOpen, onClose, children }: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Responsive Table Component
 */
interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className={`min-w-full divide-y divide-gray-300 ${className}`}>
            {children}
          </table>
        </div>
      </div>
    </div>
  )
}

/**
 * Stack Component - Vertical spacing
 */
interface StackProps {
  children: React.ReactNode
  spacing?: number
  className?: string
}

export function Stack({ children, spacing = 4, className = '' }: StackProps) {
  return (
    <div className={`flex flex-col space-y-${spacing} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Show/Hide based on screen size
 */
interface ShowOnProps {
  mobile?: boolean
  tablet?: boolean
  desktop?: boolean
  children: React.ReactNode
}

export function ShowOn({ mobile, tablet, desktop, children }: ShowOnProps) {
  const classes = []
  
  if (mobile && !tablet && !desktop) classes.push('block md:hidden')
  if (tablet && !mobile && !desktop) classes.push('hidden md:block lg:hidden')
  if (desktop && !mobile && !tablet) classes.push('hidden lg:block')
  if (mobile && tablet && !desktop) classes.push('block lg:hidden')
  if (mobile && desktop && !tablet) classes.push('block md:hidden lg:block')
  if (tablet && desktop && !mobile) classes.push('hidden md:block')
  
  return <div className={classes.join(' ')}>{children}</div>
}

/**
 * Responsive Text Sizes
 */
export const responsiveText = {
  xs: 'text-xs sm:text-sm',
  sm: 'text-sm sm:text-base',
  base: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl',
  xl: 'text-xl sm:text-2xl',
  '2xl': 'text-2xl sm:text-3xl',
  '3xl': 'text-3xl sm:text-4xl md:text-5xl',
  '4xl': 'text-4xl sm:text-5xl md:text-6xl'
}

/**
 * Responsive Spacing
 */
export const responsiveSpacing = {
  section: 'py-8 sm:py-12 md:py-16 lg:py-20',
  container: 'px-4 sm:px-6 lg:px-8',
  gap: 'gap-4 sm:gap-6 lg:gap-8'
}
