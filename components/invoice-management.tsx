"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  CalendarIcon,
  Filter,
  X,
  Hash,
  DollarSign,
  Activity,
  TrendingUp,
  Package,
  Upload,
} from "lucide-react"
import type { Invoice, Product } from "@/types/app"
import type { User as AuthUser } from "@/types/auth"
import { generateInvoicesSummaryPDF } from "@/components/data-export-pdf-generator"
import { exportInvoicesToExcel, importInvoicesFromExcel } from "@/lib/excel-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface InvoiceManagementProps {
  invoices: Invoice[]
  products: Product[]
  customers: any[]
  onViewInvoice: (invoice: Invoice) => void
  onEditInvoice: (invoice: Invoice) => void
  onDeleteInvoice: (invoiceId: string) => void
  onCreateInvoice: () => void
  onDownloadPdf: (invoice: Invoice) => void
  onDownloadCustomerInvoices: (customerName: string) => void
  onMarkInvoiceAsPaid: (invoiceId: string) => void
  onAddInvoices: (invoices: Invoice[]) => void
  currentAppCurrency: string
  user: AuthUser
}

export function InvoiceManagement({
  invoices,
  products,
  customers,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onCreateInvoice,
  onDownloadPdf,
  onDownloadCustomerInvoices,
  onMarkInvoiceAsPaid,
  onAddInvoices,
  currentAppCurrency,
  user,
}: InvoiceManagementProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [amountRange, setAmountRange] = useState({ min: "", max: "" })
  const [profitRange, setProfitRange] = useState({ min: "", max: "" })
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.trackingId && invoice.trackingId.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter

      const invoiceDate = new Date(invoice.createdAt)
      const matchesDateRange =
        (!dateRange.from || invoiceDate >= dateRange.from) && (!dateRange.to || invoiceDate <= dateRange.to)

      const matchesAmountRange =
        (!amountRange.min || invoice.totalAmount >= Number(amountRange.min)) &&
        (!amountRange.max || invoice.totalAmount <= Number(amountRange.max))

      const matchesProfitRange =
        (!profitRange.min || invoice.totalProfit >= Number(profitRange.min)) &&
        (!profitRange.max || invoice.totalProfit <= Number(profitRange.max))

      return matchesSearch && matchesStatus && matchesDateRange && matchesAmountRange && matchesProfitRange
    })
  }, [invoices, searchTerm, statusFilter, dateRange, amountRange, profitRange])

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDateRange({})
    setAmountRange({ min: "", max: "" })
    setProfitRange({ min: "", max: "" })
  }

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    dateRange.from ||
    dateRange.to ||
    amountRange.min ||
    amountRange.max ||
    profitRange.min ||
    profitRange.max

  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const totalProfit = filteredInvoices.reduce((sum, invoice) => sum + invoice.totalProfit, 0)
  const completedInvoices = filteredInvoices.filter((inv) => inv.status === "completed").length
  const pendingInvoices = filteredInvoices.filter((inv) => inv.status === "pending").length
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const handleDownloadAllInvoices = async () => {
    await generateInvoicesSummaryPDF(filteredInvoices, currentAppCurrency)
    toast({
      title: "PDF Downloaded",
      description: `All ${filteredInvoices.length} invoices exported to PDF.`,
    })
  }

  const handleDownloadAllInvoicesExcel = () => {
    exportInvoicesToExcel(filteredInvoices, customers, products)
    toast({
      title: "Excel Downloaded",
      description: `All ${filteredInvoices.length} invoices exported to Excel.`,
    })
  }

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    importInvoicesFromExcel(
      file,
      (importedInvoices) => {
        onAddInvoices(importedInvoices)
        setIsUploadDialogOpen(false)
        toast({
          title: "Invoices Imported",
          description: `Successfully imported ${importedInvoices.length} invoices from Excel.`,
        })
      },
      (error) => {
        toast({
          title: "Import Failed",
          description: error,
          variant: "destructive",
        })
      },
    )
    event.target.value = ""
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <FileText className="mr-3 h-8 w-8" />
              Invoice Management
            </h1>
            <p className="text-purple-100">Manage and track all your invoices with comprehensive analytics</p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 rounded-lg p-4">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
              <Package className="mr-2 h-4 w-4" />
              {filteredInvoices.length} Invoices
            </Badge>
            {hasActiveFilters && (
              <Badge className="bg-yellow-500/20 text-yellow-100 border-yellow-300/30 px-4 py-2">
                Filtered Results
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadAllInvoicesExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Excel Sheet
            </Button>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Excel Sheet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-purple-700 flex items-center">
                    <Upload className="mr-2 h-6 w-6" />
                    Upload Invoices from Excel
                  </DialogTitle>
                  <DialogDescription>Upload an Excel file with invoice information.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-purple-400 mb-3" />
                    <Label
                      htmlFor="invoice-excel-upload"
                      className="cursor-pointer text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Click to select Excel file
                    </Label>
                    <Input
                      id="invoice-excel-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-2">Supports .xlsx and .xls files</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleDownloadAllInvoices}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
            <Button
              onClick={onCreateInvoice}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
            <div className="bg-blue-100 p-2 rounded-full">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{filteredInvoices.length}</div>
            <p className="text-sm text-gray-500 mt-1">{hasActiveFilters ? "Filtered results" : "Total in system"}</p>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {Math.round((filteredInvoices.length / invoices.length) * 100)}% of total
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <div className="bg-green-100 p-2 rounded-full">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue, currentAppCurrency)}</div>
            <p className="text-sm text-gray-500 mt-1">From selected invoices</p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm font-medium text-green-600">
                Avg:{" "}
                {formatCurrency(
                  filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0,
                  currentAppCurrency,
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Profit</CardTitle>
            <div className="bg-purple-100 p-2 rounded-full">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalProfit, currentAppCurrency)}</div>
            <div className="flex items-center mt-1 space-x-2">
              <span className="text-sm text-purple-600 font-medium">{profitMargin.toFixed(1)}% margin</span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(profitMargin, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Status Overview</CardTitle>
              <div className="bg-orange-100 p-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{completedInvoices}</div>
            <p className="text-sm text-gray-500 mt-1">Completed invoices</p>
            <div className="flex items-center mt-2 space-x-2">
              <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
                {completedInvoices} Done
              </Badge>
              <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 text-xs">
                {pendingInvoices} Pending
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by Invoice ID, tracking ID, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`border-blue-200 ${hasActiveFilters ? "border-blue-500 text-blue-600 bg-blue-50" : ""}`}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && <span className="ml-1 text-xs">(Active)</span>}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Advanced Filters */}
        {showFilters && (
          <CardContent className="border-t bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-white">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? formatDate(dateRange.from.toISOString()) : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-white">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? formatDate(dateRange.to.toISOString()) : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <Label>Amount Range ({currentAppCurrency})</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={amountRange.min}
                    onChange={(e) => setAmountRange((prev) => ({ ...prev, min: e.target.value }))}
                    className="bg-white"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={amountRange.max}
                    onChange={(e) => setAmountRange((prev) => ({ ...prev, max: e.target.value }))}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Profit Range Filter */}
              <div className="space-y-2">
                <Label>Profit Range ({currentAppCurrency})</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={profitRange.min}
                    onChange={(e) => setProfitRange((prev) => ({ ...prev, min: e.target.value }))}
                    className="bg-white"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={profitRange.max}
                    onChange={(e) => setProfitRange((prev) => ({ ...prev, max: e.target.value }))}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Invoices Table */}
      <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-600" />
            Invoices ({filteredInvoices.length})
            {hasActiveFilters && <span className="text-sm font-normal text-gray-500 ml-2">(filtered)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {hasActiveFilters ? "Try adjusting your filters" : "Get started by creating a new invoice"}
              </p>
              {!hasActiveFilters && (
                <div className="mt-6">
                  <Button
                    onClick={onCreateInvoice}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                    <th className="text-left p-4 font-medium text-gray-900">Invoice ID</th>
                    <th className="text-left p-4 font-medium text-gray-900">Tracking ID</th>
                    <th className="text-left p-4 font-medium text-gray-900">Customer</th>
                    <th className="text-left p-4 font-medium text-gray-900">Date</th>
                    <th className="text-left p-4 font-medium text-gray-900">Amount</th>
                    <th className="text-left p-4 font-medium text-gray-900">Profit</th>
                    <th className="text-left p-4 font-medium text-gray-900">Status</th>
                    <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-purple-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-purple-700 font-mono">{invoice.id}</div>
                      </td>
                      <td className="p-4">
                        {invoice.trackingId ? (
                          <div className="flex items-center text-blue-600">
                            <Hash className="h-3 w-3 mr-1" />
                            <span className="font-mono text-sm">{invoice.trackingId}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No tracking ID</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900">{invoice.customerName}</div>
                          <div className="text-sm text-gray-600">{invoice.customerEmail}</div>
                          {invoice.customerPhone && (
                            <div className="text-sm text-gray-600">{invoice.customerPhone}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{formatDate(invoice.createdAt)}</td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(invoice.totalAmount, currentAppCurrency)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`font-medium ${invoice.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(invoice.totalProfit, currentAppCurrency)}
                        </div>
                        <div className="text-sm text-gray-500">{(invoice.profitPercentage ?? 0).toFixed(1)}%</div>
                      </td>
                      <td className="p-4">{getStatusBadge(invoice.status)}</td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewInvoice(invoice)}
                            title="View Invoice"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditInvoice(invoice)}
                            title="Edit Invoice"
                            className="border-purple-200 text-purple-600 hover:bg-purple-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDownloadPdf(invoice)}
                            title="Download PDF"
                            className="border-green-200 text-green-600 hover:bg-green-50"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onMarkInvoiceAsPaid(invoice.id)}
                              className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {user?.role === "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDeleteInvoice(invoice.id)}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                              title="Delete Invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
