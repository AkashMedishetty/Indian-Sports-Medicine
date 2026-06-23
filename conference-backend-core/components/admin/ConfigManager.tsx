"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Input } from "@/conference-backend-core/components/ui/input"
import { Label } from "@/conference-backend-core/components/ui/label"
import { Textarea } from "@/conference-backend-core/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/conference-backend-core/components/ui/select"
import { Switch } from "@/conference-backend-core/components/ui/switch"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/conference-backend-core/components/ui/tabs"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import {
  Settings,
  DollarSign,
  Tag,
  Mail,
  Calendar,
  Plus,
  Minus,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X
} from "lucide-react"
import { useToast } from "@/conference-backend-core/hooks/use-toast"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

interface PricingConfig {
  registration_categories: {
    [key: string]: {
      amount: number
      currency: string
      label: string
    }
  }
  workshops: Array<{
    id: string
    name: string
    amount: number
  }>
  accompanying_person: {
    amount: number
    currency: string
  }
  age_exemptions: {
    children_under_age: number
    senior_citizen_age: number
    senior_citizen_category: string
  }
}

interface DiscountConfig {
  active_discounts: Array<{
    id: string
    name: string
    type: 'time-based' | 'code-based'
    percentage: number
    startDate?: string
    endDate?: string
    code?: string
    applicableCategories: string[]
    isActive: boolean
  }>
}

interface EmailConfig {
  fromName: string
  fromEmail: string
  replyTo: string
  templates: {
    registration: { enabled: boolean; subject: string }
    payment: { enabled: boolean; subject: string }
    passwordReset: { enabled: boolean; subject: string }
    bulkEmail: { enabled: boolean; subject: string }
  }
  rateLimiting: {
    batchSize: number
    delayBetweenBatches: number
  }
}

export function ConfigManager() {
  const [activeTab, setActiveTab] = useState("pricing")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Configuration states
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)
  const [discountConfig, setDiscountConfig] = useState<DiscountConfig | null>(null)
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const fetchConfigurations = async () => {
    setIsLoading(true)
    try {
      const [pricingRes, discountRes, emailRes] = await Promise.all([
        fetch('/api/admin/config/pricing'),
        fetch('/api/admin/config/discounts'),
        fetch('/api/admin/config/email')
      ])

      const [pricingData, discountData, emailData] = await Promise.all([
        pricingRes.json(),
        discountRes.json(),
        emailRes.json()
      ])

      if (pricingData.success) {
        // Ensure accompanying_person and age_exemptions have default values
        const configWithDefaults = {
          ...pricingData.data,
          accompanying_person: pricingData.data.accompanying_person || {
            amount: 0,
            currency: 'INR'
          },
          age_exemptions: pricingData.data.age_exemptions || {
            children_under_age: 10,
            senior_citizen_age: 70,
            senior_citizen_category: 'consultant'
          }
        }
        setPricingConfig(configWithDefaults)
      } else {
        console.error('Pricing config error:', pricingData.message)
      }

      if (discountData.success) {
        setDiscountConfig(discountData.data)
      } else {
        console.error('Discount config error:', discountData.message)
      }

      if (emailData.success) {
        setEmailConfig(emailData.data)
      } else {
        console.error('Email config error:', emailData.message)
      }

    } catch (error) {
      console.error('Config fetch error:', error)
      setError('Failed to load configurations')
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfiguration = async (type: string, data: any) => {
    setIsSaving(true)
    try {
      console.log('Saving configuration:', { type, data })
      
      const response = await fetch(`/api/admin/config/${type}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      console.log('Save response:', result)

      if (result.success) {
        toast({
          title: "Configuration Saved",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} configuration has been updated successfully.`
        })
        fetchConfigurations() // Refresh data
      } else {
        console.error('Save failed:', result)
        toast({
          title: "Save Failed",
          description: result.message || result.error || "Failed to save configuration",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Config save error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while saving configuration",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Pricing configuration handlers
  const updateRegistrationCategory = (type: string, field: string, value: any) => {
    if (!pricingConfig) return

    setPricingConfig(prev => ({
      ...prev!,
      registration_categories: {
        ...prev!.registration_categories,
        [type]: {
          ...prev!.registration_categories[type],
          [field]: value
        }
      }
    }))
  }

  const addWorkshop = () => {
    if (!pricingConfig) return

    const newWorkshop = {
      id: `workshop-${Date.now()}`,
      name: "",
      amount: 0
    }

    setPricingConfig(prev => ({
      ...prev!,
      workshops: [...prev!.workshops, newWorkshop]
    }))
  }

  const updateWorkshop = (index: number, field: string, value: any) => {
    if (!pricingConfig) return

    setPricingConfig(prev => ({
      ...prev!,
      workshops: prev!.workshops.map((workshop, i) =>
        i === index ? { ...workshop, [field]: value } : workshop
      )
    }))
  }

  const removeWorkshop = (index: number) => {
    if (!pricingConfig) return

    setPricingConfig(prev => ({
      ...prev!,
      workshops: prev!.workshops.filter((_, i) => i !== index)
    }))
  }

  // Discount configuration handlers
  const addDiscount = () => {
    if (!discountConfig) return

    const newDiscount = {
      id: `discount-${Date.now()}`,
      name: "",
      type: 'time-based' as const,
      percentage: 10,
      applicableCategories: ['all'],
      isActive: true
    }

    setDiscountConfig(prev => ({
      ...prev!,
      active_discounts: [...prev!.active_discounts, newDiscount]
    }))
  }

  const updateDiscount = (index: number, field: string, value: any) => {
    if (!discountConfig) return

    setDiscountConfig(prev => ({
      ...prev!,
      active_discounts: prev!.active_discounts.map((discount, i) =>
        i === index ? { ...discount, [field]: value } : discount
      )
    }))
  }

  const removeDiscount = (index: number) => {
    if (!discountConfig) return

    setDiscountConfig(prev => ({
      ...prev!,
      active_discounts: prev!.active_discounts.filter((_, i) => i !== index)
    }))
  }

  const updateEmailTemplate = (template: string, field: string, value: any) => {
    if (!emailConfig) return

    setEmailConfig(prev => ({
      ...prev!,
      templates: {
        ...prev!.templates,
        [template]: {
          ...(prev?.templates[template as keyof typeof prev.templates] || {}),
          [field]: value
        }
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
          <p className="text-gray-600">Loading configurations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#f0f3f8]0/10 rounded-xl">
            <Settings className="h-6 w-6 text-[#25406b]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">System Configuration</h2>
            <p className="text-slate-600 text-sm">
              Manage pricing, discounts, email settings, and other system configurations
            </p>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100/60 p-1 rounded-xl">
            <TabsTrigger
              value="pricing"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <DollarSign className="h-4 w-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger
              value="discounts"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Tag className="h-4 w-4" />
              Discounts
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* Pricing Configuration */}
          <TabsContent value="pricing" className="space-y-6">
            {pricingConfig && (
              <>
                {/* Registration Categories */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Registration Categories</h3>
                  <div className="grid gap-4">
                    {pricingConfig?.registration_categories && Object.entries(pricingConfig.registration_categories).map(([type, config]) => (
                      <Card key={type} className="bg-white/60 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200">
                        <CardHeader className="pb-4">
                          <CardTitle className="capitalize text-slate-900 flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#f0f3f8]0 rounded-full" />
                            {config.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Label</Label>
                            <Input
                              value={config.label}
                              onChange={(e) => updateRegistrationCategory(type, 'label', e.target.value)}
                              className="bg-white/60 border-slate-200/50 focus:bg-white/80"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Amount</Label>
                            <Input
                              type="number"
                              value={config.amount}
                              onChange={(e) => updateRegistrationCategory(type, 'amount', parseFloat(e.target.value) || 0)}
                              className="bg-white/60 border-slate-200/50 focus:bg-white/80"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Currency</Label>
                            <Select
                              value={config.currency}
                              onValueChange={(value) => updateRegistrationCategory(type, 'currency', value)}
                            >
                              <SelectTrigger className="bg-white/60 border-slate-200/50 focus:bg-white/80">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200/50">
                                <SelectItem value="INR">INR (â‚¹)</SelectItem>
                                <SelectItem value="USD">USD ($)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Workshops */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Workshops</h3>
                    <Button onClick={addWorkshop} size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Workshop
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {pricingConfig?.workshops?.map((workshop, index) => (
                      <Card key={workshop.id}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-2">
                              <Label>Workshop Name</Label>
                              <Input
                                value={workshop.name}
                                onChange={(e) => updateWorkshop(index, 'name', e.target.value)}
                                placeholder="Enter workshop name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Amount</Label>
                              <Input
                                type="number"
                                value={workshop.amount}
                                onChange={(e) => updateWorkshop(index, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeWorkshop(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Accompanying Person Pricing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Accompanying Person</h3>
                  <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-slate-900 flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        Accompanying Person Fee
                      </CardTitle>
                      <CardDescription>Fee charged per accompanying person (age 10 and above)</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Amount</Label>
                        <Input
                          type="number"
                          value={pricingConfig?.accompanying_person?.amount || 0}
                          onChange={(e) => setPricingConfig(prev => ({
                            ...prev!,
                            accompanying_person: {
                              ...prev!.accompanying_person,
                              amount: parseFloat(e.target.value) || 0
                            }
                          }))}
                          className="bg-white/60 border-slate-200/50 focus:bg-white/80"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Currency</Label>
                        <Select
                          value={pricingConfig?.accompanying_person?.currency || 'INR'}
                          onValueChange={(value) => setPricingConfig(prev => ({
                            ...prev!,
                            accompanying_person: {
                              ...prev!.accompanying_person,
                              currency: value
                            }
                          }))}
                        >
                          <SelectTrigger className="bg-white/60 border-slate-200/50 focus:bg-white/80">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200/50">
                            <SelectItem value="INR">INR (â‚¹)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Age Exemptions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Age-Based Exemptions</h3>
                  <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-slate-900 flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        Free Registration Rules
                      </CardTitle>
                      <CardDescription>Configure age-based exemptions for registration fees</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-medium">Children Under Age (Free)</Label>
                          <Input
                            type="number"
                            value={pricingConfig?.age_exemptions?.children_under_age || 10}
                            onChange={(e) => setPricingConfig(prev => ({
                              ...prev!,
                              age_exemptions: {
                                ...prev!.age_exemptions,
                                children_under_age: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="bg-white/60 border-slate-200/50 focus:bg-white/80"
                            min="0"
                            max="18"
                          />
                          <p className="text-xs text-slate-600">Accompanying persons below this age are free</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-medium">Senior Citizen Age (Free)</Label>
                          <Input
                            type="number"
                            value={pricingConfig?.age_exemptions?.senior_citizen_age || 70}
                            onChange={(e) => setPricingConfig(prev => ({
                              ...prev!,
                              age_exemptions: {
                                ...prev!.age_exemptions,
                                senior_citizen_age: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="bg-white/60 border-slate-200/50 focus:bg-white/80"
                            min="0"
                            max="100"
                          />
                          <p className="text-xs text-slate-600">Delegates above this age qualify for free registration</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Applicable Category for Senior Citizens</Label>
                        <Select
                          value={pricingConfig?.age_exemptions?.senior_citizen_category || 'consultant'}
                          onValueChange={(value) => setPricingConfig(prev => ({
                            ...prev!,
                            age_exemptions: {
                              ...prev!.age_exemptions,
                              senior_citizen_category: value
                            }
                          }))}
                        >
                          <SelectTrigger className="bg-white/60 border-slate-200/50 focus:bg-white/80">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200/50">
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="postgraduate">Postgraduate Only</SelectItem>
                            <SelectItem value="consultant">Consultants Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-600">Senior citizen exemption applies to selected category only</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-200/50">
                  <Button
                    onClick={() => saveConfiguration('pricing', pricingConfig)}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-[#f0f3f8]0 to-[#25406b] hover:from-[#25406b] hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Pricing
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Discount Configuration */}
          <TabsContent value="discounts" className="space-y-6">
            {discountConfig && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Active Discounts</h3>
                  <Button onClick={addDiscount} size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Discount
                  </Button>
                </div>

                <div className="space-y-4">
                  {discountConfig?.active_discounts?.map((discount, index) => (
                    <Card key={discount.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            {discount.name || 'New Discount'}
                            <Badge variant={discount.isActive ? "default" : "secondary"}>
                              {discount.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeDiscount(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Discount Name</Label>
                            <Input
                              value={discount.name}
                              onChange={(e) => updateDiscount(index, 'name', e.target.value)}
                              placeholder="Enter discount name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={discount.type}
                              onValueChange={(value) => updateDiscount(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="time-based">Time-based</SelectItem>
                                <SelectItem value="code-based">Code-based</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Percentage</Label>
                            <Input
                              type="number"
                              value={discount.percentage}
                              onChange={(e) => updateDiscount(index, 'percentage', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={discount.isActive}
                                onCheckedChange={(checked) => updateDiscount(index, 'isActive', checked)}
                              />
                              <span className="text-sm">{discount.isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                          </div>
                        </div>

                        {discount.type === 'code-based' && (
                          <div className="space-y-2">
                            <Label>Discount Code</Label>
                            <Input
                              value={discount.code || ''}
                              onChange={(e) => updateDiscount(index, 'code', e.target.value)}
                              placeholder="Enter discount code"
                            />
                          </div>
                        )}

                        {discount.type === 'time-based' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Start Date</Label>
                              <Input
                                type="date"
                                value={discount.startDate || ''}
                                onChange={(e) => updateDiscount(index, 'startDate', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input
                                type="date"
                                value={discount.endDate || ''}
                                onChange={(e) => updateDiscount(index, 'endDate', e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Applicable Categories</Label>
                          <div className="flex flex-wrap gap-2">
                            {['all', 'regular', 'student', 'international', 'faculty'].map(category => (
                              <Button
                                key={category}
                                variant={discount.applicableCategories.includes(category) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  const categories = discount.applicableCategories.includes(category)
                                    ? discount.applicableCategories.filter(c => c !== category)
                                    : [...discount.applicableCategories, category]
                                  updateDiscount(index, 'applicableCategories', categories)
                                }}
                              >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => saveConfiguration('discounts', discountConfig)}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-[#f0f3f8]0 to-blue-700 hover:from-[#25406b] hover:to-blue-800"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Discounts
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Email Configuration */}
          <TabsContent value="email" className="space-y-6">
            {emailConfig && (
              <>
                {/* Basic Email Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Email Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From Name</Label>
                      <Input
                        value={emailConfig.fromName}
                        onChange={(e) => setEmailConfig(prev => ({ ...prev!, fromName: e.target.value }))}
                        placeholder={`${conferenceConfig.shortName}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>From Email</Label>
                      <Input
                        type="email"
                        value={emailConfig.fromEmail}
                        onChange={(e) => setEmailConfig(prev => ({ ...prev!, fromEmail: e.target.value }))}
                        placeholder={`noreply@${conferenceConfig.contact.website?.replace('https://', '').replace('http://', '') || 'conference.com'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reply To</Label>
                      <Input
                        type="email"
                        value={emailConfig.replyTo}
                        onChange={(e) => setEmailConfig(prev => ({ ...prev!, replyTo: e.target.value }))}
                        placeholder="contact@gmail.com"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Email Templates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Email Templates</h3>
                  <div className="space-y-4">
                    {emailConfig?.templates && Object.entries(emailConfig.templates).map(([template, config]) => (
                      <Card key={template}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="capitalize">{template.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                            <Switch
                              checked={config.enabled}
                              onCheckedChange={(checked) => updateEmailTemplate(template, 'enabled', checked)}
                            />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input
                              value={config.subject}
                              onChange={(e) => updateEmailTemplate(template, 'subject', e.target.value)}
                              placeholder="Enter email subject"
                              disabled={!config.enabled}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Rate Limiting */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Rate Limiting</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Batch Size</Label>
                      <Input
                        type="number"
                        value={emailConfig.rateLimiting.batchSize}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev!,
                          rateLimiting: {
                            ...prev!.rateLimiting,
                            batchSize: parseInt(e.target.value) || 10
                          }
                        }))}
                        min="1"
                        max="50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Delay Between Batches (ms)</Label>
                      <Input
                        type="number"
                        value={emailConfig.rateLimiting.delayBetweenBatches}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev!,
                          rateLimiting: {
                            ...prev!.rateLimiting,
                            delayBetweenBatches: parseInt(e.target.value) || 1000
                          }
                        }))}
                        min="100"
                        max="10000"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => saveConfiguration('email', emailConfig)}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-[#f0f3f8]0 to-blue-700 hover:from-[#25406b] hover:to-blue-800"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Email Settings
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  )
}