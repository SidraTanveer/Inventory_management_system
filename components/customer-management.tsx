"use client"

import { DialogDescription } from "@/components/ui/dialog"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Users, Download, Upload } from "lucide-react"
import type { Customer, Invoice } from "@/types/app"
import { formatDate, getCurrentDate, generateId } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { generateCustomersPDF } from "@/components/data-export-pdf-generator"
import { exportCustomersToExcel, importCustomersFromExcel } from "@/lib/excel-utils"
import { savePDFToDatabase } from "@/lib/pdf-utils"

interface CustomerManagementProps {
  customers: Customer[]
  invoices: Invoice[]
  currentAppCurrency: string
  onAddCustomer: (customer: Customer) => void
  onUpdateCustomer: (customer: Customer) => void
  onDeleteCustomer: (customerId: string) => void // Soft delete
}

export function CustomerManagement({
  customers,
  invoices,
  currentAppCurrency,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}: CustomerManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "frequent" | "new">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerType, setCustomerType] = useState<"frequent" | "new">("new")
  const { toast } = useToast()

  const filteredCustomers = useMemo(() => {
    let filtered = customers

    if (filterType !== "all") {
      filtered = filtered.filter((customer) => customer.type === filterType)
    }

    if (!searchTerm) {
      return filtered
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return filtered.filter(
      (customer) =>
        customer.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        customer.email.toLowerCase().includes(lowerCaseSearchTerm) ||
        customer.phone.toLowerCase().includes(lowerCaseSearchTerm),
    )
  }, [customers, searchTerm, filterType])

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setCustomerName(customer.name)
      setCustomerEmail(customer.email)
      setCustomerPhone(customer.phone)
      setCustomerType(customer.type)
    } else {
      setEditingCustomer(null)
      setCustomerName("")
      setCustomerEmail("")
      setCustomerPhone("")
      setCustomerType("new")
    }
    setIsDialogOpen(true)
  }

  const handleSaveCustomer = () => {
    if (!customerName || !customerEmail || !customerPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all customer details.",
        variant: "destructive",
      })
      return
    }

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        type: customerType,
      })
      toast({ title: "Customer Updated", description: `${customerName} has been updated.` })
    } else {
      onAddCustomer({
        id: generateId(),
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        type: customerType,
        createdAt: getCurrentDate(),
      })
      toast({ title: "Customer Added", description: `${customerName} has been added.` })
    }
    setIsDialogOpen(false)
  }

  const handleDownloadAllCustomers = async () => {
    const doc = await generateCustomersPDF(customers, invoices, currentAppCurrency)
    doc.save(`customers-detailed-${new Date().toISOString().split("T")[0]}.pdf`)

    // Save to database
    await savePDFToDatabase(doc, {
      filename: `customers-detailed-${new Date().toISOString().split("T")[0]}.pdf`,
      type: "customers",
    })

    toast({
      title: "PDF Downloaded",
      description: `All ${customers.length} customers exported to PDF.`,
    })
  }

  const handleDownloadAllCustomersExcel = () => {
    exportCustomersToExcel(customers, [])
    toast({
      title: "Excel Downloaded",
      description: `All ${customers.length} customers exported to Excel.`,
    })
  }

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    importCustomersFromExcel(
      file,
      (importedCustomers) => {
        importedCustomers.forEach((customer) => onAddCustomer(customer))
        setIsUploadDialogOpen(false)
        toast({
          title: "Success",
          description: `Successfully imported ${importedCustomers.length} customers from Excel`,
        })
      },
      (error) => {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        })
      },
    )
    event.target.value = ""
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Users className="mr-3 h-8 w-8" />
              Customer Management
            </h1>
            <p className="text-blue-100">Manage your frequent and new customer records</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadAllCustomersExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Excel Sheet
            </Button>
            <Button
              onClick={handleDownloadAllCustomers}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add New Customer
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
                  <DialogTitle className="text-2xl font-bold text-blue-700 flex items-center">
                    <Upload className="mr-2 h-6 w-6" />
                    Upload Customers from Excel
                  </DialogTitle>
                  <DialogDescription>Upload an Excel file with customer information.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-blue-400 mb-3" />
                    <Label
                      htmlFor="customer-excel-upload"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Click to select Excel file
                    </Label>
                    <Input
                      id="customer-excel-upload"
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
          </div>
        </div>
      </div>

      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Search className="mr-2 h-5 w-5 text-blue-600" />
            Search & Filter Customers
          </CardTitle>
          <CardDescription>Find customers by name, email, phone, or type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Select onValueChange={(value: "all" | "frequent" | "new") => setFilterType(value)} defaultValue="all">
              <SelectTrigger className="w-[180px] border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="frequent">Frequent</SelectItem>
                <SelectItem value="new">New</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700">Phone</TableHead>
                    <TableHead className="font-semibold text-gray-700">Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">Created At</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-blue-50/50 transition-colors">
                      <TableCell className="font-medium text-blue-700">{customer.name}</TableCell>
                      <TableCell className="text-gray-600">{customer.email}</TableCell>
                      <TableCell className="text-gray-600">{customer.phone}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            customer.type === "frequent"
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                          }
                        >
                          {customer.type ? customer.type.charAt(0).toUpperCase() + customer.type.slice(1) : "New"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{formatDate(customer.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(customer)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteCustomer(customer.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-gray-500 mb-4">No customers found matching your search or filters.</p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Customer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Name</Label>
              <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerType">Type</Label>
              <Select value={customerType} onValueChange={(value: "frequent" | "new") => setCustomerType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="frequent">Frequent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomer}>{editingCustomer ? "Save Changes" : "Add Customer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
