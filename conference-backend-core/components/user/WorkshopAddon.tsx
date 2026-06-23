'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { useToast } from '../ui/use-toast'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  DollarSign,
  Info
} from 'lucide-react'

interface Workshop {
  id: string
  name: string
  description: string
  workshopDate: Date
  workshopTime: string
  venue: string
  instructor: string
  maxSeats: number
  bookedSeats: number
  price: number
  currency: string
  duration: string
  prerequisites?: string
  materials?: string
}

interface WorkshopAddonProps {
  userEmail: string
  registrationId: string
  existingWorkshops?: string[]
  maxWorkshops?: number
}

export function WorkshopAddon({
  userEmail,
  registrationId,
  existingWorkshops = [],
  maxWorkshops = 3
}: WorkshopAddonProps) {
  const { toast } = useToast()
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([])  // Only NEW workshops, not existing ones
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [totalCost, setTotalCost] = useState(0)

  useEffect(() => {
    loadWorkshops()
  }, [])

  useEffect(() => {
    calculateTotalCost()
  }, [selectedWorkshops, workshops])

  const loadWorkshops = async () => {
    try {
      const response = await fetch('/api/workshops')
      if (response.ok) {
        const data = await response.json()
        setWorkshops(data.data || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load workshops",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalCost = () => {
    const cost = workshops
      .filter(w => selectedWorkshops.includes(w.id) && !existingWorkshops.includes(w.id))  // Exclude existing workshops
      .reduce((sum, w) => sum + w.price, 0)
    setTotalCost(cost)
  }

  const toggleWorkshop = (workshopId: string) => {
    // Prevent toggling already registered workshops
    if (existingWorkshops.includes(workshopId)) {
      return
    }

    setSelectedWorkshops(prev => {
      if (prev.includes(workshopId)) {
        return prev.filter(id => id !== workshopId)
      } else {
        if (prev.length >= maxWorkshops) {
          toast({
            title: "Maximum Reached",
            description: `You can only select up to ${maxWorkshops} workshops`,
            variant: "destructive"
          })
          return prev
        }
        return [...prev, workshopId]
      }
    })
  }

  const handleSubmit = async () => {
    // Filter out any existing workshops (safety check)
    const newWorkshopsOnly = selectedWorkshops.filter(id => !existingWorkshops.includes(id))
    
    if (newWorkshopsOnly.length === 0) {
      toast({
        title: "No New Selection",
        description: "Please select at least one new workshop to add",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/user/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          workshopIds: newWorkshopsOnly,  // Only send NEW workshops
          totalAmount: totalCost
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Workshops Added!",
          description: data.data.paymentRequired 
            ? `Successfully registered for ${selectedWorkshops.length} workshop(s). Redirecting to payment...`
            : `Successfully registered for ${selectedWorkshops.length} workshop(s)`,
        })
        
        // Redirect to payment if needed
        if (data.data.paymentRequired && data.data.paymentId) {
          // Redirect to payment page with payment ID
          setTimeout(() => {
            window.location.href = `/dashboard/payment?paymentId=${data.data.paymentId}&type=workshop-addon`
          }, 1500)
        } else if (totalCost > 0 && data.paymentUrl) {
          // Fallback to old payment URL method
          window.location.href = data.paymentUrl
        } else {
          // Refresh the page to show updated workshops
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        }
      } else {
        throw new Error(data.message || 'Registration failed')
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register workshops",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isWorkshopFull = (workshop: Workshop) => {
    return workshop.bookedSeats >= workshop.maxSeats
  }

  const isWorkshopSelected = (workshopId: string) => {
    return selectedWorkshops.includes(workshopId)
  }

  const isWorkshopAlreadyRegistered = (workshopId: string) => {
    return existingWorkshops.includes(workshopId)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading workshops...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Workshop Registration
          </CardTitle>
          <CardDescription>
            Enhance your conference experience by registering for hands-on workshops
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Workshop Add-on:</strong> You can select up to {maxWorkshops} workshops.
              {selectedWorkshops.length > 0 && (
                <span className="ml-2">
                  Currently selected: <strong>{selectedWorkshops.length}/{maxWorkshops}</strong>
                </span>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Workshop List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workshops.map((workshop) => {
          const isFull = isWorkshopFull(workshop)
          const isSelected = isWorkshopSelected(workshop.id)
          const isRegistered = isWorkshopAlreadyRegistered(workshop.id)
          const spotsLeft = workshop.maxSeats - workshop.bookedSeats

          return (
            <Card
              key={workshop.id}
              className={`transition-all ${
                isRegistered
                  ? 'opacity-50 bg-gray-50 dark:bg-gray-900 border-2 border-green-500'
                  : isSelected
                  ? 'ring-2 ring-primary shadow-lg'
                  : isFull
                  ? 'opacity-60'
                  : 'hover:shadow-md'
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {workshop.name}
                  {isRegistered && (
                    <Badge variant="default" className="bg-green-600 text-white">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Registered
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  {workshop.instructor}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Workshop Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(workshop.workshopDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{workshop.workshopTime} ({workshop.duration})</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                    <MapPin className="h-4 w-4" />
                    <span>{workshop.venue}</span>
                  </div>
                </div>

                <Separator />

                {/* Instructor & Capacity */}
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Instructor</p>
                    <p className="font-medium">{workshop.instructor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Capacity</p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">
                        {workshop.bookedSeats}/{workshop.maxSeats}
                      </span>
                      {spotsLeft <= 5 && spotsLeft > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {spotsLeft} left
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-lg">
                      {workshop.currency} {workshop.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Prerequisites */}
                {workshop.prerequisites && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Prerequisites:</strong> {workshop.prerequisites}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Selection Button */}
                {isRegistered ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                    Already Registered
                  </Button>
                ) : isFull ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                  >
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Workshop Full
                  </Button>
                ) : isSelected ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => toggleWorkshop(workshop.id)}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Selected - Click to Remove
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="default"
                    onClick={() => toggleWorkshop(workshop.id)}
                    disabled={selectedWorkshops.length >= maxWorkshops}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {selectedWorkshops.length >= maxWorkshops ? 'Maximum Reached' : 'Select Workshop'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary & Submit */}
      {selectedWorkshops.length > 0 && (
        <Card className="shadow-xl border-2">
          <CardHeader className="pb-3">
            <CardTitle>Registration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-lg">
                <span>Selected Workshops:</span>
                <Badge variant="outline" className="text-base">
                  {selectedWorkshops.length}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-2xl font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">
                  ₹{totalCost.toLocaleString()}
                </span>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedWorkshops([])}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    "Processing..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Register & Pay
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
