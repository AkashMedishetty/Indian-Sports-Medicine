"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Clock, XCircle, AlertCircle, User, Calendar, CreditCard, FileText, Loader2 } from "lucide-react"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

interface RegistrationStatus {
  success: boolean
  registration?: {
    registrationId: string
    status: string
    type: string
    name: string
    email: string
    institution: string
    registrationDate: string
    paymentStatus?: string
    paymentDate?: string
    paymentAmount?: number
    workshopSelections?: string[]
  }
  message?: string
}

export default function RegistrationStatusPage() {
  const params = useParams()
  const registrationId = params.registrationId as string
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RegistrationStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/register/status/${registrationId}`)
        const result = await response.json()
        
        if (response.ok) {
          setData(result)
        } else {
          setError(result.message || 'Registration not found')
        }
      } catch (err) {
        setError('Failed to fetch registration status')
      } finally {
        setLoading(false)
      }
    }

    if (registrationId) {
      fetchStatus()
    }
  }, [registrationId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'pending':
      case 'pending-payment':
        return <Clock className="h-8 w-8 text-yellow-500" />
      case 'cancelled':
      case 'refunded':
        return <XCircle className="h-8 w-8 text-red-500" />
      default:
        return <AlertCircle className="h-8 w-8 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string, label: string }> = {
      paid: { variant: "default", className: "bg-green-500", label: "Paid" },
      confirmed: { variant: "default", className: "bg-blue-500", label: "Confirmed" },
      pending: { variant: "secondary", className: "bg-yellow-500 text-black", label: "Pending" },
      'pending-payment': { variant: "outline", className: "border-orange-500 text-orange-500", label: "Awaiting Payment" },
      cancelled: { variant: "destructive", className: "", label: "Cancelled" },
      refunded: { variant: "outline", className: "border-gray-500", label: "Refunded" }
    }
    const config = variants[status] || { variant: "outline" as const, className: "", label: status }
    return <Badge variant={config.variant} className={`${config.className} text-sm px-3 py-1`}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading registration status...</p>
        </div>
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle>Registration Not Found</CardTitle>
            <CardDescription>
              {error || data?.message || 'The registration ID you provided could not be found.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Please check your registration ID and try again, or contact support at{' '}
              <a href={`mailto:${conferenceConfig.contact?.email}`} className="text-primary hover:underline">
                {conferenceConfig.contact?.email}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const reg = data.registration!

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{conferenceConfig.name}</h1>
          <p className="text-muted-foreground mt-2">Registration Status</p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader className="text-center pb-2">
            {getStatusIcon(reg.status)}
            <CardTitle className="mt-4">Registration {reg.status === 'paid' || reg.status === 'confirmed' ? 'Confirmed' : 'Status'}</CardTitle>
            <div className="mt-2">{getStatusBadge(reg.status)}</div>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-muted-foreground">
              Registration ID: <code className="bg-muted px-2 py-1 rounded font-mono">{reg.registrationId}</code>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registration Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Personal Info */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{reg.name}</p>
                <p className="text-sm text-muted-foreground">{reg.email}</p>
                <p className="text-sm text-muted-foreground">{reg.institution}</p>
              </div>
            </div>

            <Separator />

            {/* Registration Type */}
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Registration Type</p>
                <p className="font-medium capitalize">{reg.type.replace(/-/g, ' ')}</p>
              </div>
            </div>

            {/* Registration Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Registration Date</p>
                <p className="font-medium">{new Date(reg.registrationDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>

            {/* Payment Info */}
            {reg.paymentAmount && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment</p>
                    <p className="font-medium">₹{reg.paymentAmount.toLocaleString()}</p>
                    {reg.paymentDate && (
                      <p className="text-sm text-muted-foreground">
                        Paid on {new Date(reg.paymentDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Workshops */}
            {reg.workshopSelections && reg.workshopSelections.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Selected Workshops</p>
                  <div className="flex flex-wrap gap-2">
                    {reg.workshopSelections.map((workshop, index) => (
                      <Badge key={index} variant="outline">{workshop}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            For any queries, please contact us at{' '}
            <a href={`mailto:${conferenceConfig.contact?.email}`} className="text-primary hover:underline">
              {conferenceConfig.contact?.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
