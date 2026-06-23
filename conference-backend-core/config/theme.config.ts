/**
 * Theme Configuration System
 * 
 * Automatically generates theme variables and utilities from conference config.
 * All UI components use these theme values for consistent branding.
 */

import { conferenceConfig } from './conference.config'

export interface ThemeColors {
  primary: string
  primaryHover: string
  primaryLight: string
  primaryDark: string
  
  secondary: string
  secondaryHover: string
  secondaryLight: string
  secondaryDark: string
  
  accent: string
  accentHover: string
  accentLight: string
  accentDark: string
  
  success: string
  successLight: string
  successDark: string
  
  error: string
  errorLight: string
  errorDark: string
  
  warning: string
  warningLight: string
  warningDark: string
  
  dark: string
  darkLight: string
  
  light: string
  lightDark: string
  
  // Neutral colors
  gray: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
  }
}

/**
 * Generate shade variations from base color
 */
function generateShades(baseColor: string): {
  hover: string
  light: string
  dark: string
} {
  // This is a simplified version - in production, use a color manipulation library
  return {
    hover: baseColor, // Would be slightly darker
    light: baseColor + '20', // Alpha channel for light version
    dark: baseColor // Would be darker
  }
}

/**
 * Generate complete theme from conference config
 */
export function generateTheme(): ThemeColors {
  const { theme } = conferenceConfig
  
  const primaryShades = generateShades(theme.primary)
  const secondaryShades = generateShades(theme.secondary)
  const accentShades = generateShades(theme.accent)
  
  return {
    // Primary color
    primary: theme.primary,
    primaryHover: primaryShades.hover,
    primaryLight: primaryShades.light,
    primaryDark: primaryShades.dark,
    
    // Secondary color
    secondary: theme.secondary,
    secondaryHover: secondaryShades.hover,
    secondaryLight: secondaryShades.light,
    secondaryDark: secondaryShades.dark,
    
    // Accent color
    accent: theme.accent,
    accentHover: accentShades.hover,
    accentLight: accentShades.light,
    accentDark: accentShades.dark,
    
    // Success color
    success: theme.success,
    successLight: theme.success + '20',
    successDark: theme.success,
    
    // Error color
    error: theme.error,
    errorLight: theme.error + '20',
    errorDark: theme.error,
    
    // Warning color
    warning: theme.warning,
    warningLight: theme.warning + '20',
    warningDark: theme.warning,
    
    // Dark colors
    dark: theme.dark,
    darkLight: '#374151',
    
    // Light colors
    light: theme.light,
    lightDark: '#e5e7eb',
    
    // Neutral grays
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  }
}

/**
 * Generate CSS variables for theme
 */
export function generateThemeCSSVariables(): string {
  const theme = generateTheme()
  
  return `
    :root {
      /* Primary Colors */
      --conf-primary: ${theme.primary};
      --conf-primary-hover: ${theme.primaryHover};
      --conf-primary-light: ${theme.primaryLight};
      --conf-primary-dark: ${theme.primaryDark};
      
      /* Secondary Colors */
      --conf-secondary: ${theme.secondary};
      --conf-secondary-hover: ${theme.secondaryHover};
      --conf-secondary-light: ${theme.secondaryLight};
      --conf-secondary-dark: ${theme.secondaryDark};
      
      /* Accent Colors */
      --conf-accent: ${theme.accent};
      --conf-accent-hover: ${theme.accentHover};
      --conf-accent-light: ${theme.accentLight};
      --conf-accent-dark: ${theme.accentDark};
      
      /* State Colors */
      --conf-success: ${theme.success};
      --conf-success-light: ${theme.successLight};
      --conf-success-dark: ${theme.successDark};
      
      --conf-error: ${theme.error};
      --conf-error-light: ${theme.errorLight};
      --conf-error-dark: ${theme.errorDark};
      
      --conf-warning: ${theme.warning};
      --conf-warning-light: ${theme.warningLight};
      --conf-warning-dark: ${theme.warningDark};
      
      /* Neutral Colors */
      --conf-dark: ${theme.dark};
      --conf-dark-light: ${theme.darkLight};
      --conf-light: ${theme.light};
      --conf-light-dark: ${theme.lightDark};
      
      /* Gray Scale */
      --conf-gray-50: ${theme.gray[50]};
      --conf-gray-100: ${theme.gray[100]};
      --conf-gray-200: ${theme.gray[200]};
      --conf-gray-300: ${theme.gray[300]};
      --conf-gray-400: ${theme.gray[400]};
      --conf-gray-500: ${theme.gray[500]};
      --conf-gray-600: ${theme.gray[600]};
      --conf-gray-700: ${theme.gray[700]};
      --conf-gray-800: ${theme.gray[800]};
      --conf-gray-900: ${theme.gray[900]};
    }
  `
}

/**
 * Tailwind CSS color configuration
 */
export function getTailwindThemeConfig() {
  const theme = generateTheme()
  
  return {
    colors: {
      conference: {
        primary: {
          DEFAULT: theme.primary,
          hover: theme.primaryHover,
          light: theme.primaryLight,
          dark: theme.primaryDark,
        },
        secondary: {
          DEFAULT: theme.secondary,
          hover: theme.secondaryHover,
          light: theme.secondaryLight,
          dark: theme.secondaryDark,
        },
        accent: {
          DEFAULT: theme.accent,
          hover: theme.accentHover,
          light: theme.accentLight,
          dark: theme.accentDark,
        },
        success: {
          DEFAULT: theme.success,
          light: theme.successLight,
          dark: theme.successDark,
        },
        error: {
          DEFAULT: theme.error,
          light: theme.errorLight,
          dark: theme.errorDark,
        },
        warning: {
          DEFAULT: theme.warning,
          light: theme.warningLight,
          dark: theme.warningDark,
        }
      }
    }
  }
}

/**
 * Typography configuration
 */
export const typography = {
  fonts: {
    heading: 'var(--font-heading, "Inter", system-ui, sans-serif)',
    body: 'var(--font-body, "Inter", system-ui, sans-serif)',
    mono: 'var(--font-mono, "JetBrains Mono", monospace)'
  },
  
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2
  }
}

/**
 * Spacing configuration
 */
export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',  // 48px
  '4xl': '4rem',  // 64px
  '5xl': '5rem',  // 80px
  '6xl': '6rem',  // 96px
}

/**
 * Border radius configuration
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem',  // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px'
}

/**
 * Breakpoints for responsive design
 */
export const breakpoints = {
  xs: '320px',   // Mobile small
  sm: '640px',   // Mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Desktop large
  '2xl': '1536px' // Desktop extra large
}

/**
 * Shadow configuration
 */
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none'
}

/**
 * Animation configuration
 */
export const animations = {
  transition: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms'
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
}

/**
 * Get complete theme configuration
 */
export function getThemeConfig() {
  return {
    colors: generateTheme(),
    typography,
    spacing,
    borderRadius,
    breakpoints,
    shadows,
    animations
  }
}
