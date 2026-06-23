import { NextRequest } from 'next/server'

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  max: number // Maximum number of requests per window
  keyGenerator?: (req: NextRequest) => string // Custom key generator
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now()
  
  // Generate key for this request
  const key = options.keyGenerator 
    ? options.keyGenerator(request)
    : getDefaultKey(request)

  // Clean up expired entries
  cleanupExpiredEntries(now)

  // Get current data for this key
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + options.windowMs }

  // If window has expired, reset
  if (now > current.resetTime) {
    current.count = 0
    current.resetTime = now + options.windowMs
  }

  // Check if limit exceeded
  if (current.count >= options.max) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000)
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
      retryAfter
    }
  }

  // Increment counter
  current.count++
  rateLimitStore.set(key, current)

  return {
    success: true,
    remaining: Math.max(0, options.max - current.count),
    resetTime: current.resetTime
  }
}

function getDefaultKey(request: NextRequest): string {
  // Try to get real IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  
  // Include pathname for more granular limiting
  const pathname = new URL(request.url).pathname
  
  return `${ip}:${pathname}`
}

function cleanupExpiredEntries(now: number) {
  // Clean up expired entries to prevent memory leaks
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Specific rate limiters for different endpoints
export const authRateLimit = (request: NextRequest) => rateLimit(request, {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
    return `auth_${ip}`
  }
})

export const apiRateLimit = (request: NextRequest) => rateLimit(request, {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
})

export const paymentRateLimit = (request: NextRequest) => rateLimit(request, {
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 payment requests per minute
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
    return `payment_${ip}`
  }
})

export const emailRateLimit = (request: NextRequest) => rateLimit(request, {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 email requests per hour
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
    return `email_${ip}`
  }
})