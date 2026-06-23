"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { testMultiDeviceAuth, clearAllAuthData, getCurrentDeviceSession } from "@/lib/utils/multi-device-test"

export default function AuthDebugPage() {
  const { data: session, status } = useSession()
  const [cookies, setCookies] = useState<string[]>([])
  const [clientInfo, setClientInfo] = useState<any>({})

  useEffect(() => {
    // Get all cookies
    const allCookies = document.cookie.split(';').map(cookie => cookie.trim())
    setCookies(allCookies)

    // Get client info
    setClientInfo({
      userAgent: navigator.userAgent,
      url: window.location.href,
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV
    })
  }, [])

  const refreshSession = async () => {
    window.location.reload()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>
            Debug information for authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Session Status</h3>
            <p className="text-sm bg-gray-100 p-2 rounded">
              Status: {status}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Session Data</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Client Information</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(clientInfo, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Cookies</h3>
            <div className="text-xs bg-gray-100 p-2 rounded space-y-1">
              {cookies.length > 0 ? (
                cookies.map((cookie, index) => (
                  <div key={index} className="break-all">
                    {cookie}
                  </div>
                ))
              ) : (
                <p>No cookies found</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Multi-Device Testing</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={testMultiDeviceAuth}>
                Test Multi-Device Auth
              </Button>
              <Button variant="outline" onClick={clearAllAuthData}>
                Clear All Auth Data
              </Button>
              <Button variant="outline" onClick={() => console.log(getCurrentDeviceSession())}>
                Log Device Session
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Check browser console for detailed output
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={refreshSession}>
              Refresh Session
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/auth/login'}
            >
              Go to Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug/session')
                  const data = await response.json()
                  console.log('🔍 Server Session Debug:', data)
                  alert('Check console for server session debug info')
                } catch (error) {
                  console.error('Debug fetch error:', error)
                }
              }}
            >
              Debug Server Session
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).testMultiDeviceAuth) {
                  (window as any).testMultiDeviceAuth()
                } else {
                  alert('Multi-device test not available')
                }
              }}
            >
              Test Multi-Device
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}