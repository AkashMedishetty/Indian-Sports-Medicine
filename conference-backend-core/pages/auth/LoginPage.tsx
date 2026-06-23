/**
 * Login Page - Redesigned with Excellent UI
 * 
 * Features:
 * - Unified login for all users (participants, reviewers, admins)
 * - Mobile-first responsive design
 * - Subtle animations for better UX
 * - Real-time validation feedback
 * - Accessible and performant
 */

'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Input } from '@/conference-backend-core/components/ui/input'
import { Label } from '@/conference-backend-core/components/ui/label'
import { Card } from '@/conference-backend-core/components/ui/card'
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle2, AlertCircle, ArrowRight, LogIn } from 'lucide-react'
import { Navigation } from '@/conference-backend-core/components/Navigation'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [emailValid, setEmailValid] = useState(false)
  
  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setEmailValid(emailRegex.test(formData.email))
  }, [formData.email])
  
  // Get theme colors
  const primaryColor = conferenceConfig.theme?.primary || '#f59e0b'
  const secondaryColor = conferenceConfig.theme?.secondary || '#3b82f6'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    // Validate
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    if (!emailValid) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid email or password. Please try again.')
        setIsLoading(false)
      } else if (result?.ok) {
        setSuccess(true)
        setError('')
        
        // Redirect after success animation
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1000)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navigation />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 px-4 sm:py-12 bg-gray-50 dark:bg-[#181818]">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="inline-block mb-4"
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <LogIn className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Sign in to {conferenceConfig.shortName}
              </p>
            </motion.div>

            {/* Card */}
            <Card className="border-0 shadow-2xl shadow-gray-200/50 dark:shadow-none overflow-hidden bg-white dark:bg-[#1f1f1f]">

              <div className="p-6 sm:p-8">
                {/* Success/Error Messages */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6"
                    >
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6"
                    >
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800 dark:text-green-200">Login successful! Redirecting...</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-colors" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onBlur={() => setTouched({ ...touched, email: true })}
                        className="pl-10 pr-10 h-12 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 transition-all bg-white dark:bg-[#181818] text-gray-900 dark:text-white"
                        required
                        disabled={isLoading || success}
                      />
                      {touched.email && formData.email && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {emailValid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                        </motion.div>
                      )}
                    </div>
                    {touched.email && formData.email && !emailValid && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-600"
                      >
                        Please enter a valid email address
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-colors" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        onBlur={() => setTouched({ ...touched, password: true })}
                        className="pl-10 pr-10 h-12 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 transition-all bg-white dark:bg-[#181818] text-gray-900 dark:text-white"
                        required
                        disabled={isLoading || success}
                      />
                      <div className="absolute right-3 top-0 bottom-0 flex items-center">
                        <motion.button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          disabled={isLoading || success}
                          whileTap={{ scale: 0.95 }}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </motion.button>
                      </div>
                    </div>
                    {touched.password && formData.password && formData.password.length < 8 && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-amber-600"
                      >
                        Password should be at least 8 characters
                      </motion.p>
                    )}
                  </div>

                  <div className="flex items-center justify-end">
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm font-medium hover:underline transition-colors"
                      style={{ color: primaryColor }}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <motion.div
                    whileTap={{ scale: isLoading || success ? 1 : 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={isLoading || success}
                      style={{ 
                        backgroundColor: success ? '#10b981' : primaryColor,
                        color: 'white'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing in...
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Success!
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link
                      href="/register"
                      className="font-semibold hover:underline transition-colors"
                      style={{ color: primaryColor }}
                    >
                      Register now
                    </Link>
                  </p>
                </div>
              </div>
            </Card>

            {/* Footer Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{conferenceConfig.eventDate.start}</span> - <span className="font-medium">{conferenceConfig.eventDate.end}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {conferenceConfig.venue.name}, {conferenceConfig.venue.city}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
