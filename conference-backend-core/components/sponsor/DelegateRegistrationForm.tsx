"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/conference-backend-core/components/ui/card'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Input } from '@/conference-backend-core/components/ui/input'
import { Label } from '@/conference-backend-core/components/ui/label'
import { Textarea } from '@/conference-backend-core/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/conference-backend-core/components/ui/select'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { Separator } from '@/conference-backend-core/components/ui/separator'
import { SponsorLayout } from './SponsorLayout'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { 
  UserPlus, ArrowLeft, User, Mail, Phone, Building, MapPin, 
  FileText, CheckCircle, AlertCircle, Loader2, Info
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const TITLES = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.']
const DESIGNATIONS = ['Consultant', 'PG/Student']

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Lakshadweep'
]

interface SponsorData {
  companyName: string
  category: string
  allocation: { total: number; used: number }
}

export function DelegateRegistrationForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sponsorData, setSponsorData] = useState<SponsorData | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  
  const [formData, setFormData] = useState({
    // Personal Info
    title: 'Dr.',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    designation: 'Consultant',
    
    // Professional Info
    institution: '',
    mciNumber: '',
    
    // Address
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    
    // Additional
    dietaryRequirements: 'none',
    specialNeeds: '',
    workshopSelections: [] as string[],
  })

  const [workshopsList, setWorkshopsList] = useState<Array<{ id: string; name: string; maxSeats: number; bookedSeats: number; price: number }>>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sponsor/login')
    } else if (status === 'authenticated') {
      const user = session?.user as any
      if (user?.role !== 'sponsor') {
        router.push('/sponsor/login')
      } else {
        fetchSponsorData()
        fetchWorkshops()
      }
    }
  }, [status, session])

  const fetchWorkshops = async () => {
    try {
      const res = await fetch('/api/workshops')
      const data = await res.json()
      if (data.success && data.data) {
        setWorkshopsList(data.data.filter((w: any) => w.canRegister).map((w: any) => ({
          id: w.id,
          name: w.name,
          maxSeats: w.maxSeats,
          bookedSeats: w.bookedSeats,
          price: w.price
        })))
      }
    } catch (error) {
      console.error('Failed to fetch workshops')
    }
  }

  const fetchSponsorData = async () => {
    try {
      const res = await fetch('/api/sponsor/dashboard')
      const result = await res.json()
      if (result.success) {
        setSponsorData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch sponsor data')
    }
  }

  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) return
    
    setCheckingEmail(true)
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      })
      const data = await res.json()
      setEmailAvailable(data.available)
      if (!data.available) {
        toast.error('This email is already registered')
      }
    } catch (error) {
      console.error('Email check failed')
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'email') {
      setEmailAvailable(null)
      const timeout = setTimeout(() => checkEmailAvailability(value), 800)
      return () => clearTimeout(timeout)
    }
  }

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'institution', 'address', 'city', 'state', 'pincode']
    const missing = required.filter(field => !formData[field as keyof typeof formData])
    
    if (missing.length > 0) {
      toast.error(`Please fill all required fields: ${missing.join(', ')}`)
      return false
    }

    if (formData.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits')
      return false
    }

    if (emailAvailable === false) {
      toast.error('This email is already registered')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const res = await fetch('/api/sponsor/delegates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Phone number as password
          password: formData.phone
        })
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Delegate registered successfully! ID: ${data.delegate.registrationId}`)
        router.push('/sponsor/delegates')
      } else {
        toast.error(data.message || 'Failed to register delegate')
      }
    } catch (error) {
      toast.error('Failed to register delegate')
    } finally {
      setLoading(false)
    }
  }

  const remaining = sponsorData ? sponsorData.allocation.total - sponsorData.allocation.used : 0

  if (status === 'loading' || !sponsorData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: conferenceConfig.theme.primary }} />
      </div>
    )
  }

  return (
    <SponsorLayout sponsorData={sponsorData}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link href="/sponsor/delegates">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Delegates
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Register New Delegate</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Add a delegate to {conferenceConfig.shortName} • {remaining} slots remaining
          </p>
        </motion.div>

        {/* Allocation Warning */}
        {remaining <= 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">No Slots Available</h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                You have used all your delegate allocation. Contact the organizers for more slots.
              </p>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">Password Information</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              The delegate's mobile number will be used as their initial password. They can change it after first login.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <Card className="mb-6 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
                Personal Information
              </CardTitle>
              <CardDescription>Basic details of the delegate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Select value={formData.title} onValueChange={(v) => handleInputChange('title', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label>First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
              </div>

              <div>
                <Label>Last Name *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    Email * 
                    {checkingEmail && <Loader2 className="h-3 w-3 animate-spin" />}
                    {emailAvailable === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {emailAvailable === false && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="delegate@example.com"
                    className={emailAvailable === false ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label>Phone Number * (Will be used as password)</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="Age in years"
                    min={18}
                    max={100}
                  />
                </div>
                <div>
                  <Label>Designation *</Label>
                  <Select value={formData.designation} onValueChange={(v) => handleInputChange('designation', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DESIGNATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card className="mb-6 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Institution/Hospital *</Label>
                <Input
                  value={formData.institution}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                  placeholder="Name of institution or hospital"
                />
              </div>
              <div>
                <Label>MCI/NMC Registration Number</Label>
                <Input
                  value={formData.mciNumber}
                  onChange={(e) => handleInputChange('mciNumber', e.target.value)}
                  placeholder="Medical registration number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="mb-6 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Address *</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Street address"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>City *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label>State *</Label>
                  <Select value={formData.state} onValueChange={(v) => handleInputChange('state', v)}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Country</Label>
                  <Input value={formData.country} disabled className="bg-slate-100" />
                </div>
                <div>
                  <Label>Pincode *</Label>
                  <Input
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit pincode"
                    maxLength={6}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="mb-6 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Dietary Requirements</Label>
                <Select value={formData.dietaryRequirements} onValueChange={(v) => handleInputChange('dietaryRequirements', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No special requirements</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="halal">Halal</SelectItem>
                    <SelectItem value="kosher">Kosher</SelectItem>
                    <SelectItem value="gluten-free">Gluten-free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Special Needs / Accessibility Requirements</Label>
                <Textarea
                  value={formData.specialNeeds}
                  onChange={(e) => handleInputChange('specialNeeds', e.target.value)}
                  placeholder="Any special requirements or accessibility needs"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Workshop Selections */}
          {workshopsList.length > 0 && (
            <Card className="mb-6 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
                  Workshop Selections (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {workshopsList.map(workshop => {
                  const isSelected = formData.workshopSelections.includes(workshop.id)
                  const availableSeats = workshop.maxSeats === 0 ? '∞' : `${workshop.maxSeats - workshop.bookedSeats}`
                  return (
                    <label
                      key={workshop.id}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            workshopSelections: isSelected
                              ? prev.workshopSelections.filter(id => id !== workshop.id)
                              : [...prev.workshopSelections, workshop.id]
                          }))
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{workshop.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({availableSeats} seats available • ₹{workshop.price})
                        </span>
                      </div>
                    </label>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || remaining <= 0}
              className="flex-1 text-white"
              style={{ backgroundColor: conferenceConfig.theme.primary }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register Delegate
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </SponsorLayout>
  )
}
