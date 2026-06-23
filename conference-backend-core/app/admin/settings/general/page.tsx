"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Label } from "@/conference-backend-core/components/ui/label"
import { Switch } from "@/conference-backend-core/components/ui/switch"
import { Button } from "@/conference-backend-core/components/ui/button"
import { useToast } from "@/conference-backend-core/hooks/use-toast"
import { Loader2, Settings, Award, QrCode, BookOpen, FileText, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"

interface GeneralSettings {
  certificate_enabled: boolean
  badge_enabled: boolean
  workshop_registration_enabled: boolean
  abstract_submission_enabled: boolean
}

export default function GeneralSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<GeneralSettings>({
    certificate_enabled: false,
    badge_enabled: false,
    workshop_registration_enabled: false,
    abstract_submission_enabled: false
  })
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/general')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          certificate_enabled: data.data.certificate_enabled ?? false,
          badge_enabled: data.data.badge_enabled ?? true,
          workshop_registration_enabled: data.data.workshop_registration_enabled ?? true,
          abstract_submission_enabled: data.data.abstract_submission_enabled ?? true
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof GeneralSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Save each setting
      for (const [key, value] of Object.entries(settings)) {
        const response = await fetch('/api/admin/settings/general', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to save ${key}`)
        }
      }

      toast({
        title: "✅ Settings Saved",
        description: "General settings have been updated successfully",
      })
      setHasChanges(false)
      
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">General Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure general conference features and functionality
        </p>
      </div>

      {hasChanges && (
        <Alert>
          <AlertDescription>
            You have unsaved changes. Click "Save Settings" to apply them.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Toggles
          </CardTitle>
          <CardDescription>
            Enable or disable conference features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Certificate Generation */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Award className="h-5 w-5 mt-1 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="certificate-toggle" className="text-base font-medium cursor-pointer">
                  Certificate Generation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to download participation certificates from their dashboard
                </p>
              </div>
            </div>
            <Switch
              id="certificate-toggle"
              checked={settings.certificate_enabled}
              onCheckedChange={() => handleToggle('certificate_enabled')}
            />
          </div>

          {/* Badge Generation */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <QrCode className="h-5 w-5 mt-1 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="badge-toggle" className="text-base font-medium cursor-pointer">
                  Badge Generation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to download event badges with QR codes
                </p>
              </div>
            </div>
            <Switch
              id="badge-toggle"
              checked={settings.badge_enabled}
              onCheckedChange={() => handleToggle('badge_enabled')}
            />
          </div>

          {/* Workshop Registration */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <BookOpen className="h-5 w-5 mt-1 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="workshop-toggle" className="text-base font-medium cursor-pointer">
                  Workshop Registration
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable workshop addon registration for attendees
                </p>
              </div>
            </div>
            <Switch
              id="workshop-toggle"
              checked={settings.workshop_registration_enabled}
              onCheckedChange={() => handleToggle('workshop_registration_enabled')}
            />
          </div>

          {/* Abstract Submission */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <FileText className="h-5 w-5 mt-1 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="abstract-toggle" className="text-base font-medium cursor-pointer">
                  Abstract Submission
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to submit abstracts for the conference
                </p>
              </div>
            </div>
            <Switch
              id="abstract-toggle"
              checked={settings.abstract_submission_enabled}
              onCheckedChange={() => handleToggle('abstract_submission_enabled')}
            />
          </div>

        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || saving}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
