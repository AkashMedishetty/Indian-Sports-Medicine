'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { useToast } from '../ui/use-toast'
import { Badge, CreditCard, Save, RefreshCw, Eye, QrCode, Image as ImageIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

interface BadgeConfig {
  enabled: boolean
  template: {
    layout: 'portrait' | 'landscape'
    size: 'A4' | 'A5' | 'A6'
    backgroundColor: string
    logoUrl: string
    showQRCode: boolean
    showPhoto: boolean
  }
  fields: {
    name: boolean
    registrationId: boolean
    institution: boolean
    category: boolean
    city: boolean
    country: boolean
  }
  styling: {
    fontFamily: string
    primaryColor: string
    secondaryColor: string
    borderColor: string
  }
}

export function BadgeConfig() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<BadgeConfig>({
    enabled: true,
    template: {
      layout: 'portrait',
      size: 'A6',
      backgroundColor: '#ffffff',
      logoUrl: '',
      showQRCode: true,
      showPhoto: true
    },
    fields: {
      name: true,
      registrationId: true,
      institution: true,
      category: true,
      city: false,
      country: false
    },
    styling: {
      fontFamily: 'Arial',
      primaryColor: '#FCCA00',
      secondaryColor: '#000000',
      borderColor: '#e5e7eb'
    }
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/badge')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setConfig(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading badge config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/config/badge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        toast({
          title: "Badge Configuration Saved",
          description: "Badge settings have been updated successfully."
        })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save badge configuration.",
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
              <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Badge Configuration
            </CardTitle>
            <CardDescription className="dark:text-slate-400">
              Design and configure event badges for participants
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="styling">Styling</TabsTrigger>
          </TabsList>

          {/* Template Settings */}
          <TabsContent value="template" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Layout</Label>
                <div className="flex gap-2">
                  {['portrait', 'landscape'].map((layout) => (
                    <Button
                      key={layout}
                      variant={config.template.layout === layout ? "default" : "outline"}
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        template: { ...prev.template, layout: layout as 'portrait' | 'landscape' }
                      }))}
                      className="flex-1 capitalize"
                    >
                      {layout}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Size</Label>
                <div className="flex gap-2">
                  {['A4', 'A5', 'A6'].map((size) => (
                    <Button
                      key={size}
                      variant={config.template.size === size ? "default" : "outline"}
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        template: { ...prev.template, size: size as 'A4' | 'A5' | 'A6' }
                      }))}
                      className="flex-1"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.template.backgroundColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      template: { ...prev.template, backgroundColor: e.target.value }
                    }))}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={config.template.backgroundColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      template: { ...prev.template, backgroundColor: e.target.value }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>

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
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <Label className="text-slate-900 dark:text-white">Show QR Code</Label>
                </div>
                <Switch
                  checked={config.template.showQRCode}
                  onCheckedChange={(checked) => setConfig(prev => ({
                    ...prev,
                    template: { ...prev.template, showQRCode: checked }
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <Label className="text-slate-900 dark:text-white">Show Photo</Label>
                </div>
                <Switch
                  checked={config.template.showPhoto}
                  onCheckedChange={(checked) => setConfig(prev => ({
                    ...prev,
                    template: { ...prev.template, showPhoto: checked }
                  }))}
                />
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
                <Label className="text-slate-900 dark:text-white">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.styling.primaryColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      styling: { ...prev.styling, primaryColor: e.target.value }
                    }))}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={config.styling.primaryColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      styling: { ...prev.styling, primaryColor: e.target.value }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.styling.secondaryColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      styling: { ...prev.styling, secondaryColor: e.target.value }
                    }))}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={config.styling.secondaryColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      styling: { ...prev.styling, secondaryColor: e.target.value }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Border Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.styling.borderColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      styling: { ...prev.styling, borderColor: e.target.value }
                    }))}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={config.styling.borderColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      styling: { ...prev.styling, borderColor: e.target.value }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview and Save */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open('/api/admin/badge/preview', '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Badge
          </Button>
          <Button
            onClick={saveConfig}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white"
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
