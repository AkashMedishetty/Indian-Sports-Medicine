"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { useSession, signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Label } from "../../components/ui/label"
import { Checkbox } from "../../components/ui/checkbox"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Navigation } from "../../components/Navigation"
import { Calendar, FileText, Award, Upload, CheckCircle, Bell, Mail, Lock, LogIn, Clock, AlertCircle, UserPlus, User, MapPin, Stethoscope, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, X, Download } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { conferenceConfig } from "../../config/conference.config"
import { upload } from "@vercel/blob/client"

// Constants
const SUBMISSION_CATEGORY_OPTIONS = [
  { value: 'award-paper', label: 'Award Paper' },
  { value: 'free-paper', label: 'Free Paper' },
  { value: 'poster-presentation', label: 'E-Poster' }
]

const TITLES = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.']
const DESIGNATIONS = ['Consultant', 'PG/Student']

type FlowType = 'none' | 'registered' | 'unregistered' | 'final-submission'

// ============ LOGIN MODAL COMPONENT ============
interface LoginModalProps {
  show: boolean
  onClose: () => void
  onSuccess: () => void
}

const LoginModal = memo(function LoginModal({ show, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.ok) {
        toast.success("Login successful!")
        onSuccess()
      } else {
        toast.error(result?.error || "Invalid email or password")
      }
    } catch {
      toast.error("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#25406b]" />
              Login to Submit
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email Address</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[#25406b] hover:bg-[#1d3357]" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login & Continue
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            <Link href="/auth/forgot-password" className="text-[#25406b] hover:underline">
              Forgot password?
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
})

// ============ REGISTERED ABSTRACT FORM COMPONENT ============
interface RegisteredFormProps {
  session: any
  onClose: () => void
  onSuccess: (data: any) => void
  abstractsConfig: any
}

const RegisteredAbstractForm = memo(function RegisteredAbstractForm({ session, onClose, onSuccess, abstractsConfig }: RegisteredFormProps) {
  const [formData, setFormData] = useState({
    submissionCategory: "",
    title: "",
    authors: "",
    abstract: "",
    keywords: "",
    file: null as File | null
  })
  const [isLoading, setIsLoading] = useState(false)

  // Dynamic options from config
  const submissionCategoryOptions = abstractsConfig?.submissionCategories?.filter((o: any) => o.enabled)?.map((o: any) => ({ value: o.key, label: o.label })) || SUBMISSION_CATEGORY_OPTIONS
  const wordLimit = abstractsConfig?.guidelines?.freePaper?.wordLimit || abstractsConfig?.guidelines?.poster?.wordLimit || 250
  const maxFileSizeMB = abstractsConfig?.maxFileSizeMB || 4

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['.doc', '.docx', '.pdf']
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!allowedTypes.includes(ext)) {
        toast.error("Please upload Word documents or PDF files")
        return
      }
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        toast.error(`File size must not exceed ${maxFileSizeMB}MB`)
        return
      }
      setFormData(prev => ({ ...prev, file }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.submissionCategory) {
      toast.error('Please select a submission category')
      return
    }
    if (!formData.title.trim() || !formData.authors.trim()) {
      toast.error('Please enter title and authors')
      return
    }
    if (!formData.file) {
      toast.error('Please upload an abstract file')
      return
    }
    
    setIsLoading(true)
    try {
      toast.info("Uploading file...")
      const blob = await upload(formData.file.name, formData.file, {
        access: 'public',
        handleUploadUrl: '/api/abstracts/upload',
        clientPayload: JSON.stringify({ email: '' })
      })
      
      toast.info("Submitting abstract...")
      const response = await fetch('/api/abstracts/submit-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          blobUrl: blob.url,
          fileName: formData.file.name,
          fileSize: formData.file.size,
          fileType: formData.file.type
        })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success("Abstract submitted successfully!")
        onSuccess(data.data)
      } else {
        toast.error(data.message || "Submission failed")
      }
    } catch {
      toast.error("Submission failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <Card className="bg-white dark:bg-gray-800 shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#25406b]" />
              Submit Your Abstract
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
          {session && <p className="text-sm text-gray-600 dark:text-gray-400">Submitting as: <strong>{session.user?.email}</strong></p>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Submission Category <span className="text-red-500">*</span></Label>
              <Select value={formData.submissionCategory} onValueChange={(v) => setFormData(prev => ({ ...prev, submissionCategory: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {submissionCategoryOptions.map((opt: any) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Abstract Title <span className="text-red-500">*</span></Label>
              <Input placeholder="Enter your abstract title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} className="mt-1" />
            </div>
            
            <div>
              <Label>Authors <span className="text-red-500">*</span></Label>
              <Input placeholder="Author 1, Author 2 (comma separated)" value={formData.authors} onChange={(e) => setFormData(prev => ({ ...prev, authors: e.target.value }))} className="mt-1" />
            </div>
            
            <div>
              <Label>Abstract Content (Optional)</Label>
              <Textarea placeholder={`Enter abstract content (max ${wordLimit} words)`} value={formData.abstract} onChange={(e) => setFormData(prev => ({ ...prev, abstract: e.target.value }))} className="mt-1 min-h-[120px]" />
            </div>
            
            <div>
              <Label>Keywords (Optional)</Label>
              <Input placeholder="keyword1, keyword2" value={formData.keywords} onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))} className="mt-1" />
            </div>
            
            <div>
              <Label>Abstract File <span className="text-red-500">*</span></Label>
              <div className="mt-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#25406b] transition-colors">
                <input type="file" id="registered-file" accept=".doc,.docx,.pdf" onChange={handleFileChange} className="hidden" />
                <label htmlFor="registered-file" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  {formData.file ? (
                    <div>
                      <p className="text-sm font-medium text-green-600">{formData.file.name}</p>
                      <p className="text-xs text-gray-500">{(formData.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload</p>
                      <p className="text-xs text-gray-500">Word (.doc, .docx) or PDF - Max {maxFileSizeMB}MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-[#25406b] hover:bg-[#1d3357]" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" />Submit Abstract</>}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
})


// ============ UNREGISTERED FORM COMPONENT ============
interface UnregisteredFormProps {
  registrationTypes: Array<{ value: string; label: string; price: number }>
  onClose: () => void
  onSuccess: (data: any) => void
  abstractsConfig: any
}

const UnregisteredForm = memo(function UnregisteredForm({ registrationTypes, onClose, onSuccess, abstractsConfig }: UnregisteredFormProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const [formData, setFormData] = useState({
    title: 'Dr.', firstName: '', lastName: '', email: '', phone: '', age: '',
    designation: 'Consultant', password: '', confirmPassword: '', institution: '',
    mciNumber: '', address: '', city: '', state: '', country: 'India', pincode: '',
    registrationType: '', dietaryRequirements: '', specialNeeds: '',
    submissionCategory: '', abstractTitle: '', authors: '',
    abstractContent: '', keywords: '', agreeTerms: false
  })

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimeout) clearTimeout(emailCheckTimeout)
    }
  }, [emailCheckTimeout])

  const checkEmailUniqueness = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setIsCheckingEmail(true)
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })
      if (response.ok) {
        const result = await response.json()
        setEmailAvailable(result.available)
        if (!result.available) toast.error('This email is already registered. Please use a different email or sign in.')
      }
    } catch { /* ignore */ } finally { setIsCheckingEmail(false) }
  }, [])

  // Handle email change with debounced check
  const handleEmailChange = useCallback((email: string) => {
    setFormData(prev => ({ ...prev, email: email.toLowerCase() }))
    setEmailAvailable(null)
    
    // Clear existing timeout
    if (emailCheckTimeout) clearTimeout(emailCheckTimeout)
    
    // Set new debounced check
    if (email.includes('@') && email.includes('.')) {
      const timeoutId = setTimeout(() => checkEmailUniqueness(email), 1000)
      setEmailCheckTimeout(timeoutId)
    }
  }, [emailCheckTimeout, checkEmailUniqueness])

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const wordLimit = abstractsConfig?.guidelines?.freePaper?.wordLimit || abstractsConfig?.guidelines?.poster?.wordLimit || 250
  const maxFileSizeMB = abstractsConfig?.maxFileSizeMB || 4
  const submissionCategoryOptions = abstractsConfig?.submissionCategories?.filter((o: any) => o.enabled)?.map((o: any) => ({ value: o.key, label: o.label })) || SUBMISSION_CATEGORY_OPTIONS

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      if (!['.doc', '.docx', '.pdf'].includes(ext)) {
        toast.error("Please upload Word or PDF files")
        return
      }
      if (f.size > maxFileSizeMB * 1024 * 1024) {
        toast.error(`File size must not exceed ${maxFileSizeMB}MB`)
        return
      }
      setFile(f)
    }
  }

  const validateStep = (s: number): boolean => {
    const errors: Record<string, string> = {}
    let hasErrors = false
    
    if (s === 1) {
      if (!formData.firstName.trim()) { errors.firstName = 'Required'; hasErrors = true }
      if (!formData.lastName.trim()) { errors.lastName = 'Required'; hasErrors = true }
      if (!formData.age.trim()) { errors.age = 'Required'; hasErrors = true }
      if (!formData.email.trim()) { errors.email = 'Required'; hasErrors = true }
      else if (emailAvailable === false) { errors.email = 'Already registered'; hasErrors = true }
      if (!formData.phone.trim() || !/^[0-9]{10}$/.test(formData.phone)) { errors.phone = '10 digits required'; hasErrors = true }
      if (!formData.institution.trim()) { errors.institution = 'Required'; hasErrors = true }
      if (!formData.mciNumber.trim()) { errors.mciNumber = 'Required'; hasErrors = true }
      if (!formData.password || formData.password.length < 8) { errors.password = 'Min 8 chars'; hasErrors = true }
      if (formData.password !== formData.confirmPassword) { errors.confirmPassword = 'No match'; hasErrors = true }
    } else if (s === 2) {
      if (!formData.city.trim()) { errors.city = 'Required'; hasErrors = true }
      if (!formData.state.trim()) { errors.state = 'Required'; hasErrors = true }
      if (!formData.registrationType) { errors.registrationType = 'Required'; hasErrors = true }
    } else if (s === 3) {
      if (!formData.submissionCategory) { errors.submissionCategory = 'Required'; hasErrors = true }
      if (!formData.abstractTitle.trim()) { errors.abstractTitle = 'Required'; hasErrors = true }
      if (!formData.authors.trim()) { errors.authors = 'Required'; hasErrors = true }
      if (!file) { errors.file = 'Required'; hasErrors = true }
      if (!formData.agreeTerms) { errors.agreeTerms = 'Required'; hasErrors = true }
    }
    
    setFieldErrors(errors)
    if (hasErrors) toast.error('Please fill all required fields')
    return !hasErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(3)) return

    setIsLoading(true)
    try {
      let blobUrl = '', fileName = '', fileSize = 0, fileType = ''
      if (file) {
        toast.info('Uploading file...')
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/abstracts/upload',
          clientPayload: JSON.stringify({ registrationId: '' })
        })
        blobUrl = blob.url
        fileName = file.name
        fileSize = file.size
        fileType = file.type
      }

      toast.info('Submitting registration...')
      const res = await fetch('/api/abstracts/submit-unregistered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, blobUrl, fileName, fileSize, fileType })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('Registration and abstract submitted!')
        onSuccess({ registrationId: data.registrationId, abstractId: data.abstractId })
      } else {
        toast.error(data.message || 'Submission failed')
      }
    } catch {
      toast.error('Submission failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { label: "Personal Info", icon: User },
    { label: "Address", icon: MapPin },
    { label: "Abstract", icon: FileText },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <Card className="bg-white dark:bg-gray-800 shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#d4b565]" />
              Register & Submit Abstract
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
          
          {/* Step Progress */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((s, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step > idx + 1 ? 'bg-green-500 border-green-500 text-white' :
                  step === idx + 1 ? 'bg-[#25406b] border-[#25406b] text-white' :
                  'border-gray-300 text-gray-400'
                }`}>
                  {step > idx + 1 ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={`ml-2 text-sm hidden sm:inline ${step === idx + 1 ? 'font-semibold' : 'text-gray-500'}`}>{s.label}</span>
                {idx < steps.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${step > idx + 1 ? 'bg-green-500' : 'bg-gray-300'}`} />}
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Select value={formData.title} onValueChange={(v) => updateField('title', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Label>First Name <span className="text-red-500">*</span></Label>
                    <Input value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder="First name" className={`mt-1 ${fieldErrors.firstName ? 'border-red-500' : ''}`} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Last Name <span className="text-red-500">*</span></Label>
                    <Input value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder="Last name" className={`mt-1 ${fieldErrors.lastName ? 'border-red-500' : ''}`} />
                  </div>
                  <div>
                    <Label>Age <span className="text-red-500">*</span></Label>
                    <Input type="number" value={formData.age} onChange={(e) => updateField('age', e.target.value)} placeholder="Age" min="18" max="100" className={`mt-1 ${fieldErrors.age ? 'border-red-500' : ''}`} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <Input type="email" value={formData.email} onChange={(e) => handleEmailChange(e.target.value)} placeholder="your.email@example.com" className={`pr-10 ${emailAvailable === false ? 'border-red-500' : emailAvailable === true ? 'border-green-500' : ''}`} />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingEmail && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                        {!isCheckingEmail && emailAvailable === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {!isCheckingEmail && emailAvailable === false && <AlertCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                    {emailAvailable === false && <p className="text-xs text-red-500 mt-1">This email is already registered</p>}
                    {emailAvailable === true && <p className="text-xs text-green-500 mt-1">Email is available</p>}
                  </div>
                  <div>
                    <Label>Phone <span className="text-red-500">*</span></Label>
                    <Input value={formData.phone} onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" maxLength={10} className={`mt-1 ${fieldErrors.phone ? 'border-red-500' : ''}`} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Designation</Label>
                    <Select value={formData.designation} onValueChange={(v) => updateField('designation', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{DESIGNATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>MCI/NMC Number <span className="text-red-500">*</span></Label>
                    <Input value={formData.mciNumber} onChange={(e) => updateField('mciNumber', e.target.value)} placeholder="Registration number" className={`mt-1 ${fieldErrors.mciNumber ? 'border-red-500' : ''}`} />
                  </div>
                </div>
                
                <div>
                  <Label>Institution/Hospital <span className="text-red-500">*</span></Label>
                  <Input value={formData.institution} onChange={(e) => updateField('institution', e.target.value)} placeholder="Your institution" className={`mt-1 ${fieldErrors.institution ? 'border-red-500' : ''}`} />
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><Lock className="w-4 h-4" /> Create Password</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Password <span className="text-red-500">*</span></Label>
                      <div className="relative mt-1">
                        <Input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Min 8 characters" className={`pr-10 ${fieldErrors.password ? 'border-red-500' : ''}`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label>Confirm Password <span className="text-red-500">*</span></Label>
                      <div className="relative mt-1">
                        <Input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="Re-enter password" className={`pr-10 ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Step 2: Address & Registration */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Address</Label>
                  <Input value={formData.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Street address" className="mt-1" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City <span className="text-red-500">*</span></Label>
                    <Input value={formData.city} onChange={(e) => updateField('city', e.target.value)} placeholder="City" className={`mt-1 ${fieldErrors.city ? 'border-red-500' : ''}`} />
                  </div>
                  <div>
                    <Label>State <span className="text-red-500">*</span></Label>
                    <Input value={formData.state} onChange={(e) => updateField('state', e.target.value)} placeholder="State" className={`mt-1 ${fieldErrors.state ? 'border-red-500' : ''}`} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Country</Label>
                    <Input value={formData.country} onChange={(e) => updateField('country', e.target.value)} placeholder="Country" className="mt-1" />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input value={formData.pincode} onChange={(e) => updateField('pincode', e.target.value)} placeholder="Pincode" className="mt-1" />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Registration Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Registration Type <span className="text-red-500">*</span></Label>
                      <Select value={formData.registrationType} onValueChange={(v) => updateField('registrationType', v)}>
                        <SelectTrigger className={`mt-1 ${fieldErrors.registrationType ? 'border-red-500' : ''}`}><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>{registrationTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Dietary Requirements</Label>
                      <Select value={formData.dietaryRequirements} onValueChange={(v) => updateField('dietaryRequirements', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select if any" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="halal">Halal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Abstract Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Submission Category <span className="text-red-500">*</span></Label>
                  <Select value={formData.submissionCategory} onValueChange={(v) => updateField('submissionCategory', v)}>
                    <SelectTrigger className={`mt-1 ${fieldErrors.submissionCategory ? 'border-red-500' : ''}`}><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{submissionCategoryOptions.map((opt: any) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Abstract Title <span className="text-red-500">*</span></Label>
                  <Input value={formData.abstractTitle} onChange={(e) => updateField('abstractTitle', e.target.value)} placeholder="Enter your abstract title" className={`mt-1 ${fieldErrors.abstractTitle ? 'border-red-500' : ''}`} />
                </div>
                
                <div>
                  <Label>Authors <span className="text-red-500">*</span></Label>
                  <Input value={formData.authors} onChange={(e) => updateField('authors', e.target.value)} placeholder="Author 1, Author 2 (comma separated)" className={`mt-1 ${fieldErrors.authors ? 'border-red-500' : ''}`} />
                </div>
                
                <div>
                  <Label>Abstract Content (Optional)</Label>
                  <Textarea value={formData.abstractContent} onChange={(e) => updateField('abstractContent', e.target.value)} placeholder={`Enter abstract content (max ${wordLimit} words)`} rows={4} className="mt-1" />
                </div>
                
                <div>
                  <Label>Keywords (Optional)</Label>
                  <Input value={formData.keywords} onChange={(e) => updateField('keywords', e.target.value)} placeholder="keyword1, keyword2" className="mt-1" />
                </div>
                
                <div>
                  <Label>Upload Abstract <span className="text-red-500">*</span></Label>
                  <div className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center hover:border-[#25406b] transition-colors ${fieldErrors.file ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    <input type="file" id="unregistered-file" accept=".doc,.docx,.pdf" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="unregistered-file" className="cursor-pointer">
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      {file ? (
                        <div>
                          <p className="text-sm font-medium text-green-600">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload</p>
                          <p className="text-xs text-gray-500">Word (.doc, .docx) or PDF - Max {maxFileSizeMB}MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 pt-4 border-t">
                  <Checkbox id="terms" checked={formData.agreeTerms} onCheckedChange={(checked) => updateField('agreeTerms', checked as boolean)} />
                  <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                    I agree to the <Link href="/terms-conditions" className="text-[#25406b] hover:underline" target="_blank">Terms</Link> and <Link href="/privacy-policy" className="text-[#25406b] hover:underline" target="_blank">Privacy Policy</Link>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-6 mt-6 border-t">
              {step > 1 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>}
              <div className="flex-1" />
              {step < 3 ? (
                <Button type="button" onClick={() => { if (validateStep(step)) { setStep(step + 1); toast.success(`Step ${step} completed!`) } }} className="bg-[#25406b] hover:bg-[#1d3357]">
                  Next<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Submit</>}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
})


// ============ FINAL SUBMISSION FORM COMPONENT ============
interface FinalSubmissionFormProps {
  session: any
  onClose: () => void
  onSuccess: (data: any) => void
}

const FinalSubmissionForm = memo(function FinalSubmissionForm({ session, onClose, onSuccess }: FinalSubmissionFormProps) {
  const [abstracts, setAbstracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAbstract, setSelectedAbstract] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchAbstracts = async () => {
      try {
        const res = await fetch('/api/abstracts')
        const data = await res.json()
        if (data.success) {
          // Only show accepted abstracts that haven't had final submission
          setAbstracts(data.data.filter((a: any) => a.status === 'accepted' && !a.final?.submittedAt))
        }
      } catch {} finally { setLoading(false) }
    }
    fetchAbstracts()
  }, [])

  const handleSubmit = async () => {
    if (!selectedAbstract || !file) { toast.error('Please select an abstract and upload a file'); return }
    if (file.size > 4.5 * 1024 * 1024) { toast.error('File size must be under 4.5MB. Please compress your file and try again.'); return }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('abstractId', selectedAbstract._id)
      formData.append('file', file)
      formData.append('notes', notes)

      const res = await fetch('/api/abstracts/final-submission', { method: 'POST', body: formData })
      if (!res.ok && res.status === 413) { toast.error('File too large. Please reduce file size to under 4MB.'); setSubmitting(false); return }
      const data = await res.json()
      if (data.success) {
        toast.success('Final presentation submitted successfully!')
        onSuccess({ abstractId: selectedAbstract.abstractId })
      } else {
        toast.error(data.message || 'Submission failed')
      }
    } catch (err) { console.error('Final submission error:', err); toast.error('Submission failed — check your internet connection and try again') } finally { setSubmitting(false) }
  }

  const getApprovedForLabel = (val: string) => val ? val.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Presentation'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <Card className="bg-white dark:bg-gray-800 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="w-5 h-5 text-green-600" />
              Submit Final Presentation
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Submitting as: <strong>{session?.user?.email}</strong></p>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600" /><p className="mt-2 text-gray-500">Loading your accepted abstracts...</p></div>
          ) : abstracts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">No accepted abstracts pending final submission</p>
              <p className="text-sm text-gray-500 mt-1">All your accepted abstracts have already been submitted, or none have been accepted yet.</p>
            </div>
          ) : (
            <>
              {/* Select Abstract */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Accepted Abstract</Label>
                <div className="space-y-2">
                  {abstracts.map(abstract => (
                    <div
                      key={abstract._id}
                      onClick={() => setSelectedAbstract(abstract)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedAbstract?._id === abstract._id ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-green-300'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{abstract.title}</p>
                          <p className="text-xs text-gray-500 mt-1">ID: {abstract.abstractId} • {getApprovedForLabel(abstract.approvedFor || abstract.submissionCategory)}</p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">Accepted</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Download */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2"><Download className="w-4 h-4" /> Presentation Templates</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">Download the official templates for your presentation.</p>
                <div className="flex flex-wrap gap-3">
                  <a href="/Paper Template..pptx" download="Paper Template.pptx" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" /> Paper Template (.pptx)
                  </a>
                  <a href="/Poster Template.pptx" download="Poster Template.pptx" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" /> Poster Template (.pptx)
                  </a>
                </div>
              </div>

              {/* Presentation Guidelines */}
              {selectedAbstract && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3">
                    📋 {(selectedAbstract.approvedFor === 'award-paper' || selectedAbstract.submissionCategory === 'award-paper') ? 'Award (Medal) Paper' : (selectedAbstract.approvedFor?.includes('poster') || selectedAbstract.submissionCategory?.includes('poster') || selectedAbstract.approvedFor === 'e-poster' || selectedAbstract.submissionCategory === 'e-poster') ? 'Poster Presentation' : 'Free Paper'} Guidelines
                  </h4>
                  
                  <div className="space-y-3 text-sm">
                    {(selectedAbstract.approvedFor?.includes('poster') || selectedAbstract.submissionCategory?.includes('poster') || selectedAbstract.approvedFor === 'e-poster' || selectedAbstract.submissionCategory === 'e-poster') ? (
                      <>
                        <div className="bg-white dark:bg-gray-800 rounded p-3 border border-amber-200">
                          <p className="font-semibold text-amber-900 mb-2">Format & Timing</p>
                          <div className="text-amber-800 space-y-1">
                            <div>Presentation: <strong>5 minutes</strong> (PowerPoint, standard mode)</div>
                            <div>Maximum Slides: <strong>3 slides</strong></div>
                          </div>
                          <p className="text-xs text-red-600 mt-2 font-semibold">Exceeding 3 slides may lead to disqualification or penalty.</p>
                        </div>
                        <div>
                          <p className="font-semibold text-amber-900 mb-1">Poster Guidelines</p>
                          <ul className="text-amber-800 text-xs space-y-1">
                            <li>• Poster should include only the author's name</li>
                            <li>• The author name on the poster should be the one presenting</li>
                            <li className="font-semibold">• Institution names must NOT be mentioned anywhere on the poster</li>
                            <li>• Keep content clear, concise, and visually engaging</li>
                            <li>• Ensure originality of work</li>
                            <li>• Be ready before your turn to avoid delays</li>
                          </ul>
                        </div>
                        <p className="text-xs text-red-600 font-semibold">Note: Failure to follow the above guidelines may affect evaluation.</p>
                      </>
                    ) : (
                      <>
                        <div className="bg-white dark:bg-gray-800 rounded p-3 border border-amber-200">
                          <p className="font-semibold text-amber-900 mb-2">Format & Timing</p>
                          <div className="grid grid-cols-2 gap-2 text-amber-800">
                            <div>Presentation: <strong>{(selectedAbstract.approvedFor === 'award-paper' || selectedAbstract.submissionCategory === 'award-paper') ? '8 minutes' : '5 minutes'}</strong></div>
                            <div>Discussion: <strong>2 minutes</strong></div>
                          </div>
                          <p className="text-xs text-amber-600 mt-1">Use the provided template for slide presentation</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded p-3 border border-red-200">
                          <p className="font-semibold text-red-800 mb-1">⏱️ Time Warning</p>
                          <ul className="text-red-700 text-xs space-y-1">
                            <li>• Warning at {(selectedAbstract.approvedFor === 'award-paper' || selectedAbstract.submissionCategory === 'award-paper') ? '7' : '4'} minutes</li>
                            <li>• Stop at {(selectedAbstract.approvedFor === 'award-paper' || selectedAbstract.submissionCategory === 'award-paper') ? '8' : '5'} minutes — strict adherence required</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-amber-900 mb-1">Presentation Instructions</p>
                          <ul className="text-amber-800 text-xs space-y-1">
                            <li>• Begin with greeting and introduction</li>
                            <li>• Clearly state title and objectives</li>
                            <li>• Present key results and conclusion</li>
                            <li>• Keep slides concise and readable</li>
                            <li className="font-semibold">• Paper should include only presenter name; institution name must not be mentioned anywhere in the paper</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-amber-900 mb-1">General Instructions</p>
                          <ul className="text-amber-800 text-xs space-y-1">
                            <li>• Be present 15 minutes early</li>
                            <li>• Submit presentation in advance</li>
                            <li>• Follow moderator instructions</li>
                            <li>• Answer questions from judges briefly and clearly</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Upload Final Presentation</Label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${file ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
                  {file ? (
                    <div>
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Button variant="outline" size="sm" onClick={() => setFile(null)} className="mt-2 text-red-500">Remove</Button>
                    </div>
                  ) : (
                    <div>
                      <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="final-upload" />
                      <label htmlFor="final-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 font-medium">Click to upload your presentation</p>
                        <p className="text-xs text-gray-500 mt-1">Accepted: .ppt, .pptx, .pdf, .doc, .docx (max 4.5MB)</p>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Additional Notes (Optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional information..." rows={3} />
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button onClick={handleSubmit} disabled={!selectedAbstract || !file || submitting} className="flex-1 bg-green-600 hover:bg-green-700">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <><Upload className="w-4 h-4 mr-2" />Submit Final Presentation</>}
                </Button>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
})


// ============ MAIN PAGE COMPONENT ============
export default function AbstractsPage() {
  const { data: session } = useSession()
  
  // Config state
  const [abstractsConfig, setAbstractsConfig] = useState<any>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [registrationTypes, setRegistrationTypes] = useState<Array<{ value: string; label: string; price: number }>>([])

  // Flow state
  const [activeFlow, setActiveFlow] = useState<FlowType>('none')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submissionData, setSubmissionData] = useState<any>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Reminder state
  const [reminderEmail, setReminderEmail] = useState("")
  const [reminderLoading, setReminderLoading] = useState(false)

  useEffect(() => {
    document.title = `Abstract Submission | ${conferenceConfig.shortName}`
  }, [])

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/abstracts/config')
        const data = await response.json()
        if (data.success) setAbstractsConfig(data.data)
        
        const typesResponse = await fetch('/api/admin/registration-types')
        if (typesResponse.ok) {
          const typesResult = await typesResponse.json()
          if (typesResult.success && typesResult.data?.length > 0) {
            setRegistrationTypes(typesResult.data.map((type: any) => ({ value: type.key, label: type.label, price: type.price })))
          } else {
            setRegistrationTypes(conferenceConfig.registration.categories.map(cat => ({ value: cat.key, label: cat.label, price: 0 })))
          }
        }
      } catch { /* ignore */ } finally { setConfigLoading(false) }
    }
    fetchConfig()
  }, [])

  useEffect(() => {
    if (session && (activeFlow === 'registered' || activeFlow === 'final-submission')) {
      setIsAuthenticated(true)
      setShowLoginModal(false)
    }
  }, [session, activeFlow])

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true)
    setShowLoginModal(false)
  }, [])

  const handleFormSuccess = useCallback((data: any) => {
    setSubmissionData(data)
    setIsSubmitted(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setActiveFlow('none')
  }, [])

  const resetAll = useCallback(() => {
    setActiveFlow('none')
    setIsSubmitted(false)
    setSubmissionData(null)
    setIsAuthenticated(false)
    setShowLoginModal(false)
  }, [])

  const handleReminderSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reminderEmail.trim() || !reminderEmail.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }
    setReminderLoading(true)
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: reminderEmail, type: 'abstract-reminder' })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('We\'ll notify you when submissions open!')
        setReminderEmail('')
      } else {
        toast.error(data.message || 'Failed to subscribe')
      }
    } catch { toast.error('An error occurred') } finally { setReminderLoading(false) }
  }

  const submissionsDisabled = !configLoading && abstractsConfig && !abstractsConfig.submissionWindow?.enabled

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center p-8 lg:p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            {activeFlow === 'unregistered' ? 'Registration & Abstract Submitted!' : 'Abstract Submitted Successfully!'}
          </h2>
          
          {submissionData && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1 text-left">
                {submissionData.registrationId && <p><strong>Registration ID:</strong> {submissionData.registrationId}</p>}
                <p><strong>Abstract ID:</strong> {submissionData.abstractId}</p>
              </div>
            </div>
          )}
          
          {activeFlow === 'unregistered' && (
            <Alert className="mb-6 text-left bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Payment Pending:</strong> Login with your email and password to complete payment.
              </AlertDescription>
            </Alert>
          )}
          
          <p className="text-gray-600 dark:text-gray-300 mb-2">Your abstract will be reviewed by our scientific committee.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">ðŸ“§ A confirmation email has been sent.</p>
          
          <div className="flex flex-col gap-3">
            {activeFlow === 'unregistered' ? (
              <Link href="/login" className="w-full"><Button className="w-full bg-green-600 hover:bg-green-700"><LogIn className="w-4 h-4 mr-2" />Login to Check Status & Pay</Button></Link>
            ) : (
              <Link href="/dashboard/abstracts" className="w-full"><Button className="w-full bg-green-600 hover:bg-green-700"><FileText className="w-4 h-4 mr-2" />View My Abstracts</Button></Link>
            )}
            <div className="flex gap-3">
              <Button onClick={resetAll} variant="outline" className="flex-1">Submit Another</Button>
              <Link href="/" className="flex-1"><Button variant="outline" className="w-full">Go Home</Button></Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <LoginModal show={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />

      <div className="pt-24 pb-12">
        {/* Header */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-[#25406b] to-[#152843] text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">Abstract Submission</h1>
              
              <div className="mb-6">
                <motion.div className={`inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full mb-4 ${submissionsDisabled ? 'bg-orange-500/30' : ''}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
                  {submissionsDisabled ? <><Clock className="w-5 h-5 mr-2" /><span className="font-semibold">Coming Soon</span></> : <><CheckCircle className="w-5 h-5 mr-2" /><span className="font-semibold">Now Open</span></>}
                </motion.div>
                
                <p className="text-lg md:text-xl max-w-3xl mx-auto">
                  Submit your research abstracts for Award Paper, Free Paper, and Poster Presentation
                  <br /><span className="text-blue-200">at {conferenceConfig.shortName}, {conferenceConfig.venue.city}</span>
                </p>
              </div>

              {/* Buttons */}
              {!submissionsDisabled && activeFlow === 'none' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-8">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => { if (session) { setActiveFlow('registered'); setIsAuthenticated(true) } else { setActiveFlow('registered'); setShowLoginModal(true) } }} className="px-8 py-6 text-lg bg-white text-[#1d3357] hover:bg-gray-100 rounded-2xl shadow-2xl font-bold">
                      {session ? <><Upload className="w-5 h-5 mr-2" />Submit Your Abstract</> : <><LogIn className="w-5 h-5 mr-2" />Already Registered? Login to Submit</>}
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => { if (session) { setActiveFlow('final-submission'); setIsAuthenticated(true) } else { setActiveFlow('final-submission'); setShowLoginModal(true) } }} className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-2xl font-bold">
                      <Upload className="w-5 h-5 mr-2" />Submit Final Presentation
                    </Button>
                  </motion.div>

                  {!session && abstractsConfig?.enableAbstractsWithoutRegistration && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => setActiveFlow('unregistered')} className="px-8 py-6 text-lg bg-[#ebc975] hover:bg-[#d4b565] text-white rounded-2xl shadow-2xl font-bold">
                        <UserPlus className="w-5 h-5 mr-2" />Submit Abstract & Register Later
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Show final submission button even when submissions are closed */}
              {submissionsDisabled && activeFlow === 'none' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => { if (session) { setActiveFlow('final-submission'); setIsAuthenticated(true) } else { setActiveFlow('final-submission'); setShowLoginModal(true) } }} className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-2xl font-bold">
                      <Upload className="w-5 h-5 mr-2" />Submit Final Presentation
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {session && activeFlow === 'none' && !submissionsDisabled && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-4">
                  <Link href="/dashboard/abstracts"><Button variant="link" className="text-white/80 hover:text-white"><FileText className="w-4 h-4 mr-2" />View My Submitted Abstracts</Button></Link>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>


        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {activeFlow === 'registered' && (session || isAuthenticated) && (
              <RegisteredAbstractForm session={session} onClose={handleCloseForm} onSuccess={handleFormSuccess} abstractsConfig={abstractsConfig} />
            )}
            
            {activeFlow === 'registered' && !session && !isAuthenticated && (
              <div className="max-w-md mx-auto text-center">
                <Card className="bg-white dark:bg-gray-800 shadow-xl">
                  <CardContent className="pt-6">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-[#25406b]" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Login Required</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Please login to submit your abstract</p>
                    <Button onClick={() => setShowLoginModal(true)} className="w-full bg-[#25406b] hover:bg-[#1d3357]"><LogIn className="w-4 h-4 mr-2" />Login Now</Button>
                    <Button variant="link" onClick={() => setActiveFlow('none')} className="mt-2">Go Back</Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeFlow === 'unregistered' && (
              <UnregisteredForm registrationTypes={registrationTypes} onClose={handleCloseForm} onSuccess={handleFormSuccess} abstractsConfig={abstractsConfig} />
            )}

            {activeFlow === 'final-submission' && (session || isAuthenticated) && (
              <FinalSubmissionForm session={session} onClose={handleCloseForm} onSuccess={handleFormSuccess} />
            )}

            {activeFlow === 'final-submission' && !session && !isAuthenticated && (
              <div className="max-w-md mx-auto text-center">
                <Card className="bg-white dark:bg-gray-800 shadow-xl">
                  <CardContent className="pt-6">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Login Required</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Please login to submit your final presentation</p>
                    <Button onClick={() => setShowLoginModal(true)} className="w-full bg-green-600 hover:bg-green-700"><LogIn className="w-4 h-4 mr-2" />Login Now</Button>
                    <Button variant="link" onClick={() => setActiveFlow('none')} className="mt-2">Go Back</Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeFlow === 'none' && submissionsDisabled && (
              <div className="max-w-xl mx-auto">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="pt-6">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-[#25406b]" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center">Get Notified When Submissions Open</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">Enter your email to receive a notification</p>
                    <form onSubmit={handleReminderSignup} className="flex flex-col sm:flex-row gap-3">
                      <Input type="email" placeholder="your.email@example.com" value={reminderEmail} onChange={(e) => setReminderEmail(e.target.value)} className="flex-1" required />
                      <Button type="submit" disabled={reminderLoading} className="bg-[#25406b] hover:bg-[#1d3357]">
                        {reminderLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4 mr-2" />Notify Me</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeFlow === 'none' && !submissionsDisabled && (
              <div className="max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-white">Abstract Submission Guidelines</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Please read the guidelines carefully before submitting</p>
                </motion.div>

                {/* Important Dates - from config */}
                {abstractsConfig?.submissionWindow && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
                  <Card className="bg-gradient-to-r from-[#25406b] to-[#152843] text-white border-0 shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-8 h-8" />
                          <div><h3 className="text-xl font-bold">Important Dates</h3><p className="text-white/80">Mark your calendar!</p></div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 text-center">
                          {abstractsConfig.submissionWindow.start && (
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                              <p className="text-sm text-white/80">Submission Opens</p>
                              <p className="font-bold">{new Date(abstractsConfig.submissionWindow.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          )}
                          {abstractsConfig.submissionWindow.end && (
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                              <p className="text-sm text-white/80">Last Date</p>
                              <p className="font-bold text-yellow-300">{new Date(abstractsConfig.submissionWindow.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          )}
                          {abstractsConfig.daysRemaining > 0 && (
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                              <p className="text-sm text-white/80">Days Remaining</p>
                              <p className="font-bold text-green-300">{abstractsConfig.daysRemaining} days</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                )}

                {/* Quick Rules - from config */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2"><FileText className="w-5 h-5" />Quick Submission Rules</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          `Max ${abstractsConfig?.guidelines?.freePaper?.wordLimit || abstractsConfig?.guidelines?.poster?.wordLimit || 250} words`,
                          'Word format only (.doc/.docx)',
                          'Original, unpublished work only',
                          'Follow submission guidelines carefully'
                        ].map((rule, i) => (
                          <div key={i} className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /><span className="text-sm">{rule}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Categories - from config guidelines */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Award Paper */}
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 shadow-lg h-full">
                      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg text-yellow-800 dark:text-yellow-200"><Award className="w-6 h-6 text-yellow-500" />Award Paper</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="text-sm text-yellow-900/80 dark:text-yellow-100/80 space-y-2">
                          {(abstractsConfig?.guidelines?.freePaper?.requirements?.length > 0
                            ? abstractsConfig.guidelines.freePaper.requirements.slice(0, 4)
                            : ['Original, unpublished work only', 'Abstract must follow guidelines', 'Upload as Word document (.doc/.docx)']
                          ).map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Free Paper */}
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg h-full">
                      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg text-blue-800 dark:text-blue-200"><FileText className="w-6 h-6 text-blue-500" />Free Paper</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="text-sm text-blue-900/80 dark:text-blue-100/80 space-y-2">
                          {(abstractsConfig?.guidelines?.freePaper?.requirements?.length > 0
                            ? abstractsConfig.guidelines.freePaper.requirements.slice(0, 4)
                            : ['Original, unpublished research', 'Not presented at any conference', 'Upload as Word document (.doc/.docx)']
                          ).map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* E-Poster */}
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 shadow-lg h-full">
                      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg text-purple-800 dark:text-purple-200"><Calendar className="w-6 h-6 text-purple-500" />E-Poster</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="text-sm text-purple-900/80 dark:text-purple-100/80 space-y-2">
                          {(abstractsConfig?.guidelines?.poster?.requirements?.length > 0
                            ? abstractsConfig.guidelines.poster.requirements.slice(0, 4)
                            : ['E-poster displayed on LCD screen', 'Follow poster format guidelines', 'Upload as Word document (.doc/.docx)']
                          ).map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* General Guidelines - from config */}
                {abstractsConfig?.guidelines?.general && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
                  <Card className="bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <FileText className="w-6 h-6 mr-3 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">Submission Guidelines</h3>
                          <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">{abstractsConfig.guidelines.general}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                )}

                {/* Important Notice */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <AlertCircle className="w-6 h-6 mr-3 text-red-600 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-3">Important Notice</h3>
                          <ul className="text-red-700 dark:text-red-300 space-y-2 text-sm">
                            <li>• All presenters must register for the conference</li>
                            <li>• Abstracts will be rejected if guidelines are not followed</li>
                            <li>• The Scientific Committee reserves the right to accept/reject any paper</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* CTA */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-10">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <Button onClick={() => { if (session) { setActiveFlow('registered'); setIsAuthenticated(true) } else { setActiveFlow('registered'); setShowLoginModal(true) } }} className="px-10 py-6 text-lg bg-[#25406b] hover:bg-[#1d3357] text-white rounded-full shadow-xl font-bold">
                      {session ? <><Upload className="w-5 h-5 mr-2" />Submit Your Abstract</> : <><LogIn className="w-5 h-5 mr-2" />Login & Submit Abstract</>}
                    </Button>
                    
                    {!session && abstractsConfig?.enableAbstractsWithoutRegistration && (
                      <Button onClick={() => setActiveFlow('unregistered')} variant="outline" className="px-10 py-6 text-lg border-[#ebc975] text-[#d4b565] hover:bg-[#ebc975]/10 rounded-full shadow-xl font-bold">
                        <UserPlus className="w-5 h-5 mr-2" />Register & Submit
                      </Button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
