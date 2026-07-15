"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Edit, Plus, Building2, Package, TrendingUp, Download, Upload } from "lucide-react"
import type { Product, Invoice } from "@/types/app"
import { formatCurrency, generateId, getCurrentDate } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { generateVendorsPDF } from "@/components/data-export-pdf-generator"
import { exportVendorsToExcel, importVendorsFromExcel } from "@/lib/excel-utils"
import { useToast } from "@/hooks/use-toast"
import { savePDFToDatabase } from "@/lib/pdf-utils"

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
}

interface VendorManagementProps {
  products: Product[]
  onUpdateProduct: (product: Product) => void
  currentAppCurrency: string
  allInvoices: Invoice[]
  vendors: Vendor[]
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>
  onAddVendor: (vendor: Vendor) => void
  onUpdateVendor: (vendor: Vendor) => void
  onDeleteVendor: (vendorId: string) => void
}

export function VendorManagement({
  products,
  onUpdateProduct,
  currentAppCurrency,
  allInvoices,
  vendors,
  setVendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
}: VendorManagementProps) {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
    })
  }

  const handleAddVendor = () => {
    const newVendor: Vendor = {
      id: generateId(),
      ...formData,
      createdAt: getCurrentDate(),
    }
    onAddVendor(newVendor)
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateVendor = () => {
    if (editingVendor) {
      const updatedVendor: Vendor = {
        ...editingVendor,
        ...formData,
      }
      onUpdateVendor(updatedVendor)
      setIsEditDialogOpen(false)
      setEditingVendor(null)
      resetForm()
    }
  }

  const handleDeleteVendor = (vendorId: string) => {
    onDeleteVendor(vendorId)
  }

  const handleViewVendor = (vendor: Vendor) => {
    setViewingVendor(vendor)
    setIsViewDialogOpen(true)
  }

  const handleDownloadAllVendors = async () => {
    const doc = await generateVendorsPDF(vendors, products, currentAppCurrency)
    doc.save(`vendors-detailed-${getCurrentDate()}.pdf`)

    // Save to database
    await savePDFToDatabase(doc, {
      filename: `vendors-detailed-${getCurrentDate()}.pdf`,
      type: "vendors",
    })
  }

  const handleDownloadAllVendorsExcel = () => {
    exportVendorsToExcel(vendors, products)
  }

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    importVendorsFromExcel(
      file,
      (importedVendors) => {
        setVendors([...vendors, ...importedVendors])
        setIsUploadDialogOpen(false)
        toast({
          title: "Success",
          description: `Successfully imported ${importedVendors.length} vendors from Excel`,
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

    // Reset input
    event.target.value = ""
  }

  const getVendorProducts = (vendorId: string) => {
    return products.filter((product) => product.vendorId === vendorId)
  }

  const getVendorStats = (vendorId: string) => {
    const vendorProducts = getVendorProducts(vendorId)
    const totalProducts = vendorProducts.length
    const totalStock = vendorProducts.reduce((sum, product) => sum + (Number(product.stock) || 0), 0)
    const totalValue = vendorProducts.reduce(
      (sum, product) => sum + (Number(product.unitPrice) || 0) * (Number(product.stock) || 0),
      0,
    )

    return {
      totalProducts,
      totalStock,
      totalValue,
    }
  }

  const getProductOverallSalesDetails = (productId: string) => {
    let totalQuantitySold = 0
    let totalSalesValue = 0

    allInvoices.forEach((invoice) => {
      const item = invoice.items.find((item) => item.productId === productId)
      if (item) {
        const quantity = Number(item.quantity) || 0
        const unitPrice = Number(item.unitPrice) || 0
        totalQuantitySold += quantity
        totalSalesValue += quantity * unitPrice
      }
    })

    return {
      totalQuantitySold,
      totalSalesValue,
    }
  }

  const getVendorProductProfitability = (vendorId: string) => {
    const vendorProducts = getVendorProducts(vendorId)

    return vendorProducts.map((product) => {
      const totalPurchased = product.purchaseHistory.reduce((sum, purchase) => sum + (Number(purchase.quantity) || 0), 0)
      const totalPurchaseCost = product.purchaseHistory.reduce(
        (sum, purchase) => sum + (Number(purchase.totalCost) || 0),
        0,
      )

      const salesDetails = getProductOverallSalesDetails(product.id)
      const overallProfit = salesDetails.totalSalesValue - salesDetails.totalQuantitySold * (Number(product.costPrice) || 0)

      return {
        ...product,
        totalPurchased,
        totalPurchaseCost,
        totalQuantitySold: salesDetails.totalQuantitySold,
        totalSalesValue: salesDetails.totalSalesValue,
        overallProfit,
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Building2 className="mr-3 h-8 w-8" />
              Vendor Management
            </h1>
            <p className="text-purple-100">Manage your suppliers and vendor relationships</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadAllVendorsExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Excel Sheet
            </Button>
            <Button
              onClick={handleDownloadAllVendors}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF
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
                    Upload Vendors from Excel
                  </DialogTitle>
                  <DialogDescription>
                    Upload an Excel file with vendor information. The file should have columns: Vendor Name, Email,
                    Phone, Address
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-blue-400 mb-3" />
                    <Label
                      htmlFor="excel-upload"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Click to select Excel file
                    </Label>
                    <Input
                      id="excel-upload"
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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30" size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-purple-700 flex items-center">
                    <Plus className="mr-2 h-6 w-6" />
                    Add New Vendor
                  </DialogTitle>
                  <DialogDescription>Create a new vendor profile for your suppliers.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="font-medium">
                      Vendor Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter vendor name"
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="font-medium">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="font-medium">
                      Address
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter address"
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>
                  <Button
                    onClick={handleAddVendor}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Add Vendor
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid gap-6">
        {vendors.map((vendor) => {
          const stats = getVendorStats(vendor.id)
          return (
            <Card key={vendor.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{vendor.name}</h3>
                      <p className="text-gray-600">{vendor.email}</p>
                      <p className="text-sm text-gray-500">{vendor.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewVendor(vendor)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditVendor(vendor)}
                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {currentUser?.role === "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVendor(vendor.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
                    <p className="text-sm text-gray-600">Products</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.totalStock}</p>
                    <p className="text-sm text-gray-600">Total Stock</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(stats.totalValue, currentAppCurrency)}
                    </p>
                    <p className="text-sm text-gray-600">Inventory Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* View Vendor Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-700 flex items-center">
              <Building2 className="mr-2 h-6 w-6" />
              Vendor Details: {viewingVendor?.name}
            </DialogTitle>
            <DialogDescription>Complete vendor information and product details</DialogDescription>
          </DialogHeader>
          {viewingVendor && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Vendor Info</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="profitability">Profitability</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900">
                      <Building2 className="mr-2 h-5 w-5 text-purple-600" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Name</Label>
                        <p className="text-gray-900 font-medium">{viewingVendor.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <p className="text-gray-900">{viewingVendor.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phone</Label>
                        <p className="text-gray-900">{viewingVendor.phone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Created</Label>
                        <p className="text-gray-900">{viewingVendor.createdAt}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Address</Label>
                      <p className="text-gray-900">{viewingVendor.address}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="space-y-4">
                <div className="grid gap-4">
                  {getVendorProducts(viewingVendor.id).map((product) => (
                    <Card key={product.id} className="border-l-4 border-l-pink-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-pink-100 p-2 rounded-full">
                              <Package className="h-6 w-6 text-pink-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{product.name}</h4>
                              <p className="text-sm text-gray-600">{product.description}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <Badge variant="outline" className="border-purple-200 text-purple-700">
                                  SKU: {product.sku}
                                </Badge>
                                <Badge variant="outline" className="border-pink-200 text-pink-700">
                                  {product.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(product.unitPrice, currentAppCurrency)}
                            </p>
                            <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                            <p className="text-sm text-green-600">
                              Cost: {formatCurrency(product.costPrice, currentAppCurrency)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="profitability" className="space-y-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900">
                      <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                      Product Profitability Overview
                    </CardTitle>
                    <CardDescription>
                      Detailed analysis of purchases, sales, and profits for each product from this vendor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getVendorProductProfitability(viewingVendor.id).map((product) => (
                        <div
                          key={product.id}
                          className="border border-purple-200 rounded-lg p-4 hover:bg-purple-50/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{product.name}</h4>
                              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                            </div>
                            <Badge
                              variant={product.overallProfit >= 0 ? "default" : "destructive"}
                              className={product.overallProfit >= 0 ? "bg-green-100 text-green-800" : ""}
                            >
                              {product.overallProfit >= 0 ? "Profitable" : "Loss"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <p className="text-gray-600 font-medium">Total Purchased</p>
                              <p className="font-bold text-blue-600">{product.totalPurchased} units</p>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(product.totalPurchaseCost, currentAppCurrency)}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <p className="text-gray-600 font-medium">Total Sold</p>
                              <p className="font-bold text-green-600">{product.totalQuantitySold} units</p>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(product.totalSalesValue, currentAppCurrency)}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-yellow-50 rounded">
                              <p className="text-gray-600 font-medium">Current Stock</p>
                              <p className="font-bold text-yellow-600">{product.stock} units</p>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded">
                              <p className="text-gray-600 font-medium">Unit Profit</p>
                              <p className="font-bold text-purple-600">
                                {formatCurrency(product.unitPrice - product.costPrice, currentAppCurrency)}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <p className="text-gray-600 font-medium">Overall Profit</p>
                              <p className="font-bold text-green-600">
                                {formatCurrency(product.overallProfit, currentAppCurrency)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-700 flex items-center">
              <Edit className="mr-2 h-6 w-6" />
              Edit Vendor
            </DialogTitle>
            <DialogDescription>Update vendor information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="font-medium">
                Vendor Name
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter vendor name"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="font-medium">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone" className="font-medium">
                Phone
              </Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>
            <div>
              <Label htmlFor="edit-address" className="font-medium">
                Address
              </Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Enter address"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>
            <Button
              onClick={handleUpdateVendor}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Update Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
