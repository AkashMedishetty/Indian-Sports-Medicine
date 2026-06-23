/**
 * Theme Provider Component - Injects theme CSS variables
 * 
 * Wrap your app with this to enable theme throughout.
 */

'use client'

import React, { useEffect } from 'react'
import { conferenceConfig } from '../config/conference.config'
import { generateThemeCSSVariables } from '../config/theme.config'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ConferenceThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    // Inject CSS variables into document
    const style = document.createElement('style')
    style.innerHTML = generateThemeCSSVariables()
    document.head.appendChild(style)
    
    // Set data attributes for easy targeting
    document.documentElement.setAttribute('data-conference', conferenceConfig.shortName)
    document.documentElement.setAttribute('data-theme-primary', conferenceConfig.theme.primary)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  
  return <>{children}</>
}

/**
 * HOC to wrap component with theme provider
 */
export function withConferenceTheme<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ThemedComponent(props: P) {
    return (
      <ConferenceThemeProvider>
        <Component {...props} />
      </ConferenceThemeProvider>
    )
  }
}
