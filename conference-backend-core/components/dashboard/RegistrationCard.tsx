"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { Input } from "@/conference-backend-core/components/ui/input"
import { Label } from "@/conference-backend-core/components/ui/label"
import { Textarea } from "@/conference-backend-core/components/ui/textarea"
import { 
  FileText, 
  Calendar, 
  User, 
  Building, 
  MapPin, 
  Phone, 
  Mail,
  Users,
  Plus,
  Minus,
  Edit,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/conference-backend-core/components/ui/use-toast"

interface AccompanyingPerson {
  name: string
  age: number
  relationship: string
  dietaryRequirements?: string
}

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
    dietaryRequirements?: string
    specialNeeds?: string
  }
  registration: {
    registrationId: string
    type: string
    status: string
    membershipNumber?: string
    workshopSelections: string[]
    accompanyingPersons: AccompanyingPerson[]
    registrationDate: string
    paymentDate?: string
  }
}

interface RegistrationCardProps {
  userData: UserData
  onUpdate: () => void
}

export function RegistrationCard({ userData, onUpdate }: RegistrationCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editData, setEditData] = useState({
    workshopSelections: [...userData.registration.workshopSelections],
    accompanyingPersons: [...userData.registration.accompanyingPersons],
    dietaryRequirements: userData.profile.dietaryRequirements || "",
    specialNeeds: userData.profile.specialNeeds || ""
  })
  
  const { toast } = useToast()

  // NOTE: Do not hardcode workshops. Display only the user's selected workshops.

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

  const handleWorkshopToggle = (workshop: string) => {
    if (userData.registration.status === "paid") return // Can't edit after payment
    
    setEditData(prev => ({
      ...prev,
      workshopSelections: prev.workshopSelections.includes(workshop)
        ? prev.workshopSelections.filter(w => w !== workshop)
        : [...prev.workshopSelections, workshop]
    }))
  }

  const handleAddAccompanyingPerson = () => {
    if (userData.registration.status === "paid") return // Can't edit after payment
    
    setEditData(prev => ({
      ...prev,
      accompanyingPersons: [
        ...prev.accompanyingPersons,
        { name: "", age: 0, relationship: "", dietaryRequirements: "" }
      ]
    }))
  }

  const handleRemoveAccompanyingPerson = (index: number) => {
    if (userData.registration.status === "paid") return // Can't edit after payment
    
    setEditData(prev => ({
      ...prev,
      accompanyingPersons: prev.accompanyingPersons.filter((_, i) => i !== index)
    }))
  }

  const handleAccompanyingPersonChange = (index: number, field: string, value: string | number) => {
    if (userData.registration.status === "paid") return // Can't edit after payment
    
    setEditData(prev => ({
      ...prev,
      accompanyingPersons: prev.accompanyingPersons.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    }))
  }

  const handleSave = async () => {
    if (userData.registration.status === "paid") {
      toast({
        title: "Cannot Edit",
        description: "Registration cannot be modified after payment.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/user/registration", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workshopSelections: editData.workshopSelections,
          accompanyingPersons: editData.accompanyingPersons.filter(p => p.name.trim()),
          profile: {
            dietaryRequirements: editData.dietaryRequirements,
            specialNeeds: editData.specialNeeds
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Updated Successfully",
          description: "Your registration has been updated."
        })
        setIsEditing(false)
        onUpdate()
      } else {
        toast({
          title: "Update Failed",
          description: data.message || "Failed to update registration.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      workshopSelections: [...userData.registration.workshopSelections],
      accompanyingPersons: [...userData.registration.accompanyingPersons],
      dietaryRequirements: userData.profile.dietaryRequirements || "",
      specialNeeds: userData.profile.specialNeeds || ""
    })
    setIsEditing(false)
  }

  const canEdit = userData.registration.status !== "paid"

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
                <FileText className="h-5 w-5 text-[#25406b]" />
                Registration Details
              </CardTitle>
              <CardDescription>
                View and manage your conference registration
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(userData.registration.status)} flex items-center gap-1`}>
                {getStatusIcon(userData.registration.status)}
                {userData.registration.status.charAt(0).toUpperCase() + userData.registration.status.slice(1)}
              </Badge>
              {canEdit && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!canEdit && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Registration details cannot be modified after payment confirmation.
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Registration Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration ID:</span>
                  <Badge variant="outline">{userData.registration.registrationId}</Badge>
                </div>
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Institution:</span>
                  <span>{userData.profile.institution}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Registration Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span>
                    {userData.registration.type === "regular" && "Regular Delegate"}
                    {userData.registration.type === "student" && "Student/Resident"}
                    {userData.registration.type === "international" && "International"}
                    {userData.registration.type === "faculty" && "Faculty Member"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration Date:</span>
                  <span>{new Date(userData.registration.registrationDate).toLocaleDateString()}</span>
                </div>
                {userData.registration.paymentDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Date:</span>
                    <span>{new Date(userData.registration.paymentDate).toLocaleDateString()}</span>
                  </div>
                )}
                {userData.registration.membershipNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Membership:</span>
                    <span>{userData.registration.membershipNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Workshop Selections */}
          <div className="space-y-4">
            <h3 className="font-semibold">Workshop Selections</h3>
            {userData.registration.workshopSelections.length === 0 ? (
              <p className="text-sm text-gray-600">No workshops selected</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(isEditing ? editData.workshopSelections : userData.registration.workshopSelections).map((workshop) => (
                  <div key={workshop} className="flex items-center space-x-2">
                    <span className="inline-flex items-center rounded-md bg-[#f0f3f8] px-2 py-1 text-xs font-medium text-[#1d3357] ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-200">
                      {workshop}
                    </span>
                    {isEditing && canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWorkshopToggle(workshop)}
                        className="h-7 px-2"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Accompanying Persons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Accompanying Persons
              </h3>
              {isEditing && canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddAccompanyingPerson}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Person
                </Button>
              )}
            </div>

            {(isEditing ? editData : userData.registration).accompanyingPersons.length === 0 ? (
              <p className="text-sm text-gray-600">No accompanying persons registered</p>
            ) : (
              <div className="space-y-4">
                {(isEditing ? editData : userData.registration).accompanyingPersons.map((person, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        {isEditing && canEdit ? (
                          <>
                            <div>
                              <Label htmlFor={`name-${index}`}>Name</Label>
                              <Input
                                id={`name-${index}`}
                                value={person.name}
                                onChange={(e) => handleAccompanyingPersonChange(index, "name", e.target.value)}
                                placeholder="Enter name"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`age-${index}`}>Age</Label>
                              <Input
                                id={`age-${index}`}
                                type="number"
                                value={person.age}
                                onChange={(e) => handleAccompanyingPersonChange(index, "age", parseInt(e.target.value) || 0)}
                                placeholder="Enter age"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`relationship-${index}`}>Relationship</Label>
                              <Input
                                id={`relationship-${index}`}
                                value={person.relationship}
                                onChange={(e) => handleAccompanyingPersonChange(index, "relationship", e.target.value)}
                                placeholder="e.g., Spouse, Child"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <Label htmlFor={`dietary-${index}`}>Dietary Requirements</Label>
                              <Input
                                id={`dietary-${index}`}
                                value={person.dietaryRequirements || ""}
                                onChange={(e) => handleAccompanyingPersonChange(index, "dietaryRequirements", e.target.value)}
                                placeholder="Any dietary restrictions"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-sm font-medium">{person.name}</p>
                              <p className="text-xs text-gray-600">Age: {person.age}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{person.relationship}</p>
                            </div>
                            <div>
                              {person.dietaryRequirements && (
                                <p className="text-xs text-gray-600">
                                  Dietary: {person.dietaryRequirements}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {isEditing && canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAccompanyingPerson(index)}
                          className="ml-2 text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
                {isEditing && canEdit ? (
                  <Textarea
                    id="dietaryRequirements"
                    value={editData.dietaryRequirements}
                    onChange={(e) => setEditData(prev => ({ ...prev, dietaryRequirements: e.target.value }))}
                    placeholder="Any dietary restrictions or preferences"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-600 mt-1">
                    {userData.profile.dietaryRequirements || "None specified"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="specialNeeds">Special Needs</Label>
                {isEditing && canEdit ? (
                  <Textarea
                    id="specialNeeds"
                    value={editData.specialNeeds}
                    onChange={(e) => setEditData(prev => ({ ...prev, specialNeeds: e.target.value }))}
                    placeholder="Any accessibility requirements or special needs"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-600 mt-1">
                    {userData.profile.specialNeeds || "None specified"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-gradient-to-r from-[#25406b] to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Save className="h-4 w-4 mr-1" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}