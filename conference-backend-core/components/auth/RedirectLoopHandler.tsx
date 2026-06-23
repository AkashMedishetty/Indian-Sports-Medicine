'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

export function RedirectLoopHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleRedirectLoop = (event: CustomEvent) => {
      const { targetUrl, sourceContext } = event.detail
      
      console.error(`🚨 Redirect loop detected: ${targetUrl} from ${sourceContext}`)
      
      toast.error('Authentication Loop Detected', {
        description: 'We prevented an infinite redirect loop. Taking you to a safe page.',
        duration: 8000,
        action: {
          label: 'Go to Home',
          onClick: () => {
            window.location.href = '/'
          },
        },
      })

      // If it's an auth-related loop, sign out and go to home
      if (targetUrl.includes('/auth/') || sourceContext.includes('auth')) {
        setTimeout(async () => {
          try {
            await signOut({ redirect: false })
            window.location.href = '/'
          } catch (error) {
            console.error('Error during loop recovery:', error)
            window.location.href = '/'
          }
        }, 2000)
      } else {
        // For other loops, just go to home
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      }
    }

    // Listen for redirect loop events
    window.addEventListener('redirectLoopDetected', handleRedirectLoop as EventListener)

    return () => {
      window.removeEventListener('redirectLoopDetected', handleRedirectLoop as EventListener)
    }
  }, [router])

  return null // This component doesn't render anything
}