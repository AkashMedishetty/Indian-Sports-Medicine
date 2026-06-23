"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Award,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface Abstract {
  _id: string
  abstractId: string
  title: string
  track: string
  authors: string[]
  status: 'submitted' | 'under-review' | 'accepted' | 'rejected' | 'final-submitted'
  submittedAt: string
  wordCount?: number
  userId: {
    firstName: string
    lastName: string
    email: string
    registration: {
      registrationId: string
    }
  }
  assignedReviewerIds?: string[]
  averageScore?: number
}

export function AdminAbstractsManager() {
  const [abstracts, setAbstracts] = useState<Abstract[]>([])
  const [filteredAbstracts, setFilteredAbstracts] = useState<Abstract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [trackFilter, setTrackFilter] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    accepted: 0,
    rejected: 0,
    freePaper: 0,
    poster: 0
  })

  useEffect(() => {
    fetchAbstracts()
  }, [])

  useEffect(() => {
    filterAbstracts()
  }, [abstracts, searchTerm, statusFilter, trackFilter])

  const fetchAbstracts = async () => {
    try {
      const response = await fetch('/api/admin/abstracts/list')
      const data = await response.json()
      
      if (data.success) {
        setAbstracts(data.data)
        calculateStats(data.data)
      } else {
        toast.error('Failed to fetch abstracts')
      }
    } catch (error) {
      toast.error('Error fetching abstracts')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (abstractsData: Abstract[]) => {
    const stats = {
      total: abstractsData.length,
      submitted: abstractsData.filter(a => a.status === 'submitted').length,
      underReview: abstractsData.filter(a => a.status === 'under-review').length,
      accepted: abstractsData.filter(a => a.status === 'accepted').length,
      rejected: abstractsData.filter(a => a.status === 'rejected').length,
      freePaper: abstractsData.filter(a => a.track === 'Free Paper').length,
      poster: abstractsData.filter(a => a.track === 'Poster').length
    }
    setStats(stats)
  }

  const filterAbstracts = () => {
    let filtered = abstracts

    if (searchTerm) {
      filtered = filtered.filter(abstract =>
        abstract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abstract.abstractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abstract.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        `${abstract.userId.firstName} ${abstract.userId.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(abstract => abstract.status === statusFilter)
    }

    if (trackFilter !== 'all') {
      filtered = filtered.filter(abstract => abstract.track === trackFilter)
    }

    setFilteredAbstracts(filtered)
  }

  const updateAbstractStatus = async (abstractId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/abstracts/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ abstractId, status: newStatus })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Abstract status updated to ${newStatus}`)
        fetchAbstracts() // Refresh the list
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Error updating abstract status')
    }
  }

  const exportAbstracts = async (format: 'json' | 'excel') => {
    try {
      const response = await fetch(`/api/admin/abstracts/export?format=${format}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `abstracts-export.${format === 'json' ? 'json' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Abstracts exported as ${format.toUpperCase()}`)
      } else {
        toast.error('Export failed')
      }
    } catch (error) {
      toast.error('Error exporting abstracts')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'submitted': { color: 'bg-[#d8e0ed] text-blue-800', icon: Clock },
      'under-review': { color: 'bg-yellow-100 text-yellow-800', icon: Eye },
      'accepted': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'final-submitted': { color: 'bg-purple-100 text-purple-800', icon: Award }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-midnight-600 dark:text-midnight-400">Total Abstracts</p>
                  <p className="text-2xl font-bold text-midnight-800 dark:text-midnight-100">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-midnight-600 dark:text-midnight-400">Under Review</p>
                  <p className="text-2xl font-bold text-midnight-800 dark:text-midnight-100">{stats.underReview}</p>
                </div>
                <Eye className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-midnight-600 dark:text-midnight-400">Free Papers</p>
                  <p className="text-2xl font-bold text-midnight-800 dark:text-midnight-100">{stats.freePaper}</p>
                </div>
                <Award className="w-8 h-8 text-[#25406b]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-midnight-600 dark:text-midnight-400">Posters</p>
                  <p className="text-2xl font-bold text-midnight-800 dark:text-midnight-100">{stats.poster}</p>
                </div>
                <Users className="w-8 h-8 text-theme-accent-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Abstract Management</span>
            <div className="flex gap-2">
              <Button
                onClick={() => exportAbstracts('json')}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button
                onClick={() => exportAbstracts('excel')}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by title, ID, author, or submitter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={trackFilter} onValueChange={setTrackFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by track" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tracks</SelectItem>
                <SelectItem value="Free Paper">Free Paper</SelectItem>
                <SelectItem value="Poster">Poster</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Abstracts List */}
          <div className="space-y-4">
            {filteredAbstracts.length === 0 ? (
              <div className="text-center py-8 text-midnight-600 dark:text-midnight-400">
                No abstracts found matching your criteria.
              </div>
            ) : (
              filteredAbstracts.map((abstract, index) => (
                <motion.div
                  key={abstract._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border border-midnight-200 dark:border-midnight-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-midnight-800 dark:text-midnight-100">
                          {abstract.title}
                        </h3>
                        {getStatusBadge(abstract.status)}
                        <Badge variant="outline">
                          {abstract.track}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-midnight-600 dark:text-midnight-400 space-y-1">
                        <p><strong>ID:</strong> {abstract.abstractId}</p>
                        <p><strong>Authors:</strong> {abstract.authors.join(', ')}</p>
                        <p><strong>Submitter:</strong> {abstract.userId.firstName} {abstract.userId.lastName} ({abstract.userId.registration.registrationId})</p>
                        <p><strong>Submitted:</strong> {new Date(abstract.submittedAt).toLocaleDateString()}</p>
                        {abstract.wordCount && <p><strong>Word Count:</strong> {abstract.wordCount}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAbstractStatus(abstract._id, 'accepted')}
                          disabled={abstract.status === 'accepted'}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAbstractStatus(abstract._id, 'rejected')}
                          disabled={abstract.status === 'rejected'}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // TODO: Implement view abstract details
                          toast.info('Abstract details view coming soon')
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
