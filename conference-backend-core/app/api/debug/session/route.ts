import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    // Get session using getServerSession
    const session = await getServerSession(authOptions)
    
    // Get token using getToken
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
    })

    // Get all cookies
    const cookies = request.cookies.getAll()
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('next-auth') || cookie.name.includes('nextauth')
    )

    // Environment info
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length || 0,
      NEXTAUTH_SECRET_PREVIEW: process.env.NEXTAUTH_SECRET?.substring(0, 20) + '...',
      hasNEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasVERCEL_URL: !!process.env.VERCEL_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      requestUrl: request.url,
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    }

    // Detailed cookie analysis
    const cookieAnalysis = authCookies.map(cookie => {
      let tokenInfo = null
      if (cookie.name.includes('session-token') && cookie.value) {
        try {
          // Try to decode the JWT token
          const parts = cookie.value.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
            tokenInfo = {
              exp: payload.exp,
              iat: payload.iat,
              isExpired: payload.exp && typeof payload.exp === 'number' ? Date.now() / 1000 > payload.exp : false,
              timeUntilExpiry: payload.exp && typeof payload.exp === 'number' ? Math.floor(payload.exp - Date.now() / 1000) : null
            }
          }
        } catch (e) {
          tokenInfo = { error: 'Failed to decode JWT' }
        }
      }
      
      return {
        name: cookie.name,
        hasValue: !!cookie.value,
        valueLength: cookie.value?.length || 0,
        valuePreview: cookie.value?.substring(0, 50) + '...',
        tokenInfo
      }
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      session: session ? {
        user: session.user,
        expires: session.expires,
        deviceId: (session as any).deviceId,
        loginTime: (session as any).loginTime,
        sessionAge: (session as any).loginTime ? Math.floor((Date.now() - (session as any).loginTime) / 1000) : null
      } : null,
      token: token ? {
        sub: token.sub,
        role: token.role,
        deviceId: token.deviceId,
        loginTime: token.loginTime,
        exp: token.exp,
        iat: token.iat,
        isExpired: token.exp && typeof token.exp === 'number' ? Date.now() / 1000 > token.exp : false,
        timeUntilExpiry: token.exp && typeof token.exp === 'number' ? Math.floor(token.exp - Date.now() / 1000) : null
      } : null,
      cookies: {
        total: cookies.length,
        authCookies: cookieAnalysis,
        allCookieNames: cookies.map(c => c.name)
      },
      environment: envInfo,
      debug: {
        currentTime: Math.floor(Date.now() / 1000),
        hasSessionToken: !!cookies.find(c => c.name.includes('session-token')),
        hasCSRFToken: !!cookies.find(c => c.name.includes('csrf-token')),
        hasCallbackUrl: !!cookies.find(c => c.name.includes('callback-url'))
      }
    })
  } catch (error) {
    console.error('Session debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}