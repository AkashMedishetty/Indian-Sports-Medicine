"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import { 
  FileText, 
  Download, 
  Printer,
  Calendar,
  Building,
  User,
  CreditCard,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { useToast } from "../ui/use-toast"
import { conferenceConfig } from "../../config/conference.config"

interface InvoiceData {
  _id: string
  userId: string
  registrationId: string
  razorpayOrderId: string
  razorpayPaymentId: string
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
  invoiceGenerated: boolean
  invoicePath?: string
  userDetails: {
    title: string
    firstName: string
    lastName: string
    email: string
    phone: string
    institution: string
    address: {
      street: string
      city: string
      state: string
      country: string
      pincode: string
    }
  }
}

interface InvoiceViewerProps {
  invoiceData: InvoiceData
  onDownload?: () => void
}

export function InvoiceViewer({ invoiceData, onDownload }: InvoiceViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const { toast } = useToast()

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`
    }
    return `₹${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/payment/invoice/${invoiceData._id}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${conferenceConfig.shortName}-Invoice-${invoiceData.registrationId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Download Started",
          description: "Your invoice is being downloaded."
        })
        
        if (onDownload) {
          onDownload()
        }
      } else {
        toast({
          title: "Download Failed",
          description: "Unable to download invoice. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while downloading the invoice.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    setIsPrinting(true)
    // Remove print button before printing
    const printButton = document.getElementById('print-button')
    const downloadButton = document.getElementById('download-button')
    
    if (printButton) printButton.style.display = 'none'
    if (downloadButton) downloadButton.style.display = 'none'
    
    window.print()
    
    // Restore buttons after print
    setTimeout(() => {
      if (printButton) printButton.style.display = 'block'
      if (downloadButton) downloadButton.style.display = 'block'
      setIsPrinting(false)
    }, 1000)
  }

  const getRegistrationTypeLabel = (type: string) => {
    switch (type) {
      case "regular": return "Regular Delegate"
      case "student": return "Student/Resident"
      case "international": return "International Delegate"
      case "faculty": return "Faculty Member"
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Invoice #{invoiceData.registrationId}
              </CardTitle>
              <CardDescription>
                Payment receipt for ${conferenceConfig.shortName} Conference
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Paid
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 print:hidden">
            <Button
              id="print-button"
              variant="outline"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            {invoiceData.invoiceGenerated && (
              <Button
                id="download-button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {isDownloading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isDownloading ? "Downloading..." : "Download PDF"}
              </Button>
            )}
          </div>

          {/* Invoice Header */}
          <div className="text-center space-y-2 print:block hidden">
            <h1 className="text-2xl font-bold">{conferenceConfig.shortName} Conference</h1>
            <p className="text-gray-600">{conferenceConfig.name}</p>
            <p className="text-sm text-gray-500">{new Date(conferenceConfig.eventDate.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(conferenceConfig.eventDate.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | {conferenceConfig.venue.city}, {conferenceConfig.venue.state}</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Invoice Details
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-medium">{invoiceData.registrationId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Date:</span>
                    <span>{formatDate(invoiceData.transactionDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-mono text-xs">{invoiceData.razorpayPaymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono text-xs">{invoiceData.razorpayOrderId}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Billing Information
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {invoiceData.userDetails.title} {invoiceData.userDetails.firstName} {invoiceData.userDetails.lastName}
                  </p>
                  <p>{invoiceData.userDetails.email}</p>
                  <p>{invoiceData.userDetails.phone}</p>
                  <p>{invoiceData.userDetails.institution}</p>
                  {invoiceData.userDetails.address && (
                    <div className="pt-1">
                      <p>{invoiceData.userDetails.address.street}</p>
                      <p>
                        {invoiceData.userDetails.address.city}, {invoiceData.userDetails.address.state} {invoiceData.userDetails.address.pincode}
                      </p>
                      <p>{invoiceData.userDetails.address.country}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Registration Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Registration Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Registration Type:</span>
                <span className="font-medium">{getRegistrationTypeLabel(invoiceData.breakdown.registrationType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registration ID:</span>
                <span className="font-medium">{invoiceData.registrationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conference Dates:</span>
                <span>{new Date(conferenceConfig.eventDate.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} - {new Date(conferenceConfig.eventDate.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Venue:</span>
                <span>{conferenceConfig.venue.city}, {conferenceConfig.venue.state}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Breakdown
            </h3>
            
            <div className="space-y-2">
              {/* Registration Fee */}
              <div className="flex justify-between text-sm">
                <span>Registration Fee ({getRegistrationTypeLabel(invoiceData.breakdown.registrationType)}):</span>
                <span>{formatCurrency(invoiceData.breakdown.baseAmount, invoiceData.amount.currency)}</span>
              </div>

              {/* GST */}
              {(invoiceData.breakdown?.gst > 0) && (
                <div className="flex justify-between text-sm">
                  <span>GST (18%):</span>
                  <span>{formatCurrency(invoiceData.breakdown.gst, invoiceData.amount.currency)}</span>
                </div>
              )}

              {/* Workshop Fees */}
              {invoiceData.breakdown.workshopFees.length > 0 && (
                <>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Workshop Fees:</div>
                  {invoiceData.breakdown.workshopFees.map((workshop, index) => (
                    <div key={index} className="flex justify-between text-sm ml-4">
                      <span>• {workshop.name}:</span>
                      <span>{formatCurrency(workshop.amount, invoiceData.amount.currency)}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Accompanying Person Fees */}
              {invoiceData.breakdown.accompanyingPersonFees > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Accompanying Person Fees:</span>
                  <span>{formatCurrency(invoiceData.breakdown.accompanyingPersonFees, invoiceData.amount.currency)}</span>
                </div>
              )}

              {/* Subtotal */}
              <Separator className="my-2" />
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoiceData.amount.total + invoiceData.amount.discount, invoiceData.amount.currency)}</span>
              </div>

              {/* Discounts */}
              {invoiceData.breakdown.discountsApplied.length > 0 && (
                <>
                  <div className="text-sm font-medium text-green-700 dark:text-green-300 pt-2">Discounts Applied:</div>
                  {invoiceData.breakdown.discountsApplied.map((discount, index) => (
                    <div key={index} className="flex justify-between text-sm text-green-600 ml-4">
                      <span>
                        • {discount.type} {discount.code ? `(${discount.code})` : ''} - {discount.percentage}%:
                      </span>
                      <span>-{formatCurrency(discount.amount, invoiceData.amount.currency)}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Total */}
              <Separator className="my-3" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount Paid:</span>
                <span>{formatCurrency(invoiceData.amount.total, invoiceData.amount.currency)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span>Online Payment</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <Badge variant="secondary" className="text-green-600">Completed</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Date:</span>
                <span>{formatDate(invoiceData.transactionDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Currency:</span>
                <span>{invoiceData.amount.currency}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 space-y-1 pt-6 border-t">
            <p>Thank you for registering for ${conferenceConfig.shortName} Conference!</p>
            <p>For any queries, please contact us at {conferenceConfig.contact.email}</p>
            <p className="print:block hidden">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}