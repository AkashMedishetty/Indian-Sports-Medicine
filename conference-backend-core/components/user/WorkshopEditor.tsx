"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Checkbox } from "@/conference-backend-core/components/ui/checkbox"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/conference-backend-core/components/ui/dialog"
import { 
  Edit, 
  Save, 
  X, 
  Clock, 
  Users, 
  MapPin, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react"
import { useToast } from "@/conference-backend-core/hooks/use-toast"

interface Workshop {
  id: string
  name: string
  description: string
  instructor: string
  duration: string
  price: number
  currency: string
  maxSeats: number
  bookedSeats: number
  availableSeats: number
  registrationStart: string
  registrationEnd: string
  workshopDate: string
  workshopTime: string
  venue: string
  prerequisites?: string
  materials?: string
  canRegister: boolean
  registrationStatus: string
}

interface WorkshopEditorProps {
  userWorkshops: string[]
  canEdit: boolean
  onUpdate?: () => void
}

export function WorkshopEditor({ userWorkshops, canEdit, onUpdate }: WorkshopEditorProps) {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>(userWorkshops)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [error, setError] = useState("")
  
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkshops()
  }, [])

  useEffect(() => {
    setSelectedWorkshops(userWorkshops)
  }, [userWorkshops])

  const fetchWorkshops = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/workshops")
      const data = await response.json()

      if (data.success) {
        setWorkshops(data.data)
      } else {
        setError(data.message || "Failed to fetch workshops")
      }
    } catch (error) {
      console.error("Workshops fetch error:", error)
      setError("An error occurred while fetching workshops")
    } finally {
      setIsLoading(false)
    }
  }

  const handleWorkshopToggle = (workshopId: string, checked: boolean) => {
    if (checked) {
      setSelectedWorkshops(prev => [...prev, workshopId])
    } else {
      setSelectedWorkshops(prev => prev.filter(id => id !== workshopId))
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch("/api/user/workshops", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ workshopSelections: selectedWorkshops })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Workshops Updated",
          description: "Your workshop selections have been updated successfully."
        })
        setIsEditOpen(false)
        if (onUpdate) onUpdate()
      } else {
        toast({
          title: "Update Failed",
          description: data.message || "Failed to update workshop selections",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating your selections",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getWorkshopStatus = (workshop: Workshop) => {
    if (workshop.registrationStatus === 'full') {
      return { label: 'Full', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    } else if (workshop.registrationStatus === 'closed') {
      return { label: 'Closed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
    } else if (workshop.registrationStatus === 'not-started') {
      return { label: 'Not Started', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
    } else {
      return { label: 'Open', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `$${amount}`
    }
    return `₹${amount.toLocaleString()}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const selectedWorkshopDetails = workshops.filter(w => userWorkshops.includes(w.id))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Workshop Selections ({userWorkshops.length})
              </CardTitle>
              <CardDescription>
                Your selected workshops for the conference
              </CardDescription>
            </div>
            {canEdit && (
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Selections
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Workshop Selections</DialogTitle>
                    <DialogDescription>
                      Select the workshops you want to attend. You can modify your selections until payment is completed.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {workshops.map((workshop) => {
                      const status = getWorkshopStatus(workshop)
                      const isSelected = selectedWorkshops.includes(workshop.id)
                      const canSelect = workshop.canRegister && (isSelected || workshop.availableSeats > 0)
                      
                      return (
                        <Card key={workshop.id} className={`${isSelected ? 'ring-2 ring-primary' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleWorkshopToggle(workshop.id, checked as boolean)}
                                  disabled={!canSelect}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold">{workshop.name}</h3>
                                    <Badge className={status.color}>
                                      {status.label}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {workshop.description}
                                  </p>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      Instructor: {workshop.instructor}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Duration: {workshop.duration}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      Venue: {workshop.venue}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      Seats: {workshop.availableSeats}/{workshop.maxSeats} available
                                    </div>
                                  </div>
                                  
                                  <div className="mt-2 text-lg font-semibold text-primary">
                                    {formatCurrency(workshop.price, workshop.currency)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {!canEdit && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Workshop selections cannot be modified after payment completion.
              </AlertDescription>
            </Alert>
          )}

          {selectedWorkshopDetails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No workshops selected</p>
              {canEdit && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsEditOpen(true)}
                >
                  Select Workshops
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedWorkshopDetails.map((workshop) => (
                <Card key={workshop.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{workshop.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {workshop.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {workshop.instructor}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {workshop.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(workshop.workshopDate).toLocaleDateString()} at {workshop.workshopTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {workshop.venue}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-primary">
                          {formatCurrency(workshop.price, workshop.currency)}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          Registered
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}