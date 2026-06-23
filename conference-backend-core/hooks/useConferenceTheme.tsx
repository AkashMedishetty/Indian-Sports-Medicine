/**
 * useConferenceTheme Hook - Access theme throughout the app
 * 
 * Provides easy access to conference theme colors and utilities.
 */

'use client'

import { useMemo } from 'react'
import { conferenceConfig } from '../config/conference.config'
import { generateTheme } from '../config/theme.config'

export interface ConferenceTheme {
  // Configuration
  config: typeof conferenceConfig
  
  // Colors
  colors: ReturnType<typeof generateTheme>
  
  // Quick access to common colors
  primary: string
  secondary: string
  accent: string
  success: string
  error: string
  warning: string
  
  // Utility functions
  utils: {
    getCSSVar: (colorKey: string) => string
    getContrastText: (backgroundColor: string) => 'white' | 'black'
  }
}

export function useConferenceTheme(): ConferenceTheme {
  const theme = useMemo(() => {
    const colors = generateTheme()
    
    return {
      config: conferenceConfig,
      colors,
      
      // Quick access
      primary: conferenceConfig.theme.primary,
      secondary: conferenceConfig.theme.secondary,
      accent: conferenceConfig.theme.accent,
      success: conferenceConfig.theme.success,
      error: conferenceConfig.theme.error,
      warning: conferenceConfig.theme.warning,
      
      utils: {
        getCSSVar: (colorKey: string) => `var(--conf-${colorKey})`,
        
        getContrastText: (backgroundColor: string) => {
          // Simple contrast calculation - in production use a proper library
          const isDark = backgroundColor.includes('dark') || 
                        ['#111827', '#1f2937', '#374151'].includes(backgroundColor)
          return isDark ? 'white' : 'black'
        }
      }
    }
  }, [])
  
  return theme
}

/**
 * Hook to check if registration is open
 */
export function useRegistrationStatus() {
  return useMemo(() => {
    const { registration } = conferenceConfig
    
    if (!registration.enabled) {
      return { isOpen: false, message: 'Registration is currently closed' }
    }
    
    if (!registration.startDate || !registration.endDate) {
      return { isOpen: true, message: 'Registration is open' }
    }
    
    const today = new Date()
    const start = new Date(registration.startDate)
    const end = new Date(registration.endDate)
    
    if (today < start) {
      return { 
        isOpen: false, 
        message: `Registration opens on ${start.toLocaleDateString()}` 
      }
    }
    
    if (today > end) {
      return { 
        isOpen: false, 
        message: `Registration closed on ${end.toLocaleDateString()}` 
      }
    }
    
    return { 
      isOpen: true, 
      message: `Registration closes on ${end.toLocaleDateString()}` 
    }
  }, [])
}

/**
 * Hook to check if abstract submission is open
 */
export function useAbstractSubmissionStatus() {
  return useMemo(() => {
    const { abstracts } = conferenceConfig
    
    if (!abstracts.enabled) {
      return { isOpen: false, message: 'Abstract submission is currently closed' }
    }
    
    if (!abstracts.submissionWindow?.enabled) {
      return { isOpen: true, message: 'Abstract submission is open' }
    }
    
    const today = new Date()
    const start = new Date(abstracts.submissionWindow.start)
    const end = new Date(abstracts.submissionWindow.end)
    
    if (today < start) {
      return { 
        isOpen: false, 
        message: `Abstract submission opens on ${start.toLocaleDateString()}` 
      }
    }
    
    if (today > end) {
      return { 
        isOpen: false, 
        message: `Abstract submission closed on ${end.toLocaleDateString()}` 
      }
    }
    
    return { 
      isOpen: true, 
      message: `Submission closes on ${end.toLocaleDateString()}` 
    }
  }, [])
}

/**
 * Hook to get current pricing tier
 */
export function useCurrentPricingTier() {
  return useMemo(() => {
    const today = new Date()
    const { tiers } = conferenceConfig.payment
    
    if (tiers.earlyBird?.enabled) {
      const start = new Date(tiers.earlyBird.startDate)
      const end = new Date(tiers.earlyBird.endDate)
      if (today >= start && today <= end) {
        return { 
          tier: 'earlyBird', 
          name: tiers.earlyBird.label,
          nextTier: tiers.regular?.enabled ? tiers.regular.label : null,
          nextTierDate: tiers.regular?.enabled ? new Date(tiers.regular.startDate) : null
        }
      }
    }
    
    if (tiers.regular?.enabled) {
      const start = new Date(tiers.regular.startDate)
      const end = new Date(tiers.regular.endDate)
      if (today >= start && today <= end) {
        return { 
          tier: 'regular', 
          name: tiers.regular.label,
          nextTier: tiers.onsite?.enabled ? tiers.onsite.label : null,
          nextTierDate: tiers.onsite?.enabled ? new Date(tiers.onsite.startDate) : null
        }
      }
    }
    
    if (tiers.onsite?.enabled) {
      return { 
        tier: 'onsite', 
        name: tiers.onsite.label,
        nextTier: null,
        nextTierDate: null
      }
    }
    
    return { 
      tier: 'regular', 
      name: 'Regular',
      nextTier: null,
      nextTierDate: null
    }
  }, [])
}

/**
 * Hook to format currency
 */
export function useCurrencyFormat() {
  const { currency, currencySymbol } = conferenceConfig.payment
  
  return useMemo(() => ({
    format: (amount: number) => {
      return `${currencySymbol}${amount.toLocaleString()}`
    },
    currency,
    symbol: currencySymbol
  }), [currency, currencySymbol])
}

/**
 * Hook to get conference dates
 */
export function useConferenceDates() {
  return useMemo(() => {
    const start = new Date(conferenceConfig.eventDate.start)
    const end = new Date(conferenceConfig.eventDate.end)
    
    const daysUntilConference = Math.ceil(
      (start.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    
    return {
      start,
      end,
      startFormatted: start.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      endFormatted: end.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      daysUntilConference,
      isUpcoming: daysUntilConference > 0,
      isPast: daysUntilConference < -3, // Conference + 3 days buffer
      isOngoing: daysUntilConference <= 0 && daysUntilConference >= -3
    }
  }, [])
}
