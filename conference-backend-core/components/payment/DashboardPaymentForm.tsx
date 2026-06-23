"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Input } from "@/conference-backend-core/components/ui/input"
import { Checkbox } from "@/conference-backend-core/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { 
  CreditCard, Building, Users, CheckCircle, Loader2, AlertCircle,
  User, Mail, Phone, Shield, Sparkles
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/conference-backend-core/hooks/use-toast"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

// Payment configuration interface
interface PaymentConfig {
  gateway: boolean
  bankTransfer: boolean
  externalRedirect: boolean
  externalRedirectUrl: string
  redirectUrl?: string
  bankDetails: {
    accountName?: string
    accountNumber?: string
    ifscCode?: string
    bankName?: string
    branch?: string
    qrCodeUrl?: string
    upiId?: string
  } | null
}

interface UserData {
  _id: string
  email: string
  profile: {
    title: string
    firstName: string
    lastName: string
    phone: string
    age?: number
    designation: string
    institution: string
    mciNumber?: string
    address?: {
      street?: string
      city?: string
      state?: string
      country?: string
      pincode?: string
    }
  }
  registration: {
    registrationId: string
    type: string
    status: string
    workshopSelections?: string[]
    accompanyingPersons?: Array<{ name: string; age: number; relationship: string; dietaryRequirements?: string }>
  }
}

interface Workshop {
  id: string
  label: string
  price: number
  maxSeats?: number
  availableSeats?: number
  canRegister?: boolean
}

export function DashboardPaymentForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    gateway: false,
    bankTransfer: true,
    externalRedirect: false,
    externalRedirectUrl: '',
    bankDetails: null
  })
  const [priceCalculation, setPriceCalculation] = useState<any>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'gateway' | 'bank-transfer' | null>(null)
  const [registrationData, setRegistrationData] = useState<any>(null)

  // Form state (only editable fields)
  const [workshopSelections, setWorkshopSelections] = useState<string[]>([])
  const [accompanyingPersons, setAccompanyingPersons] = useState<Array<{
    name: string
    age: number
    relationship: string
    dietaryRequirements?: string
  }>>([])
  const [bankTransferUTR, setBankTransferUTR] = useState("")
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [activePaymentMethod, setActivePaymentMethod] = useState<'pay-now' | 'bank-transfer'>('bank-transfer')
  const [priceCalcTrigger, setPriceCalcTrigger] = useState(0)

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Fetch user profile
      const profileRes = await fetch('/api/user/profile')
      const profileData = await profileRes.json()
      
      if (!profileData.success) {
        toast({ title: "Error", description: "Failed to load profile", variant: "destructive" })
        return
      }

      // Check if already paid
      if (profileData.data.registration?.status === 'paid' || profileData.data.registration?.status === 'confirmed') {
        toast({ title: "Already Paid", description: "Your registration is already confirmed." })
        router.push('/dashboard')
        return
      }

      setUserData(profileData.data)
      setWorkshopSelections(profileData.data.registration?.workshopSelections || [])
      setOriginalWorkshops(profileData.data.registration?.workshopSelections || [])
      setAccompanyingPersons(profileData.data.registration?.accompanyingPersons || [])

      // Trigger initial price calculation after data loads
      setTimeout(() => setPriceCalcTrigger(1), 100)

      // Fetch workshops
      const workshopsRes = await fetch('/api/workshops')
      if (workshopsRes.ok) {
        const workshopsData = await workshopsRes.json()
        if (workshopsData.success && workshopsData.data) {
          setWorkshops(workshopsData.data.map((w: any) => ({
            id: w.id,
            label: w.name,
            price: w.price,
            maxSeats: w.maxSeats,
            availableSeats: w.availableSeats,
            canRegister: w.canRegister
          })))
        }
      }

      // Fetch payment configuration
      const paymentRes = await fetch('/api/admin/settings/payment-methods')
      if (paymentRes.ok) {
        const paymentData = await paymentRes.json()
        if (paymentData.success && paymentData.data) {
          setPaymentConfig(paymentData.data)
          
          // Check for external redirect
          if (paymentData.data.externalRedirect && paymentData.data.externalRedirectUrl) {
            setRedirecting(true)
            let url = paymentData.data.externalRedirectUrl.trim()
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              url = 'https://' + url
            }
            setPaymentConfig(prev => ({ ...prev, redirectUrl: url }))
            
            setTimeout(() => {
              const popup = window.open(url, '_blank', 'noopener,noreferrer')
              if (!popup || popup.closed) {
                console.log('Popup blocked - showing manual redirect link')
              } else {
                setTimeout(() => setRedirecting(false), 2000)
              }
            }, 1500)
            return
          }
          
          // Set payment method based on config
          setActivePaymentMethod(paymentData.data.gateway ? 'pay-now' : 'bank-transfer')
        }
      }

    } catch (error) {
      console.error('Error loading data:', error)
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const calculatePrice = async () => {
    if (!userData) return

    console.log('💰 Calculating price with:', {
      registrationType: userData.registration.type,
      workshopSelections,
      accompanyingPersons,
      age: userData.profile.age || 0
    })

    try {
      const response = await fetch('/api/payment/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationType: userData.registration.type,
          workshopSelections,
          accompanyingPersons,
          age: userData.profile.age || 0
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('💰 Price calculation result:', result.data)
          setPriceCalculation(result.data)
        } else {
          console.error('❌ Price calculation failed:', result.message)
        }
      } else {
        console.error('❌ Price calculation API error:', response.status)
      }
    } catch (error) {
      console.error('Price calculation error:', error)
    }
  }

  // Track original workshop selections (cannot be removed)
  const [originalWorkshops, setOriginalWorkshops] = useState<string[]>([])

  const handleWorkshopToggle = (workshopId: string) => {
    // Cannot uncheck originally selected workshops
    if (originalWorkshops.includes(workshopId)) {
      toast({ 
        title: "Cannot Remove", 
        description: "You cannot remove workshops that were already registered.", 
        variant: "destructive" 
      })
      return
    }
    
    setWorkshopSelections(prev => {
      if (prev.includes(workshopId)) {
        return prev.filter(w => w !== workshopId)
      } else {
        return [...prev, workshopId]
      }
    })
  }

  const addAccompanyingPerson = () => {
    setAccompanyingPersons(prev => [...prev, { name: '', age: 0, relationship: '' }])
  }

  const removeAccompanyingPerson = (index: number) => {
    setAccompanyingPersons(prev => prev.filter((_, i) => i !== index))
  }

  const updateAccompanyingPerson = (index: number, field: string, value: any) => {
    setAccompanyingPersons(prev => {
      const updated = prev.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
      return updated
    })
  }

  // Debounced price calculation to avoid too many API calls
  // Trigger recalculation when ANY editable form data changes
  useEffect(() => {
    if (userData?.registration?.type) {
      // Small delay to batch rapid changes
      const timer = setTimeout(() => {
        setPriceCalcTrigger(prev => prev + 1)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [
    userData?.registration?.type,
    userData?.profile?.age,
    JSON.stringify(accompanyingPersons), 
    JSON.stringify(workshopSelections)
  ])

  // Actually calculate price when trigger changes
  useEffect(() => {
    if (userData?.registration?.type && priceCalcTrigger > 0) {
      console.log('🔄 Price calc triggered:', priceCalcTrigger)
      calculatePrice()
    }
  }, [priceCalcTrigger])

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    if (!amount || typeof amount !== 'number') return "₹0"
    if (currency === "USD") return `$${amount.toFixed(2)}`
    return `₹${amount.toLocaleString()}`
  }

  const handleSubmit = async () => {
    if (!userData || !priceCalculation) return

    // Validate
    if (!agreeTerms) {
      toast({ title: "Terms Required", description: "Please agree to the terms and conditions", variant: "destructive" })
      return
    }

    if (activePaymentMethod === 'bank-transfer' && !bankTransferUTR) {
      toast({ title: "UTR Required", description: "Please enter your bank transfer UTR number", variant: "destructive" })
      return
    }

    if (activePaymentMethod === 'bank-transfer' && bankTransferUTR.length < 12) {
      toast({ title: "Invalid UTR", description: "UTR number must be at least 12 characters", variant: "destructive" })
      return
    }

    // Validate accompanying persons
    for (let i = 0; i < accompanyingPersons.length; i++) {
      const person = accompanyingPersons[i]
      if (!person.name || !person.age || !person.relationship) {
        toast({ 
          title: "Incomplete Details", 
          description: `Please fill all required fields for Accompanying Person ${i + 1}`, 
          variant: "destructive" 
        })
        return
      }
    }

    setSubmitting(true)

    try {
      // Build request body similar to registration form
      const requestBody = {
        email: userData.email,
        password: 'EXISTING_USER', // Flag to indicate existing user
        profile: userData.profile,
        registration: {
          type: userData.registration.type,
          workshopSelections,
          accompanyingPersons
        },
        payment: {
          method: activePaymentMethod,
          bankTransferUTR: activePaymentMethod === 'bank-transfer' ? bankTransferUTR : undefined,
          amount: priceCalculation?.total || 0,
          status: activePaymentMethod === 'pay-now' ? 'processing' : 'pending'
        },
        isExistingUser: true,
        userId: userData._id,
        registrationId: userData.registration.registrationId
      }

      // For gateway payment, create order and open Razorpay
      if (activePaymentMethod === 'pay-now') {
        const orderRes = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: priceCalculation.total,
            currency: priceCalculation.currency || 'INR'
          })
        })

        const orderData = await orderRes.json()
        if (!orderData.success) {
          throw new Error(orderData.message || 'Failed to create order')
        }

        // Open Razorpay
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: conferenceConfig.shortName,
          description: `Registration Payment - ${userData.registration.registrationId}`,
          order_id: orderData.data.id,
          prefill: {
            name: `${userData.profile.title} ${userData.profile.firstName} ${userData.profile.lastName}`,
            email: userData.email,
            contact: userData.profile.phone
          },
          theme: { color: conferenceConfig.theme.primary },
          handler: async (response: any) => {
            try {
              // Verify payment
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  workshopSelections,
                  accompanyingPersons
                })
              })

              const verifyData = await verifyRes.json()
              if (verifyData.success) {
                setPaymentMethod('gateway')
                setRegistrationData({
                  email: userData.email,
                  name: `${userData.profile.firstName} ${userData.profile.lastName}`,
                  registrationId: userData.registration.registrationId,
                  paymentId: response.razorpay_payment_id,
                  amount: orderData.data.amount / 100,
                  currency: orderData.data.currency
                })
                setPaymentComplete(true)
                toast({ title: "Payment Successful!", description: "Your registration is confirmed." })
              } else {
                throw new Error(verifyData.message || 'Verification failed')
              }
            } catch (err) {
              toast({ title: "Verification Failed", description: "Please contact support.", variant: "destructive" })
            }
            setSubmitting(false)
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false)
              toast({ title: "Payment Cancelled", description: "You can complete payment later." })
            }
          }
        }

        // @ts-ignore
        const rzp = new window.Razorpay(options)
        rzp.open()
        return
      }

      // Upload payment screenshot if provided (bank transfer only)
      let screenshotUrl = ''
      if (paymentScreenshot) {
        try {
          const uploadFormData = new FormData()
          uploadFormData.append('file', paymentScreenshot)
          
          const uploadResponse = await fetch('/api/upload/payment-screenshot', {
            method: 'POST',
            body: uploadFormData
          })
          
          const uploadResult = await uploadResponse.json()
          if (uploadResult.success) {
            screenshotUrl = uploadResult.data.url
            console.log('Screenshot uploaded:', screenshotUrl)
          } else {
            console.warn('Screenshot upload failed:', uploadResult.message)
          }
        } catch (uploadError) {
          console.warn('Screenshot upload error:', uploadError)
        }
      }

      // For bank transfer, call the submit-payment API
      const submitRes = await fetch('/api/user/submit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'bank-transfer',
          bankTransferUTR,
          screenshotUrl: screenshotUrl || undefined,
          amount: priceCalculation.total,
          workshopSelections,
          accompanyingPersons
        })
      })

      const submitData = await submitRes.json()
      if (submitData.success) {
        setPaymentMethod('bank-transfer')
        setRegistrationData({
          email: userData.email,
          name: `${userData.profile.firstName} ${userData.profile.lastName}`,
          registrationId: userData.registration.registrationId
        })
        setPaymentComplete(true)
        toast({ title: "Submitted!", description: "Your payment details have been submitted for verification." })
      } else {
        throw new Error(submitData.message || 'Failed to submit payment')
      }

    } catch (error) {
      console.error('Payment error:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "An error occurred", 
        variant: "destructive" 
      })
    } finally {
      setSubmitting(false)
    }
  }


  // Loading state
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: conferenceConfig.theme.primary }} />
          <p className="text-slate-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  // External redirect state
  if (redirecting) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: conferenceConfig.theme.primary }} />
            <h3 className="text-lg font-semibold mb-2">Redirecting to Payment Portal</h3>
            <p className="text-slate-600 mb-4">Please wait while we redirect you to the payment portal...</p>
            {paymentConfig.redirectUrl && (
              <a 
                href={paymentConfig.redirectUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Click here if not redirected automatically
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Payment complete state
  if (paymentComplete) {
    if (paymentMethod === 'gateway') {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg mx-auto text-center p-8"
        >
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Your payment has been processed and your registration is now <span className="font-bold text-green-600">confirmed</span>.
          </p>

          <div className="bg-green-50 border border-green-200 p-6 rounded-xl mb-6 text-left">
            <h3 className="font-semibold text-green-900 mb-4">Registration Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{registrationData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registration ID:</span>
                <span className="font-bold text-green-600">{registrationData?.registrationId}</span>
              </div>
              {registrationData?.paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-mono text-sm">{registrationData?.paymentId}</span>
                </div>
              )}
              {registrationData?.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-bold">₹{registrationData?.amount}</span>
                </div>
              )}
            </div>
          </div>

          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
        </motion.div>
      )
    } else {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg mx-auto text-center p-8"
        >
          <CheckCircle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Details Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your bank transfer details have been submitted for verification.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-yellow-900 mb-4">What happens next?</h3>
            <div className="space-y-2 text-sm text-yellow-800">
              <p>• Our team will verify your bank transfer within 2-3 business days</p>
              <p>• You will receive a confirmation email once verified</p>
              <p>• Your registration will be confirmed after verification</p>
            </div>
          </div>

          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
        </motion.div>
      )
    }
  }

  if (!userData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-slate-600 mb-4">Unable to load your profile data.</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-yellow-100 text-yellow-800 border-yellow-200">
            <Sparkles className="w-3 h-3 mr-1" />
            Payment Pending
          </Badge>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">
            Secure your spot at {conferenceConfig.shortName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - User Info (Read Only) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Registration ID</span>
                  <Badge variant="outline" className="font-mono">
                    {userData.registration.registrationId}
                  </Badge>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {userData.profile.title} {userData.profile.firstName} {userData.profile.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{userData.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{userData.profile.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{userData.profile.institution}</span>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <span className="text-sm text-gray-500">Registration Type</span>
                  <p className="font-medium">{priceCalculation?.breakdown?.registration?.label || userData.registration.type}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Workshop Selection */}
            {workshops.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Workshop Selection (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workshops.map((workshop) => {
                    const isOriginal = originalWorkshops.includes(workshop.id)
                    const isSelected = workshopSelections.includes(workshop.id)
                    return (
                    <div 
                      key={workshop.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        !workshop.canRegister && !isOriginal ? 'opacity-60 bg-gray-50' : 
                        isOriginal ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={workshop.id}
                          checked={isSelected}
                          onCheckedChange={() => handleWorkshopToggle(workshop.id)}
                          disabled={isOriginal || !workshop.canRegister}
                        />
                        <div>
                          <label htmlFor={workshop.id} className="text-sm font-medium flex items-center gap-2">
                            {workshop.label}
                            {isOriginal && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Already Registered
                              </span>
                            )}
                          </label>
                          <p className="text-xs text-gray-500">
                            ₹{workshop.price?.toLocaleString() || 0}
                            {!isOriginal && workshop.availableSeats !== undefined && (
                              <span className={`ml-2 ${
                                workshop.availableSeats > 10 ? 'text-green-600' :
                                workshop.availableSeats > 0 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                • {workshop.availableSeats > 0 ? `${workshop.availableSeats} seats left` : 'Fully Booked'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Accompanying Persons */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Accompanying Persons (Optional)</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addAccompanyingPerson}>
                    <Users className="h-4 w-4 mr-1" />
                    Add Person
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {accompanyingPersons.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No accompanying persons added.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accompanyingPersons.map((person, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Person {index + 1}</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAccompanyingPerson(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                            <Input
                              value={person.name}
                              onChange={(e) => updateAccompanyingPerson(index, 'name', e.target.value)}
                              placeholder="Full name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Age *</label>
                            <Input
                              type="number"
                              value={person.age || ''}
                              onChange={(e) => updateAccompanyingPerson(index, 'age', parseInt(e.target.value) || 0)}
                              placeholder="Age"
                            />
                            {person.age > 0 && person.age < 10 && (
                              <p className="text-xs text-green-600 mt-1">✓ Free (under 10)</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Relationship *</label>
                            <select
                              value={person.relationship}
                              onChange={(e) => updateAccompanyingPerson(index, 'relationship', e.target.value)}
                              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Select</option>
                              <option value="spouse">Spouse</option>
                              <option value="parent">Parent</option>
                              <option value="child">Child</option>
                              <option value="sibling">Sibling</option>
                              <option value="friend">Friend</option>
                              <option value="colleague">Colleague</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>


            {/* Price Summary */}
            {priceCalculation && (
              <Card>
                <CardHeader className="pb-3 bg-yellow-50">
                  <CardTitle className="text-lg">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {priceCalculation.breakdown?.registration?.label || 'Registration Fee'}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(priceCalculation.registrationFee || priceCalculation.baseAmount || 0)}
                    </span>
                  </div>
                  
                  {(priceCalculation.gst > 0 || priceCalculation.breakdown?.gst > 0) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST (18%)</span>
                      <span className="font-medium">{formatCurrency(priceCalculation.gst || priceCalculation.breakdown?.gst || 0)}</span>
                    </div>
                  )}
                  
                  {priceCalculation.workshopFees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Workshop Fees ({workshopSelections.length})</span>
                      <span className="font-medium">{formatCurrency(priceCalculation.workshopFees)}</span>
                    </div>
                  )}
                  
                  {(priceCalculation.accompanyingPersonFees > 0 || priceCalculation.accompanyingPersons > 0) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Accompanying Persons ({priceCalculation.accompanyingPersonCount || accompanyingPersons.length})
                      </span>
                      <span className="font-medium">
                        {formatCurrency(priceCalculation.accompanyingPersonFees || priceCalculation.accompanyingPersons || 0)}
                      </span>
                    </div>
                  )}
                  
                  {priceCalculation.freeChildrenCount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Children under 10 ({priceCalculation.freeChildrenCount})</span>
                      <span className="font-medium">FREE</span>
                    </div>
                  )}
                  
                  {priceCalculation.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount Applied</span>
                      <span className="font-medium">-{formatCurrency(priceCalculation.discount)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total Amount</span>
                      <span style={{ color: conferenceConfig.theme.primary }}>
                        {formatCurrency(priceCalculation.total || priceCalculation.finalAmount || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method Info */}
            {activePaymentMethod === 'pay-now' && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">Online Payment Gateway</p>
                      <p className="text-sm text-blue-700">You will be redirected to Razorpay to complete payment</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bank Transfer Details */}
            {activePaymentMethod === 'bank-transfer' && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Bank Transfer Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* QR Code */}
                  {paymentConfig.bankDetails?.qrCodeUrl && (
                    <div className="bg-white p-4 rounded-lg border text-center">
                      <p className="font-medium text-gray-700 mb-3">Scan QR Code to Pay</p>
                      <img 
                        src={paymentConfig.bankDetails.qrCodeUrl} 
                        alt="Payment QR Code" 
                        className="mx-auto w-48 h-48 border-2 border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-2">Scan with any UPI app</p>
                    </div>
                  )}

                  {/* UPI ID */}
                  {paymentConfig.bankDetails?.upiId && (
                    <div className="bg-white p-4 rounded-lg border">
                      <span className="font-medium text-gray-700 block mb-2">UPI ID:</span>
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                        <p className="font-mono">{paymentConfig.bankDetails.upiId}</p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(paymentConfig.bankDetails!.upiId!)
                            toast({ title: "Copied!", description: "UPI ID copied to clipboard" })
                          }}
                          className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bank Details */}
                  {(paymentConfig.bankDetails?.accountName || paymentConfig.bankDetails?.accountNumber) && (
                    <div className="space-y-3">
                      {paymentConfig.bankDetails?.accountName && (
                        <div className="bg-white p-3 rounded-lg border">
                          <span className="text-sm text-gray-500">Account Name:</span>
                          <p className="font-medium">{paymentConfig.bankDetails.accountName}</p>
                        </div>
                      )}
                      {paymentConfig.bankDetails?.accountNumber && (
                        <div className="bg-white p-3 rounded-lg border">
                          <span className="text-sm text-gray-500">Account Number:</span>
                          <p className="font-mono font-medium">{paymentConfig.bankDetails.accountNumber}</p>
                        </div>
                      )}
                      {paymentConfig.bankDetails?.ifscCode && (
                        <div className="bg-white p-3 rounded-lg border">
                          <span className="text-sm text-gray-500">IFSC Code:</span>
                          <p className="font-mono font-medium">{paymentConfig.bankDetails.ifscCode}</p>
                        </div>
                      )}
                      {paymentConfig.bankDetails?.bankName && (
                        <div className="bg-white p-3 rounded-lg border">
                          <span className="text-sm text-gray-500">Bank Name:</span>
                          <p className="font-medium">{paymentConfig.bankDetails.bankName}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <p className="font-medium text-yellow-800">
                      💡 Transfer Amount: {formatCurrency(priceCalculation?.total || 0)}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please transfer the exact amount and enter the UTR number below
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* UTR Input for Bank Transfer */}
            {activePaymentMethod === 'bank-transfer' && (
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Transfer UTR Number *
                    </label>
                    <Input
                      type="text"
                      value={bankTransferUTR}
                      onChange={(e) => setBankTransferUTR(e.target.value)}
                      placeholder="Enter 12-digit UTR number from your bank transfer"
                      maxLength={22}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The UTR (Unique Transaction Reference) number is provided by your bank after successful transfer
                    </p>
                  </div>

                  {/* Payment Screenshot Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Screenshot (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {paymentScreenshot ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">{paymentScreenshot.name}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {(paymentScreenshot.size / 1024).toFixed(1)} KB
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentScreenshot(null)}
                            className="text-red-500 hover:text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  toast({
                                    title: "File too large",
                                    description: "Maximum file size is 5MB",
                                    variant: "destructive"
                                  })
                                  return
                                }
                                setPaymentScreenshot(file)
                              }
                            }}
                            className="hidden"
                            id="payment-screenshot-dashboard"
                          />
                          <label
                            htmlFor="payment-screenshot-dashboard"
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Upload Screenshot</span>
                          </label>
                          <p className="text-xs text-gray-500">
                            Upload a screenshot of your payment confirmation (JPEG, PNG, max 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Terms and Submit */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the{" "}
                    <Link href="/terms-conditions" className="text-blue-600 hover:underline">
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={
                    !agreeTerms || 
                    (activePaymentMethod === 'bank-transfer' && !bankTransferUTR) || 
                    submitting
                  }
                  className="w-full h-12 text-lg font-semibold"
                  style={{ backgroundColor: conferenceConfig.theme.primary }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : activePaymentMethod === 'pay-now' ? (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pay {formatCurrency(priceCalculation?.total || 0)}
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Submit Payment Details
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  <Shield className="inline h-3 w-3 mr-1" />
                  Secure payment powered by Razorpay
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
