"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Smartphone, Monitor, Tablet, Globe } from 'lucide-react'

interface ActiveSession {
  sessionId: string
  deviceId: string
  deviceFingerprint: string
  loginTime: number
  lastActivity: number
  userAgent?: string
  isCurrent: boolean
}

export function ActiveSessions() {
  const { data: session } = useSession()
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user && (session.user as any).id) {
      fetchActiveSessions()
    }
  }, [session])

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/auth/active-sessions')
      if (response.ok) {
        const sessions = await response.json()
        setActiveSessions(sessions)
      }
    } catch (error) {
      console.error('Failed to fetch active sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async (deviceFingerprint: string) => {
    try {
      const response = await fetch('/api/auth/terminate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceFingerprint })
      })
      
      if (response.ok) {
        await fetchActiveSessions()
      }
    } catch (error) {
      console.error('Failed to terminate session:', error)
    }
  }

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Globe className="h-4 w-4" />
    
    if (userAgent.includes('Mobile')) return <Smartphone className="h-4 w-4" />
    if (userAgent.includes('Tablet')) return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  const getDeviceType = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Device'
    
    if (userAgent.includes('Mobile')) return 'Mobile Device'
    if (userAgent.includes('Tablet')) return 'Tablet'
    return 'Desktop'
  }

  const formatLastActivity = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (!session) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Active Sessions ({activeSessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading sessions...</div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No active sessions found</div>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((activeSession) => (
              <div
                key={activeSession.deviceFingerprint}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(activeSession.userAgent)}
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {getDeviceType(activeSession.userAgent)}
                      {activeSession.isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Last active: {formatLastActivity(activeSession.lastActivity)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Device ID: {activeSession.deviceId.substring(0, 16)}...
                    </div>
                  </div>
                </div>
                
                {!activeSession.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => terminateSession(activeSession.deviceFingerprint)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Terminate
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Each device maintains an independent session. You can be logged in on multiple devices simultaneously.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}