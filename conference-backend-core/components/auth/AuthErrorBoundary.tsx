"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { signOut } from 'next-auth/react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  isJWTError: boolean
  retryCount: number
}

/**
 * Error boundary specifically designed to handle NextAuth JWT errors
 * and session-related issues that cause authentication failures
 */
export class AuthErrorBoundary extends Component<Props, State> {
  private retryTimer?: NodeJS.Timeout

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      isJWTError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a JWT-related error
    const isJWTError = error.message.includes('JWT') || 
                      error.message.includes('decryption operation failed') ||
                      error.message.includes('JWE') ||
                      error.message.includes('session')

    console.error('🚨 AuthErrorBoundary caught error:', {
      error: error.message,
      isJWTError,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })

    return {
      hasError: true,
      error,
      isJWTError,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      isJWTError: error.message.includes('JWT') || 
                  error.message.includes('decryption operation failed') ||
                  error.message.includes('JWE') ||
                  error.message.includes('session')
    })

    // Log detailed error information
    console.error('🚨 AuthErrorBoundary detailed error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      isJWTError: this.state.isJWTError,
      timestamp: new Date().toISOString()
    })

    // If it's a JWT error, automatically attempt recovery
    if (this.state.isJWTError && this.state.retryCount < 3) {
      this.handleJWTErrorRecovery()
    }
  }

  handleJWTErrorRecovery = async () => {
    console.log('🔧 Attempting JWT error recovery...')
    
    try {
      // Clear potentially corrupted session
      await signOut({ redirect: false })
      
      // Clear all auth-related localStorage/sessionStorage
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('nextauth') || key.includes('next-auth')) {
            localStorage.removeItem(key)
          }
        })
        
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('nextauth') || key.includes('next-auth')) {
            sessionStorage.removeItem(key)
          }
        })
      }
      
      // Wait a moment then retry
      this.retryTimer = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          retryCount: prevState.retryCount + 1
        }))
      }, 2000)
      
    } catch (recoveryError) {
      console.error('🚨 JWT error recovery failed:', recoveryError)
    }
  }

  handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0
    })
  }

  handleForceSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/auth/login?error=session_error' })
    } catch (error) {
      console.error('🚨 Force sign out failed:', error)
      // Fallback: redirect manually
      window.location.href = '/auth/login?error=session_error'
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              {this.state.isJWTError ? 'Session Error' : 'Authentication Error'}
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              {this.state.isJWTError 
                ? 'Your session has become corrupted. This can happen when multiple users login simultaneously.'
                : 'An authentication error occurred. Please try again.'
              }
            </p>
            
            {this.state.isJWTError && this.state.retryCount < 3 && (
              <div className="flex items-center justify-center mb-4">
                <RefreshCw className="w-4 h-4 animate-spin text-[#f0f3f8]0 mr-2" />
                <span className="text-sm text-[#25406b]">
                  Attempting automatic recovery... ({this.state.retryCount + 1}/3)
                </span>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={this.handleManualRetry}
                className="w-full bg-[#25406b] text-white py-2 px-4 rounded-md hover:bg-[#1d3357] transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleForceSignOut}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Sign Out & Restart
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}