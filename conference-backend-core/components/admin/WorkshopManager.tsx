'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { useToast } from '../ui/use-toast'
import { Plus, Edit, Trash2, Users, Calendar, Clock, MapPin, Eye, Download } from 'lucide-react'

interface Workshop {
  _id?: string
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
  isActive: boolean
  registrationStatus?: string
  canRegister?: boolean
}

export function WorkshopManager() {
  const { toast } = useToast()
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewingRegistrants, setViewingRegistrants] = useState<Workshop | null>(null)
  const [isRegistrantsDialogOpen, setIsRegistrantsDialogOpen] = useState(false)
  const [registrantsData, setRegistrantsData] = useState<any[]>([])
  const [loadingRegistrants, setLoadingRegistrants] = useState(false)

  const [formData, setFormData] = useState<Partial<Workshop>>({
    id: '',
    name: '',
    description: '',
    instructor: '',
    duration: '',
    price: 0,
    currency: 'INR',
    maxSeats: 0,
    registrationStart: '',
    registrationEnd: '',
    workshopDate: '',
    workshopTime: '',
    venue: '',
    prerequisites: '',
    materials: '',
    isActive: true
  })

  useEffect(() => {
    loadWorkshops()
  }, [])

  const loadWorkshops = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/workshops?includeStatus=true')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Ensure all workshops have registrationStatus computed
          const workshopsWithStatus = result.data.map((w: Workshop) => ({
            ...w,
            registrationStatus: w.registrationStatus || 'unknown'
          }))
          setWorkshops(workshopsWithStatus)
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load workshops",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading workshops:', error)
      toast({
        title: "Error",
        description: "Failed to load workshops",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.id?.trim()) errors.push('Workshop ID is required')
    if (!formData.name?.trim()) errors.push('Workshop Name is required')
    if (formData.price === undefined || formData.price === null || isNaN(formData.price) || formData.price < 0) errors.push('Valid Price is required (0 or more)')
    if (!formData.maxSeats || formData.maxSeats < 1) errors.push('Max Seats must be at least 1')
    
    // Validate dates only if both are provided
    if (formData.registrationStart && formData.registrationEnd) {
      const start = new Date(formData.registrationStart)
      const end = new Date(formData.registrationEnd)
      if (end < start) {
        errors.push('Registration End Date must be after Start Date')
      }
    }
    
    return errors
  }

  const handleCreate = async () => {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(', '),
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/admin/workshops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          toast({
            title: "Success",
            description: "Workshop created successfully"
          })
          setIsCreateDialogOpen(false)
          resetForm()
          loadWorkshops()
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to create workshop",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating workshop:', error)
      toast({
        title: "Error",
        description: "Failed to create workshop",
        variant: "destructive"
      })
    }
  }

  const handleUpdate = async () => {
    if (!editingWorkshop) return

    try {
      const response = await fetch('/api/admin/workshops', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workshopId: editingWorkshop.id,
          ...formData
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          toast({
            title: "Success",
            description: "Workshop updated successfully"
          })
          setIsEditDialogOpen(false)
          setEditingWorkshop(null)
          resetForm()
          loadWorkshops()
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to update workshop",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating workshop:', error)
      toast({
        title: "Error",
        description: "Failed to update workshop",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (workshopId: string) => {
    if (!confirm('Are you sure you want to delete this workshop? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/workshops', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workshopId })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          toast({
            title: "Success",
            description: "Workshop deleted successfully"
          })
          loadWorkshops()
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to delete workshop",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting workshop:', error)
      toast({
        title: "Error",
        description: "Failed to delete workshop",
        variant: "destructive"
      })
    }
  }

  const viewRegistrants = async (workshop: Workshop) => {
    setViewingRegistrants(workshop)
    setIsRegistrantsDialogOpen(true)
    setLoadingRegistrants(true)
    
    try {
      const response = await fetch(`/api/admin/export/workshop?workshop=${workshop.id}&format=json`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setRegistrantsData(result.data.registrations || [])
        }
      }
    } catch (error) {
      console.error('Error loading registrants:', error)
      toast({
        title: "Error",
        description: "Failed to load registrants",
        variant: "destructive"
      })
    } finally {
      setLoadingRegistrants(false)
    }
  }

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      instructor: '',
      duration: '',
      price: 0,
      currency: 'INR',
      maxSeats: 0,
      registrationStart: '',
      registrationEnd: '',
      workshopDate: '',
      workshopTime: '',
      venue: '',
      prerequisites: '',
      materials: '',
      isActive: true
    })
  }

  const openEditDialog = (workshop: Workshop) => {
    setEditingWorkshop(workshop)
    setFormData({
      id: workshop.id,
      name: workshop.name,
      description: workshop.description,
      instructor: workshop.instructor,
      duration: workshop.duration,
      price: workshop.price,
      currency: workshop.currency,
      maxSeats: workshop.maxSeats,
      registrationStart: workshop.registrationStart ? workshop.registrationStart.split('T')[0] : '',
      registrationEnd: workshop.registrationEnd ? workshop.registrationEnd.split('T')[0] : '',
      workshopDate: workshop.workshopDate ? workshop.workshopDate.split('T')[0] : '',
      workshopTime: workshop.workshopTime || '',
      venue: workshop.venue || '',
      prerequisites: workshop.prerequisites || '',
      materials: workshop.materials || '',
      isActive: workshop.isActive
    })
    setIsEditDialogOpen(true)
  }

  const getStatusBadge = (workshop: Workshop) => {
    if (!workshop.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    
    switch (workshop.registrationStatus) {
      case 'open':
        return <Badge variant="default" className="bg-green-500">Open</Badge>
      case 'full':
        return <Badge variant="destructive">Full</Badge>
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>
      case 'not-started':
        return <Badge variant="outline">Not Started</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const renderWorkshopForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Workshop ID *</Label>
          <Input
            value={formData.id}
            onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
            placeholder="e.g., joint-replacement"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Unique identifier used in URLs (use lowercase with hyphens, e.g., "trauma-surgery")
          </p>
        </div>
        <div>
          <Label>Workshop Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Advanced Brain Surgery"
          />
        </div>
      </div>

      <div>
        <Label>Description <span className="text-gray-400">(Optional)</span></Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Workshop description..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Instructor <span className="text-gray-400">(Optional)</span></Label>
          <Input
            value={formData.instructor}
            onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
            placeholder="Dr. John Doe"
          />
        </div>
        <div>
          <Label>Duration <span className="text-gray-400">(Optional)</span></Label>
          <Input
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
            placeholder="e.g., 4 hours"
          />
        </div>
      </div>

      {/* Registration Status Toggle - PROMINENT */}
      <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/30">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label className="text-base font-semibold text-gray-900 dark:text-white">🔴 Registration Status</Label>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {formData.isActive 
                ? '✅ Workshop is LIVE - Will appear in registration if within date range' 
                : '❌ Workshop is DISABLED - Will NOT appear in registration'}
            </p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
        </div>
      </div>

      {/* Pricing & Capacity */}
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">💰 Pricing & Capacity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Price *</Label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => {
                const value = e.target.value
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setFormData(prev => ({ ...prev, price: value === '' ? 0 : parseFloat(value) }))
                }
              }}
              min="0"
              step="0.01"
              placeholder="e.g., 2000"
              required
            />
          </div>
          <div>
            <Label>Currency *</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">₹ INR (Indian Rupee)</SelectItem>
              <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Max Seats *</Label>
          <Input
            type="number"
            value={formData.maxSeats}
            onChange={(e) => {
              const value = e.target.value
              if (value === '' || /^\d+$/.test(value)) {
                setFormData(prev => ({ ...prev, maxSeats: value === '' ? 0 : parseInt(value) }))
              }
            }}
            min="1"
            placeholder="e.g., 30"
            required
          />
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Registration Start Date <span className="text-gray-400">(Optional)</span></Label>
          <Input
            type="date"
            value={formData.registrationStart}
            onChange={(e) => setFormData(prev => ({ ...prev, registrationStart: e.target.value }))}
          />
        </div>
        <div>
          <Label>Registration End Date <span className="text-gray-400">(Optional)</span></Label>
          <Input
            type="date"
            value={formData.registrationEnd}
            onChange={(e) => setFormData(prev => ({ ...prev, registrationEnd: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Workshop Date <span className="text-gray-400">(Optional)</span></Label>
          <Input
            type="date"
            value={formData.workshopDate}
            onChange={(e) => setFormData(prev => ({ ...prev, workshopDate: e.target.value }))}
          />
        </div>
        <div>
          <Label>Workshop Time <span className="text-gray-400">(Optional)</span></Label>
          <Input
            value={formData.workshopTime}
            onChange={(e) => setFormData(prev => ({ ...prev, workshopTime: e.target.value }))}
            placeholder="e.g., 09:00 AM - 01:00 PM"
          />
        </div>
      </div>

      <div>
        <Label>Venue <span className="text-gray-400">(Optional)</span></Label>
        <Input
          value={formData.venue}
          onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
          placeholder="e.g., Workshop Hall A"
        />
      </div>

      <div>
        <Label>Prerequisites</Label>
        <Textarea
          value={formData.prerequisites}
          onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
          placeholder="Any prerequisites for the workshop..."
          rows={2}
        />
      </div>

      <div>
        <Label>Materials Provided</Label>
        <Textarea
          value={formData.materials}
          onChange={(e) => setFormData(prev => ({ ...prev, materials: e.target.value }))}
          placeholder="Materials and equipment provided..."
          rows={2}
        />
      </div>
    </div>
  )

  if (loading) {
    return <div className="flex justify-center p-8">Loading workshops...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workshop Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage conference workshops and seat availability</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Workshop
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Create New Workshop</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Add a new workshop to the conference program
              </DialogDescription>
            </DialogHeader>
            {renderWorkshopForm()}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                Cancel
              </Button>
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">Create Workshop</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workshops ({workshops.length})</CardTitle>
          <CardDescription>
            Manage workshop details, pricing, and seat availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workshop</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workshops.map((workshop) => (
                <TableRow key={workshop.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{workshop.name}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {workshop.duration}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {workshop.venue}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{workshop.instructor}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{workshop.bookedSeats}/{workshop.maxSeats}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {workshop.availableSeats} available
                    </div>
                  </TableCell>
                  <TableCell>₹{(workshop.price || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {workshop.workshopDate ? new Date(workshop.workshopDate).toLocaleDateString() : 'Not set'}
                      </div>
                      <div className="text-gray-500">
                        {workshop.workshopTime || 'Not set'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(workshop)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewRegistrants(workshop)}
                        title="View Registrants"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(workshop)}
                        title="Edit Workshop"
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(workshop.id)}
                        title="Delete Workshop"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Edit Workshop</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Update workshop details and configuration
            </DialogDescription>
          </DialogHeader>
          {renderWorkshopForm()}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-100">
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">Update Workshop</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registrants Dialog */}
      <Dialog open={isRegistrantsDialogOpen} onOpenChange={setIsRegistrantsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Workshop Registrants</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {viewingRegistrants?.name} - {viewingRegistrants?.bookedSeats || 0} registrants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Registrations: {viewingRegistrants?.bookedSeats || 0} / {viewingRegistrants?.maxSeats || 0}
              </div>
              <Button 
                onClick={() => {
                  if (!viewingRegistrants) return
                  // Direct download from API endpoint
                  window.open(`/api/admin/export/workshop?workshop=${viewingRegistrants.id}&format=csv`, '_blank')
                  toast({
                    title: "Success",
                    description: "CSV file is downloading..."
                  })
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!viewingRegistrants}
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </div>
            {loadingRegistrants ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading registrants...</p>
                  </div>
                </CardContent>
              </Card>
            ) : registrantsData.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-semibold">No registrations yet</p>
                    <p className="text-sm mt-2">No one has registered for this workshop yet.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reg ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrantsData.map((registrant, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">
                            {registrant.registrationId || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{registrant.name}</div>
                            {registrant.phone && (
                              <div className="text-xs text-gray-500">{registrant.phone}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{registrant.email}</TableCell>
                          <TableCell className="text-sm">{registrant.institution || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{registrant.registrationType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                registrant.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                registrant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {registrant.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {registrant.registrationDate 
                              ? new Date(registrant.registrationDate).toLocaleDateString()
                              : 'N/A'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}