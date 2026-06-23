"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { 
  CreditCard, 
  Download, 
  Receipt, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/conference-backend-core/components/ui/use-toast"

interface PaymentData {
  _id: string
  amount: {
    total: number
    currency: string
    registration: number
    workshops: number
    accompanyingPersons: number
    discount: number
  }
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
  status: string
  transactionDate: string
  razorpayPaymentId: string
  invoiceGenerated: boolean
  invoicePath?: string
}

interface PaymentStatusProps {
  registrationStatus: string
  paymentData: PaymentData[]
  detailed?: boolean
  paymentType?: 'regular' | 'pending' | 'online' | 'bank-transfer' | 'complementary' | 'complimentary' | 'sponsored'
}

export function PaymentStatus({ registrationStatus, paymentData, detailed = false, paymentType }: PaymentStatusProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "failed":
      case "cancelled":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`
    }
    return `â‚¹${amount.toLocaleString()}`
  }

  const handleDownloadInvoice = async (paymentId: string) => {
    setIsDownloading(true)
    try {
      // Open invoice in new window
      const invoiceUrl = `/api/payment/invoice/${paymentId}`
      const newWindow = window.open(invoiceUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
      
      if (newWindow) {
        toast({
          title: "Invoice Opened",
          description: "Your invoice has been opened in a new window. You can print it as PDF."
        })
      } else {
        // Fallback: direct navigation if popup blocked
        window.location.href = invoiceUrl
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while opening the invoice.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const isSpecialPaid = registrationStatus === 'paid' && (paymentType === 'complementary' || paymentType === 'sponsored')

  // Simple view for dashboard overview
  if (!detailed) {
    if (registrationStatus === "pending") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Payment Pending
            </Badge>
          </div>
          <Link href="/dashboard/payment">
            <Button size="sm" className="w-full bg-gradient-to-r from-[#25406b] to-blue-700 hover:from-blue-700 hover:to-blue-800">
              Complete Payment
            </Button>
          </Link>
        </div>
      )
    }

    if (isSpecialPaid) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {paymentType === 'complementary' ? 'Paid (Complimentary)' : 'Paid (Sponsored)'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-medium">â‚¹0</span>
          </div>
        </div>
      )
    }

    if (paymentData.length === 0) {
      return (
        <div className="text-center text-sm text-gray-600">
          No payment information available
        </div>
      )
    }

    const latestPayment = paymentData[0]
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <Badge className={`${getStatusColor(latestPayment.status)} flex items-center gap-1`}>
            {getStatusIcon(latestPayment.status)}
            {latestPayment.status.charAt(0).toUpperCase() + latestPayment.status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="font-medium">
            {formatCurrency(latestPayment.amount?.total || 0, latestPayment.amount?.currency || 'INR')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Date:</span>
          <span className="text-sm">
            {new Date(latestPayment.transactionDate).toLocaleDateString()}
          </span>
        </div>
        {latestPayment.invoiceGenerated && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => handleDownloadInvoice(latestPayment._id)}
            disabled={isDownloading}
          >
            <Download className="h-3 w-3 mr-1" />
            {isDownloading ? "Downloading..." : "Download Invoice"}
          </Button>
        )}
      </div>
    )
  }

  // Detailed view for payment tab
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {isSpecialPaid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {paymentType === 'complementary' ? 'Complimentary Registration' : 'Sponsored Registration'}
            </CardTitle>
            <CardDescription>This registration has been paid with a zero amount.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Paid
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-lg font-semibold">â‚¹0</span>
            </div>
          </CardContent>
        </Card>
      )}
      {registrationStatus === "pending" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Payment is required to complete your registration.</span>
            <Link href="/dashboard/payment">
              <Button size="sm" className="bg-gradient-to-r from-[#25406b] to-blue-700 hover:from-blue-700 hover:to-blue-800">
                Pay Now
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {paymentData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payment Records</h3>
            <p className="text-gray-600 mb-4">
              {registrationStatus === "pending" 
                ? "Complete your payment to secure your conference registration." 
                : "No payment information is available."
              }
            </p>
            {registrationStatus === "pending" && (
              <Link href="/dashboard/payment">
                <Button className="bg-gradient-to-r from-[#25406b] to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  Make Payment
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentData.map((payment, index) => (
            <Card key={payment._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-green-500" />
                      Payment #{index + 1}
                    </CardTitle>
                    <CardDescription>
                      Transaction ID: {payment.razorpayPaymentId}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(payment.status)} flex items-center gap-1`}>
                    {getStatusIcon(payment.status)}
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Payment Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Amount Paid:</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(payment.amount?.total || 0, payment.amount?.currency || 'INR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payment Date:</span>
                      <span className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(payment.transactionDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Method:</span>
                      <span className="text-sm">Online Payment</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Registration Type:</span>
                      <span className="text-sm capitalize">
                        {payment.breakdown?.registrationType?.replace('-', ' ') || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Currency:</span>
                      <span className="text-sm">{payment.amount?.currency || 'INR'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Invoice:</span>
                      <span className="text-sm">
                        {payment.invoiceGenerated ? "Generated" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment Breakdown
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Registration Fee:</span>
                      <span className="text-sm">
                        {formatCurrency(payment.breakdown?.baseAmount || 0, payment.amount?.currency || 'INR')}
                      </span>
                    </div>

                    {payment.breakdown?.gst > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm">GST (18%):</span>
                        <span className="text-sm">
                          {formatCurrency(payment.breakdown?.gst || 0, payment.amount?.currency || 'INR')}
                        </span>
                      </div>
                    )}

                    {payment.breakdown?.workshopFees?.length > 0 && (
                      <>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Workshops:</div>
                        {payment.breakdown?.workshopFees?.map((workshop, idx) => (
                          <div key={idx} className="flex justify-between ml-4">
                            <span className="text-sm text-gray-600">â€¢ {workshop.name}:</span>
                            <span className="text-sm">
                              {formatCurrency(workshop.amount, payment.amount?.currency || 'INR')}
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    {payment.breakdown?.accompanyingPersonFees > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm">Accompanying Persons:</span>
                        <span className="text-sm">
                          {formatCurrency(payment.breakdown?.accompanyingPersonFees || 0, payment.amount?.currency || 'INR')}
                        </span>
                      </div>
                    )}

                    {payment.breakdown?.discountsApplied?.length > 0 && (
                      <>
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">Discounts Applied:</div>
                        {payment.breakdown?.discountsApplied?.map((discount, idx) => (
                          <div key={idx} className="flex justify-between ml-4">
                            <span className="text-sm text-green-600">
                              â€¢ {discount.type} {discount.code ? `(${discount.code})` : ''} - {discount.percentage}%:
                            </span>
                            <span className="text-sm text-green-600">
                              -{formatCurrency(discount.amount, payment.amount?.currency || 'INR')}
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(payment.amount?.total || 0, payment.amount?.currency || 'INR')}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  {payment.invoiceGenerated && (
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadInvoice(payment._id)}
                      disabled={isDownloading}
                      className="flex items-center gap-2"
                    >
                      {isDownloading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {isDownloading ? "Downloading..." : "Download Invoice"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}