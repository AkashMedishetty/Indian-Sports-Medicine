"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Input } from '@/conference-backend-core/components/ui/input'
import { Label } from '@/conference-backend-core/components/ui/label'
import { Textarea } from '@/conference-backend-core/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/conference-backend-core/components/ui/select'
import { Alert, AlertDescription } from '@/conference-backend-core/components/ui/alert'
import { Checkbox } from '@/conference-backend-core/components/ui/checkbox'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { StepProgress } from '@/conference-backend-core/components/ui/progress'
import { toast } from 'sonner'
import { FileText, Upload, AlertCircle, CheckCircle, Loader2, Eye, EyeOff, User, MapPin, Lock, Stethoscope, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { Navigation } from '@/conference-backend-core/components/Navigation'
import Link from 'next/link'
import { upload } from '@vercel/blob/client'

const TITLES = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.']
const DESIGNATIONS = ['Consultant', 'PG/Student']

const SUBMITTING_FOR_OPTIONS = [
  { value: 'neurosurgery', label: 'Neurosurgery' },
  { value: 'neurology', label: 'Neurology' }
]

const SUBMISSION_CATEGORY_OPTIONS = [
  { value: 'award-paper', label: 'Award Paper' },
  { value: 'free-paper', label: 'Free Paper' },
  { value: 'poster-presentation', label: 'E-Poster / Poster Presentation' }
]

const NEUROSURGERY_TOPICS = [
  'Skullbase', 'Vascular', 'Neuro Oncology', 'Paediatric Neurosurgery',
  'Spine', 'Functional', 'General Neurosurgery', 'Miscellaneous'
]

const NEUROLOGY_TOPICS = [
  'General Neurology', 'Neuroimmunology', 'Stroke', 'Neuromuscular Disorders',
  'Epilepsy', 'Therapeutics in Neurology', 'Movement Disorders', 'Miscellaneous'
]

export default function SubmitUnregisteredAbstractPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [registrationId, setRegistrationId] = useState('')
  const [abstractId, setAbstractId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationTypes, setRegistrationTypes] = useState<Array<{ value: string; label: string; price: number }>>([])
  
  // Email checking state
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  
  // Field error state for visual feedback
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  
  const [formData, setFormData] = useState({
    title: 'Dr.',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    designation: 'Consultant',
    password: '',
    confirmPassword: '',
    institution: '',
    mciNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    registrationType: '',
    dietaryRequirements: '',
    specialNeeds: '',
    submittingFor: '',
    submissionCategory: '',
    submissionTopic: '',
    abstractTitle: '',
    authors: '',
    abstractContent: '',
    keywords: '',
    agreeTerms: false
  })

  const steps = [
    { label: "Personal Info", completed: step > 1, current: step === 1 },
    { label: "Address & Registration", completed: step > 2, current: step === 2 },
    { label: "Abstract Details", completed: step > 3, current: step === 3 },
  ]

  // Helper to mark field as touched and validate
  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }))
    validateField(fieldName, formData[fieldName as keyof typeof formData])
  }

  // Single field validation
  const validateField = (fieldName: string, value: any): string => {
    let error = ''
    
    switch (fieldName) {
      case 'firstName':
        if (!value?.trim()) error = 'First name is required'
        break
      case 'lastName':
        if (!value?.trim()) error = 'Last name is required'
        break
      case 'email':
        if (!value?.trim()) error = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format'
        else if (emailAvailable === false) error = 'Email already registered'
        break
      case 'phone':
        if (!value?.trim()) error = 'Phone is required'
        else if (!/^[0-9]{10}$/.test(value.replace(/\D/g, ''))) error = 'Must be exactly 10 digits'
        break
      case 'age':
        if (!value?.trim()) error = 'Age is required'
        else {
          const ageNum = parseInt(value)
          if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) error = 'Age must be between 18 and 100'
        }
        break
      case 'institution':
        if (!value?.trim()) error = 'Institution is required'
        break
      case 'mciNumber':
        if (!value?.trim()) error = 'MCI/NMC Number is required'
        break
      case 'password':
        if (!value) error = 'Password is required'
        else if (value.length < 8) error = 'Minimum 8 characters'
        break
      case 'confirmPassword':
        if (!value) error = 'Please confirm password'
        else if (value !== formData.password) error = 'Passwords do not match'
        break
      case 'city':
        if (!value?.trim()) error = 'City is required'
        break
      case 'state':
        if (!value?.trim()) error = 'State is required'
        break
      case 'registrationType':
        if (!value) error = 'Please select registration type'
        break
      case 'submittingFor':
        if (!value) error = 'Please select Neurosurgery or Neurology'
        break
      case 'submissionCategory':
        if (!value) error = 'Please select category'
        break
      case 'submissionTopic':
        if (!value) error = 'Please select topic'
        break
      case 'abstractTitle':
        if (!value?.trim()) error = 'Abstract title is required'
        break
      case 'authors':
        if (!value?.trim()) error = 'Authors are required'
        break
      case 'agreeTerms':
        if (!value) error = 'Please agree to terms'
        break
    }
    
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }))
    return error
  }

  // Update form data and validate
  const updateFormData = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    if (touchedFields[fieldName]) {
      validateField(fieldName, value)
    }
  }

  const getTopicsForSelection = () => {
    if (formData.submittingFor === 'neurosurgery') return NEUROSURGERY_TOPICS
    if (formData.submittingFor === 'neurology') return NEUROLOGY_TOPICS
    return []
  }

  // Cleanup email check timeout on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }
    }
  }, [emailCheckTimeout])

  // Email uniqueness check function
  const checkEmailUniqueness = async (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) return

    setIsCheckingEmail(true)
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      if (!response.ok) {
        console.error('Email check failed:', response.status)
        return
      }

      const result = await response.json()

      if (!result.available) {
        setEmailAvailable(false)
        toast.error('This email is already registered. Please use a different email or sign in.')
      } else {
        setEmailAvailable(true)
      }
    } catch (error) {
      console.error('Email check error:', error)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  // Handle email input change with debounced check
  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email: email.toLowerCase() })
    setEmailAvailable(null)

    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout)
    }

    if (email.includes('@') && email.includes('.')) {
      const timeoutId = setTimeout(() => checkEmailUniqueness(email), 1000)
      setEmailCheckTimeout(timeoutId)
    }
  }

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/abstracts/config')
        const data = await response.json()
        if (data.success) {
          if (!data.data.enableAbstractsWithoutRegistration) {
            toast.error('Abstract submission without registration is not enabled')
            router.push('/abstracts')
            return
          }
        } else {
          toast.error('Failed to load configuration')
          router.push('/abstracts')
          return
        }
        
        const typesResponse = await fetch('/api/admin/registration-types')
        if (typesResponse.ok) {
          const typesResult = await typesResponse.json()
          if (typesResult.success && typesResult.data && typesResult.data.length > 0) {
            setRegistrationTypes(typesResult.data.map((type: any) => ({
              value: type.key,
              label: type.label,
              price: type.price
            })))
          } else {
            setRegistrationTypes(conferenceConfig.registration.categories.map(cat => ({
              value: cat.key,
              label: cat.label,
              price: 0
            })))
          }
        }
      } catch (error) {
        console.error('Failed to load config:', error)
        toast.error('Failed to load configuration')
        router.push('/abstracts')
      } finally {
        setConfigLoading(false)
      }
    }
    fetchConfig()
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const allowedExtensions = ['.doc', '.docx', '.pdf']
      const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
      
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error('Please upload a Word document (.doc, .docx) or PDF (.pdf)')
        return
      }
      
      const maxSize = 4 * 1024 * 1024
      if (selectedFile.size > maxSize) {
        toast.error('File size must be less than 4MB')
        return
      }
      setFile(selectedFile)
    }
  }

  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {}
    let hasErrors = false
    
    // Mark all fields for this step as touched
    const step1Fields = ['firstName', 'lastName', 'email', 'phone', 'age', 'institution', 'mciNumber', 'password', 'confirmPassword']
    const step2Fields = ['city', 'state', 'registrationType']
    const step3Fields = ['submittingFor', 'submissionCategory', 'submissionTopic', 'abstractTitle', 'authors']
    
    const fieldsToValidate = currentStep === 1 ? step1Fields : currentStep === 2 ? step2Fields : step3Fields
    
    // Mark fields as touched
    const newTouched: Record<string, boolean> = {}
    fieldsToValidate.forEach(field => { newTouched[field] = true })
    setTouchedFields(prev => ({ ...prev, ...newTouched }))
    
    switch (currentStep) {
      case 1:
        if (!formData.firstName.trim()) { errors.firstName = 'First name is required'; hasErrors = true }
        if (!formData.lastName.trim()) { errors.lastName = 'Last name is required'; hasErrors = true }
        if (!formData.age.trim()) { errors.age = 'Age is required'; hasErrors = true }
        else {
          const ageNum = parseInt(formData.age)
          if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) { errors.age = 'Age must be between 18 and 100'; hasErrors = true }
        }
        if (!formData.email.trim()) { errors.email = 'Email is required'; hasErrors = true }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { errors.email = 'Invalid email format'; hasErrors = true }
        else if (emailAvailable === false) { errors.email = 'Email already registered'; hasErrors = true }
        else if (emailAvailable === null && formData.email.includes('@') && formData.email.includes('.')) {
          errors.email = 'Verifying email...'
          hasErrors = true
          setTimeout(() => checkEmailUniqueness(formData.email), 100)
        }
        if (!formData.phone.trim()) { errors.phone = 'Phone is required'; hasErrors = true }
        else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) { errors.phone = 'Must be exactly 10 digits'; hasErrors = true }
        if (!formData.institution.trim()) { errors.institution = 'Institution is required'; hasErrors = true }
        if (!formData.mciNumber.trim()) { errors.mciNumber = 'MCI/NMC Number is required'; hasErrors = true }
        if (!formData.password) { errors.password = 'Password is required'; hasErrors = true }
        else if (formData.password.length < 8) { errors.password = 'Minimum 8 characters'; hasErrors = true }
        if (!formData.confirmPassword) { errors.confirmPassword = 'Please confirm password'; hasErrors = true }
        else if (formData.password !== formData.confirmPassword) { errors.confirmPassword = 'Passwords do not match'; hasErrors = true }
        break
        
      case 2:
        if (!formData.city.trim()) { errors.city = 'City is required'; hasErrors = true }
        if (!formData.state.trim()) { errors.state = 'State is required'; hasErrors = true }
        if (!formData.registrationType) { errors.registrationType = 'Please select registration type'; hasErrors = true }
        break
        
      case 3:
        if (!formData.submittingFor) { errors.submittingFor = 'Please select Neurosurgery or Neurology'; hasErrors = true }
        if (!formData.submissionCategory) { errors.submissionCategory = 'Please select category'; hasErrors = true }
        if (!formData.submissionTopic) { errors.submissionTopic = 'Please select topic'; hasErrors = true }
        if (!formData.abstractTitle.trim()) { errors.abstractTitle = 'Abstract title is required'; hasErrors = true }
        if (!formData.authors.trim()) { errors.authors = 'Authors are required'; hasErrors = true }
        if (!file) { errors.file = 'Please upload your abstract document'; hasErrors = true }
        if (!formData.agreeTerms) { errors.agreeTerms = 'Please agree to terms'; hasErrors = true }
        break
    }
    
    setFieldErrors(prev => ({ ...prev, ...errors }))
    
    if (hasErrors) {
      const errorMessages = Object.values(errors).filter(e => e)
      toast.error(`Please fix: ${errorMessages.slice(0, 3).join(', ')}${errorMessages.length > 3 ? '...' : ''}`)
    }
    
    return !hasErrors
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
      toast.success(`Step ${step} completed!`)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(3)) return

    setLoading(true)
    try {
      // Step 1: Upload file to Vercel Blob first (bypasses serverless filesystem limitation)
      let blobUrl = ''
      let fileName = ''
      let fileSize = 0
      let fileType = ''
      
      if (file) {
        toast.info('Uploading file...')
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/abstracts/upload',
          clientPayload: JSON.stringify({ registrationId: '' }) // No registration ID yet
        })
        blobUrl = blob.url
        fileName = file.name
        fileSize = file.size
        fileType = file.type
        toast.info('File uploaded, submitting registration...')
      }

      // Step 2: Submit JSON with blob URL (not FormData with file)
      const submitPayload = {
        // Personal info
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        age: formData.age,
        designation: formData.designation,
        password: formData.password,
        institution: formData.institution,
        mciNumber: formData.mciNumber,
        // Address
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
        // Registration
        registrationType: formData.registrationType,
        dietaryRequirements: formData.dietaryRequirements,
        specialNeeds: formData.specialNeeds,
        // Abstract
        submittingFor: formData.submittingFor,
        submissionCategory: formData.submissionCategory,
        submissionTopic: formData.submissionTopic,
        abstractTitle: formData.abstractTitle,
        authors: formData.authors,
        abstractContent: formData.abstractContent,
        keywords: formData.keywords,
        // File info from Vercel Blob upload
        blobUrl,
        fileName,
        fileSize,
        fileType
      }

      console.log('Submitting form data:', submitPayload)

      const res = await fetch('/api/abstracts/submit-unregistered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload)
      })
      const data = await res.json()
      
      console.log('API response:', data)

      if (data.success) {
        setSubmitted(true)
        setRegistrationId(data.registrationId)
        setAbstractId(data.abstractId)
        toast.success('Registration and abstract submitted successfully!')
      } else {
        toast.error(data.message || 'Failed to submit')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Glass card style
  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.35)',
    boxShadow: '0 25px 50px rgba(30, 58, 95, 0.2), 0 10px 20px rgba(30, 58, 95, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.7)'
  }

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e8eef5 0%, #f0f4f8 25%, #f8f0f5 50%, #f0f4f8 75%, #e8eef5 100%)' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pink-600" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div 
        className="min-h-screen text-gray-800 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #e8eef5 0%, #f0f4f8 25%, #f8f0f5 50%, #f0f4f8 75%, #e8eef5 100%)' }}
      >
        {/* Background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,58,95,0.4) 0%, rgba(30,58,95,0.15) 50%, transparent 70%)', filter: 'blur(100px)' }} />
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '45%', height: '45%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.35) 0%, rgba(236,72,153,0.1) 50%, transparent 70%)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '-15%', right: '5%', width: '55%', height: '55%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,58,95,0.35) 0%, rgba(30,58,95,0.1) 50%, transparent 70%)', filter: 'blur(120px)' }} />
        </div>
        
        <Navigation />
        
        <main className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-8 relative overflow-hidden"
              style={glassCardStyle}
            >
              <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%)' }} />
              
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration & Abstract Submitted!</h2>
                <p className="text-gray-600 mb-6">Your registration and abstract have been submitted successfully.</p>
                
                <div className="bg-white/50 rounded-2xl p-4 mb-4">
                  <p className="text-sm text-gray-500 mb-1">Registration ID</p>
                  <p className="text-xl font-mono font-bold text-gray-900">{registrationId}</p>
                </div>
                
                <div className="bg-white/50 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">Abstract ID</p>
                  <p className="text-xl font-mono font-bold text-gray-900">{abstractId}</p>
                </div>
                
                <Alert className="mb-6 text-left bg-amber-50/80 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Payment Pending:</strong> Your registration is pending payment. Login with your email and password to complete payment.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <Link href="/login" className="block">
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg">
                      Login to Check Status & Pay
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => router.push('/')} className="w-full rounded-xl border-gray-300">
                    Return to Home
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen text-gray-800 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #e8eef5 0%, #f0f4f8 25%, #f8f0f5 50%, #f0f4f8 75%, #e8eef5 100%)' }}
    >
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,58,95,0.4) 0%, rgba(30,58,95,0.15) 50%, transparent 70%)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '45%', height: '45%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.35) 0%, rgba(236,72,153,0.1) 50%, transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '5%', width: '55%', height: '55%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,58,95,0.35) 0%, rgba(30,58,95,0.1) 50%, transparent 70%)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '0%', left: '-5%', width: '40%', height: '40%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(236,72,153,0.08) 50%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>
      
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-pink-100 text-pink-700 border-pink-200">
              <Sparkles className="w-3 h-3 mr-1" />
              New Registration
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
              Register & Submit Abstract
            </h1>
            <p className="text-gray-600 font-medium">
              Complete your registration and submit your abstract for {conferenceConfig.shortName}
            </p>
          </div>

          {/* Step Progress */}
          <div className="mb-8">
            <StepProgress steps={steps} />
          </div>

          {/* Glass Card Form */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-3xl p-8 relative overflow-hidden"
            style={glassCardStyle}
          >
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%)' }} />
            
            <div className="relative z-10">
              <form onSubmit={handleSubmit}>

                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Personal Information</h3>
                        <p className="text-sm text-gray-500">Tell us about yourself</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-gray-700 font-medium">Title *</Label>
                        <Select value={formData.title} onValueChange={(v) => updateFormData('title', v)}>
                          <SelectTrigger className="mt-1 bg-white/70 border-gray-200 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-gray-700 font-medium">First Name *</Label>
                        <Input
                          value={formData.firstName}
                          onChange={(e) => updateFormData('firstName', e.target.value)}
                          onBlur={() => handleFieldBlur('firstName')}
                          placeholder="Enter first name"
                          className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.firstName && fieldErrors.firstName ? 'border-red-500' : ''}`}
                        />
                        {touchedFields.firstName && fieldErrors.firstName && (
                          <p className="text-xs text-red-500 mt-1">{fieldErrors.firstName}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700 font-medium">Last Name *</Label>
                        <Input
                          value={formData.lastName}
                          onChange={(e) => updateFormData('lastName', e.target.value)}
                          onBlur={() => handleFieldBlur('lastName')}
                          placeholder="Enter last name"
                          className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.lastName && fieldErrors.lastName ? 'border-red-500' : ''}`}
                        />
                        {touchedFields.lastName && fieldErrors.lastName && (
                          <p className="text-xs text-red-500 mt-1">{fieldErrors.lastName}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Age *</Label>
                        <Input
                          type="number"
                          value={formData.age}
                          onChange={(e) => updateFormData('age', e.target.value)}
                          onBlur={() => handleFieldBlur('age')}
                          placeholder="Enter age"
                          min="18"
                          max="100"
                          className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.age && fieldErrors.age ? 'border-red-500' : ''}`}
                        />
                        {touchedFields.age && fieldErrors.age && (
                          <p className="text-xs text-red-500 mt-1">{fieldErrors.age}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700 font-medium">Email *</Label>
                        <div className="relative mt-1">
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            placeholder="your.email@example.com"
                            className={`bg-white/70 border-gray-200 rounded-xl pr-10 ${
                              emailAvailable === false ? 'border-red-500 focus:border-red-500' : 
                              emailAvailable === true ? 'border-green-500 focus:border-green-500' : ''
                            }`}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isCheckingEmail && (
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            )}
                            {!isCheckingEmail && emailAvailable === true && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {!isCheckingEmail && emailAvailable === false && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        {emailAvailable === false && (
                          <p className="text-xs text-red-500 mt-1">This email is already registered</p>
                        )}
                        {emailAvailable === true && (
                          <p className="text-xs text-green-500 mt-1">Email is available</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Phone *</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => {
                            // Only allow digits and limit to 10
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                            updateFormData('phone', digits)
                          }}
                          onBlur={() => handleFieldBlur('phone')}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.phone && fieldErrors.phone ? 'border-red-500' : ''}`}
                        />
                        {touchedFields.phone && fieldErrors.phone && (
                          <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700 font-medium">Designation *</Label>
                        <Select value={formData.designation} onValueChange={(v) => updateFormData('designation', v)}>
                          <SelectTrigger className="mt-1 bg-white/70 border-gray-200 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DESIGNATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">MCI/NMC Number *</Label>
                        <Input
                          value={formData.mciNumber}
                          onChange={(e) => updateFormData('mciNumber', e.target.value)}
                          onBlur={() => handleFieldBlur('mciNumber')}
                          placeholder="Enter MCI/NMC registration number"
                          className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.mciNumber && fieldErrors.mciNumber ? 'border-red-500' : ''}`}
                        />
                        {touchedFields.mciNumber && fieldErrors.mciNumber && (
                          <p className="text-xs text-red-500 mt-1">{fieldErrors.mciNumber}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-700 font-medium">Institution/Hospital *</Label>
                      <Input
                        value={formData.institution}
                        onChange={(e) => updateFormData('institution', e.target.value)}
                        onBlur={() => handleFieldBlur('institution')}
                        placeholder="Enter your institution or hospital name"
                        className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.institution && fieldErrors.institution ? 'border-red-500' : ''}`}
                      />
                      {touchedFields.institution && fieldErrors.institution && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.institution}</p>
                      )}
                    </div>

                    {/* Password Section */}
                    <div className="pt-4 border-t border-gray-200/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Lock className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Create Account Password</h4>
                          <p className="text-xs text-gray-500">You'll use this to login and check your status</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-700 font-medium">Password *</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={(e) => updateFormData('password', e.target.value)}
                              onBlur={() => handleFieldBlur('password')}
                              placeholder="Minimum 8 characters"
                              className={`bg-white/70 border-gray-200 rounded-xl pr-10 ${touchedFields.password && fieldErrors.password ? 'border-red-500' : ''}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {touchedFields.password && fieldErrors.password && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-gray-700 font-medium">Confirm Password *</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={formData.confirmPassword}
                              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                              onBlur={() => handleFieldBlur('confirmPassword')}
                              placeholder="Re-enter password"
                              className={`bg-white/70 border-gray-200 rounded-xl pr-10 ${touchedFields.confirmPassword && fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {touchedFields.confirmPassword && fieldErrors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Address & Registration */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Address & Registration</h3>
                        <p className="text-sm text-gray-500">Your address and registration details</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-700 font-medium">Address</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => updateFormData('address', e.target.value)}
                        placeholder="Street address"
                        className="mt-1 bg-white/70 border-gray-200 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700 font-medium">City *</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) => updateFormData('city', e.target.value)}
                          onBlur={() => handleFieldBlur('city')}
                          placeholder="Enter city"
                          className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.city && fieldErrors.city ? 'border-red-500' : ''}`}
                        />
                        {touchedFields.city && fieldErrors.city && (
                          <p className="text-xs text-red-500 mt-1">{fieldErrors.city}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">State *</Label>
                        <Input
                          value={formData.state}
                          onChange={(e) => updateFormData('state', e.target.value)}
                          onBlur={() => handleFieldBlur('state')}
                          placeholder="Enter state"
                          className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.state && fieldErrors.state ? 'border-red-500' : ''}`}
                        />
                        {touchedFields.state && fieldErrors.state && (
                          <p className="text-xs text-red-500 mt-1">{fieldErrors.state}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700 font-medium">Country</Label>
                        <Input
                          value={formData.country}
                          onChange={(e) => updateFormData('country', e.target.value)}
                          placeholder="Country"
                          className="mt-1 bg-white/70 border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Pincode</Label>
                        <Input
                          value={formData.pincode}
                          onChange={(e) => updateFormData('pincode', e.target.value)}
                          placeholder="Enter pincode"
                          className="mt-1 bg-white/70 border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Registration Details */}
                    <div className="pt-4 border-t border-gray-200/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Stethoscope className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Registration Details</h4>
                          <p className="text-xs text-gray-500">Select your registration type</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-700 font-medium">Registration Type *</Label>
                          <Select value={formData.registrationType} onValueChange={(v) => { 
                            updateFormData('registrationType', v)
                            setTouchedFields(prev => ({ ...prev, registrationType: true }))
                            setFieldErrors(prev => ({ ...prev, registrationType: '' })) // Clear error when valid selection made
                          }}>
                            <SelectTrigger className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.registrationType && fieldErrors.registrationType ? 'border-red-500' : ''}`}>
                              <SelectValue placeholder="Select registration type" />
                            </SelectTrigger>
                            <SelectContent>
                              {registrationTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {touchedFields.registrationType && fieldErrors.registrationType && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.registrationType}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-gray-700 font-medium">Dietary Requirements</Label>
                          <Select value={formData.dietaryRequirements} onValueChange={(v) => updateFormData('dietaryRequirements', v)}>
                            <SelectTrigger className="mt-1 bg-white/70 border-gray-200 rounded-xl">
                              <SelectValue placeholder="Select if any" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="vegetarian">Vegetarian</SelectItem>
                              <SelectItem value="vegan">Vegan</SelectItem>
                              <SelectItem value="halal">Halal</SelectItem>
                              <SelectItem value="gluten-free">Gluten Free</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label className="text-gray-700 font-medium">Special Needs / Accessibility Requirements</Label>
                        <Textarea
                          value={formData.specialNeeds}
                          onChange={(e) => updateFormData('specialNeeds', e.target.value)}
                          placeholder="Please mention any special requirements (wheelchair access, hearing assistance, etc.)"
                          rows={2}
                          className="mt-1 bg-white/70 border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}


                {/* Step 3: Abstract Details */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Abstract Details</h3>
                        <p className="text-sm text-gray-500">Submit your abstract for review</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700 font-medium">Submitting Abstract for *</Label>
                        <Select 
                          value={formData.submittingFor} 
                          onValueChange={(v) => { 
                            updateFormData('submittingFor', v)
                            updateFormData('submissionTopic', '')
                            setTouchedFields(prev => ({ ...prev, submittingFor: true }))
                            setFieldErrors(prev => ({ ...prev, submittingFor: '' }))
                          }}
                        >
                          <SelectTrigger className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.submittingFor && fieldErrors.submittingFor ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select Neurosurgery or Neurology" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBMITTING_FOR_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {touchedFields.submittingFor && fieldErrors.submittingFor && (
                          <p className="text-xs text-red-500 mt-1">{fieldErrors.submittingFor}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Submission Category *</Label>
                        <Select 
                          value={formData.submissionCategory} 
                          onValueChange={(v) => { 
                            updateFormData('submissionCategory', v)
                            setTouchedFields(prev => ({ ...prev, submissionCategory: true }))
                            setFieldErrors(prev => ({ ...prev, submissionCategory: '' }))
                          }}
                        >
                          <SelectTrigger className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.submissionCategory && fieldErrors.submissionCategory ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBMISSION_CATEGORY_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {touchedFields.submissionCategory && fieldErrors.submissionCategory && (
                          <p className="text-xs text-red-500 mt-1">{fieldErrors.submissionCategory}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-700 font-medium">Submission Topic *</Label>
                      <Select 
                        value={formData.submissionTopic} 
                        onValueChange={(v) => { 
                          updateFormData('submissionTopic', v)
                          setTouchedFields(prev => ({ ...prev, submissionTopic: true }))
                          setFieldErrors(prev => ({ ...prev, submissionTopic: '' }))
                        }}
                        disabled={!formData.submittingFor}
                      >
                        <SelectTrigger className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.submissionTopic && fieldErrors.submissionTopic ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder={formData.submittingFor ? "Select topic" : "First select Neurosurgery or Neurology"} />
                        </SelectTrigger>
                        <SelectContent>
                          {getTopicsForSelection().map(topic => (
                            <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {touchedFields.submissionTopic && fieldErrors.submissionTopic && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.submissionTopic}</p>
                      )}
                      {formData.submittingFor && !fieldErrors.submissionTopic && (
                        <p className="text-xs text-gray-500 mt-1">
                          Topics for {formData.submittingFor === 'neurosurgery' ? 'Neurosurgery' : 'Neurology'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-700 font-medium">Abstract Title *</Label>
                      <Input
                        value={formData.abstractTitle}
                        onChange={(e) => updateFormData('abstractTitle', e.target.value)}
                        onBlur={() => handleFieldBlur('abstractTitle')}
                        placeholder="Enter your abstract title"
                        className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.abstractTitle && fieldErrors.abstractTitle ? 'border-red-500' : ''}`}
                      />
                      {touchedFields.abstractTitle && fieldErrors.abstractTitle && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.abstractTitle}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-700 font-medium">Authors *</Label>
                      <Input
                        value={formData.authors}
                        onChange={(e) => updateFormData('authors', e.target.value)}
                        onBlur={() => handleFieldBlur('authors')}
                        placeholder="Author 1, Author 2, Author 3 (comma separated)"
                        className={`mt-1 bg-white/70 border-gray-200 rounded-xl ${touchedFields.authors && fieldErrors.authors ? 'border-red-500' : ''}`}
                      />
                      {touchedFields.authors && fieldErrors.authors ? (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.authors}</p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Separate multiple authors with commas</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-700 font-medium">Abstract Content (Optional)</Label>
                      <Textarea
                        value={formData.abstractContent}
                        onChange={(e) => updateFormData('abstractContent', e.target.value)}
                        placeholder="Enter your abstract content (max 200 words)"
                        rows={5}
                        className="mt-1 bg-white/70 border-gray-200 rounded-xl"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.abstractContent.trim() ? 
                          `${formData.abstractContent.trim().split(/\s+/).filter(word => word.length > 0).length}/200 words` : 
                          'Maximum 200 words'
                        }
                      </p>
                    </div>

                    <div>
                      <Label className="text-gray-700 font-medium">Keywords (Optional)</Label>
                      <Input
                        value={formData.keywords}
                        onChange={(e) => updateFormData('keywords', e.target.value)}
                        placeholder="keyword1, keyword2, keyword3"
                        className="mt-1 bg-white/70 border-gray-200 rounded-xl"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
                    </div>

                    {/* File Upload */}
                    <div>
                      <Label className="text-gray-700 font-medium">Upload Abstract Document *</Label>
                      <div className="mt-2">
                        <label 
                          htmlFor="file-upload" 
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer bg-white/50 hover:bg-white/70 hover:border-pink-400 transition-all ${touchedFields.file && fieldErrors.file ? 'border-red-500' : 'border-gray-300'}`}
                        >
                          <input
                            type="file"
                            accept=".doc,.docx,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                          />
                          {file ? (
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              </div>
                              <p className="text-sm font-medium text-green-700">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600 font-medium">Click to upload</p>
                              <p className="text-xs text-gray-400">Word (.doc, .docx) or PDF - Max 4MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                      {touchedFields.file && fieldErrors.file && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.file}</p>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="pt-4 border-t border-gray-200/50">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="terms"
                          checked={formData.agreeTerms}
                          onCheckedChange={(checked) => updateFormData('agreeTerms', checked as boolean)}
                          className={`mt-1 ${touchedFields.agreeTerms && fieldErrors.agreeTerms ? 'border-red-500' : ''}`}
                        />
                        <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                          I agree to the{' '}
                          <Link href="/terms-conditions" className="text-pink-600 hover:underline font-medium" target="_blank">
                            Terms and Conditions
                          </Link>
                          {' '}and{' '}
                          <Link href="/privacy-policy" className="text-pink-600 hover:underline font-medium" target="_blank">
                            Privacy Policy
                          </Link>
                          . I understand that my registration will be pending until payment is completed.
                        </label>
                      </div>
                      {touchedFields.agreeTerms && fieldErrors.agreeTerms && (
                        <p className="text-xs text-red-500 mt-1 ml-7">{fieldErrors.agreeTerms}</p>
                      )}
                    </div>

                    <Alert className="bg-blue-50/80 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        After submission, you can login with your email and password to check your status and complete payment.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200/50">
                  {step > 1 ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleBack}
                      className="rounded-xl border-gray-300 hover:bg-gray-100"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.back()}
                      className="rounded-xl border-gray-300 hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                  )}

                  {step < 3 ? (
                    <Button 
                      type="button" 
                      onClick={handleNext}
                      className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg min-w-[180px]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Register & Submit
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
