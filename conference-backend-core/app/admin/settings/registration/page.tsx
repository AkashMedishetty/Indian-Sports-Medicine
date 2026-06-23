"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "../../../../components/auth/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Badge } from "../../../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../../../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs"
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  DollarSign,
  Users,
  BookOpen,
  Settings
} from "lucide-react"
import { useToast } from "../../../../hooks/use-toast"
import { MainLayout } from "../../../../components/layout/MainLayout"

interface RegistrationType {
  key: string
  label: string
  price: number
  currency: string
  description?: string
}

interface Workshop {
  id: string
  name: string
  price: number
  maxSeats: number
  availableSeats: number
  instructor?: string
  description?: string
  canRegister: boolean
}

export default function RegistrationSettingsPage() {
  const [registrationTypes, setRegistrationTypes] = useState<RegistrationType[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isWorkshopDialogOpen, setIsWorkshopDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<RegistrationType | null>(null)
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null)

  const { toast } = useToast()

  // Form states for Registration Type
  const [typeForm, setTypeForm] = useState({
    key: "",
    label: "",
    price: 0,
    currency: "INR",
    description: ""
  })

  // Form states for Workshop
  const [workshopForm, setWorkshopForm] = useState({
    id: "",
    name: "",
    price: 0,
    maxSeats: 50,
    instructor: "",
    description: "",
    canRegister: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch registration types
      const typesResponse = await fetch("/api/admin/registration-types")
      if (typesResponse.ok) {
        const typesData = await typesResponse.json()
        if (typesData.success) {
          setRegistrationTypes(typesData.data)
        }
      }

      // Fetch workshops
      const workshopsResponse = await fetch("/api/workshops")
      if (workshopsResponse.ok) {
        const workshopsData = await workshopsResponse.json()
        if (workshopsData.success) {
          setWorkshops(workshopsData.data)
        }
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Registration Type Functions
  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingType 
        ? `/api/admin/registration-types/${editingType.key}`
        : "/api/admin/registration-types"
      
      const method = editingType ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(typeForm)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: editingType ? "Registration type updated" : "Registration type created"
        })
        setIsDialogOpen(false)
        resetTypeForm()
        fetchData()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save registration type",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive"
      })
    }
  }

  const handleDeleteType = async (key: string) => {
    if (!confirm("Are you sure you want to delete this registration type?")) return

    try {
      const response = await fetch(`/api/admin/registration-types/${key}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Registration type deleted"
        })
        fetchData()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete registration type",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive"
      })
    }
  }

  const openEditType = (type: RegistrationType) => {
    setEditingType(type)
    setTypeForm({
      key: type.key,
      label: type.label,
      price: type.price,
      currency: type.currency,
      description: type.description || ""
    })
    setIsDialogOpen(true)
  }

  const resetTypeForm = () => {
    setEditingType(null)
    setTypeForm({
      key: "",
      label: "",
      price: 0,
      currency: "INR",
      description: ""
    })
  }

  // Workshop Functions
  const handleWorkshopSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingWorkshop 
        ? `/api/admin/workshops/${editingWorkshop.id}`
        : "/api/admin/workshops"
      
      const method = editingWorkshop ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workshopForm)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: editingWorkshop ? "Workshop updated" : "Workshop created"
        })
        setIsWorkshopDialogOpen(false)
        resetWorkshopForm()
        fetchData()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save workshop",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive"
      })
    }
  }

  const handleDeleteWorkshop = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workshop?")) return

    try {
      const response = await fetch(`/api/admin/workshops/${id}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Workshop deleted"
        })
        fetchData()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete workshop",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive"
      })
    }
  }

  const openEditWorkshop = (workshop: Workshop) => {
    setEditingWorkshop(workshop)
    setWorkshopForm({
      id: workshop.id,
      name: workshop.name,
      price: workshop.price,
      maxSeats: workshop.maxSeats,
      instructor: workshop.instructor || "",
      description: workshop.description || "",
      canRegister: workshop.canRegister
    })
    setIsWorkshopDialogOpen(true)
  }

  const resetWorkshopForm = () => {
    setEditingWorkshop(null)
    setWorkshopForm({
      id: "",
      name: "",
      price: 0,
      maxSeats: 50,
      instructor: "",
      description: "",
      canRegister: true
    })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Settings className="h-8 w-8 text-conference-primary" />
                Registration Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage registration types and workshops
              </p>
            </div>

            <Tabs defaultValue="types" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="types">Registration Types</TabsTrigger>
                <TabsTrigger value="workshops">Workshops</TabsTrigger>
              </TabsList>

              {/* Registration Types Tab */}
              <TabsContent value="types" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-conference-primary" />
                          Registration Types
                        </CardTitle>
                        <CardDescription>
                          Configure available registration categories and pricing
                        </CardDescription>
                      </div>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={resetTypeForm} className="bg-conference-primary hover:opacity-90 text-black">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Type
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingType ? "Edit Registration Type" : "Add Registration Type"}
                            </DialogTitle>
                            <DialogDescription>
                              Configure registration category details
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleTypeSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="key">Key (Unique ID) *</Label>
                              <Input
                                id="key"
                                value={typeForm.key}
                                onChange={(e) => setTypeForm({ ...typeForm, key: e.target.value })}
                                placeholder="e.g., member, non-member"
                                required
                                disabled={!!editingType}
                              />
                            </div>
                            <div>
                              <Label htmlFor="label">Display Label *</Label>
                              <Input
                                id="label"
                                value={typeForm.label}
                                onChange={(e) => setTypeForm({ ...typeForm, label: e.target.value })}
                                placeholder="e.g., CVSI Member"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="price">Price *</Label>
                                <Input
                                  id="price"
                                  type="number"
                                  value={typeForm.price}
                                  onChange={(e) => setTypeForm({ ...typeForm, price: parseFloat(e.target.value) })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="currency">Currency *</Label>
                                <Select
                                  value={typeForm.currency}
                                  onValueChange={(value) => setTypeForm({ ...typeForm, currency: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="description">Description</Label>
                              <Input
                                id="description"
                                value={typeForm.description}
                                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                                placeholder="Optional description"
                              />
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" className="bg-conference-primary hover:opacity-90 text-black">
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Label</TableHead>
                          <TableHead>Key</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrationTypes.map((type) => (
                          <TableRow key={type.key}>
                            <TableCell className="font-medium">{type.label}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{type.key}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                {type.currency === 'USD' ? '$' : '₹'}{type.price.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {type.description || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditType(type)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteType(type.key)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {registrationTypes.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No registration types configured. Add one to get started.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Workshops Tab */}
              <TabsContent value="workshops" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-orange-500" />
                          Workshops
                        </CardTitle>
                        <CardDescription>
                          Configure available workshops and pricing
                        </CardDescription>
                      </div>
                      <Dialog open={isWorkshopDialogOpen} onOpenChange={setIsWorkshopDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={resetWorkshopForm} className="bg-conference-primary hover:opacity-90 text-black">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Workshop
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingWorkshop ? "Edit Workshop" : "Add Workshop"}
                            </DialogTitle>
                            <DialogDescription>
                              Configure workshop details and capacity
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleWorkshopSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="workshop-id">Workshop ID *</Label>
                              <Input
                                id="workshop-id"
                                value={workshopForm.id}
                                onChange={(e) => setWorkshopForm({ ...workshopForm, id: e.target.value })}
                                placeholder="e.g., workshop-1"
                                required
                                disabled={!!editingWorkshop}
                              />
                            </div>
                            <div>
                              <Label htmlFor="workshop-name">Workshop Name *</Label>
                              <Input
                                id="workshop-name"
                                value={workshopForm.name}
                                onChange={(e) => setWorkshopForm({ ...workshopForm, name: e.target.value })}
                                placeholder="e.g., Advanced Techniques"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="instructor">Instructor</Label>
                              <Input
                                id="instructor"
                                value={workshopForm.instructor}
                                onChange={(e) => setWorkshopForm({ ...workshopForm, instructor: e.target.value })}
                                placeholder="Instructor name"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="workshop-price">Price (₹) *</Label>
                                <Input
                                  id="workshop-price"
                                  type="number"
                                  min="0"
                                  value={workshopForm.price}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setWorkshopForm({ ...workshopForm, price: val === '' ? 0 : parseFloat(val) })
                                  }}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="max-seats">Max Seats *</Label>
                                <Input
                                  id="max-seats"
                                  type="number"
                                  min="1"
                                  value={workshopForm.maxSeats}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setWorkshopForm({ ...workshopForm, maxSeats: val === '' ? 0 : parseInt(val) })
                                  }}
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="workshop-description">Description</Label>
                              <Input
                                id="workshop-description"
                                value={workshopForm.description}
                                onChange={(e) => setWorkshopForm({ ...workshopForm, description: e.target.value })}
                                placeholder="Workshop description"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="can-register"
                                checked={workshopForm.canRegister}
                                onChange={(e) => setWorkshopForm({ ...workshopForm, canRegister: e.target.checked })}
                                className="h-4 w-4"
                              />
                              <Label htmlFor="can-register">Allow registrations</Label>
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsWorkshopDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" className="bg-conference-primary hover:opacity-90 text-black">
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Workshop</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Capacity</TableHead>
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
                                <div className="text-sm text-gray-500">ID: {workshop.id}</div>
                              </div>
                            </TableCell>
                            <TableCell>{workshop.instructor || "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                ₹{workshop.price.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              {workshop.availableSeats}/{workshop.maxSeats}
                            </TableCell>
                            <TableCell>
                              <Badge className={workshop.canRegister ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                {workshop.canRegister ? "Open" : "Closed"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditWorkshop(workshop)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteWorkshop(workshop.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {workshops.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No workshops configured. Add one to get started.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
