"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Input } from "@/conference-backend-core/components/ui/input"
import { Label } from "@/conference-backend-core/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/conference-backend-core/components/ui/select"
import { Textarea } from "@/conference-backend-core/components/ui/textarea"
import { Checkbox } from "@/conference-backend-core/components/ui/checkbox"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { Eye, EyeOff, User, Mail, Phone, Building, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/conference-backend-core/hooks/use-toast"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

export function RegisterForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Personal Information
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    
    // Professional Information
    institution: "",
    registrationType: "",
    membershipNumber: "",
    
    // Address Information
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    
    // Additional Information
    dietaryRequirements: "",
    specialNeeds: "",
    
    // Agreement
    agreeTerms: false,
    agreePrivacy: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const router = useRouter()
  const { toast } = useToast()

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!formData.title) newErrors.title = "Title is required"
      if (!formData.firstName) newErrors.firstName = "First name is required"
      if (!formData.lastName) newErrors.lastName = "Last name is required"
      if (!formData.email) newErrors.email = "Email is required"
      if (!formData.email.includes("@")) newErrors.email = "Please enter a valid email"
      if (!formData.phone) newErrors.phone = "Phone number is required"
      if (!formData.password) newErrors.password = "Password is required"
      if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters"
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    if (currentStep === 2) {
      if (!formData.institution) newErrors.institution = "Institution is required"
      if (!formData.registrationType) newErrors.registrationType = "Registration type is required"
      if (!formData.city) newErrors.city = "City is required"
      if (!formData.country) newErrors.country = "Country is required"
    }

    if (currentStep === 3) {
      if (!formData.agreeTerms) newErrors.agreeTerms = "You must agree to the terms and conditions"
      if (!formData.agreePrivacy) newErrors.agreePrivacy = "You must agree to the privacy policy"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(3)) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          profile: {
            title: formData.title,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            institution: formData.institution,
            address: {
              street: formData.address,
              city: formData.city,
              state: formData.state,
              country: formData.country,
              pincode: formData.pincode
            },
            dietaryRequirements: formData.dietaryRequirements,
            specialNeeds: formData.specialNeeds
          },
          registration: {
            type: formData.registrationType,
            membershipNumber: formData.membershipNumber
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Registration Successful!",
          description: "Your account has been created. Please check your email for confirmation.",
        })
        router.push("/auth/login?message=Registration successful. Please log in.")
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "Something went wrong. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Select value={formData.title} onValueChange={(value) => handleInputChange("title", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dr">Dr.</SelectItem>
              <SelectItem value="prof">Prof.</SelectItem>
              <SelectItem value="mr">Mr.</SelectItem>
              <SelectItem value="mrs">Mrs.</SelectItem>
              <SelectItem value="ms">Ms.</SelectItem>
            </SelectContent>
          </Select>
          {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            placeholder="Enter first name"
          />
          {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name *</Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) => handleInputChange("lastName", e.target.value)}
          placeholder="Enter last name"
        />
        {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Enter email address"
            className="pl-10"
          />
        </div>
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="Enter phone number"
            className="pl-10"
          />
        </div>
        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Create password"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              placeholder="Confirm password"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="institution">Institution/Organization *</Label>
        <div className="relative">
          <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="institution"
            value={formData.institution}
            onChange={(e) => handleInputChange("institution", e.target.value)}
            placeholder="Enter institution or organization"
            className="pl-10"
          />
        </div>
        {errors.institution && <p className="text-sm text-red-500">{errors.institution}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="registrationType">Registration Category *</Label>
        <Select value={formData.registrationType} onValueChange={(value) => handleInputChange("registrationType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select registration category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="regular">Regular Delegate (â‚¹15,000)</SelectItem>
            <SelectItem value="student">Student/Resident (â‚¹8,000)</SelectItem>
            <SelectItem value="international">International Delegate ($300)</SelectItem>
            <SelectItem value="faculty">Faculty Member (â‚¹12,000)</SelectItem>
          </SelectContent>
        </Select>
        {errors.registrationType && <p className="text-sm text-red-500">{errors.registrationType}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="membershipNumber">Membership Number (Optional)</Label>
        <Input
          id="membershipNumber"
          value={formData.membershipNumber}
          onChange={(e) => handleInputChange("membershipNumber", e.target.value)}
          placeholder="Enter membership number if applicable"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            placeholder="Enter full address"
            className="pl-10"
            rows={3}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            placeholder="Enter city"
          />
          {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State/Province</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleInputChange("state", e.target.value)}
            placeholder="Enter state or province"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => handleInputChange("country", e.target.value)}
            placeholder="Enter country"
          />
          {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pincode">PIN Code/ZIP</Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => handleInputChange("pincode", e.target.value)}
            placeholder="Enter PIN/ZIP code"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
        <Textarea
          id="dietaryRequirements"
          value={formData.dietaryRequirements}
          onChange={(e) => handleInputChange("dietaryRequirements", e.target.value)}
          placeholder="Any dietary restrictions or preferences"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialNeeds">Special Needs/Accessibility</Label>
        <Textarea
          id="specialNeeds"
          value={formData.specialNeeds}
          onChange={(e) => handleInputChange("specialNeeds", e.target.value)}
          placeholder="Any special requirements or accessibility needs"
          rows={2}
        />
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-4">Registration Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Name:</span>
            <span>{formData.title} {formData.firstName} {formData.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span>Email:</span>
            <span>{formData.email}</span>
          </div>
          <div className="flex justify-between">
            <span>Institution:</span>
            <span>{formData.institution}</span>
          </div>
          <div className="flex justify-between">
            <span>Registration Type:</span>
            <span>
              {formData.registrationType === "regular" && "Regular Delegate (â‚¹15,000)"}
              {formData.registrationType === "student" && "Student/Resident (â‚¹8,000)"}
              {formData.registrationType === "international" && "International Delegate ($300)"}
              {formData.registrationType === "faculty" && "Faculty Member (â‚¹12,000)"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="agreeTerms"
            checked={formData.agreeTerms}
            onCheckedChange={(checked) => handleInputChange("agreeTerms", checked as boolean)}
          />
          <label htmlFor="agreeTerms" className="text-sm leading-relaxed">
            I agree to the{" "}
            <Link href="/terms-conditions" className="text-[#25406b] hover:underline">
              Terms and Conditions
            </Link>{" "}
            of the ${conferenceConfig.shortName} Conference
          </label>
        </div>
        {errors.agreeTerms && <p className="text-sm text-red-500">{errors.agreeTerms}</p>}

        <div className="flex items-start space-x-2">
          <Checkbox
            id="agreePrivacy"
            checked={formData.agreePrivacy}
            onCheckedChange={(checked) => handleInputChange("agreePrivacy", checked as boolean)}
          />
          <label htmlFor="agreePrivacy" className="text-sm leading-relaxed">
            I agree to the{" "}
            <Link href="/privacy-policy" className="text-[#25406b] hover:underline">
              Privacy Policy
            </Link>{" "}
            and consent to the processing of my personal data
          </label>
        </div>
        {errors.agreePrivacy && <p className="text-sm text-red-500">{errors.agreePrivacy}</p>}
      </div>

      <Alert>
        <AlertDescription>
          After registration, you will receive a confirmation email. Payment can be made later through your dashboard.
        </AlertDescription>
      </Alert>
    </div>
  )

  const stepTitles = [
    "Personal Information",
    "Professional & Address Details",
    "Review & Confirm"
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Register for ${conferenceConfig.shortName}
          </CardTitle>
          <CardDescription className="text-center">
            Step {step} of 3: {stepTitles[step - 1]}
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-[#25406b] to-blue-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isLoading}
                >
                  Previous
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-gradient-to-r from-[#25406b] to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#25406b] to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              )}
            </div>
          </form>

          <div className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link 
              href="/auth/login"
              className="font-medium text-[#25406b] hover:text-[#1d3357] hover:underline"
            >
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}