'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
import { Download, FileDown, Image as ImageIcon, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

interface BadgeElement {
  id: string
  type: 'text' | 'qrcode' | 'image' | 'field'
  x: number
  y: number
  width: number
  height: number
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  color?: string
  align?: 'left' | 'center' | 'right'
  fieldName?: string
  qrData?: string
}

interface BadgeData {
  template: {
    backgroundImage: {
      url: string
      width: number
      height: number
    }
    dimensions: {
      width: number
      height: number
    }
    elements: BadgeElement[]
    settings: any
  }
  user: {
    registrationId: string
    fullName: string
    title: string
    firstName: string
    lastName: string
    institution: string
    designation: string
    email: string
    phone: string
    category: string
    city?: string
    country?: string
    profilePicture?: string
  }
}

export function BadgeDisplay() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null)
  const [qrCodeUrls, setQrCodeUrls] = useState<{ [key: string]: string }>({})
  const badgeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadBadgeData()
  }, [])

  useEffect(() => {
    if (badgeData) {
      generateQRCodes()
    }
  }, [badgeData])

  const loadBadgeData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/badge')
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to load badge')
      }

      const result = await response.json()
      if (result.success) {
        setBadgeData(result.data)
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error('Error loading badge:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load badge. Please contact support.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateQRCodes = async () => {
    if (!badgeData) return

    const qrUrls: { [key: string]: string } = {}
    
    // Generate QR codes for elements
    for (const element of badgeData.template.elements) {
      if (element.type === 'qrcode') {
        const qrText = element.qrData === 'registrationId' 
          ? badgeData.user.registrationId 
          : element.qrData || badgeData.user.registrationId

        try {
          const qrCodeUrl = await QRCode.toDataURL(qrText, {
            width: element.width * 4, // Very high resolution for print quality
            margin: 1,
            errorCorrectionLevel: 'H', // Highest error correction
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          })
          qrUrls[element.id] = qrCodeUrl
        } catch (error) {
          console.error('Error generating QR code:', error)
        }
      }
    }

    setQrCodeUrls(qrUrls)
  }

  const getFieldValue = (fieldName: string): string => {
    if (!badgeData) return ''

    const fieldMap: { [key: string]: string } = {
      name: badgeData.user.fullName, // Support 'name' field
      registrationId: badgeData.user.registrationId,
      fullName: badgeData.user.fullName,
      firstName: badgeData.user.firstName,
      lastName: badgeData.user.lastName,
      title: badgeData.user.title || '',
      institution: badgeData.user.institution,
      designation: badgeData.user.designation,
      email: badgeData.user.email,
      phone: badgeData.user.phone,
      category: badgeData.user.category,
      city: badgeData.user.city || '',
      country: badgeData.user.country || ''
    }

    return fieldMap[fieldName] || ''
  }

  const downloadAsPNG = async () => {
    if (!badgeRef.current) return

    try {
      setDownloading(true)
      
      // Use html2canvas to convert the badge to an image
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(badgeRef.current, {
        scale: 4, // Maximum quality for print
        backgroundColor: badgeData?.template.settings.backgroundColor || '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `badge-${badgeData?.user.registrationId}.png`
          link.click()
          URL.revokeObjectURL(url)
          
          toast({
            title: "Badge Downloaded",
            description: "Your badge has been downloaded as PNG"
          })
        }
      })
    } catch (error) {
      console.error('Error downloading badge:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download badge. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDownloading(false)
    }
  }

  const downloadAsPDF = async () => {
    try {
      setDownloading(true)
      
      const response = await fetch('/api/user/badge/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('PDF generation failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `badge-${badgeData?.user.registrationId}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Badge Downloaded",
        description: "Your badge has been downloaded as PDF"
      })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: conferenceConfig.theme.primary }} />
            <p className="text-slate-600 dark:text-slate-400">Loading your badge...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!badgeData) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Badge not available. Please complete your registration and payment.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { template, user } = badgeData

  return (
    <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <ImageIcon className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
              Your Conference Badge
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Download and print your badge for event entry
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Badge Preview */}
          <div className="flex justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div
              ref={badgeRef}
              className="relative rounded-lg shadow-2xl overflow-hidden"
              style={{
                width: `${template.dimensions.width}px`,
                height: `${template.dimensions.height}px`,
                maxWidth: '100%',
                backgroundImage: `url(${template.backgroundImage.url})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: template.settings.backgroundColor || '#ffffff'
              }}
            >
              {/* Render Badge Elements */}
              {template.elements.map(element => {
                if (element.type === 'field' || element.type === 'text') {
                  const textContent = element.type === 'field' && element.fieldName
                    ? getFieldValue(element.fieldName)
                    : element.text || ''

                  return (
                    <div
                      key={element.id}
                      className="absolute"
                      style={{
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                        fontSize: `${element.fontSize || 16}px`,
                        fontFamily: element.fontFamily || 'Arial',
                        fontWeight: element.fontWeight || 'bold',
                        color: element.color || '#000000',
                        textAlign: element.align || 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: element.align === 'center' ? 'center' : element.align === 'right' ? 'flex-end' : 'flex-start',
                        padding: '4px'
                      }}
                    >
                      {textContent}
                    </div>
                  )
                }

                if (element.type === 'qrcode' && qrCodeUrls[element.id]) {
                  return (
                    <div
                      key={element.id}
                      className="absolute"
                      style={{
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`
                      }}
                    >
                      <img
                        src={qrCodeUrls[element.id]}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )
                }

                return null
              })}
            </div>
          </div>

          {/* User Information */}
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Badge Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Registration ID:</span>
                <p className="font-medium text-slate-900 dark:text-white">{user.registrationId}</p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Name:</span>
                <p className="font-medium text-slate-900 dark:text-white">{user.fullName}</p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Institution:</span>
                <p className="font-medium text-slate-900 dark:text-white">{user.institution}</p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Category:</span>
                <p className="font-medium text-slate-900 dark:text-white">{user.category}</p>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={downloadAsPNG}
              disabled={downloading}
              variant="outline"
              className="w-full"
            >
              {downloading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Downloading...</>
              ) : (
                <><ImageIcon className="h-4 w-4 mr-2" /> Download as PNG</>
              )}
            </Button>
            <Button
              onClick={downloadAsPDF}
              disabled={downloading}
              className="w-full"
              style={{ backgroundColor: conferenceConfig.theme.primary }}
            >
              {downloading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Downloading...</>
              ) : (
                <><FileDown className="h-4 w-4 mr-2" /> Download as PDF</>
              )}
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Important Notes</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Please print your badge on A4 or A6 paper</li>
              <li>Bring the badge to the conference venue for entry</li>
              <li>Keep your badge visible at all times during the event</li>
              <li>The QR code will be scanned for workshop check-ins</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
