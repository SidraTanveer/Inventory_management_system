"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Invoice, Product, User } from "@/types/app"
import { formatCurrency } from "@/lib/utils"
import { Search, Calendar, Download, Eye, Edit, Trash2, Plus, CheckCircle } from "lucide-react"
import { InvoiceCreateDialog } from "@/components/invoice-create-dialog"
import { generateDailyOrdersPDF } from "@/components/daily-orders-pdf-generator"
import { exportDailyOrdersToExcel } from "@/lib/excel-utils"
import { useToast } from "@/hooks/use-toast"

// Helper ⚡
const normalizeStatus = (status?: Invoice["status"]): Invoice["status"] => status ?? "pending"

const formatStatusLabel = (status?: Invoice["status"]) => {
  const s = normalizeStatus(status)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface DailyOrdersProps {
  invoices: Invoice[]
  products: Product[]
  onViewInvoice: (invoice: Invoice) => void
  onEditInvoice: (invoice: Invoice) => void
  onDeleteInvoice: (invoiceId: string) => void
  onCreateInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => void
  onDownloadPdf: (invoice: Invoice) => void
  onDownloadCustomerInvoices: (customerName: string) => void
  onMarkInvoiceAsPaid: (invoiceId: string) => void
  currentAppCurrency: string
  user: User
}

export function DailyOrders({
  invoices,
  products,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onCreateInvoice,
  onDownloadPdf,
  onDownloadCustomerInvoices,
  onMarkInvoiceAsPaid,
  currentAppCurrency,
  user,
}: DailyOrdersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const { toast } = useToast()

  // Get customers from invoices for the create dialog
  const customers = useMemo(() => {
    const uniqueCustomers = new Map()
    invoices.forEach((invoice) => {
      if (!uniqueCustomers.has(invoice.customerEmail)) {
        uniqueCustomers.set(invoice.customerEmail, {
          id: `cust-${invoice.customerEmail}`,
          name: invoice.customerName,
          email: invoice.customerEmail,
          phone: invoice.customerPhone,
          type: "frequent",
          createdAt: invoice.createdAt,
        })
      }
    })
    return Array.from(uniqueCustomers.values())
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    let filtered = invoices

    // Filter by selected date
    if (selectedDate) {
      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.createdAt).toISOString().split("T")[0]
        return invoiceDate === selectedDate
      })
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((invoice) => normalizeStatus(invoice.status) === filterStatus)
    }

    // Filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (invoice) =>
          invoice.id.toLowerCase().includes(lowerCaseSearchTerm) ||
          invoice.customerName.toLowerCase().includes(lowerCaseSearchTerm) ||
          invoice.customerEmail.toLowerCase().includes(lowerCaseSearchTerm) ||
          invoice.items.some((item) => item.productName.toLowerCase().includes(lowerCaseSearchTerm)),
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [invoices, selectedDate, filterStatus, searchTerm])

  const dailyStats = useMemo(() => {
    const todayInvoices = filteredInvoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt).toISOString().split("T")[0]
      return invoiceDate === selectedDate
    })

    const totalOrders = todayInvoices.length
    const totalRevenue = todayInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    const totalProfit = todayInvoices.reduce((sum, invoice) => sum + invoice.totalProfit, 0)
    const completedOrders = todayInvoices.filter((invoice) => normalizeStatus(invoice.status) === "completed").length
    const pendingOrders = todayInvoices.filter((invoice) => normalizeStatus(invoice.status) === "pending").length

    return {
      totalOrders,
      totalRevenue,
      totalProfit,
      completedOrders,
      pendingOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    }
  }, [filteredInvoices, selectedDate])

  const getStatusColor = (status?: Invoice["status"]) => {
    switch (normalizeStatus(status)) {
      case "pending":
        return "text-yellow-600"
      case "completed":
        return "text-green-600"
      case "cancelled":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const handleDownloadAllOrders = async () => {
    if (filteredInvoices.length === 0) {
      toast({
        title: "No Orders",
        description: "There are no orders to download for the selected date.",
        variant: "destructive",
      })
      return
    }

    setIsDownloadingAll(true)
    try {
      await generateDailyOrdersPDF(filteredInvoices, selectedDate, currentAppCurrency)
      toast({
        title: "PDF Downloaded Successfully",
        description: `Daily orders report for ${selectedDate} has been downloaded.`,
      })
    } catch (error) {
      console.error("Error downloading daily orders PDF:", error)
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingAll(false)
    }
  }

  const handleDownloadAllOrdersExcel = () => {
    if (filteredInvoices.length === 0) {
      toast({
        title: "No Orders",
        description: "There are no orders to download for the selected date.",
        variant: "destructive",
      })
      return
    }

    exportDailyOrdersToExcel(filteredInvoices, [], new Date(selectedDate))
    toast({
      title: "Excel Downloaded Successfully",
      description: `Daily orders report for ${selectedDate} has been downloaded.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Calendar className="mr-3 h-8 w-8" />
              Daily Orders
            </h1>
            <p className="text-blue-100">Track and manage your daily sales orders</p>
          </div>
          {user?.role === "admin" && (
            <Button
              onClick={() => setIsCreateInvoiceOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Order
            </Button>
          )}
        </div>
      </div>

      {/* Daily Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{dailyStats.totalOrders}</div>
            <p className="text-sm text-gray-600">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dailyStats.totalRevenue, currentAppCurrency)}
            </div>
            <p className="text-sm text-gray-600">Revenue</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(dailyStats.totalProfit, currentAppCurrency)}
            </div>
            <p className="text-sm text-gray-600">Profit</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{dailyStats.pendingOrders}</div>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{dailyStats.completedOrders}</div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(dailyStats.averageOrderValue, currentAppCurrency)}
            </div>
            <p className="text-sm text-gray-600">Avg Order</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Search className="mr-2 h-5 w-5 text-blue-600" />
              <CardTitle className="text-gray-900">Filter Daily Orders</CardTitle>
            </div>
            {filteredInvoices.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadAllOrdersExcel}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel Sheet
                </Button>
                <Button
                  onClick={handleDownloadAllOrders}
                  disabled={isDownloadingAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloadingAll ? "Generating..." : "Download PDF"}
                </Button>
              </div>
            )}
          </div>
          <CardDescription>Filter orders by date, status, and search terms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="space-y-2">
              <label htmlFor="date-select" className="text-sm font-medium">
                Select Date
              </label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[200px] border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by Invoice ID, customer, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Select onValueChange={setFilterStatus} defaultValue="all">
              <SelectTrigger className="w-[180px] border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <TableHead className="font-semibold text-gray-700">Invoice ID</TableHead>
                    <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-700">Profit</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Time</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-blue-50/50 transition-colors">
                      <TableCell className="font-medium text-blue-700 font-mono">{invoice.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{invoice.customerName}</p>
                          <p className="text-sm text-gray-500">{invoice.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {formatCurrency(invoice.totalAmount, currentAppCurrency)}
                      </TableCell>
                      <TableCell
                        className={
                          invoice.totalProfit >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
                        }
                      >
                        {formatCurrency(invoice.totalProfit, currentAppCurrency)}
                      </TableCell>
                      <TableCell className={`font-medium ${getStatusColor(invoice.status)}`}>
                        {formatStatusLabel(invoice.status)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(invoice.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewInvoice(invoice)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user?.role === "admin" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditInvoice(invoice)}
                                className="border-purple-200 text-purple-600 hover:bg-purple-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDeleteInvoice(invoice.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {normalizeStatus(invoice.status) === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onMarkInvoiceAsPaid(invoice.id)}
                                  className="border-green-200 text-green-600 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDownloadPdf(invoice)}
                            className="border-green-200 text-green-600 hover:bg-green-50"
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
          ) : (
            <div className="text-center py-12">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-gray-500 mb-4">No orders found for the selected date</p>
              {user?.role === "admin" && (
                <Button
                  onClick={() => setIsCreateInvoiceOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Order Today
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Create Dialog */}
      <InvoiceCreateDialog
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSave={onCreateInvoice}
        products={products}
        customers={customers}
        existingInvoices={invoices}
        currentAppCurrency={currentAppCurrency}
        isAdmin={user?.role === "admin"}
      />
    </div>
  )
}
