"use client"

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Input } from '@/conference-backend-core/components/ui/input'
import { Label } from '@/conference-backend-core/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/conference-backend-core/components/ui/card'
import { Loader2, Eye, EyeOff, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export default function ReviewerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid email or password')
        toast.error('Login failed. Please check your credentials.')
      } else {
        toast.success('Login successful!')
        // Redirect to reviewer dashboard
        router.push('/reviewer')
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Conference Banner */}
      <div 
        className="w-full py-8 px-4 text-center text-white"
        style={{ 
          background: `linear-gradient(135deg, ${conferenceConfig.theme.primary} 0%, ${conferenceConfig.theme.secondary} 100%)` 
        }}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{conferenceConfig.shortName}</h1>
        <p className="text-lg md:text-xl opacity-90">{conferenceConfig.name}</p>
        <p className="text-sm md:text-base opacity-80 mt-2">
          {conferenceConfig.eventDate.start} - {conferenceConfig.eventDate.end} | {conferenceConfig.venue.city}, {conferenceConfig.venue.state}
        </p>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Reviewer Portal</CardTitle>
            <CardDescription>
              Sign in to review abstracts for {conferenceConfig.shortName}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email ID</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base font-semibold"
                style={{ 
                  background: `linear-gradient(135deg, ${conferenceConfig.theme.primary} 0%, ${conferenceConfig.theme.secondary} 100%)` 
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Having trouble logging in?</p>
              <a 
                href={`mailto:${conferenceConfig.contact.email}`}
                className="text-blue-600 hover:underline"
              >
                Contact support
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-sm text-gray-500 bg-gray-50 border-t">
        © {new Date().getFullYear()} {conferenceConfig.shortName}. All rights reserved.
      </div>
    </div>
  )
}
