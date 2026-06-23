'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { useToast } from '../ui/use-toast'
import { 
  Settings, FileText, Calendar, CreditCard, 
  CheckCircle, XCircle, Save, RefreshCw, Zap 
} from 'lucide-react'
import { motion } from 'framer-motion'

interface FeatureSettings {
  abstractSubmission: boolean
  workshopRegistration: boolean
  paymentGateway: boolean
  bankTransfer: boolean
  accompanyingPersons: boolean
  certificateGeneration: boolean
}

export function QuickSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<FeatureSettings>({
    abstractSubmission: true,
    workshopRegistration: true,
    paymentGateway: true,
    bankTransfer: true,
    accompanyingPersons: true,
    certificateGeneration: false
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/features')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setSettings(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/config/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Feature settings have been updated successfully."
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleSetting = (key: keyof FeatureSettings) => {
    // Handle payment methods - only one can be active
    if (key === 'paymentGateway' || key === 'bankTransfer') {
      setSettings(prev => ({
        ...prev,
        paymentGateway: key === 'paymentGateway' ? !prev.paymentGateway : false,
        bankTransfer: key === 'bankTransfer' ? !prev.bankTransfer : false
      }))
    } else {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }
  }

  const settingItems = [
    {
      key: 'abstractSubmission' as keyof FeatureSettings,
      label: 'Abstract Submission',
      description: 'Allow users to submit research abstracts',
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      key: 'workshopRegistration' as keyof FeatureSettings,
      label: 'Workshop Registration',
      description: 'Enable workshop seat booking for attendees',
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      key: 'paymentGateway' as keyof FeatureSettings,
      label: 'Online Payment Gateway',
      description: 'Accept payments via Razorpay (online)',
      icon: CreditCard,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      key: 'bankTransfer' as keyof FeatureSettings,
      label: 'Bank Transfer Payment',
      description: 'Accept payments via direct bank transfer',
      icon: CreditCard,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      key: 'accompanyingPersons' as keyof FeatureSettings,
      label: 'Accompanying Persons',
      description: 'Allow registration of accompanying persons',
      icon: Settings,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20'
    },
    {
      key: 'certificateGeneration' as keyof FeatureSettings,
      label: 'Certificate Generation',
      description: 'Enable automatic certificate generation',
      icon: CheckCircle,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    }
  ]

  if (loading) {
    return (
      <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700">
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Quick Feature Settings
            </CardTitle>
            <CardDescription className="dark:text-slate-400">
              Enable or disable features instantly
            </CardDescription>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {settingItems.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                settings[item.key]
                  ? `${item.bgColor} border-current`
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-lg ${settings[item.key] ? item.bgColor : 'bg-slate-100 dark:bg-slate-700'}`}>
                  <item.icon className={`h-5 w-5 ${settings[item.key] ? item.color : 'text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label 
                      htmlFor={item.key}
                      className="text-base font-semibold cursor-pointer text-slate-900 dark:text-white"
                    >
                      {item.label}
                    </Label>
                    <Badge 
                      variant={settings[item.key] ? "default" : "secondary"}
                      className={settings[item.key] 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" 
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      }
                    >
                      {settings[item.key] ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
              <Switch
                id={item.key}
                checked={settings[item.key]}
                onCheckedChange={() => toggleSetting(item.key)}
                className="ml-4"
              />
            </motion.div>
          ))}
        </div>

        {/* Payment Method Notice */}
        {(!settings.paymentGateway && !settings.bankTransfer) && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-900 dark:text-red-100 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Warning: At least one payment method should be enabled
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
