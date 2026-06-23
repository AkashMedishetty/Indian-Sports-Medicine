"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Mail, Users, Download, Filter, Search, Calendar, Eye } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'

interface NotificationSubscription {
  _id: string
  email: string
  source: 'program' | 'abstracts' | 'venue'
  subscribedAt: string
  notifiedAt?: string
}

interface NotificationData {
  subscriptions: NotificationSubscription[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  counts: {
    total: number
    bySource: Record<string, number>
  }
}

export default function NotificationsAdminPage() {
  const [data, setData] = useState<NotificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async (page = 1, source = 'all', search = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })
      
      if (source !== 'all') {
        params.append('source', source)
      }
      
      const response = await fetch(`/api/notifications/subscribe?${params}`)
      const result = await response.json()
      
      if (result.success) {
        // Filter by search term on client side
        if (search) {
          result.data.subscriptions = result.data.subscriptions.filter((sub: NotificationSubscription) =>
            sub.email.toLowerCase().includes(search.toLowerCase())
          )
        }
        
        setData(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch notifications')
      }
    } catch (err) {
      setError('Failed to fetch notifications')
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(currentPage, sourceFilter, searchTerm)
  }, [currentPage, sourceFilter])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchNotifications(1, sourceFilter, searchTerm)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        limit: '10000' // Get all records for export
      })
      
      if (sourceFilter !== 'all') {
        params.append('source', sourceFilter)
      }
      
      const response = await fetch(`/api/notifications/subscribe?${params}`)
      const result = await response.json()
      
      if (result.success) {
        // Create CSV content
        const csvContent = [
          ['Email', 'Source', 'Subscribed At', 'Notified At'],
          ...result.data.subscriptions.map((sub: NotificationSubscription) => [
            sub.email,
            sub.source,
            new Date(sub.subscribedAt).toLocaleString(),
            sub.notifiedAt ? new Date(sub.notifiedAt).toLocaleString() : 'Not notified'
          ])
        ].map(row => row.join(',')).join('\n')
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `notification-subscriptions-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error exporting data:', err)
      alert('Failed to export data')
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'program': return 'bg-yellow-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'abstracts': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'venue': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Notification Subscriptions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage email notifications for program, abstracts, and venue updates
          </p>
        </motion.div>

        {/* Stats Cards */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.counts.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Program</CardTitle>
                <Calendar className="h-4 w-4 text-conference-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.counts.bySource.program || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Abstracts</CardTitle>
                <Bell className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.counts.bySource.abstracts || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Venue</CardTitle>
                <Eye className="h-4 w-4 text-conference-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.counts.bySource.venue || 0}</div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters and Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="program">Program</SelectItem>
                  <SelectItem value="abstracts">Abstracts</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleExport} className="bg-orange-600 hover:bg-orange-700">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        {/* Subscriptions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Subscription List
            </h2>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            
            {data && data.subscriptions.length > 0 ? (
              <div className="space-y-3">
                {data.subscriptions.map((subscription) => (
                  <div
                    key={subscription._id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {subscription.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Subscribed: {new Date(subscription.subscribedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getSourceColor(subscription.source)}>
                        {subscription.source}
                      </Badge>
                      {subscription.notifiedAt && (
                        <Badge variant="outline">
                          Notified: {new Date(subscription.notifiedAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No notification subscriptions found
                </p>
              </div>
            )}
            
            {/* Pagination */}
            {data && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                  {data.pagination.total} results
                </p>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === data.pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}