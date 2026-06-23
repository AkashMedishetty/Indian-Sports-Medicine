"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import {
  Building, Users, Search, Download, RefreshCw, BedDouble, BedSingle, Calendar, DollarSign
} from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import { MainLayout } from "../../../components/layout/MainLayout"

interface AccommodationBooking {
  _id: string
  email: string
  profile: {
    title: string
    firstName: string
    lastName: string
    phone: string
  }
  registration: {
    registrationId: string
    type: string
    status: string
    accommodation: {
      required: boolean
      roomType: 'single' | 'sharing'
      checkIn: string
      checkOut: string
      nights: number
      totalAmount: number
    }
  }
  payment?: {
    status?: string
    amount?: number
  }
}

interface Stats {
  total: number
  single: number
  sharing: number
  totalRevenue: number
  confirmed: number
}

export default function AdminAccommodationPage() {
  const [bookings, setBookings] = useState<AccommodationBooking[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, single: 0, sharing: 0, totalRevenue: 0, confirmed: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roomTypeFilter, setRoomTypeFilter] = useState("")
  const { toast } = useToast()

  useEffect(() => { fetchBookings() }, [roomTypeFilter])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roomTypeFilter) params.set('roomType', roomTypeFilter)
      const response = await fetch(`/api/admin/accommodation?${params}`)
      const data = await response.json()
      if (data.success) {
        setBookings(data.data)
        setStats(data.stats)
      } else {
        toast({ title: "Error", description: data.message || "Failed to fetch", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch accommodation data", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => { fetchBookings() }

  const exportData = async () => {
    try {
      const response = await fetch('/api/admin/accommodation/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `accommodation-bookings-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast({ title: "Export Started", description: "CSV download initiated" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Export failed", variant: "destructive" })
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Hotel Accommodation</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage hotel bookings at Novotel HICC, Hyderabad
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchBookings}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Building className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BedSingle className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Single Rooms</p>
                      <p className="text-2xl font-bold">{stats.single}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BedDouble className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Sharing Rooms</p>
                      <p className="text-2xl font-bold">{stats.sharing}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Confirmed</p>
                      <p className="text-2xl font-bold">{stats.confirmed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-emerald-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Search by name, email, or registration ID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button variant="outline" onClick={handleSearch}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Room Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Room Types</SelectItem>
                      <SelectItem value="single">Single Room</SelectItem>
                      <SelectItem value="sharing">Sharing Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Bookings Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Accommodation Bookings
                </CardTitle>
                <CardDescription>
                  All hotel accommodation bookings for the conference
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Guest</TableHead>
                          <TableHead>Reg ID</TableHead>
                          <TableHead>Room Type</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>Nights</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking._id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {booking.profile?.title} {booking.profile?.firstName} {booking.profile?.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{booking.email}</div>
                                <div className="text-xs text-gray-400">{booking.profile?.phone}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{booking.registration?.registrationId}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={booking.registration?.accommodation?.roomType === 'single' ? 'default' : 'secondary'}>
                                {booking.registration?.accommodation?.roomType === 'single' ? 'Single' : 'Sharing'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{booking.registration?.accommodation?.checkIn}</TableCell>
                            <TableCell className="text-sm">{booking.registration?.accommodation?.checkOut}</TableCell>
                            <TableCell className="text-center font-medium">{booking.registration?.accommodation?.nights}</TableCell>
                            <TableCell className="font-semibold">₹{booking.registration?.accommodation?.totalAmount?.toLocaleString('en-IN')}</TableCell>
                            <TableCell>
                              <Badge variant={booking.payment?.status === 'verified' || booking.registration?.status === 'paid' ? 'default' : 'secondary'}>
                                {booking.payment?.status === 'verified' || booking.registration?.status === 'paid' ? 'Confirmed' : 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {!isLoading && bookings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No accommodation bookings found.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
