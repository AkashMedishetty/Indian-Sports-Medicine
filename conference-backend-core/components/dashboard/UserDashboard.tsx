"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/conference-backend-core/components/ui/tabs"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { 
  User, 
  CreditCard, 
  FileText, 
  Calendar, 
  MapPin, 
  Mail,
  Phone,
  Building,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Edit
} from "lucide-react"
import Link from "next/link"
import { RegistrationCard } from "@/conference-backend-core/components/dashboard/RegistrationCard"
import { PaymentStatus } from "@/conference-backend-core/components/dashboard/PaymentStatus"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

interface UserData {
  _id: string
  email: string
  profile: {
    title: string
    firstName: string
    lastName: string
    phone: string
    institution: string
    address: {
      street: string
      city: string
      state: string
      country: string
      pincode: string
    }
    profilePicture?: string
    dietaryRequirements?: string
    specialNeeds?: string
  }
  registration: {
    registrationId: string
    type: string
    status: string
    membershipNumber?: string
    workshopSelections: string[]
    accompanyingPersons: Array<{
      name: string
      age: number
      relationship: string
      dietaryRequirements?: string
    }>
    registrationDate: string
    paymentDate?: string
  }
  role: string
  createdAt: string
}

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

export function UserDashboard() {
  const { data: session } = useSession()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/user/profile")
      const data = await response.json()

      if (data.success) {
        setUserData(data.data)
        
        // Fetch payment data if user exists
        if (data.data) {
          const paymentResponse = await fetch("/api/user/payments")
          const paymentData = await paymentResponse.json()
          if (paymentData.success) {
            setPaymentData(paymentData.payments || [])
          }
        }
      } else {
        setError(data.message || "Failed to fetch user data")
      }
    } catch (error) {
      setError("An error occurred while fetching data")
      console.error("Dashboard error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "cancelled":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
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
        <Alert>
          <AlertDescription>No user data found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {userData.profile.title} {userData.profile.firstName}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your ${conferenceConfig.shortName} registration and profile
            </p>
          </div>
          <Badge 
            className={`${getStatusColor(userData.registration.status)} flex items-center gap-1`}
          >
            {getStatusIcon(userData.registration.status)}
            {userData.registration.status.charAt(0).toUpperCase() + userData.registration.status.slice(1)}
          </Badge>
        </div>
      </motion.div>

      {/* Quick Actions */}
      {userData.registration.status === "pending" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Complete your registration by making the payment.</span>
              <Link href="/dashboard/payment">
                <Button size="sm" className="bg-gradient-to-r from-[#25406b] to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  Pay Now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Registration Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#25406b]" />
                    Registration Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Registration ID:</span>
                      <Badge variant="outline">{userData.registration.registrationId}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium">
                        {userData.registration.type === "regular" && "Regular Delegate"}
                        {userData.registration.type === "student" && "Student/Resident"}
                        {userData.registration.type === "international" && "International"}
                        {userData.registration.type === "faculty" && "Faculty Member"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm">
                        {new Date(userData.registration.registrationDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-500" />
                    Payment Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentStatus 
                    registrationStatus={userData.registration.status}
                    paymentData={paymentData}
                  />
                </CardContent>
              </Card>

              {/* Conference Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#f0f3f8]0" />
                    Conference Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{new Date(conferenceConfig.eventDate.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} - {new Date(conferenceConfig.eventDate.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{conferenceConfig.venue.city}, {conferenceConfig.venue.state}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>
                        {userData.registration.accompanyingPersons.length > 0 
                          ? `${userData.registration.accompanyingPersons.length} accompanying persons`
                          : "No accompanying persons"
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/dashboard/profile">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
              
              {userData.registration.status === "pending" && (
                <Link href="/dashboard/payment">
                  <Button className="w-full flex items-center gap-2 bg-gradient-to-r from-[#25406b] to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    <CreditCard className="h-4 w-4" />
                    Complete Payment
                  </Button>
                </Link>
              )}
              
              {paymentData && paymentData.length > 0 && paymentData[0].invoiceGenerated && (
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Invoice
                </Button>
              )}
              
              <Link href="/program">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  View Program
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="registration">
            <RegistrationCard userData={userData} onUpdate={fetchUserData} />
          </TabsContent>

          <TabsContent value="payment">
            <PaymentStatus 
              registrationStatus={userData.registration.status}
              paymentData={paymentData}
              detailed={true}
            />
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your personal and professional information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>{userData.profile.title} {userData.profile.firstName} {userData.profile.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span>{userData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span>{userData.profile.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Professional Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Institution:</span>
                        <span>{userData.profile.institution}</span>
                      </div>
                      {userData.registration.membershipNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Membership:</span>
                          <span>{userData.registration.membershipNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {userData.profile.address && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address Information
                    </h3>
                    <div className="text-sm">
                      <p>{userData.profile.address.street}</p>
                      <p>
                        {userData.profile.address.city}, {userData.profile.address.state} {userData.profile.address.pincode}
                      </p>
                      <p>{userData.profile.address.country}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Link href="/dashboard/profile">
                    <Button className="bg-gradient-to-r from-[#25406b] to-blue-700 hover:from-blue-700 hover:to-blue-800">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}