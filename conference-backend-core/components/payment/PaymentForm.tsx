"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Input } from "@/conference-backend-core/components/ui/input"
import { Label } from "@/conference-backend-core/components/ui/label"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Clock,
  DollarSign,
  Tag,
  Users,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/conference-backend-core/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/conference-backend-core/components/ui/dialog"
import { WorkshopSelectionEditor } from "@/conference-backend-core/components/payment/WorkshopSelectionEditor"
import { AccompanyingPersonsEditor } from "@/conference-backend-core/components/payment/AccompanyingPersonsEditor"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentCalculation {
  registrationFee: number
  gst: number
  workshopFees: number
  accompanyingPersonFees: number
  subtotal: number
  discount: number
  total: number
  currency: string
  breakdown: {
    registrationType: string
    baseAmount: number
    gst: number
    gstPercentage: number
    workshopFees: Array<{
      name: string
      amount: number
    }>
    accompanyingPersonFees: number
    discountsApplied: Array<{
      type: string
      code?: string
      percentage: number
      amount: number
    }>
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
  }
  registration: {
    registrationId: string
    type: string
    status: string
    workshopSelections: string[]
    accompanyingPersons: Array<{
      name: string
      age: number
      relationship: string
    }>
  }
}

export function PaymentForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [userData, setUserData] = useState<UserData | null>(null)
  const [paymentCalculation, setPaymentCalculation] = useState<PaymentCalculation | null>(null)
  const [discountCode, setDiscountCode] = useState("")
  const [isLoadingCalculation, setIsLoadingCalculation] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [error, setError] = useState("")
  const [isWorkshopEditorOpen, setIsWorkshopEditorOpen] = useState(false)
  const [isAccompanyingEditorOpen, setIsAccompanyingEditorOpen] = useState(false)

  useEffect(() => {
    fetchUserData()
    loadRazorpayScript()
  }, [])

  useEffect(() => {
    if (userData) {
      calculatePayment()
    }
  }, [userData, discountCode])

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile")
      const data = await response.json()

      if (data.success) {
        if (data.data.registration.status === "paid") {
          toast({
            title: "Payment Already Completed",
            description: "Your registration payment has already been processed.",
          })
          router.push("/dashboard")
          return
        }
        setUserData(data.data)
      } else {
        setError(data.message || "Failed to fetch user data")
      }
    } catch (error) {
      setError("An error occurred while fetching user data")
      console.error("User data fetch error:", error)
    }
  }

  const calculatePayment = async () => {
    if (!userData) return

    setIsLoadingCalculation(true)
    try {
      const response = await fetch("/api/payment/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          registrationType: userData.registration.type,
          workshopSelections: userData.registration.workshopSelections,
          accompanyingPersons: userData.registration.accompanyingPersons,
          discountCode: discountCode.trim() || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        setPaymentCalculation(data.data)
        setError("")
      } else {
        setError(data.message || "Failed to calculate payment")
      }
    } catch (error) {
      setError("An error occurred while calculating payment")
      console.error("Payment calculation error:", error)
    } finally {
      setIsLoadingCalculation(false)
    }
  }

  const handlePayment = async () => {
    if (!userData || !paymentCalculation) return

    setIsProcessingPayment(true)

    try {
      // Create Razorpay order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: paymentCalculation.total,
          currency: paymentCalculation.currency,
          discountCode: discountCode.trim() || undefined
        })
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create payment order")
      }

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: `${conferenceConfig.shortName} Conference`,
        description: `Registration Payment - ${userData.registration.registrationId}`,
        order_id: orderData.data.id,
        prefill: {
          name: `${userData.profile.title} ${userData.profile.firstName} ${userData.profile.lastName}`,
          email: userData.email,
          contact: userData.profile.phone
        },
        notes: {
          registration_id: userData.registration.registrationId,
          registration_type: userData.registration.type
        },
        theme: {
          color: conferenceConfig.theme.primary // Use theme color from config
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              toast({
                title: "Payment Successful!",
                description: "Your registration has been confirmed. You will receive an email confirmation shortly.",
              })
              router.push("/dashboard?payment=success")
            } else {
              throw new Error(verifyData.message || "Payment verification failed")
            }
          } catch (error) {
            console.error("Payment verification error:", error)
            toast({
              title: "Payment Verification Failed",
              description: "There was an error verifying your payment. Please contact support.",
              variant: "destructive"
            })
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessingPayment(false)
            toast({
              title: "Payment Cancelled",
              description: "You can complete the payment later from your dashboard.",
            })
          }
        }
      }

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during payment.",
        variant: "destructive"
      })
      setIsProcessingPayment(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`
    }
    return `₹${amount.toLocaleString()}`
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Secure your spot at ${conferenceConfig.shortName} Conference
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Registration Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Registration Summary
                </CardTitle>
                <CardDescription>
                  Review your registration details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Registration ID:</span>
                    <Badge variant="outline">{userData.registration.registrationId}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium">
                      {userData.profile.title} {userData.profile.firstName} {userData.profile.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm">{userData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm">{userData.profile.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Institution:</span>
                    <span className="text-sm">{userData.profile.institution}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Registration Type:</span>
                    <span className="text-sm font-medium">
                      {userData.registration.type === "regular" && "Regular Delegate"}
                      {userData.registration.type === "student" && "Student/Resident"}
                      {userData.registration.type === "international" && "International"}
                      {userData.registration.type === "faculty" && "Faculty Member"}
                    </span>
                  </div>
                  
                  {userData.registration.workshopSelections.length > 0 && (
                    <>
                      <div className="text-sm text-gray-600 font-medium">Workshop Selections:</div>
                      {userData.registration.workshopSelections.map((workshop, index) => (
                        <div key={index} className="text-sm ml-4">• {workshop}</div>
                      ))}
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsWorkshopEditorOpen(true)}
                        >
                          Edit Workshops
                        </Button>
                      </div>
                    </>
                  )}
                  {userData.registration.workshopSelections.length === 0 && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsWorkshopEditorOpen(true)}
                      >
                        Select Workshops
                      </Button>
                    </div>
                  )}

                  {userData.registration.accompanyingPersons.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Accompanying Persons:</span>
                      <span className="text-sm font-medium">
                        {userData.registration.accompanyingPersons.length}
                      </span>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAccompanyingEditorOpen(true)}
                    >
                      {userData.registration.accompanyingPersons.length > 0 ? "Edit Accompanying Persons" : "Add Accompanying Persons"}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Discount Code */}
                <div className="space-y-2">
                  <Label htmlFor="discountCode" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Discount Code (Optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="discountCode"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter discount code"
                      disabled={isLoadingCalculation}
                    />
                    <Button
                      variant="outline"
                      onClick={calculatePayment}
                      disabled={isLoadingCalculation}
                    >
                      {isLoadingCalculation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Review payment breakdown and proceed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCalculation ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : paymentCalculation ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Registration Fee:</span>
                        <span className="text-sm">
                          {formatCurrency(paymentCalculation.registrationFee, paymentCalculation.currency)}
                        </span>
                      </div>

                      {(paymentCalculation.gst > 0 || paymentCalculation.breakdown?.gst > 0) && (
                        <div className="flex justify-between">
                          <span className="text-sm">GST (18%):</span>
                          <span className="text-sm">
                            {formatCurrency(paymentCalculation.gst || paymentCalculation.breakdown?.gst || 0, paymentCalculation.currency)}
                          </span>
                        </div>
                      )}

                      {paymentCalculation.workshopFees > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm">Workshop Fees:</span>
                          <span className="text-sm">
                            {formatCurrency(paymentCalculation.workshopFees, paymentCalculation.currency)}
                          </span>
                        </div>
                      )}

                      {paymentCalculation.accompanyingPersonFees > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm">Accompanying Persons:</span>
                          <span className="text-sm">
                            {formatCurrency(paymentCalculation.accompanyingPersonFees, paymentCalculation.currency)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-sm">Subtotal:</span>
                        <span className="text-sm">
                          {formatCurrency(paymentCalculation.subtotal, paymentCalculation.currency)}
                        </span>
                      </div>

                      {paymentCalculation.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span className="text-sm">Discount Applied:</span>
                          <span className="text-sm">
                            -{formatCurrency(paymentCalculation.discount, paymentCalculation.currency)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(paymentCalculation.total, paymentCalculation.currency)}</span>
                    </div>

                    <Separator />

                    {/* Security Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4" />
                      <span>Secure payment powered by Razorpay</span>
                    </div>

                    {/* Payment Button */}
                    <Button
                      onClick={handlePayment}
                      disabled={isProcessingPayment}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      size="lg"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay {formatCurrency(paymentCalculation.total, paymentCalculation.currency)}
                        </>
                      )}
                    </Button>

                    <div className="text-xs text-gray-500 text-center">
                      By proceeding, you agree to our terms and conditions
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    Loading payment details...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Editors */}
          <Dialog open={isWorkshopEditorOpen} onOpenChange={setIsWorkshopEditorOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Workshops</DialogTitle>
              </DialogHeader>
              <WorkshopSelectionEditor
                initialSelections={userData.registration.workshopSelections}
                onUpdated={(newSelections) => {
                  setUserData((prev) => prev ? ({
                    ...prev,
                    registration: { ...prev.registration, workshopSelections: newSelections }
                  }) : prev)
                  // Recalculate with new selections
                  calculatePayment()
                }}
                onClose={() => setIsWorkshopEditorOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isAccompanyingEditorOpen} onOpenChange={setIsAccompanyingEditorOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Accompanying Persons</DialogTitle>
              </DialogHeader>
              <AccompanyingPersonsEditor
                initialPersons={userData.registration.accompanyingPersons}
                onUpdated={(persons) => {
                  setUserData((prev) => prev ? ({
                    ...prev,
                    registration: { ...prev.registration, accompanyingPersons: persons }
                  }) : prev)
                  // Recalculate with new accompanying persons
                  calculatePayment()
                }}
                onClose={() => setIsAccompanyingEditorOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>
    </div>
  )
}