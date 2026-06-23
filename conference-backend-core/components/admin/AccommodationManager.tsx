"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import {
  Building, Users, Search, Download, RefreshCw, BedDouble, BedSingle, Calendar, DollarSign
} from "lucide-react"
import { useToast } from "../ui/use-toast"

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
  payment?: { status?: string; amount?: number }
}

interface Stats {
  total: number
  single: number
  sharing: number
  totalRevenue: number
  confirmed: number
}

export function AccommodationManager() {
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
      if (roomTypeFilter && roomTypeFilter !== 'all') params.set('roomType', roomTypeFilter)
      const response = await fetch(`/api/admin/accommodation?${params}`)
      const data = await response.json()
      if (data.success) {
        setBookings(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch accommodation data", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hotel Accommodation</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage hotel bookings at Novotel HICC, Hyderabad</p>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Building className="h-8 w-8 text-blue-600" />
          <div><p className="text-xs text-slate-500">Total Bookings</p><p className="text-xl font-bold">{stats.total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <BedSingle className="h-8 w-8 text-purple-600" />
          <div><p className="text-xs text-slate-500">Single Rooms</p><p className="text-xl font-bold">{stats.single}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <BedDouble className="h-8 w-8 text-green-600" />
          <div><p className="text-xs text-slate-500">Sharing Rooms</p><p className="text-xl font-bold">{stats.sharing}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-orange-600" />
          <div><p className="text-xs text-slate-500">Confirmed</p><p className="text-xl font-bold">{stats.confirmed}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-emerald-600" />
          <div><p className="text-xs text-slate-500">Revenue</p><p className="text-xl font-bold">₹{stats.totalRevenue.toLocaleString('en-IN')}</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by name, email, or registration ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
          />
          <Button variant="outline" onClick={fetchBookings}><Search className="h-4 w-4" /></Button>
        </div>
        <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Room Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Room Types</SelectItem>
            <SelectItem value="single">Single Room</SelectItem>
            <SelectItem value="sharing">Sharing Room</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Accommodation Bookings
          </CardTitle>
          <CardDescription>All hotel accommodation bookings for the conference</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />)}</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No accommodation bookings found.</div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
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
                  {bookings.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell>
                        <div className="font-medium">{b.profile?.title} {b.profile?.firstName} {b.profile?.lastName}</div>
                        <div className="text-xs text-slate-500">{b.email}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{b.registration?.registrationId}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={b.registration?.accommodation?.roomType === 'single' ? 'default' : 'secondary'}>
                          {b.registration?.accommodation?.roomType === 'single' ? 'Single' : 'Sharing'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{b.registration?.accommodation?.checkIn}</TableCell>
                      <TableCell className="text-sm">{b.registration?.accommodation?.checkOut}</TableCell>
                      <TableCell className="text-center font-medium">{b.registration?.accommodation?.nights}</TableCell>
                      <TableCell className="font-semibold">₹{b.registration?.accommodation?.totalAmount?.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <Badge variant={b.payment?.status === 'verified' || b.registration?.status === 'paid' ? 'default' : 'secondary'}>
                          {b.payment?.status === 'verified' || b.registration?.status === 'paid' ? 'Confirmed' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
