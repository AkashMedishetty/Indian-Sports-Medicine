'use client'

import { useSession } from 'next-auth/react'
import { useDeviceSession } from './DeviceSessionManager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Smartphone, Monitor, Shield, Clock, User } from 'lucide-react'

interface SessionDebugInfoProps {
  className?: string
}

export function SessionDebugInfo({ className }: SessionDebugInfoProps) {
  const { data: session, status } = useSession()
  const deviceInfo = useDeviceSession()

  if (status !== 'authenticated' || !session) {
    return null
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Device Session Information
        </CardTitle>
        <CardDescription>
          Debug information about your current authentication session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Information */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">User:</span>
          <Badge variant="outline">{(session.user as any).name}</Badge>
          <Badge variant="secondary">{(session.user as any).role}</Badge>
        </div>

        {/* Device Information */}
        {deviceInfo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getDeviceIcon(deviceInfo.fingerprint.userAgent)}
              <span className="font-medium">Browser:</span>
              <Badge>{deviceInfo.browser}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Screen:</span>
                <span className="ml-2">{deviceInfo.fingerprint.screen}</span>
              </div>
              <div>
                <span className="font-medium">Timezone:</span>
                <span className="ml-2">{deviceInfo.fingerprint.timezone}</span>
              </div>
              <div>
                <span className="font-medium">Language:</span>
                <span className="ml-2">{deviceInfo.fingerprint.language}</span>
              </div>
            </div>
          </div>
        )}

        {/* Session Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Login Time:</span>
            <span className="text-sm">{formatTime((session as any).loginTime)}</span>
          </div>
          
          <div>
            <span className="font-medium">Device ID:</span>
            <code className="ml-2 text-xs bg-gray-100 px-1 rounded">
              {((session as any).deviceId || 'unknown').substring(0, 16)}...
            </code>
          </div>
        </div>

        {/* Browser Sync Warning */}
        {deviceInfo?.syncInfo.hasBrowserSync && (
          <div className="border-l-4 border-amber-500 bg-amber-50 p-3 rounded">
            <div className="font-medium text-amber-800">
              Browser Sync Detected ({deviceInfo.browser})
            </div>
            <div className="text-sm text-amber-700 mt-1">
              Your browser may sync cookies across devices. For security, each device requires separate login.
            </div>
            <ul className="text-xs text-amber-600 mt-2 list-disc list-inside">
              {deviceInfo.syncInfo.recommendations.map((rec: string, index: number) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Session Age */}
        <div className="text-xs text-gray-500">
          Session created: {Math.floor((Date.now() - ((session as any).loginTime || Date.now())) / 60000)} minutes ago
        </div>
      </CardContent>
    </Card>
  )
}