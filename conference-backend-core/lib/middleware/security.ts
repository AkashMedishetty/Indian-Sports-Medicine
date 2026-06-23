import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// CSRF Protection
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; timestamp: number }>()
  
  static generateToken(): string {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15)
    return Buffer.from(token).toString('base64')
  }
  
  static setToken(sessionId: string): string {
    const token = this.generateToken()
    this.tokens.set(sessionId, {
      token,
      timestamp: Date.now()
    })
    
    // Clean up old tokens (older than 1 hour)
    this.cleanupOldTokens()
    
    return token
  }
  
  static verifyToken(sessionId: string, providedToken: string): boolean {
    const stored = this.tokens.get(sessionId)
    if (!stored) return false
    
    // Check if token is expired (1 hour)
    if (Date.now() - stored.timestamp > 60 * 60 * 1000) {
      this.tokens.delete(sessionId)
      return false
    }
    
    return stored.token === providedToken
  }
  
  private static cleanupOldTokens() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    for (const [sessionId, data] of this.tokens.entries()) {
      if (data.timestamp < oneHourAgo) {
        this.tokens.delete(sessionId)
      }
    }
  }
}

// Security Headers Middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://*.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://raw.githack.com https://*.githubusercontent.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://*.googletagmanager.com blob: data:",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "frame-src 'self' https://api.razorpay.com https://*.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')

  // Temporarily disabled CSP for debugging - RE-ENABLE AFTER TESTING
  // response.headers.set('Content-Security-Policy', csp)
  
  // Other security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  return response
}

// Input Sanitization
export class InputSanitizer {
  static sanitizeString(input: unknown): string {
    if (typeof input !== 'string') return ''
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Basic XSS prevention
      .substring(0, 10000) // Prevent extremely long inputs
  }
  
  static sanitizeEmail(input: unknown): string {
    if (typeof input !== 'string') return ''
    
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@.\-_]/g, '') // Allow only valid email characters
      .substring(0, 100)
  }
  
  static sanitizePhone(input: unknown): string {
    if (typeof input !== 'string') return ''
    
    return input
      .trim()
      .replace(/[^\d+\s\-()]/g, '') // Allow only phone number characters
      .substring(0, 20)
  }
  
  static sanitizeHTML(input: unknown): string {
    if (typeof input !== 'string') return ''
    
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/style=/gi, '')
      .trim()
      .substring(0, 50000)
  }
  
  static sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key)
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value)
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = Math.max(-1000000, Math.min(1000000, value))
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value
      } else if (Array.isArray(value)) {
        sanitized[sanitizedKey] = value.slice(0, 100).map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        )
      } else if (value && typeof value === 'object') {
        sanitized[sanitizedKey] = this.sanitizeObject(value as Record<string, unknown>)
      }
    }
    
    return sanitized
  }
}

// Request validation
export function validateRequest(request: NextRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check Content-Length to prevent large payloads
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    errors.push('Request payload too large')
  }
  
  // Check for suspicious headers
  const userAgent = request.headers.get('user-agent')
  if (!userAgent || userAgent.length < 10) {
    errors.push('Invalid user agent')
  }
  
  // Check for malicious patterns in URL
  const url = request.url
  const suspiciousPatterns = [
    /\.\./,           // Path traversal
    /<script/i,       // XSS attempt
    /union.*select/i, // SQL injection
    /javascript:/i,   // JavaScript injection
    /data:.*base64/i  // Data URI injection
  ]
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      errors.push('Suspicious request pattern detected')
      break
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Honeypot field validation (anti-bot)
export function validateHoneypot(data: Record<string, unknown>): boolean {
  // Check for honeypot fields that should be empty
  const honeypotFields = ['website', 'url', 'homepage', 'link']
  
  for (const field of honeypotFields) {
    if (data[field] && String(data[field]).trim() !== '') {
      return false // Bot detected
    }
  }
  
  return true
}

// Password strength validation
export function validatePasswordStrength(password: string): { 
  isStrong: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  // Length check
  if (password.length >= 8) score += 1
  else feedback.push('Password should be at least 8 characters long')
  
  if (password.length >= 12) score += 1
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Password should contain lowercase letters')
  
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Password should contain uppercase letters')
  
  if (/\d/.test(password)) score += 1
  else feedback.push('Password should contain numbers')
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  else feedback.push('Password should contain special characters')
  
  // Common password check (basic)
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'welcome']
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score = Math.max(0, score - 2)
    feedback.push('Password should not contain common words')
  }
  
  return {
    isStrong: score >= 4,
    score,
    feedback
  }
}

// IP-based blocking (basic implementation)
export class IPBlocker {
  private static blockedIPs = new Set<string>()
  private static suspiciousActivity = new Map<string, { count: number; timestamp: number }>()
  
  static isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip)
  }
  
  static blockIP(ip: string, duration: number = 24 * 60 * 60 * 1000): void {
    this.blockedIPs.add(ip)
    
    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ip)
    }, duration)
  }
  
  static reportSuspiciousActivity(ip: string): void {
    const now = Date.now()
    const activity = this.suspiciousActivity.get(ip) || { count: 0, timestamp: now }
    
    // Reset counter if more than 1 hour has passed
    if (now - activity.timestamp > 60 * 60 * 1000) {
      activity.count = 0
      activity.timestamp = now
    }
    
    activity.count++
    this.suspiciousActivity.set(ip, activity)
    
    // Block IP if too many suspicious activities
    if (activity.count >= 10) {
      this.blockIP(ip)
      console.warn(`IP ${ip} blocked due to suspicious activity`)
    }
  }
}

// Request fingerprinting for additional security
export function generateRequestFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  
  const fingerprint = Buffer.from(
    `${userAgent}|${acceptLanguage}|${acceptEncoding}`
  ).toString('base64')
  
  return fingerprint.substring(0, 32)
}