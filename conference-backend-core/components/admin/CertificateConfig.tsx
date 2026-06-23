'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { useToast } from '../ui/use-toast'
import { Award, Save, RefreshCw, Eye, Upload } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

interface CertificateConfig {
  enabled: boolean
  template: {
    orientation: 'portrait' | 'landscape'
    backgroundImageUrl: string
    logoUrl: string
    signatureUrl: string
  }
  content: {
    title: string
    bodyText: string
    footerText: string
    issuedByName: string
    issuedByTitle: string
  }
  styling: {
    fontFamily: string
    titleFontSize: number
    bodyFontSize: number
    titleColor: string
    bodyColor: string
  }
  fields: {
    participantName: boolean
    registrationId: boolean
    eventDates: boolean
    eventLocation: boolean
    certificateNumber: boolean
    issueDate: boolean
  }
}

export function CertificateConfig() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<CertificateConfig>({
    enabled: true,
    template: {
      orientation: 'landscape',
      backgroundImageUrl: '',
      logoUrl: '',
      signatureUrl: ''
    },
    content: {
      title: 'CERTIFICATE OF PARTICIPATION',
      bodyText: 'This is to certify that {name} has successfully participated in the {conference} held from {startDate} to {endDate} at {location}.',
      footerText: '© 2026 NEUROVASCON. All rights reserved.',
      issuedByName: 'Dr. Conference Organizer',
      issuedByTitle: 'Conference Chair'
    },
    styling: {
      fontFamily: 'Georgia',
      titleFontSize: 32,
      bodyFontSize: 16,
      titleColor: '#1a1a1a',
      bodyColor: '#4a4a4a'
    },
    fields: {
      participantName: true,
      registrationId: true,
      eventDates: true,
      eventLocation: true,
      certificateNumber: true,
      issueDate: true
    }
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/certificate')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setConfig(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading certificate config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/config/certificate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        toast({
          title: "Certificate Configuration Saved",
          description: "Certificate settings have been updated successfully."
        })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save certificate configuration.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Certificate Configuration
            </CardTitle>
            <CardDescription className="dark:text-slate-400">
              Design and configure participation certificates
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            />
            <Label className="text-slate-900 dark:text-white">
              {config.enabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="template" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="styling">Styling</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
          </TabsList>

          {/* Template Settings */}
          <TabsContent value="template" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-white">Orientation</Label>
              <div className="flex gap-2">
                {['portrait', 'landscape'].map((orientation) => (
                  <Button
                    key={orientation}
                    variant={config.template.orientation === orientation ? "default" : "outline"}
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      template: { ...prev.template, orientation: orientation as 'portrait' | 'landscape' }
                    }))}
                    className="flex-1 capitalize"
                  >
                    {orientation}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-white">Background Image URL</Label>
              <Input
                value={config.template.backgroundImageUrl}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  template: { ...prev.template, backgroundImageUrl: e.target.value }
                }))}
                placeholder="/images/certificate-background.jpg"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recommended size: 1920x1080px for landscape, 1080x1920px for portrait
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Logo URL</Label>
                <Input
                  value={config.template.logoUrl}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    template: { ...prev.template, logoUrl: e.target.value }
                  }))}
                  placeholder="/images/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Signature Image URL</Label>
                <Input
                  value={config.template.signatureUrl}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    template: { ...prev.template, signatureUrl: e.target.value }
                  }))}
                  placeholder="/images/signature.png"
                />
              </div>
            </div>
          </TabsContent>

          {/* Content Settings */}
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-white">Certificate Title</Label>
              <Input
                value={config.content.title}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  content: { ...prev.content, title: e.target.value }
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-white">Body Text</Label>
              <Textarea
                value={config.content.bodyText}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  content: { ...prev.content, bodyText: e.target.value }
                }))}
                rows={4}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Available variables: {'{name}'}, {'{conference}'}, {'{startDate}'}, {'{endDate}'}, {'{location}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-white">Footer Text</Label>
              <Input
                value={config.content.footerText}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  content: { ...prev.content, footerText: e.target.value }
                }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Issued By (Name)</Label>
                <Input
                  value={config.content.issuedByName}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    content: { ...prev.content, issuedByName: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Issued By (Title)</Label>
                <Input
                  value={config.content.issuedByTitle}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    content: { ...prev.content, issuedByTitle: e.target.value }
                  }))}
                />
              </div>
            </div>
          </TabsContent>

          {/* Styling Settings */}
          <TabsContent value="styling" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Font Family</Label>
                <Input
                  value={config.styling.fontFamily}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    styling: { ...prev.styling, fontFamily: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Title Font Size (px)</Label>
                <Input
                  type="number"
                  value={config.styling.titleFontSize}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    styling: { ...prev.styling, titleFontSize: parseInt(e.target.value) }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Body Font Size (px)</Label>
                <Input
                  type="number"
                  value={config.styling.bodyFontSize}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    styling: { ...prev.styling, bodyFontSize: parseInt(e.target.value) }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Title Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.styling.titleColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      styling: { ...prev.styling, titleColor: e.target.value }
                    }))}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={config.styling.titleColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      styling: { ...prev.styling, titleColor: e.target.value }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Body Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.styling.bodyColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      styling: { ...prev.styling, bodyColor: e.target.value }
                    }))}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={config.styling.bodyColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      styling: { ...prev.styling, bodyColor: e.target.value }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Fields Settings */}
          <TabsContent value="fields" className="space-y-4">
            <div className="space-y-3">
              {Object.entries(config.fields).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Label className="text-slate-900 dark:text-white capitalize cursor-pointer">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      fields: { ...prev.fields, [key]: checked }
                    }))}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview and Save */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open('/api/admin/certificate/preview', '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Certificate
          </Button>
          <Button
            onClick={saveConfig}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
