"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Label } from "../../../components/ui/label"
import { Checkbox } from "../../../components/ui/checkbox"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Navigation } from "../../../components/Navigation"
import { CheckCircle, Loader2, AlertCircle, Eye, EyeOff, GraduationCap, UserPlus, Lock, CreditCard, Building, FileText, ShieldCheck, XCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { conferenceConfig } from "../../../config/conference.config"
import Script from "next/script"

const TITLES = conferenceConfig.registration.formFields.titles
const RELATIONSHIP_TYPES = conferenceConfig.registration.formFields.relationshipTypes

declare global { interface Window { Razorpay: any } }

interface PaymentConfig {
  gateway: boolean
  bankTransfer: boolean
  bankDetails: {
    accountName?: string; accountNumber?: string; ifscCode?: string
    bankName?: string; branch?: string; qrCodeUrl?: string; upiId?: string
  } | null
}

interface FacultyEntry {
  name: string
  phone: string
}

// Fuzzy name matching — normalize and compare
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)\s*/i, '').replace(/\s+/g, ' ').trim()
}

function fuzzyNameMatch(input: string, csvName: string): boolean {
  const a = normalizeName(input)
  const b = normalizeName(csvName)
  if (!a || a.length < 2) return false // Too short to match
  if (a === b) return true
  // Check if one contains the other (only if input is at least 5 chars)
  if (a.length >= 5 && (a.includes(b) || b.includes(a))) return true
  // Check individual words overlap — require at least 2 matching words
  const aWords = a.split(' ').filter(w => w.length > 1)
  const bWords = b.split(' ').filter(w => w.length > 1)
  if (aWords.length < 2) return false // Need at least first + last name
  const matchCount = aWords.filter(w => bWords.some(bw => bw === w || (w.length > 3 && bw.startsWith(w)) || (bw.length > 3 && w.startsWith(bw)))).length
  if (matchCount >= 2) return true
  return false
}

function verifyFaculty(firstName: string, lastName: string, phone: string, facultyList: FacultyEntry[]): { verified: boolean; matchedName?: string } {
  const fullName = `${firstName} ${lastName}`.trim()
  // First try phone match (strongest signal)
  if (phone && phone.length === 10) {
    const phoneMatch = facultyList.find(f => f.phone === phone)
    if (phoneMatch) return { verified: true, matchedName: phoneMatch.name }
  }
  // Fallback to fuzzy name match
  const nameMatch = facultyList.find(f => fuzzyNameMatch(fullName, f.name))
  if (nameMatch) return { verified: true, matchedName: nameMatch.name }
  return { verified: false }
}

export default function FacultyRegisterPage() {
  const [step, setStep] = useState(1) // 1=form, 2=payment (if needed), 3=success
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submissionData, setSubmissionData] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({ gateway: false, bankTransfer: true, bankDetails: null })
  const [bankTransferUTR, setBankTransferUTR] = useState("")
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [facultyList, setFacultyList] = useState<FacultyEntry[]>([])
  const [facultyVerified, setFacultyVerified] = useState<boolean | null>(null)
  const [facultyMatchedName, setFacultyMatchedName] = useState<string>("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'gateway' | 'bank-transfer' | null>(null)

  const [formData, setFormData] = useState({
    title: "Dr.", firstName: "", lastName: "", email: "", phone: "", age: "",
    password: "", confirmPassword: "",
    institution: "", mciNumber: "", specialization: "",
    address: "", city: "", state: "", country: "India", pincode: "",
    dietaryRequirements: "", specialNeeds: "",
    accompanyingPersons: [] as Array<{ name: string; age: number; relationship: string; dietaryRequirements?: string }>,
    accommodationRequired: false, accommodationRoomType: "" as string,
    accommodationCheckIn: "", accommodationCheckOut: "",
    agreeTerms: false,
  })

  const [priceCalculation, setPriceCalculation] = useState<any>(null)

  const hasAccompanying = formData.accompanyingPersons.length > 0
  const hasAccommodation = formData.accommodationRequired && formData.accommodationRoomType && formData.accommodationCheckIn && formData.accommodationCheckOut
  const needsPayment = hasAccompanying || hasAccommodation
  const totalAmount = priceCalculation?.total || priceCalculation?.finalAmount || 0

  // Load faculty CSV
  useEffect(() => {
    fetch('/data/Untitled spreadsheet - Sheet1 (8).csv')
      .then(r => r.text())
      .then(text => {
        const entries: FacultyEntry[] = text.split('\n').filter(l => l.trim()).map(line => {
          const parts = line.split(',')
          return { name: parts[0]?.trim() || '', phone: parts[1]?.trim() || '' }
        })
        setFacultyList(entries)
      })
      .catch(() => console.error('Failed to load faculty list'))
  }, [])

  // Fetch pricing when needed
  useEffect(() => {
    if (!needsPayment) { setPriceCalculation(null); return }
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/payment/calculate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationType: 'faculty', workshopSelections: [],
            accompanyingPersons: formData.accompanyingPersons,
            accommodation: hasAccommodation ? { roomType: formData.accommodationRoomType, checkIn: formData.accommodationCheckIn, checkOut: formData.accommodationCheckOut } : undefined
          })
        })
        if (res.ok) { const result = await res.json(); if (result.success) setPriceCalculation(result.data) }
      } catch {}
    }
    fetchPrice()
  }, [JSON.stringify(formData.accompanyingPersons), formData.accommodationRequired, formData.accommodationRoomType, formData.accommodationCheckIn, formData.accommodationCheckOut])

  useEffect(() => {
    document.title = `Faculty Registration | ${conferenceConfig.shortName}`
    fetch('/api/admin/settings/payment-methods').then(r => r.json()).then(d => {
      if (d.success && d.data) setPaymentConfig(d.data)
    }).catch(() => {})
    return () => { if (emailCheckTimeout) clearTimeout(emailCheckTimeout) }
  }, [emailCheckTimeout])

  // Auto-verify faculty when name or phone changes
  useEffect(() => {
    if (facultyList.length === 0) return
    if (!formData.firstName.trim() && !formData.phone) { setFacultyVerified(null); return }
    setIsVerifying(true)
    const timer = setTimeout(() => {
      const result = verifyFaculty(formData.firstName, formData.lastName, formData.phone, facultyList)
      setFacultyVerified(result.verified)
      setFacultyMatchedName(result.matchedName || '')
      setIsVerifying(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.firstName, formData.lastName, formData.phone, facultyList])

  const checkEmailUniqueness = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setIsCheckingEmail(true)
    try {
      const res = await fetch("/api/auth/check-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase() }) })
      if (res.ok) { const r = await res.json(); setEmailAvailable(r.available); if (!r.available) toast.error("This email is already registered.") }
    } catch {} finally { setIsCheckingEmail(false) }
  }, [])

  const handleEmailChange = useCallback((email: string) => {
    setFormData(prev => ({ ...prev, email: email.toLowerCase() }))
    setEmailAvailable(null)
    if (emailCheckTimeout) clearTimeout(emailCheckTimeout)
    if (email.includes("@") && email.includes(".")) { const t = setTimeout(() => checkEmailUniqueness(email), 1000); setEmailCheckTimeout(t) }
  }, [emailCheckTimeout, checkEmailUniqueness])

  const updateField = useCallback((field: string, value: any) => { setFormData(prev => ({ ...prev, [field]: value })) }, [])

  const addAccompanyingPerson = () => {
    if (formData.accompanyingPersons.length >= (conferenceConfig.registration.maxAccompanyingPersons || 3)) { toast.error(`Maximum ${conferenceConfig.registration.maxAccompanyingPersons || 3} accompanying persons allowed`); return }
    setFormData(prev => ({ ...prev, accompanyingPersons: [...prev.accompanyingPersons, { name: "", age: 0, relationship: "Spouse" }] }))
  }
  const removeAccompanyingPerson = (index: number) => { setFormData(prev => ({ ...prev, accompanyingPersons: prev.accompanyingPersons.filter((_, i) => i !== index) })) }
  const updateAccompanyingPerson = (index: number, field: string, value: any) => { setFormData(prev => ({ ...prev, accompanyingPersons: prev.accompanyingPersons.map((p, i) => i === index ? { ...p, [field]: value } : p) })) }

  const validateStep1 = (): boolean => {
    if (facultyVerified !== true) { toast.error("Your name/phone could not be verified against the faculty list. Please check your details."); return false }
    if (!formData.firstName.trim() || !formData.lastName.trim()) { toast.error("First and last name are required"); return false }
    if (!formData.email.trim() || emailAvailable === false) { toast.error("Valid email is required"); return false }
    if (!formData.phone.trim() || !/^[0-9]{10}$/.test(formData.phone)) { toast.error("Valid 10-digit phone required"); return false }
    if (!formData.institution.trim()) { toast.error("Institution is required"); return false }
    if (!formData.mciNumber.trim()) { toast.error("MCI/NMC number is required"); return false }
    if (!formData.password || formData.password.length < 8) { toast.error("Password must be at least 8 characters"); return false }
    if (formData.password !== formData.confirmPassword) { toast.error("Passwords do not match"); return false }
    if (!formData.city.trim() || !formData.state.trim()) { toast.error("City and state are required"); return false }
    if (!formData.agreeTerms) { toast.error("Please agree to the terms"); return false }
    for (const p of formData.accompanyingPersons) { if (!p.name.trim()) { toast.error("All accompanying person names are required"); return false } }
    if (formData.accommodationRequired) {
      if (!formData.accommodationRoomType) { toast.error("Please select a room type"); return false }
      if (!formData.accommodationCheckIn) { toast.error("Please select check-in date"); return false }
      if (!formData.accommodationCheckOut) { toast.error("Please select check-out date"); return false }
      if (new Date(formData.accommodationCheckOut) <= new Date(formData.accommodationCheckIn)) { toast.error("Check-out must be after check-in"); return false }
    }
    return true
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep1()) return
    if (needsPayment && paymentConfig.gateway) {
      // Gateway payment — submit directly with Razorpay
      handleGatewayPayment()
    } else if (needsPayment) {
      setStep(2) // Bank transfer step
      window.scrollTo(0, 0)
    } else {
      handleFinalSubmit()
    }
  }

  // Gateway payment flow (Razorpay)
  const handleGatewayPayment = async () => {
    setIsLoading(true)
    try {
      // Check email one more time
      try {
        const emailCheck = await fetch('/api/auth/check-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email.trim().toLowerCase() }) })
        const emailResult = await emailCheck.json()
        if (!emailResult.available) { toast.error("Email already registered."); setIsLoading(false); return }
      } catch {}

      const tempRegId = `T${Date.now().toString(36).toUpperCase()}`

      // Create Razorpay order
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount, currency: priceCalculation?.currency || 'INR',
          registrationId: tempRegId,
          email: formData.email.trim().toLowerCase(),
          name: `${formData.firstName} ${formData.lastName}`
        })
      })
      const orderData = await orderRes.json()
      if (!orderData.success) { toast.error(orderData.message || "Failed to create payment order"); setIsLoading(false); return }

      // Build pending data for after payment
      const pendingData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        profile: {
          title: formData.title, firstName: formData.firstName, lastName: formData.lastName,
          phone: formData.phone, age: parseInt(formData.age) || 0,
          designation: 'Faculty', specialization: formData.specialization,
          institution: formData.institution, mciNumber: formData.mciNumber,
          address: { street: formData.address, city: formData.city, state: formData.state, country: formData.country, pincode: formData.pincode },
          dietaryRequirements: formData.dietaryRequirements, specialNeeds: formData.specialNeeds
        },
        registration: {
          type: 'faculty',
          accompanyingPersons: formData.accompanyingPersons,
          accommodation: hasAccommodation ? { required: true, roomType: formData.accommodationRoomType, checkIn: formData.accommodationCheckIn, checkOut: formData.accommodationCheckOut, nights: priceCalculation?.accommodationNights || 0, totalAmount: priceCalculation?.accommodationFees || 0 } : { required: false }
        },
        payment: { amount: totalAmount, tier: priceCalculation?.currentTier?.name || undefined }
      }

      toast.info("Opening Payment Gateway — complete payment to finish registration")

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: conferenceConfig.shortName,
        description: 'Faculty Registration — Additional Charges',
        order_id: orderData.data.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                pendingRegistration: pendingData
              })
            })
            const verifyResult = await verifyRes.json()
            if (verifyResult.success) {
              setPaymentMethod('gateway')
              setSubmissionData({
                registrationId: verifyResult.data?.registrationId || tempRegId,
                name: `${formData.title} ${formData.firstName} ${formData.lastName}`,
                status: 'paid',
                paymentAmount: totalAmount,
                transactionId: response.razorpay_payment_id
              })
              setIsSubmitted(true)
            } else {
              toast.error(verifyResult.message || "Payment verification failed")
            }
          } catch { toast.error("Payment verification failed. Contact support.") }
          finally { setIsLoading(false) }
        },
        modal: { ondismiss: () => { setIsLoading(false); toast.error("Payment cancelled") } },
        prefill: { name: `${formData.firstName} ${formData.lastName}`, email: formData.email, contact: formData.phone },
        theme: { color: '#25406b' }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error('Gateway payment error:', err)
      toast.error("Payment failed. Please try again.")
      setIsLoading(false)
    }
  }

  // Bank transfer submit (no gateway)
  const handleFinalSubmit = async () => {
    setIsLoading(true)
    try {
      let screenshotUrl = ''
      if (paymentScreenshot) {
        const fd = new FormData()
        fd.append('file', paymentScreenshot)
        const uploadRes = await fetch('/api/upload/payment-screenshot', { method: 'POST', body: fd })
        if (uploadRes.ok) { const ur = await uploadRes.json(); if (ur.success) screenshotUrl = ur.url }
      }

      const response = await fetch("/api/faculty/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          payment: needsPayment ? {
            method: 'bank-transfer', bankTransferUTR, screenshotUrl, amount: totalAmount, status: 'pending'
          } : undefined
        }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success("Faculty registration successful!")
        setSubmissionData(data.data)
        setPaymentMethod(needsPayment ? 'bank-transfer' : null)
        setIsSubmitted(true)
      } else toast.error(data.message || "Registration failed")
    } catch { toast.error("Registration failed. Please try again.") }
    finally { setIsLoading(false) }
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankTransferUTR || bankTransferUTR.length < 12) { toast.error("Please enter a valid 12-digit UTR number"); return }
    if (!paymentScreenshot) { toast.error("Please upload payment screenshot"); return }
    handleFinalSubmit()
  }

  const copyToClipboard = (text: string, label: string) => { navigator.clipboard.writeText(text); toast.success(`${label} copied!`) }

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center p-8 lg:p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Faculty Registration Complete!</h2>
          {submissionData && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1 text-left">
                <p><strong>Registration ID:</strong> {submissionData.registrationId}</p>
                <p><strong>Name:</strong> {submissionData.name}</p>
                <p><strong>Type:</strong> Faculty</p>
                {submissionData.transactionId && <p><strong>Transaction ID:</strong> {submissionData.transactionId}</p>}
                <p><strong>Status:</strong> {paymentMethod === 'gateway' ? 'Paid' : paymentMethod === 'bank-transfer' ? 'Payment Verification Pending' : 'Confirmed'}</p>
              </div>
            </div>
          )}
          {paymentMethod === 'bank-transfer' && (
            <Alert className="mb-6 text-left bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">Your bank transfer details have been submitted. Our team will verify your payment within 10 business days.</AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">📧 A confirmation email has been sent.</p>
          <div className="flex flex-col gap-3">
            <Link href="/auth/login"><Button className="w-full bg-green-600 hover:bg-green-700">Login to Dashboard</Button></Link>
            <Link href="/"><Button variant="outline" className="w-full">Go Home</Button></Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navigation />
      <div className="pt-24 pb-12">
        <section className="py-12 bg-gradient-to-r from-[#25406b] to-[#152843] text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <GraduationCap className="w-5 h-5 mr-2" />
                <span className="font-semibold">Faculty Registration</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Faculty Registration</h1>
              <p className="text-lg text-blue-200 max-w-2xl mx-auto">Complimentary registration for faculty members of {conferenceConfig.shortName}</p>
            </motion.div>
          </div>
        </section>

        {/* Step indicator */}
        {needsPayment && !paymentConfig.gateway && (
          <div className="container mx-auto px-4 mt-6">
            <div className="max-w-3xl mx-auto flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 1 ? 'bg-[#25406b] text-white' : 'bg-green-100 text-green-800'}`}>
                {step > 1 ? <CheckCircle className="w-4 h-4" /> : <span>1</span>} Registration Details
              </div>
              <div className="w-8 h-0.5 bg-gray-300" />
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 2 ? 'bg-[#25406b] text-white' : 'bg-gray-100 text-gray-500'}`}>
                <span>2</span> Payment
              </div>
            </div>
          </div>
        )}

        <section className="py-8">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">

              {/* STEP 1: Registration Form */}
              {step === 1 && (
              <Card className="bg-white dark:bg-gray-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#25406b]" /> Faculty Registration Form</CardTitle>
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Registration is <strong>free</strong> for faculty members. Accompanying persons and hotel accommodation, if any, will be charged separately.
                    </AlertDescription>
                  </Alert>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleNext} className="space-y-6">

                    {/* Faculty Verification Badge */}
                    {(formData.firstName || formData.phone) && (
                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isVerifying ? 'bg-gray-50 border-gray-200' :
                        facultyVerified === true ? 'bg-green-50 border-green-300' :
                        facultyVerified === false ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'
                      }`}>
                        {isVerifying ? (
                          <><Loader2 className="w-5 h-5 animate-spin text-gray-400" /><span className="text-sm text-gray-600">Verifying faculty status...</span></>
                        ) : facultyVerified === true ? (
                          <><ShieldCheck className="w-5 h-5 text-green-600" /><span className="text-sm text-green-800 font-medium">Faculty verified — matched: {facultyMatchedName}</span></>
                        ) : facultyVerified === false ? (
                          <><XCircle className="w-5 h-5 text-red-500" /><span className="text-sm text-red-700">Not found in faculty list. Please check your name and phone number.</span></>
                        ) : null}
                      </div>
                    )}

                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 dark:text-white border-b pb-2">Personal Information</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Select value={formData.title} onValueChange={(v) => updateField("title", v)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>{TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Label>First Name <span className="text-red-500">*</span></Label>
                          <Input value={formData.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="First name" className="mt-1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Last Name <span className="text-red-500">*</span></Label><Input value={formData.lastName} onChange={(e) => updateField("lastName", e.target.value)} placeholder="Last name" className="mt-1" /></div>
                        <div><Label>Age</Label><Input type="number" value={formData.age} onChange={(e) => updateField("age", e.target.value)} placeholder="Age" min="18" max="100" className="mt-1" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Email <span className="text-red-500">*</span></Label>
                          <div className="relative mt-1">
                            <Input type="email" value={formData.email} onChange={(e) => handleEmailChange(e.target.value)} placeholder="email@example.com" className={`pr-10 ${emailAvailable === false ? "border-red-500" : emailAvailable === true ? "border-green-500" : ""}`} />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {isCheckingEmail && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                              {!isCheckingEmail && emailAvailable === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                              {!isCheckingEmail && emailAvailable === false && <AlertCircle className="w-4 h-4 text-red-500" />}
                            </div>
                          </div>
                        </div>
                        <div><Label>Phone <span className="text-red-500">*</span></Label><Input value={formData.phone} onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" maxLength={10} className="mt-1" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Institution <span className="text-red-500">*</span></Label><Input value={formData.institution} onChange={(e) => updateField("institution", e.target.value)} placeholder="Your institution" className="mt-1" /></div>
                        <div><Label>MCI/NMC Number <span className="text-red-500">*</span></Label><Input value={formData.mciNumber} onChange={(e) => updateField("mciNumber", e.target.value)} placeholder="Registration number" className="mt-1" /></div>
                      </div>
                      <div><Label>Specialization</Label><Input value={formData.specialization} onChange={(e) => updateField("specialization", e.target.value)} placeholder="e.g., Hand Surgery" className="mt-1" /></div>
                    </div>

                    {/* Password */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 dark:text-white border-b pb-2 flex items-center gap-2"><Lock className="w-4 h-4" /> Create Password</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Password <span className="text-red-500">*</span></Label>
                          <div className="relative mt-1">
                            <Input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Min 8 characters" className="pr-10" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                          </div>
                        </div>
                        <div>
                          <Label>Confirm Password <span className="text-red-500">*</span></Label>
                          <div className="relative mt-1">
                            <Input type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} placeholder="Re-enter password" className="pr-10" />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 dark:text-white border-b pb-2">Address</h3>
                      <Input value={formData.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Street address" />
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>City <span className="text-red-500">*</span></Label><Input value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" className="mt-1" /></div>
                        <div><Label>State <span className="text-red-500">*</span></Label><Input value={formData.state} onChange={(e) => updateField("state", e.target.value)} placeholder="State" className="mt-1" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input value={formData.country} onChange={(e) => updateField("country", e.target.value)} placeholder="Country" />
                        <Input value={formData.pincode} onChange={(e) => updateField("pincode", e.target.value)} placeholder="Pincode" />
                      </div>
                    </div>

                    {/* Accompanying Persons */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-white">Accompanying Persons</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addAccompanyingPerson}>+ Add Person</Button>
                      </div>
                      <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">⚠️ Accompanying persons are chargeable. {paymentConfig.gateway ? 'You will be redirected to the payment gateway.' : 'Payment details will be collected in the next step.'}</p>
                      {formData.accompanyingPersons.map((person, idx) => (
                        <div key={idx} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">Person {idx + 1}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeAccompanyingPerson(idx)} className="text-red-500 h-8">Remove</Button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1"><Label>Name <span className="text-red-500">*</span></Label><Input value={person.name} onChange={(e) => updateAccompanyingPerson(idx, "name", e.target.value)} placeholder="Full name" className="mt-1" /></div>
                            <div><Label>Age</Label><Input type="number" value={person.age || ""} onChange={(e) => updateAccompanyingPerson(idx, "age", parseInt(e.target.value) || 0)} placeholder="Age" min="0" className="mt-1" /></div>
                            <div><Label>Relationship</Label>
                              <Select value={person.relationship} onValueChange={(v) => updateAccompanyingPerson(idx, "relationship", v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{RELATIONSHIP_TYPES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Hotel Accommodation */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 dark:text-white border-b pb-2">Hotel Accommodation (Optional)</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Book your stay at Novotel HICC, Hyderabad. Check-in: 2:00 PM | Check-out: 12:00 PM. Prices are exclusive of 18% GST.</p>
                      <div className="flex items-center gap-3">
                        <Checkbox id="accommodationRequired" checked={formData.accommodationRequired} onCheckedChange={(checked) => updateField("accommodationRequired", !!checked)} />
                        <label htmlFor="accommodationRequired" className="text-sm font-medium cursor-pointer">I need hotel accommodation</label>
                      </div>
                      {formData.accommodationRequired && (
                        <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div>
                            <Label>Room Type *</Label>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              {(['single', 'sharing'] as const).map(type => (
                                <div key={type} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.accommodationRoomType === type ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`} onClick={() => updateField("accommodationRoomType", type)}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <input type="radio" checked={formData.accommodationRoomType === type} readOnly className="text-blue-600" />
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{type === 'single' ? 'Single Room' : 'Sharing Room'}</span>
                                  </div>
                                  <p className="text-lg font-bold text-blue-600">₹{type === 'single' ? '10,000' : '7,500'} <span className="text-xs font-normal text-gray-500">/ night</span></p>
                                  <p className="text-xs text-gray-500">+ 18% GST</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label>Check-in Date *</Label><Input type="date" value={formData.accommodationCheckIn} onChange={(e) => updateField("accommodationCheckIn", e.target.value)} min="2026-04-23" max="2026-04-26" className="mt-1" /></div>
                            <div><Label>Check-out Date *</Label><Input type="date" value={formData.accommodationCheckOut} onChange={(e) => updateField("accommodationCheckOut", e.target.value)} min={formData.accommodationCheckIn || "2026-04-24"} max="2026-04-27" className="mt-1" /></div>
                          </div>
                          {priceCalculation?.accommodationNights > 0 && (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">{formData.accommodationRoomType === 'single' ? 'Single' : 'Sharing'} × {priceCalculation.accommodationNights} night{priceCalculation.accommodationNights > 1 ? 's' : ''}</span>
                                <span className="font-semibold">₹{priceCalculation.accommodationFees.toLocaleString('en-IN')}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">+ 18% GST will be added</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Dietary & Special Needs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Dietary Requirements</Label>
                        <Select value={formData.dietaryRequirements} onValueChange={(v) => updateField("dietaryRequirements", v)}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select if any" /></SelectTrigger>
                          <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="vegetarian">Vegetarian</SelectItem><SelectItem value="vegan">Vegan</SelectItem><SelectItem value="halal">Halal</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div><Label>Special Needs</Label><Input value={formData.specialNeeds} onChange={(e) => updateField("specialNeeds", e.target.value)} placeholder="Any special requirements" className="mt-1" /></div>
                    </div>

                    {/* Payment Summary (if gateway and needs payment) */}
                    {needsPayment && priceCalculation && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Payment Summary</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span>Faculty Registration:</span><span className="font-medium text-green-600">FREE</span></div>
                          {(priceCalculation.accompanyingPersonFees > 0) && (
                            <div className="flex justify-between"><span>Accompanying Persons ({priceCalculation.accompanyingPersonCount || formData.accompanyingPersons.length}):</span><span className="font-medium">₹{priceCalculation.accompanyingPersonFees.toLocaleString('en-IN')}</span></div>
                          )}
                          {priceCalculation.freeChildrenCount > 0 && (
                            <div className="flex justify-between text-green-600"><span>Children under 10 ({priceCalculation.freeChildrenCount}):</span><span className="font-medium">FREE</span></div>
                          )}
                          {priceCalculation.accommodationFees > 0 && (
                            <div className="flex justify-between"><span>Accommodation:</span><span className="font-medium">₹{priceCalculation.accommodationFees.toLocaleString('en-IN')}</span></div>
                          )}
                          {(priceCalculation.gst > 0) && (
                            <div className="flex justify-between"><span>GST (18%):</span><span className="font-medium">₹{priceCalculation.gst.toLocaleString('en-IN')}</span></div>
                          )}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-bold text-lg"><span>Total:</span><span className="text-[#25406b]">₹{totalAmount.toLocaleString('en-IN')}</span></div>
                          </div>
                          {paymentConfig.gateway && (
                            <div className="flex items-center gap-2 mt-2 text-blue-700 bg-blue-50 p-2 rounded">
                              <CreditCard className="w-4 h-4" />
                              <span className="text-xs font-medium">You will be redirected to Razorpay to complete payment</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Terms */}
                    <div className="flex items-start gap-3 pt-4 border-t">
                      <Checkbox id="terms" checked={formData.agreeTerms} onCheckedChange={(checked) => updateField("agreeTerms", checked as boolean)} />
                      <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                        I agree to the <Link href="/terms-conditions" className="text-[#25406b] hover:underline" target="_blank">Terms</Link> and <Link href="/privacy-policy" className="text-[#25406b] hover:underline" target="_blank">Privacy Policy</Link>
                      </label>
                    </div>

                    <Button type="submit" className="w-full bg-[#25406b] hover:bg-[#1d3357] py-6 text-lg" disabled={isLoading || facultyVerified !== true}>
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                        needsPayment && paymentConfig.gateway ? <><CreditCard className="w-5 h-5 mr-2" />Pay ₹{totalAmount.toLocaleString('en-IN')} & Register</> :
                        needsPayment ? <>Proceed to Payment →</> :
                        <><GraduationCap className="w-5 h-5 mr-2" />Complete Faculty Registration</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              )}

              {/* STEP 2: Bank Transfer Payment (only when gateway is disabled) */}
              {step === 2 && (
              <Card className="bg-white dark:bg-gray-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#25406b]" /> Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    {/* Price Summary */}
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Payment Summary</h3>
                      {priceCalculation ? (
                      <div className="space-y-2">
                        <div className="flex justify-between"><span>Faculty Registration:</span><span className="font-medium text-green-600">FREE</span></div>
                        {(priceCalculation.accompanyingPersonFees > 0) && (
                          <div className="flex justify-between"><span>Accompanying Persons ({priceCalculation.accompanyingPersonCount || formData.accompanyingPersons.length}):</span><span className="font-medium">₹{priceCalculation.accompanyingPersonFees.toLocaleString('en-IN')}</span></div>
                        )}
                        {priceCalculation.freeChildrenCount > 0 && (
                          <div className="flex justify-between text-green-600"><span>Children under 10 ({priceCalculation.freeChildrenCount}):</span><span className="font-medium">FREE</span></div>
                        )}
                        {priceCalculation.accommodationFees > 0 && (
                          <div className="flex justify-between"><span>Accommodation ({priceCalculation.accommodationBreakdown?.roomType === 'single' ? 'Single' : 'Sharing'} × {priceCalculation.accommodationNights} night{priceCalculation.accommodationNights > 1 ? 's' : ''}):</span><span className="font-medium">₹{priceCalculation.accommodationFees.toLocaleString('en-IN')}</span></div>
                        )}
                        {(priceCalculation.gst > 0) && (
                          <div className="flex justify-between"><span>GST (18%):</span><span className="font-medium">₹{priceCalculation.gst.toLocaleString('en-IN')}</span></div>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-bold text-lg"><span>Total Amount:</span><span className="text-[#25406b]">₹{totalAmount.toLocaleString('en-IN')}</span></div>
                        </div>
                      </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Calculating pricing...</div>
                      )}
                    </div>

                    {/* Bank Transfer Details */}
                    <div className="bg-yellow-50 dark:bg-blue-900/20 border border-yellow-200 dark:border-blue-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-yellow-100 mb-4 flex items-center"><Building className="w-5 h-5 mr-2" /> Bank Transfer Payment Details</h3>
                      <div className="space-y-4 text-sm">
                        {paymentConfig.bankDetails?.qrCodeUrl && (
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-yellow-200 text-center">
                            <p className="font-medium text-gray-700 mb-3">Scan QR Code to Pay</p>
                            <img src={paymentConfig.bankDetails.qrCodeUrl} alt="Payment QR Code" className="mx-auto w-48 h-48 border-2 border-gray-300 rounded-lg" />
                            <p className="text-xs text-gray-500 mt-2">Scan with any UPI app</p>
                          </div>
                        )}
                        {paymentConfig.bankDetails?.upiId && (
                          <div className="bg-white p-4 rounded-lg border border-yellow-200">
                            <span className="font-medium text-gray-700 block mb-2">UPI ID:</span>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                              <p className="text-gray-800 font-mono break-all">{paymentConfig.bankDetails.upiId}</p>
                              <button type="button" onClick={() => copyToClipboard(paymentConfig.bankDetails!.upiId!, "UPI ID")} className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-[#25406b] rounded hover:bg-yellow-200">Copy</button>
                            </div>
                          </div>
                        )}
                        {paymentConfig.bankDetails?.accountName && (
                          <div className="bg-white p-4 rounded-lg border border-yellow-200">
                            <span className="font-medium text-gray-700 block mb-2">Account Name:</span>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                              <p className="text-gray-800 font-medium">{paymentConfig.bankDetails.accountName}</p>
                              <button type="button" onClick={() => copyToClipboard(paymentConfig.bankDetails!.accountName!, "Account name")} className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-[#25406b] rounded hover:bg-yellow-200">Copy</button>
                            </div>
                          </div>
                        )}
                        {paymentConfig.bankDetails?.accountNumber && (
                          <div className="bg-white p-4 rounded-lg border border-yellow-200">
                            <span className="font-medium text-gray-700 block mb-2">Account Number:</span>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                              <p className="text-gray-800 font-mono">{paymentConfig.bankDetails.accountNumber}</p>
                              <button type="button" onClick={() => copyToClipboard(paymentConfig.bankDetails!.accountNumber!, "Account number")} className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-[#25406b] rounded hover:bg-yellow-200">Copy</button>
                            </div>
                          </div>
                        )}
                        {paymentConfig.bankDetails?.ifscCode && (
                          <div className="bg-white p-4 rounded-lg border border-yellow-200">
                            <span className="font-medium text-gray-700 block mb-2">IFSC Code:</span>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                              <p className="text-gray-800 font-mono">{paymentConfig.bankDetails.ifscCode}</p>
                              <button type="button" onClick={() => copyToClipboard(paymentConfig.bankDetails!.ifscCode!, "IFSC code")} className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-[#25406b] rounded hover:bg-yellow-200">Copy</button>
                            </div>
                          </div>
                        )}
                        {paymentConfig.bankDetails?.bankName && (
                          <div className="bg-white p-4 rounded-lg border border-yellow-200">
                            <span className="font-medium text-gray-700 block mb-2">Bank Name:</span>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                              <p className="text-gray-800">{paymentConfig.bankDetails.bankName}</p>
                              <button type="button" onClick={() => copyToClipboard(paymentConfig.bankDetails!.bankName!, "Bank name")} className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-[#25406b] rounded hover:bg-yellow-200">Copy</button>
                            </div>
                          </div>
                        )}
                        <div className="border-t border-yellow-200 pt-3 mt-4">
                          <p className="text-blue-800 font-medium">💡 Transfer Amount: ₹{totalAmount.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-[#25406b] mt-1">Please transfer the exact amount and enter the UTR number below</p>
                        </div>
                      </div>
                    </div>

                    {/* UTR Number */}
                    <div>
                      <Label>Bank Transfer UTR Number <span className="text-red-500">*</span></Label>
                      <Input type="text" value={bankTransferUTR} onChange={(e) => setBankTransferUTR(e.target.value)} placeholder="Enter 12-digit UTR number" maxLength={12} className="mt-1" />
                      <p className="text-xs text-gray-500 mt-1">The UTR number is provided by your bank after successful transfer</p>
                    </div>

                    {/* Payment Screenshot */}
                    <div>
                      <Label>Payment Screenshot <span className="text-red-500">*</span></Label>
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center mt-1 ${paymentScreenshot ? 'border-green-400' : 'border-gray-300'}`}>
                        {paymentScreenshot ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 text-green-600"><CheckCircle className="h-5 w-5" /><span className="font-medium">{paymentScreenshot.name}</span></div>
                            <p className="text-xs text-gray-500">{(paymentScreenshot.size / 1024).toFixed(1)} KB</p>
                            <Button type="button" variant="outline" size="sm" onClick={() => setPaymentScreenshot(null)} className="text-red-500">Remove</Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) { if (file.size > 5 * 1024 * 1024) { toast.error("Maximum file size is 5MB"); return }; setPaymentScreenshot(file) }
                            }} className="hidden" id="payment-screenshot" />
                            <label htmlFor="payment-screenshot" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                              <FileText className="h-4 w-4" /><span>Upload Screenshot</span>
                            </label>
                            <p className="text-xs text-gray-500">Upload a screenshot of your payment confirmation (JPEG, PNG, max 5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 justify-between pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => { setStep(1); window.scrollTo(0, 0) }}>← Back to Details</Button>
                      <Button type="submit" className="bg-[#25406b] hover:bg-[#1d3357] py-6 text-lg px-8" disabled={isLoading || !bankTransferUTR || bankTransferUTR.length < 12 || !paymentScreenshot}>
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><GraduationCap className="w-5 h-5 mr-2" />Complete Registration</>}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              )}

            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}
