"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, XCircle, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Button } from "../ui/button"
import { useToast } from "../ui/use-toast"
import { conferenceConfig } from "../../config/conference.config"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface PaymentDetails {
  _id: string
  amount: {
    total: number
    currency: string
  }
  workshops: Array<{
    workshopName: string
    price: number
  }>
  status: string
}

export function WorkshopPayment() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const paymentId = searchParams.get("paymentId")
  const type = searchParams.get("type")
  
  const [loading, setLoading] = useState(true)
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!paymentId || type !== "workshop-addon") {
      setError("Invalid payment link")
      setLoading(false)
      return
    }

    // Load Razorpay script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => {
      fetchPaymentAndInitiate()
    }
    script.onerror = () => {
      setError("Failed to load payment gateway")
      setLoading(false)
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [paymentId, type])

  const fetchPaymentAndInitiate = async () => {
    try {
      setLoading(true)
      
      // Fetch payment details
      const response = await fetch(`/api/payment/details?paymentId=${paymentId}`)
      if (!response.ok) throw new Error("Failed to fetch payment details")
      
      const data = await response.json()
      if (!data.success) throw new Error(data.message)
      
      setPayment(data.data)
      
      // Auto-initiate payment
      await initiatePayment(data.data)
      
    } catch (err: any) {
      console.error("Payment fetch error:", err)
      setError(err.message || "Failed to load payment details")
      setLoading(false)
    }
  }

  const initiatePayment = async (paymentDetails: PaymentDetails) => {
    try {
      setProcessing(true)
      setLoading(false)
      
      // Create Razorpay order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentDetails.amount.total,
          currency: paymentDetails.amount.currency,
          paymentId: paymentDetails._id
        })
      })

      if (!orderResponse.ok) throw new Error("Failed to create payment order")
      
      const orderData = await orderResponse.json()
      if (!orderData.success) throw new Error(orderData.message)

      // Update payment with order ID
      await fetch(`/api/payment/update-order-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: paymentDetails._id,
          razorpayOrderId: orderData.data.id
        })
      })

      // Open Razorpay dialog
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: conferenceConfig.shortName,
        description: `Workshop Addon Payment`,
        order_id: orderData.data.id,
        handler: async function (response: any) {
          await verifyPayment(response)
        },
        prefill: {
          email: "", // Will be filled from session
          contact: ""
        },
        theme: {
          color: "#2563eb"
        },
        modal: {
          ondismiss: function() {
            setProcessing(false)
            toast({
              title: "Payment Cancelled",
              description: "Redirecting back to dashboard...",
              variant: "destructive"
            })
            // Redirect back to dashboard after cancel
            setTimeout(() => {
              router.push("/dashboard")
            }, 1500)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
      
    } catch (err: any) {
      console.error("Payment initiation error:", err)
      setError(err.message || "Failed to initiate payment")
      setProcessing(false)
      toast({
        title: "Payment Error",
        description: err.message || "Failed to initiate payment",
        variant: "destructive"
      })
    }
  }

  const verifyPayment = async (response: any) => {
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
        setSuccess(true)
        setProcessing(false)
        toast({
          title: "✅ Payment Successful!",
          description: "Your workshop registration has been confirmed.",
        })
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        throw new Error(verifyData.message || "Payment verification failed")
      }
    } catch (err: any) {
      console.error("Payment verification error:", err)
      setProcessing(false)
      toast({
        title: "Verification Failed",
        description: err.message || "Payment verification failed. Please contact support.",
        variant: "destructive"
      })
    }
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle>Payment Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full">
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Loading Payment</CardTitle>
          <CardDescription>Please wait while we prepare your payment...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Initializing secure payment gateway...</p>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle>Payment Successful!</CardTitle>
          </div>
          <CardDescription>Redirecting to your dashboard...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Workshop Registration Confirmed</p>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            Your payment has been processed successfully. You will receive a confirmation email shortly.
          </p>
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  if (processing) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <CardTitle>Processing Payment</CardTitle>
          </div>
          <CardDescription>Complete your payment in the Razorpay window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {payment && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">Workshop Details:</p>
                {payment.workshops.map((workshop, idx) => (
                  <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                    • {workshop.workshopName} - {payment.amount.currency === "USD" ? "$" : "₹"}{workshop.price.toLocaleString()}
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <p className="font-bold text-lg">
                    Total: {payment.amount.currency === "USD" ? "$" : "₹"}{payment.amount.total.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If the payment window didn't open, please disable your popup blocker and try again.
              </p>
              <Button 
                onClick={() => initiatePayment(payment)} 
                variant="outline" 
                className="w-full"
              >
                Retry Payment
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}
