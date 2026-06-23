"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog"
import {
  BookOpen,
  Users,
  Calendar,
  MapPin,
  Clock,
  Eye,
  Download,
  RefreshCw
} from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import { MainLayout } from "../../../components/layout/MainLayout"

interface WorkshopRegistration {
  workshopId: string
  workshopName: string
  instructor: string
  maxSeats: number
  bookedSeats: number
  totalRegistrations: number
  paidRegistrations: number
  pendingRegistrations: number
  availableSeats: number
  registrationStatus: string
}

interface WorkshopParticipant {
  _id: string
  email: string
  name: string
  institution: string
  phone: string
  registrationId: string
  registrationStatus: string
  registrationDate: string
  paymentDate?: string
}

export default function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState<WorkshopRegistration[]>([])
  const [selectedWorkshop, setSelectedWorkshop] = useState<string | null>(null)
  const [participants, setParticipants] = useState<WorkshopParticipant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    fetchWorkshops()
  }, [])

  const fetchWorkshops = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/workshops/registrations")
      const data = await response.json()

      if (data.success) {
        setWorkshops(data.data)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch workshop data",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Workshops fetch error:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching workshop data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWorkshopParticipants = async (workshopId: string) => {
    try {
      setIsLoadingParticipants(true)
      const response = await fetch(`/api/admin/workshops/registrations?workshopId=${workshopId}`)
      const data = await response.json()

      if (data.success) {
        setParticipants(data.data.registrations)
        setSelectedWorkshop(workshopId)
        setIsParticipantsOpen(true)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch participants",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Participants fetch error:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching participants",
        variant: "destructive"
      })
    } finally {
      setIsLoadingParticipants(false)
    }
  }

  const exportWorkshopData = async (workshopId: string) => {
    try {
      const response = await fetch(`/api/admin/workshops/export?workshopId=${workshopId}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `workshop-${workshopId}-participants.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: "Export Started",
          description: "Workshop participant data is being downloaded."
        })
      } else {
        toast({
          title: "Export Failed",
          description: "Unable to export workshop data",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during export",
        variant: "destructive"
      })
    }
  }

  const exportAllWorkshopsData = async () => {
    try {
      // Export all workshops data
      for (const workshop of workshops) {
        await exportWorkshopData(workshop.workshopId)
        // Add a small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      toast({
        title: "Export Complete",
        description: "All workshop data has been exported."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during bulk export",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "full":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    }
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Workshop Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  View and manage workshop registrations
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchWorkshops}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-conference-primary" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Workshops</p>
                      <p className="text-2xl font-bold">{workshops.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                      <p className="text-2xl font-bold">
                        {workshops.reduce((sum, w) => sum + w.totalRegistrations, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-conference-accent" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Paid Registrations</p>
                      <p className="text-2xl font-bold">
                        {workshops.reduce((sum, w) => sum + w.paidRegistrations, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <MapPin className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Available Seats</p>
                      <p className="text-2xl font-bold">
                        {workshops.reduce((sum, w) => sum + w.availableSeats, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workshops Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-orange-500" />
                      Workshop Registrations
                    </CardTitle>
                    <CardDescription>
                      Overview of all workshop registrations and seat availability
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportAllWorkshopsData()}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Workshop</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Registrations</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workshops.map((workshop) => (
                        <TableRow key={workshop.workshopId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{workshop.workshopName}</div>
                              <div className="text-sm text-gray-500">ID: {workshop.workshopId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              {workshop.instructor}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="text-lg font-semibold">{workshop.bookedSeats}/{workshop.maxSeats}</div>
                              <div className="text-xs text-gray-500">
                                {workshop.availableSeats} available
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm">Paid: {workshop.paidRegistrations}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm">Pending: {workshop.pendingRegistrations}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(workshop.registrationStatus)}>
                              {workshop.registrationStatus.charAt(0).toUpperCase() + workshop.registrationStatus.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchWorkshopParticipants(workshop.workshopId)}
                                disabled={isLoadingParticipants}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportWorkshopData(workshop.workshopId)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {workshops.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No workshop data available.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Workshop Participants Dialog */}
        <Dialog open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Workshop Participants</DialogTitle>
                  <DialogDescription>
                    Participants registered for {workshops.find(w => w.workshopId === selectedWorkshop)?.workshopName}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedWorkshop && exportWorkshopData(selectedWorkshop)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {isLoadingParticipants ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Participant</TableHead>
                        <TableHead>Registration ID</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registration Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((participant) => (
                        <TableRow key={participant._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{participant.name}</div>
                              <div className="text-sm text-gray-600">{participant.email}</div>
                              <div className="text-xs text-gray-500">{participant.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{participant.registrationId}</Badge>
                          </TableCell>
                          <TableCell>{participant.institution}</TableCell>
                          <TableCell>
                            <Badge className={participant.registrationStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {participant.registrationStatus.charAt(0).toUpperCase() + participant.registrationStatus.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(participant.registrationDate).toLocaleDateString()}
                              {participant.paymentDate && (
                                <div className="text-xs text-gray-500">
                                  Paid: {new Date(participant.paymentDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {participants.length === 0 && !isLoadingParticipants && (
                <div className="text-center py-8 text-gray-500">
                  No participants found for this workshop.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </MainLayout>
    </ProtectedRoute>
  )
}