'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
import { Download, FileDown, Award, Loader2 } from 'lucide-react'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

interface CertificateElement {
  id: string
  type: 'text' | 'variable' | 'image'
  x: number
  y: number
  width: number
  height: number
  content?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  color?: string
  align?: 'left' | 'center' | 'right'
  label?: string
}

interface CertificateData {
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
    logoUrl?: string
    signatureUrl?: string
    elements: CertificateElement[]
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
  }
}

export function CertificateDisplay() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null)
  const [displayScale, setDisplayScale] = useState(1)
  const certificateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCertificateData()
  }, [])

  const loadCertificateData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/certificate')
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to load certificate')
      }

      const result = await response.json()
      if (result.success) {
        setCertificateData(result.data)
        
        // Calculate display scale if certificate is too large (max 1000px width)
        const actualWidth = result.data.template.dimensions.width
        const maxDisplayWidth = 1000
        if (actualWidth > maxDisplayWidth) {
          setDisplayScale(maxDisplayWidth / actualWidth)
        } else {
          setDisplayScale(1)
        }
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error('Error loading certificate:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load certificate. Please contact support.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getFieldValue = (content: string): string => {
    if (!certificateData) return content

    const replacements: { [key: string]: string } = {
      '{name}': certificateData.user.fullName,
      '{fullName}': certificateData.user.fullName,
      '{firstName}': certificateData.user.firstName,
      '{lastName}': certificateData.user.lastName,
      '{title}': certificateData.user.title,
      '{registrationId}': certificateData.user.registrationId,
      '{institution}': certificateData.user.institution,
      '{designation}': certificateData.user.designation,
      '{email}': certificateData.user.email,
      '{phone}': certificateData.user.phone,
      '{category}': certificateData.user.category,
      '{city}': certificateData.user.city || '',
      '{country}': certificateData.user.country || '',
      '{conference}': conferenceConfig.name,
      '{startDate}': 'Jan 15, 2026', // TODO: Get from config
      '{endDate}': 'Jan 18, 2026', // TODO: Get from config
      '{location}': 'Conference Venue' // TODO: Get from config
    }

    let result = content
    Object.keys(replacements).forEach(key => {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), replacements[key])
    })

    return result
  }

  const downloadAsPNG = async () => {
    if (!certificateRef.current) return

    try {
      setDownloading(true)
      
      // Use html2canvas to convert certificate to image
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 4 / displayScale, // Compensate for display scale to get actual size at 4x quality
        backgroundColor: certificateData?.template.settings.backgroundColor || '#ffffff',
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
          link.download = `certificate-${certificateData?.user.registrationId}.png`
          link.click()
          URL.revokeObjectURL(url)
          
          toast({
            title: "Certificate Downloaded",
            description: "Your certificate has been downloaded as PNG"
          })
        }
      })
    } catch (error) {
      console.error('Error downloading certificate:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDownloading(false)
    }
  }

  const downloadAsPDF = async () => {
    try {
      setDownloading(true)
      
      const response = await fetch('/api/user/certificate/download', {
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
      link.download = `certificate-${certificateData?.user.registrationId}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been downloaded as PDF"
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
            <p className="text-slate-600 dark:text-slate-400">Loading your certificate...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!certificateData) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Certificate not available. Please complete your registration and payment.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { template, user } = certificateData

  return (
    <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Award className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
              Your Participation Certificate
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Download your certificate for the conference
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Certificate Preview */}
          <div className="flex justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div
              ref={certificateRef}
              className="relative rounded-lg shadow-2xl overflow-hidden"
              style={{
                width: `${template.dimensions.width * displayScale}px`,
                height: `${template.dimensions.height * displayScale}px`,
                backgroundImage: `url(${template.backgroundImage.url})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: template.settings.backgroundColor || '#ffffff'
              }}
            >
              {/* Render Certificate Elements */}
              {template.elements.map(element => {
                const textContent = getFieldValue(element.content || '')

                return (
                  <div
                    key={element.id}
                    className="absolute"
                    style={{
                      left: `${element.x * displayScale}px`,
                      top: `${element.y * displayScale}px`,
                      width: `${element.width * displayScale}px`,
                      height: `${element.height * displayScale}px`,
                      fontSize: `${(element.fontSize || 16) * displayScale}px`,
                      fontFamily: element.fontFamily || 'Georgia',
                      fontWeight: element.fontWeight || 'bold',
                      color: element.color || '#000000',
                      textAlign: element.align || 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: element.align === 'center' ? 'center' : element.align === 'right' ? 'flex-end' : 'flex-start',
                      padding: '4px',
                      lineHeight: '1.2'
                    }}
                  >
                    {textContent}
                  </div>
                )
              })}
            </div>
          </div>

          {/* User Information */}
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Certificate Information</h3>
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
                <><Download className="h-4 w-4 mr-2" /> Download as PNG</>
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
              <li>Please print your certificate on A4 paper</li>
              <li>Keep the certificate for your records</li>
              <li>This certificate is valid proof of your participation</li>
              <li>For any issues, contact the organizing committee</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
