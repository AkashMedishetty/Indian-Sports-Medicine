import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function requireAuth(request?: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    if (request) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    } else {
      redirect('/auth/login')
    }
  }
  
  return session
}

export async function requireAdmin(request?: NextRequest) {
  const session = await requireAuth(request)
  
  // If requireAuth returned a redirect response, return it
  if (session instanceof NextResponse) {
    return session
  }
  
  if (session && (session as any).user?.role !== 'admin') {
    if (request) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      redirect('/dashboard')
    }
  }
  
  return session
}

export async function getAuthenticatedUser() {
  const session = await getServerSession()
  return session?.user || null
}