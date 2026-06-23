"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Input } from "@/conference-backend-core/components/ui/input"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import { 
  CreditCard, Shield, CheckCircle, Clock, Loader2, AlertCircle,
  User, Mail, Phone, Building, Tag, ArrowRight, IndianRupee
} from "lucide-react"
import { useToast } from "@/conference-backend-core/hooks/use-toast"
import { conferenceConfig, getCategoryLabel } from "@/conference-backend-core/config/conference.config"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface UserData {
  _id: string
  email: string
  profile: {
    title: string
    firstName: string
    lastName: string
    phone: string
    institution: string
    mciNumber?: string
  }
  registration: {
    registrationId: string
    type: string
    status: string
    workshopSelections?: string[]
    accompanyingPersons?: Array<{ name: string; age: number; relationship: string }>
  }
}

interface PaymentCalculation {
  registrationFee: number
  registrationLabel: string
  gst: number
  workshopFees: number
  accompanyingPersonFees: number
  subtotal: number
  discount: number
  total: number
  currency: string
  breakdown: {
    registration: { type: string; label: string; amount: number }
    gst: number
    gstPercentage: number
    workshops: Array<{ name: string; amount: number }>
    accompanyingPersons: Array<{ name: string; age: number; amount: number; isFree: boolean }>
    appliedDiscounts: Array<{ type: string; code?: string; percentage: number; amount: number }>
    tier: string
  }
}

export function ModernPaymentForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [userData, setUserData] = useState<UserData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentCalculation | null>(null)
  const [discountCode, setDiscountCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadRazorpayScript()
    fetchUserData()
  }, [])

  useEffect(() => {
    if (userData) {
      calculatePayment()
    }
  }, [userData])

  const loadRazorpayScript = () => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(script)
  }

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile")
      const data = await response.json()

      if (data.success) {
        // Check if already paid
        if (data.data.registration?.status === "paid" || data.data.registration?.status === "confirmed") {
          toast({ title: "Payment Complete", description: "Your registration is already confirmed." })
          router.push("/dashboard")
          return
        }
        setUserData(data.data)
      } else {
        setError(data.message || "Failed to load user data")
      }
    } catch (err) {
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }


  const calculatePayment = async () => {
    if (!userData) return
    setCalculating(true)
    
    try {
      const response = await fetch("/api/payment/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationType: userData.registration.type,
          workshopSelections: userData.registration.workshopSelections || [],
          accompanyingPersons: userData.registration.accompanyingPersons || [],
          discountCode: discountCode.trim() || undefined
        })
      })

      const data = await response.json()
      if (data.success) {
        setPaymentData(data.data)
        setError("")
      } else {
        setError(data.message || "Failed to calculate payment")
      }
    } catch (err) {
      setError("Failed to calculate payment")
    } finally {
      setCalculating(false)
    }
  }

  const applyDiscount = () => {
    if (discountCode.trim()) {
      calculatePayment()
    }
  }

  const handlePayment = async () => {
    if (!userData || !paymentData) return
    setProcessing(true)

    try {
      // Create order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentData.total,
          currency: paymentData.currency,
          discountCode: discountCode.trim() || undefined
        })
      })

      const orderData = await orderResponse.json()
      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create order")
      }

      // Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: conferenceConfig.shortName,
        description: `Registration - ${userData.registration.registrationId}`,
        order_id: orderData.data.id,
        prefill: {
          name: `${userData.profile.title} ${userData.profile.firstName} ${userData.profile.lastName}`,
          email: userData.email,
          contact: userData.profile.phone
        },
        theme: { color: conferenceConfig.theme.primary },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })

            const verifyData = await verifyResponse.json()
            if (verifyData.success) {
              toast({ title: "Payment Successful!", description: "Your registration is confirmed." })
              router.push("/dashboard?payment=success")
            } else {
              throw new Error(verifyData.message || "Verification failed")
            }
          } catch (err) {
            toast({ title: "Verification Failed", description: "Please contact support.", variant: "destructive" })
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false)
            toast({ title: "Payment Cancelled", description: "You can complete payment later." })
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast({ title: "Payment Failed", description: err instanceof Error ? err.message : "An error occurred", variant: "destructive" })
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: conferenceConfig.theme.primary }} />
          <p className="text-slate-600 dark:text-slate-400">Loading payment details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !userData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Payment</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userData) return null


  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Complete Your Payment
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Secure your spot at {conferenceConfig.shortName}
          </p>
        </div>

        {/* Status Banner */}
        <div 
          className="rounded-lg p-4 mb-6 flex items-center gap-3"
          style={{ backgroundColor: `${conferenceConfig.theme.warning}15`, borderLeft: `4px solid ${conferenceConfig.theme.warning}` }}
        >
          <Clock className="h-5 w-5" style={{ color: conferenceConfig.theme.warning }} />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Payment Pending</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Complete your payment to confirm your registration for {conferenceConfig.shortName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - User Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
                  Registration Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Registration ID</span>
                  <Badge variant="outline" className="font-mono">
                    {userData.registration.registrationId}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 mt-0.5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {userData.profile.title} {userData.profile.firstName} {userData.profile.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{getCategoryLabel(userData.registration.type)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{userData.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{userData.profile.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{userData.profile.institution}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discount Code */}
            <Card className="border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
                  Discount Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={applyDiscount}
                    disabled={calculating || !discountCode.trim()}
                  >
                    {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="lg:col-span-3">
            <Card className="border-slate-200 dark:border-slate-700 sticky top-24">
              <CardHeader className="pb-3" style={{ backgroundColor: `${conferenceConfig.theme.primary}08` }}>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {calculating ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    ))}
                  </div>
                ) : paymentData ? (
                  <div className="space-y-4">
                    {/* Line Items */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Registration ({paymentData.breakdown?.registration?.label || getCategoryLabel(userData.registration.type)})
                        </span>
                        <span className="font-medium">{formatCurrency(paymentData.registrationFee)}</span>
                      </div>

                      {(paymentData.gst > 0 || paymentData.breakdown?.gst > 0) && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">GST (18%)</span>
                          <span className="font-medium">{formatCurrency(paymentData.gst || paymentData.breakdown?.gst || 0)}</span>
                        </div>
                      )}

                      {paymentData.workshopFees > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Workshop Fees</span>
                          <span className="font-medium">{formatCurrency(paymentData.workshopFees)}</span>
                        </div>
                      )}

                      {paymentData.accompanyingPersonFees > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Accompanying Persons</span>
                          <span className="font-medium">{formatCurrency(paymentData.accompanyingPersonFees)}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                      <span className="font-medium">{formatCurrency(paymentData.subtotal)}</span>
                    </div>

                    {paymentData.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount Applied</span>
                        <span>-{formatCurrency(paymentData.discount)}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span style={{ color: conferenceConfig.theme.primary }}>
                        {formatCurrency(paymentData.total)}
                      </span>
                    </div>

                    {/* Security Badge */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 pt-2">
                      <Shield className="h-4 w-4" />
                      <span>Secure payment powered by Razorpay</span>
                    </div>

                    {/* Pay Button */}
                    <Button
                      onClick={handlePayment}
                      disabled={processing || !paymentData.total}
                      className="w-full h-12 text-lg font-semibold"
                      style={{ backgroundColor: conferenceConfig.theme.primary }}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pay {formatCurrency(paymentData.total)}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-slate-500">
                      By proceeding, you agree to our terms and conditions
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Unable to calculate payment</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={calculatePayment}>
                      Retry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
