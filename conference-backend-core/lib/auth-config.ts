import { conferenceConfig } from '../config/conference.config'

// Auto-detect URLs for Vercel deployment
export function getAuthUrl(): string {
  // If NEXTAUTH_URL is explicitly set, use it
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // For Vercel deployments, use VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // For local development (match the port used in package.json)
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }

  // Fallback for production (use the correct domain from config)
  return conferenceConfig.contact.website;
}

// Auto-detect APP_URL (same logic as NEXTAUTH_URL)
export function getAppUrl(): string {
  // If APP_URL is explicitly set, use it
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  // Use the same auto-detection logic
  return getAuthUrl();
}

// Helper to get the base URL for any purpose
export function getBaseUrl(): string {
  return getAppUrl();
}

// Validate required environment variables
export function validateEnvironmentVariables(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for required environment variables
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is required');
  }
  
  if (!process.env.MONGODB_URI) {
    errors.push('MONGODB_URI is required');
  }
  
  // Warn about missing optional variables
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXTAUTH_URL && !process.env.VERCEL_URL) {
      errors.push('NEXTAUTH_URL or VERCEL_URL should be set in production');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Export for use in API routes and components
export const APP_URL = getAppUrl();
export const NEXTAUTH_URL = getAuthUrl();

// Log environment configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Auth Configuration:', {
    NEXTAUTH_URL: NEXTAUTH_URL,
    APP_URL: APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    hasMONGODB_URI: !!process.env.MONGODB_URI
  });
}