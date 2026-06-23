"use client"

import React, { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import { Button } from "./button"
import { Input } from "./input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Badge } from "./badge"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  Filter,
  Download,
  MoreHorizontal
} from "lucide-react"
import { cn } from "@/conference-backend-core/lib/utils"
import { LoadingSpinner } from "./loading-spinner"
import { ErrorMessage } from "./error-message"

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  searchable?: boolean
  filterable?: boolean
  render?: (value: any, row: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string
  searchPlaceholder?: string
  emptyMessage?: string
  pageSize?: number
  showPagination?: boolean
  showSearch?: boolean
  showFilter?: boolean
  showExport?: boolean
  onExport?: () => void
  onRowClick?: (row: T, index: number) => void
  className?: string
  rowClassName?: (row: T, index: number) => string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  searchPlaceholder = "Search...",
  emptyMessage = "No data available",
  pageSize = 10,
  showPagination = true,
  showSearch = true,
  showFilter = true,
  showExport = false,
  onExport,
  onRowClick,
  className,
  rowClassName
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Get searchable columns
  const searchableColumns = columns.filter(col => col.searchable)
  
  // Get filterable columns
  const filterableColumns = columns.filter(col => col.filterable)

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchTerm && searchableColumns.length > 0) {
      result = result.filter(row =>
        searchableColumns.some(column =>
          String(row[column.key] || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([columnKey, filterValue]) => {
      if (filterValue && filterValue !== '__all__') {
        result = result.filter(row =>
          String(row[columnKey] || "")
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        )
      }
    })

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        
        if (aValue === bValue) return 0
        
        const comparison = aValue < bValue ? -1 : 1
        return sortDirection === "asc" ? comparison : -comparison
      })
    }

    return result
  }, [data, searchTerm, filters, sortColumn, sortDirection, searchableColumns])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredData
    
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize, showPagination])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }

  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const resetFilters = () => {
    setFilters({})
    setSearchTerm("")
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        </div>
        <div className="border rounded-lg">
          <div className="p-8">
            <LoadingSpinner size="lg" text="Loading data..." />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorMessage
        title="Data Loading Error"
        message={error}
        action={{ label: "Retry", onClick: () => window.location.reload() }}
      />
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Controls */}
      {(showSearch || showFilter || showExport) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            {showSearch && searchableColumns.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            )}

            {showFilter && filterableColumns.map((column) => (
              <Select
                key={column.key}
                value={filters[column.key] || ""}
                onValueChange={(value) => handleFilterChange(column.key, value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={`Filter by ${column.label}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All {column.label}</SelectItem>
                  {Array.from(new Set(data.map(row => row[column.key])))
                    .filter(Boolean)
                    .map(value => (
                      <SelectItem key={String(value)} value={String(value)}>
                        {String(value)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ))}

            {(Object.keys(filters).length > 0 || searchTerm) && (
              <Button variant="outline" onClick={resetFilters} size="sm">
                Clear Filters
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {showExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.headerClassName,
                    column.sortable && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                    rowClassName?.(row, index)
                  )}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={column.className}
                    >
                      {column.render
                        ? column.render(row[column.key], row, index)
                        : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} to{" "}
            {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}