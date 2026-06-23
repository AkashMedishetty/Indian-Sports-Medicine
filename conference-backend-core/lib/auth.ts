import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import connectToDatabase from './mongodb'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { logAuthSuccess, logAuthError } from './utils/auth-debug'
import User from './models/User' // User model

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        await connectToDatabase()

        const user = await User.findOne({ 
          email: credentials.email.toLowerCase(),
          isActive: true 
        })

        if (!user || !await bcrypt.compare(credentials.password, user.password)) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          role: user.role,
          registrationId: user.registration?.registrationId || '',
          registrationStatus: user.registration?.status || 'pending'
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 // Reduced to 7 days for better isolation
      }
    }
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Only create new session on initial login
        const customUser = user as any
        token.id = user.id
        token.email = user.email
        token.role = customUser.role
        token.registrationId = customUser.registrationId
        token.registrationStatus = customUser.registrationStatus
        token.deviceId = nanoid(12) // Generate unique device ID
        token.sessionId = nanoid(32) // Unique session ID
        token.deviceFingerprint = nanoid(16) // Generate device fingerprint

        // Register session in DB only on initial login
        await connectToDatabase()
        
        // Get current user to check existing sessions
        const currentUser = await User.findById(token.id as string)
        if (currentUser) {
          // Clean up expired sessions (older than 7 days)
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const activeSessions = currentUser.activeSessions.filter(
            (session: any) => new Date(session.lastActivity) > sevenDaysAgo
          )
          
          // Limit to maximum 5 active sessions per user
          const MAX_SESSIONS = 5
          if (activeSessions.length >= MAX_SESSIONS) {
            // Remove oldest sessions to make room
            activeSessions.sort((a: any, b: any) => 
              new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime()
            )
            const sessionsToKeep = activeSessions.slice(-(MAX_SESSIONS - 1))
            
            // Update user with cleaned sessions
            await User.findByIdAndUpdate(token.id as string, {
              $set: { activeSessions: sessionsToKeep }
            })
          }
          
          // Remove any existing session with same device fingerprint
          await User.findByIdAndUpdate(token.id as string, {
            $pull: {
              activeSessions: {
                deviceFingerprint: token.deviceFingerprint as string
              }
            }
          })
        }
        
        // Add the new session
        await User.findByIdAndUpdate(token.id as string, {
          $push: {
            activeSessions: {
              sessionId: token.sessionId as string,
              deviceId: token.deviceId as string,
              deviceFingerprint: token.deviceFingerprint as string,
              loginTime: new Date(),
              lastActivity: new Date(),
              userAgent: 'unknown',
              ipAddress: 'unknown'
            }
          }
        })

        logAuthSuccess({ hasSession: true, userId: token.id as string, sessionId: token.sessionId as string, deviceId: token.deviceId as string }, 'JWT_CALLBACK')
      }

      // Update last activity on session update (but don't create new sessions)
      if (trigger === 'update' && token.sessionId) {
        await connectToDatabase()
        await User.findByIdAndUpdate(token.id as string, {
          $set: { 'activeSessions.$[elem].lastActivity': new Date() }
        }, {
          arrayFilters: [{ 'elem.sessionId': token.sessionId as string }]
        })
      }

      return token
    },
    async session({ session, token }) {
      // Ensure all user properties are properly set
      if (session.user) {
        (session.user as any).id = token.id as string
        ;(session.user as any).role = token.role as string
        ;(session.user as any).registrationId = token.registrationId as string
        ;(session.user as any).registrationStatus = token.registrationStatus as string
      }
      
      // Add session-level properties
      ;(session as any).sessionId = token.sessionId as string
      ;(session as any).deviceId = token.deviceId as string
      
      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Session callback - User role:', token.role, 'Email:', session.user?.email)
      }
      
      return session
    },
    async signIn({ user }) {
      logAuthSuccess({ hasSession: true, userId: user.id }, 'SIGNIN_CALLBACK')
      return true
    },
    // Note: signOut callback is not supported in NextAuth.js callbacks
    // Session cleanup is handled via API routes instead
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}