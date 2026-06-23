"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Input } from "@/conference-backend-core/components/ui/input"
import { Label } from "@/conference-backend-core/components/ui/label"
import { Textarea } from "@/conference-backend-core/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/conference-backend-core/components/ui/select"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/conference-backend-core/components/ui/avatar"
import { 
  User, 
  Building, 
  MapPin, 
  Phone, 
  Mail,
  Save,
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/conference-backend-core/components/ui/use-toast"

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
  }
  role: string
  createdAt: string
}

export function ProfileForm() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    phone: "",
    institution: "",
    membershipNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      pincode: ""
    },
    dietaryRequirements: "",
    specialNeeds: ""
  })

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
        setFormData({
          title: data.data.profile.title || "",
          firstName: data.data.profile.firstName || "",
          lastName: data.data.profile.lastName || "",
          phone: data.data.profile.phone || "",
          institution: data.data.profile.institution || "",
          membershipNumber: data.data.registration.membershipNumber || "",
          address: {
            street: data.data.profile.address?.street || "",
            city: data.data.profile.address?.city || "",
            state: data.data.profile.address?.state || "",
            country: data.data.profile.address?.country || "",
            pincode: data.data.profile.address?.pincode || ""
          },
          dietaryRequirements: data.data.profile.dietaryRequirements || "",
          specialNeeds: data.data.profile.specialNeeds || ""
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch profile data",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Profile fetch error:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching profile data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    }
    if (!formData.institution.trim()) {
      newErrors.institution = "Institution is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("address.")) {
      const addressField = field.split(".")[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profile: {
            title: formData.title,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            institution: formData.institution,
            address: formData.address,
            dietaryRequirements: formData.dietaryRequirements,
            specialNeeds: formData.specialNeeds
          },
          registration: {
            membershipNumber: formData.membershipNumber
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated."
        })
        // Refresh user data
        fetchUserData()
      } else {
        toast({
          title: "Update Failed",
          description: data.message || "Failed to update profile",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating your profile",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const response = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated successfully."
        })
        // Refresh user data to show new avatar
        fetchUserData()
      } else {
        toast({
          title: "Upload Failed",
          description: data.message || "Failed to upload avatar",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Error",
        description: "An error occurred while uploading your avatar",
        variant: "destructive"
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!userData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load profile data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  const canEdit = userData.registration.status !== "paid" || true // Allow profile edits even after payment

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#25406b]" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Upload a profile picture for your conference badge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={userData.profile.profilePicture} 
                  alt={`${userData.profile.firstName} ${userData.profile.lastName}`} 
                />
                <AvatarFallback className="text-lg">
                  {userData.profile.firstName[0]}{userData.profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                    disabled={isUploadingAvatar}
                    className="flex items-center gap-2"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploadingAvatar ? "Uploading..." : "Upload Picture"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Recommended: Square image, max 5MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#25406b]" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your basic personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Select 
                  value={formData.title} 
                  onValueChange={(value) => handleInputChange("title", value)}
                  disabled={!canEdit}
                >
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter first name"
                  disabled={!canEdit}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter last name"
                  disabled={!canEdit}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    disabled
                    className="pl-10 bg-gray-50 dark:bg-gray-800"
                  />
                </div>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
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
                    disabled={!canEdit}
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-[#25406b]" />
              Professional Information
            </CardTitle>
            <CardDescription>
              Update your professional and institutional details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  disabled={!canEdit}
                />
              </div>
              {errors.institution && <p className="text-sm text-red-500">{errors.institution}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="membershipNumber">Membership Number</Label>
              <Input
                id="membershipNumber"
                value={formData.membershipNumber}
                onChange={(e) => handleInputChange("membershipNumber", e.target.value)}
                placeholder="Enter membership number (optional)"
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#25406b]" />
              Address Information
            </CardTitle>
            <CardDescription>
              Update your contact address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Textarea
                id="street"
                value={formData.address.street}
                onChange={(e) => handleInputChange("address.street", e.target.value)}
                placeholder="Enter your full address"
                rows={2}
                disabled={!canEdit}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange("address.city", e.target.value)}
                  placeholder="Enter city"
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange("address.state", e.target.value)}
                  placeholder="Enter state or province"
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange("address.country", e.target.value)}
                  placeholder="Enter country"
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">PIN Code/ZIP</Label>
                <Input
                  id="pincode"
                  value={formData.address.pincode}
                  onChange={(e) => handleInputChange("address.pincode", e.target.value)}
                  placeholder="Enter PIN/ZIP code"
                  disabled={!canEdit}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              Special requirements and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
              <Textarea
                id="dietaryRequirements"
                value={formData.dietaryRequirements}
                onChange={(e) => handleInputChange("dietaryRequirements", e.target.value)}
                placeholder="Any dietary restrictions or preferences"
                rows={3}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialNeeds">Special Needs/Accessibility</Label>
              <Textarea
                id="specialNeeds"
                value={formData.specialNeeds}
                onChange={(e) => handleInputChange("specialNeeds", e.target.value)}
                placeholder="Any accessibility requirements or special needs"
                rows={3}
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        {canEdit && (
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-to-r from-[#25406b] to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </motion.div>
  )
}