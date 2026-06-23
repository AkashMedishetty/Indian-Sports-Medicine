"use client"

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/conference-backend-core/components/ui/card'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Input } from '@/conference-backend-core/components/ui/input'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/conference-backend-core/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/conference-backend-core/components/ui/table'
import { Checkbox } from '@/conference-backend-core/components/ui/checkbox'
import { SponsorLayout } from './SponsorLayout'
import { ClaimDelegateDialog } from './ClaimDelegateDialog'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { 
  Search, Download, UserPlus, Filter, X, ArrowUpDown, 
  MapPin, Building, Users, Loader2, ChevronDown, Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface Delegate {
  _id: string
  email: string
  name: string
  firstName: string
  lastName: string
  phone: string
  institution: string
  city: string
  state: string
  designation: string
  registrationId: string
  status: string
  createdAt: string
}

interface SponsorData {
  companyName: string
  category: string
  allocation: { total: number; used: number }
}

// Fuzzy match function - simple but effective
function fuzzyMatch(str: string, pattern: string): boolean {
  if (!pattern) return true
  const lowerStr = str.toLowerCase()
  const lowerPattern = pattern.toLowerCase()
  
  // Direct includes
  if (lowerStr.includes(lowerPattern)) return true
  
  // Fuzzy: check if all characters appear in order
  let patternIdx = 0
  for (let i = 0; i < lowerStr.length && patternIdx < lowerPattern.length; i++) {
    if (lowerStr[i] === lowerPattern[patternIdx]) {
      patternIdx++
    }
  }
  return patternIdx === lowerPattern.length
}

// Get unique values with fuzzy grouping
function getUniqueValuesWithFuzzyGrouping(items: string[], threshold: number = 0.8): string[] {
  const normalized = items.filter(Boolean).map(item => item.trim())
  const groups: Map<string, string[]> = new Map()
  
  normalized.forEach(item => {
    let foundGroup = false
    for (const [key, values] of groups) {
      // Check similarity
      if (areSimilar(item, key, threshold)) {
        values.push(item)
        foundGroup = true
        break
      }
    }
    if (!foundGroup) {
      groups.set(item, [item])
    }
  })
  
  // Return the most common variant from each group
  return Array.from(groups.entries()).map(([key, values]) => {
    const counts = values.reduce((acc, v) => {
      acc[v] = (acc[v] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }).sort()
}

// Check if two strings are similar (Levenshtein-based)
function areSimilar(a: string, b: string, threshold: number): boolean {
  const la = a.toLowerCase()
  const lb = b.toLowerCase()
  
  if (la === lb) return true
  if (la.includes(lb) || lb.includes(la)) return true
  
  // Simple similarity check
  const maxLen = Math.max(la.length, lb.length)
  if (maxLen === 0) return true
  
  const distance = levenshteinDistance(la, lb)
  const similarity = 1 - distance / maxLen
  
  return similarity >= threshold
}

// Levenshtein distance
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

export function DelegatesList() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [delegates, setDelegates] = useState<Delegate[]>([])
  const [sponsorData, setSponsorData] = useState<SponsorData | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [institutionFilter, setInstitutionFilter] = useState<string>('all')
  const [designationFilter, setDesignationFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDelegates, setSelectedDelegates] = useState<string[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sponsor/login')
    } else if (status === 'authenticated') {
      const user = session?.user as any
      if (user?.role !== 'sponsor') {
        router.push('/sponsor/login')
      } else {
        fetchData()
      }
    }
  }, [status, session])

  const fetchData = async () => {
    try {
      const [delegatesRes, dashboardRes] = await Promise.all([
        fetch('/api/sponsor/delegates'),
        fetch('/api/sponsor/dashboard')
      ])
      
      const delegatesData = await delegatesRes.json()
      const dashboardData = await dashboardRes.json()
      
      if (delegatesData.success) {
        setDelegates(delegatesData.delegates)
      }
      if (dashboardData.success) {
        setSponsorData(dashboardData.data)
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Get unique filter options with fuzzy grouping
  const filterOptions = useMemo(() => {
    const cities = delegates.map(d => d.city).filter(Boolean)
    const states = delegates.map(d => d.state).filter(Boolean)
    const institutions = delegates.map(d => d.institution).filter(Boolean)
    const designations = delegates.map(d => d.designation).filter(Boolean)
    
    return {
      cities: getUniqueValuesWithFuzzyGrouping(cities, 0.85),
      states: getUniqueValuesWithFuzzyGrouping(states, 0.9),
      institutions: getUniqueValuesWithFuzzyGrouping(institutions, 0.75),
      designations: [...new Set(designations)].sort()
    }
  }, [delegates])

  // Filtered and sorted delegates
  const filteredDelegates = useMemo(() => {
    let result = [...delegates]
    
    // Text search (fuzzy)
    if (search) {
      result = result.filter(d => 
        fuzzyMatch(d.name || '', search) ||
        fuzzyMatch(d.email || '', search) ||
        fuzzyMatch(d.registrationId || '', search) ||
        fuzzyMatch(d.phone || '', search) ||
        fuzzyMatch(d.institution || '', search) ||
        fuzzyMatch(d.city || '', search)
      )
    }
    
    // City filter (fuzzy)
    if (cityFilter && cityFilter !== 'all') {
      result = result.filter(d => areSimilar(d.city || '', cityFilter, 0.8))
    }
    
    // State filter (fuzzy)
    if (stateFilter && stateFilter !== 'all') {
      result = result.filter(d => areSimilar(d.state || '', stateFilter, 0.85))
    }
    
    // Institution filter (fuzzy)
    if (institutionFilter && institutionFilter !== 'all') {
      result = result.filter(d => areSimilar(d.institution || '', institutionFilter, 0.7))
    }
    
    // Designation filter (exact)
    if (designationFilter && designationFilter !== 'all') {
      result = result.filter(d => d.designation === designationFilter)
    }
    
    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter)
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField as keyof Delegate] || ''
      let bVal = b[sortField as keyof Delegate] || ''
      
      if (sortField === 'createdAt') {
        aVal = new Date(aVal as string).getTime().toString()
        bVal = new Date(bVal as string).getTime().toString()
      }
      
      const comparison = String(aVal).localeCompare(String(bVal))
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [delegates, search, cityFilter, stateFilter, institutionFilter, designationFilter, statusFilter, sortField, sortOrder])

  const activeFiltersCount = [cityFilter, stateFilter, institutionFilter, designationFilter, statusFilter]
    .filter(f => f && f !== 'all').length

  const clearFilters = () => {
    setCityFilter('all')
    setStateFilter('all')
    setInstitutionFilter('all')
    setDesignationFilter('all')
    setStatusFilter('all')
    setSearch('')
  }

  const exportCSV = () => {
    const dataToExport = selectedDelegates.length > 0 
      ? filteredDelegates.filter(d => selectedDelegates.includes(d._id))
      : filteredDelegates
    
    const headers = ['Registration ID', 'Name', 'Email', 'Phone', 'Designation', 'Institution', 'City', 'State', 'Status', 'Date']
    const rows = dataToExport.map(d => [
      d.registrationId, 
      d.name, 
      d.email, 
      d.phone, 
      d.designation,
      d.institution,
      d.city,
      d.state,
      d.status, 
      new Date(d.createdAt).toLocaleDateString()
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `delegates-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success(`Exported ${dataToExport.length} delegates`)
  }

  const toggleSelectAll = () => {
    if (selectedDelegates.length === filteredDelegates.length) {
      setSelectedDelegates([])
    } else {
      setSelectedDelegates(filteredDelegates.map(d => d._id))
    }
  }

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: conferenceConfig.theme.primary }} />
      </div>
    )
  }

  return (
    <SponsorLayout sponsorData={sponsorData || undefined}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">All Delegates</h1>
              <p className="text-slate-600 dark:text-slate-400">
                {filteredDelegates.length} of {delegates.length} delegates
                {selectedDelegates.length > 0 && ` • ${selectedDelegates.length} selected`}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export {selectedDelegates.length > 0 ? `(${selectedDelegates.length})` : 'All'}
              </Button>
              <ClaimDelegateDialog onClaimed={fetchData} />
              <Link href="/sponsor/delegates/register">
                <Button style={{ backgroundColor: conferenceConfig.theme.primary }} className="text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Delegate
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <Card className="mb-6 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, phone, ID, institution, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filter Toggle */}
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={activeFiltersCount > 0 ? 'border-blue-500 text-blue-600' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-blue-500 text-white">{activeFiltersCount}</Badge>
                )}
              </Button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* City Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                      <MapPin className="w-3 h-3 inline mr-1" />City
                    </label>
                    <Select value={cityFilter} onValueChange={setCityFilter}>
                      <SelectTrigger><SelectValue placeholder="All Cities" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {filterOptions.cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* State Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                      <MapPin className="w-3 h-3 inline mr-1" />State
                    </label>
                    <Select value={stateFilter} onValueChange={setStateFilter}>
                      <SelectTrigger><SelectValue placeholder="All States" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {filterOptions.states.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Institution Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                      <Building className="w-3 h-3 inline mr-1" />Institution
                    </label>
                    <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
                      <SelectTrigger><SelectValue placeholder="All Institutions" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Institutions</SelectItem>
                        {filterOptions.institutions.map(inst => (
                          <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Designation Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                      <Users className="w-3 h-3 inline mr-1" />Designation
                    </label>
                    <Select value={designationFilter} onValueChange={setDesignationFilter}>
                      <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Designations</SelectItem>
                        {filterOptions.designations.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                      Status
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-slate-500">Active filters:</span>
                    {cityFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        City: {cityFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setCityFilter('all')} />
                      </Badge>
                    )}
                    {stateFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        State: {stateFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setStateFilter('all')} />
                      </Badge>
                    )}
                    {institutionFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        Institution: {institutionFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setInstitutionFilter('all')} />
                      </Badge>
                    )}
                    {designationFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {designationFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setDesignationFilter('all')} />
                      </Badge>
                    )}
                    {statusFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {statusFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDelegates.length === filteredDelegates.length && filteredDelegates.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('registrationId')}>
                      <div className="flex items-center gap-1">
                        ID <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                      <div className="flex items-center gap-1">
                        Name <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('institution')}>
                      <div className="flex items-center gap-1">
                        Institution <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('city')}>
                      <div className="flex items-center gap-1">
                        Location <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('createdAt')}>
                      <div className="flex items-center gap-1">
                        Date <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDelegates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                          {delegates.length === 0 ? 'No delegates registered yet' : 'No delegates match your filters'}
                        </p>
                        {delegates.length === 0 && (
                          <Link href="/sponsor/delegates/register">
                            <Button className="mt-4" style={{ backgroundColor: conferenceConfig.theme.primary }}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Register First Delegate
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDelegates.map((delegate) => (
                      <TableRow key={delegate._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedDelegates.includes(delegate._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDelegates([...selectedDelegates, delegate._id])
                              } else {
                                setSelectedDelegates(selectedDelegates.filter(id => id !== delegate._id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {delegate.registrationId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900 dark:text-white">{delegate.name}</div>
                          <div className="text-xs text-slate-500">{delegate.designation}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{delegate.email}</div>
                          <div className="text-xs text-slate-500">{delegate.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-[200px] truncate" title={delegate.institution}>
                            {delegate.institution}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{delegate.city}</div>
                          <div className="text-xs text-slate-500">{delegate.state}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={delegate.status === 'confirmed' ? 'default' : 'secondary'}
                            className={delegate.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                          >
                            {delegate.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {new Date(delegate.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {filteredDelegates.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: conferenceConfig.theme.primary }}>
                  {filterOptions.cities.length}
                </div>
                <div className="text-sm text-slate-500">Cities</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: conferenceConfig.theme.primary }}>
                  {filterOptions.states.length}
                </div>
                <div className="text-sm text-slate-500">States</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: conferenceConfig.theme.primary }}>
                  {filterOptions.institutions.length}
                </div>
                <div className="text-sm text-slate-500">Institutions</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: conferenceConfig.theme.primary }}>
                  {filteredDelegates.filter(d => d.status === 'confirmed').length}
                </div>
                <div className="text-sm text-slate-500">Confirmed</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </SponsorLayout>
  )
}
