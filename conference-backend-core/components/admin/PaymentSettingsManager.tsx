'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Switch } from '../ui/switch'
import { useToast } from '../ui/use-toast'
import { Upload, CreditCard, Building, Save, Loader2, X, Check, AlertTriangle } from 'lucide-react'

export function PaymentSettingsManager() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingQR, setUploadingQR] = useState(false)
  
  const [config, setConfig] = useState({
    gateway: false,
    bankTransfer: true,
    externalRedirect: false,
    externalRedirectUrl: '',
    maintenanceMode: false,
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branch: '',
      qrCodeUrl: '',
      upiId: ''
    }
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings/payment-methods')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setConfig({
            ...config,
            ...result.data,
            bankDetails: {
              ...config.bankDetails,
              ...result.data.bankDetails
            }
          })
        }
      }
    } catch (error) {
      console.error('Error loading config:', error)
      toast({
        title: "Error",
        description: "Failed to load payment settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please upload an image file',
        variant: 'destructive'
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive'
      })
      return
    }

    setUploadingQR(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'payment-qr')

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setConfig(prev => ({
          ...prev,
          bankDetails: {
            ...prev.bankDetails,
            qrCodeUrl: data.url
          }
        }))
        toast({
          title: 'Success',
          description: 'QR code uploaded successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Upload failed',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload QR code',
        variant: 'destructive'
      })
    } finally {
      setUploadingQR(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Payment settings saved successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to save settings',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save payment settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure payment methods and bank transfer details</p>
      </div>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Choose which payment methods are available for registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Gateway Toggle */}
            <div className="flex items-center justify-between p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-600">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Label className="text-base font-semibold text-gray-900 dark:text-white">Online Payment Gateway</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.gateway 
                      ? '✅ Enabled - Users will be redirected to Razorpay'
                      : '❌ Disabled - Gateway payment not available'}
                  </p>
                </div>
              </div>
              <Switch
                checked={config.gateway}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, gateway: checked }))}
              />
            </div>

            {/* Bank Transfer Toggle */}
            <div className="flex items-center justify-between p-4 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-600">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Label className="text-base font-semibold text-gray-900 dark:text-white">Bank Transfer</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.bankTransfer 
                      ? '✅ Enabled - Users can pay via bank transfer'
                      : '❌ Disabled - Bank transfer not available'}
                  </p>
                </div>
              </div>
              <Switch
                checked={config.bankTransfer}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, bankTransfer: checked }))}
              />
            </div>

            {/* External Registration Redirect Toggle */}
            <div className="flex items-center justify-between p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-600">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Label className="text-base font-semibold text-gray-900 dark:text-white">External Registration Redirect</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.externalRedirect 
                      ? '✅ Enabled - Users will be redirected to external URL'
                      : '❌ Disabled - Use internal registration form'}
                  </p>
                </div>
              </div>
              <Switch
                checked={config.externalRedirect}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, externalRedirect: checked }))}
              />
            </div>

            {/* External URL Configuration */}
            {config.externalRedirect && (
              <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/10">
                <Label className="text-base font-semibold mb-3 block">External Registration URL *</Label>
                <Input
                  value={config.externalRedirectUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, externalRedirectUrl: e.target.value }))}
                  placeholder="https://example.com/register"
                  className="mb-2"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Users will be redirected to this URL when they click "Register". Ensure the URL is complete and starts with http:// or https://
                </p>
              </div>
            )}

            {/* Maintenance Mode Toggle */}
            <div className="flex items-center justify-between p-4 border-2 border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-600">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Label className="text-base font-semibold text-gray-900 dark:text-white">Registration Maintenance Mode</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.maintenanceMode 
                      ? '🔧 Enabled - Registration page blocked for regular users. Admins can still access it for testing.'
                      : '✅ Disabled - Registration page is open to everyone'}
                  </p>
                </div>
              </div>
              <Switch
                checked={config.maintenanceMode}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, maintenanceMode: checked }))}
              />
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Note:</strong> Priority order: External Redirect (highest) → Gateway → Bank Transfer. 
                When External Redirect is enabled, users bypass the internal registration completely.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      {config.bankTransfer && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Transfer Details</CardTitle>
            <CardDescription>
              Configure bank account details that will be shown to users during registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code Upload */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Payment QR Code</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Upload QR Code Image
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      PNG, JPG up to 5MB
                    </p>
                    <label htmlFor="qr-upload">
                      <Button variant="outline" type="button" disabled={uploadingQR} asChild>
                        <span className="cursor-pointer">
                          {uploadingQR ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Choose File
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                    <input
                      id="qr-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleQRUpload}
                      className="hidden"
                    />
                  </div>
                </div>
                <div>
                  {config.bankDetails.qrCodeUrl ? (
                    <div className="relative border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4">
                      <button
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          bankDetails: { ...prev.bankDetails, qrCodeUrl: '' }
                        }))}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <img
                        src={config.bankDetails.qrCodeUrl}
                        alt="Payment QR Code"
                        className="w-full h-auto rounded"
                      />
                      <p className="text-xs text-center text-gray-500 mt-2">Current QR Code</p>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center h-full flex items-center justify-center">
                      <p className="text-gray-400">No QR code uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Tip:</strong> Bank details are optional. If you only have a QR code, you can leave the bank details empty and only the QR code will be shown to users.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Account Name</Label>
                  <Input
                    value={config.bankDetails.accountName}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, accountName: e.target.value }
                    }))}
                    placeholder="e.g., ISSH 2026"
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={config.bankDetails.accountNumber}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                    }))}
                    placeholder="e.g., 137912010002201"
                  />
                </div>
                <div>
                  <Label>IFSC Code</Label>
                  <Input
                    value={config.bankDetails.ifscCode}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, ifscCode: e.target.value.toUpperCase() }
                    }))}
                    placeholder="e.g., UBIN0813796"
                  />
                </div>
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={config.bankDetails.bankName}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                    }))}
                    placeholder="e.g., Union Bank of India"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Branch</Label>
                  <Input
                    value={config.bankDetails.branch}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, branch: e.target.value }
                    }))}
                    placeholder="e.g., Main Branch, City Name"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>UPI ID</Label>
                  <Input
                    value={config.bankDetails.upiId || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, upiId: e.target.value }
                    }))}
                    placeholder="e.g., issh2026@upi or 9876543210@paytm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    UPI ID will be shown to users for easy payment via UPI apps
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
