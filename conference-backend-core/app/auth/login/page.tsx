"use client"

import { Suspense } from "react"
import { LoginForm } from "@/conference-backend-core/components/auth/LoginForm"
import { Navigation } from "@/conference-backend-core/components/Navigation"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

export default function LoginPage() {
  return (
    <div 
      className="min-h-screen text-gray-800 relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #e8eef5 0%, #f0f4f8 25%, #f8f0f5 50%, #f0f4f8 75%, #e8eef5 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Animated gradient orbs - High contrast for glass effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {/* Primary dark blue orb - top left */}
        <div 
          style={{ 
            position: 'absolute',
            top: '-5%', 
            left: '-5%', 
            width: '50%', 
            height: '50%', 
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(30,58,95,0.4) 0%, rgba(30,58,95,0.15) 50%, transparent 70%)',
            filter: 'blur(100px)',
          }} 
        />
        {/* Pink accent orb - top right */}
        <div 
          style={{ 
            position: 'absolute',
            top: '-10%', 
            right: '-10%', 
            width: '45%', 
            height: '45%', 
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.35) 0%, rgba(236,72,153,0.1) 50%, transparent 70%)',
            filter: 'blur(80px)',
          }} 
        />
        {/* Dark blue orb - bottom right */}
        <div 
          style={{ 
            position: 'absolute',
            bottom: '-15%', 
            right: '5%', 
            width: '55%', 
            height: '55%', 
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(30,58,95,0.35) 0%, rgba(30,58,95,0.1) 50%, transparent 70%)',
            filter: 'blur(120px)',
          }} 
        />
        {/* Pink orb - bottom left */}
        <div 
          style={{ 
            position: 'absolute',
            bottom: '0%', 
            left: '-5%', 
            width: '40%', 
            height: '40%', 
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(236,72,153,0.08) 50%, transparent 70%)',
            filter: 'blur(80px)',
          }} 
        />
      </div>
      
      <Navigation />
      
      <main className="container mx-auto px-4 py-24 relative z-10">
        <div className="max-w-md mx-auto">
          {/* Conference Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
              {conferenceConfig.shortName}
            </h1>
            <p className="text-base text-gray-600 font-medium">
              Sign in to your account
            </p>
          </div>
          
          {/* Liquid Glass Card */}
          <div 
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 25px 50px rgba(30, 58, 95, 0.2), 0 10px 20px rgba(30, 58, 95, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.7)'
            }}
          >
            {/* Glass inner highlight */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%)' }} />
            
            <div className="relative z-10">
              <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                <LoginFormContent />
              </Suspense>
            </div>
          </div>
          
          {/* Register link */}
          <p className="text-center mt-6 text-sm font-semibold text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="text-pink-600 font-bold hover:text-pink-700 transition-colors">
              Register here
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

// Inline login form to avoid Card wrapper
function LoginFormContent() {
  return <LoginForm />
}
