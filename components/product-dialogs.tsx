"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Package, DollarSign, History, Search, Download, Upload } from "lucide-react"
import { generateProductPDF, generateAllProductsPDF } from "@/components/product-pdf-generator"
import { exportProductsToExcel, importProductsFromExcel } from "@/lib/excel-utils"
import type { Product, PurchaseHistoryItem } from "@/types/app"
import { formatCurrency, generateId, formatDate, getCurrentDate } from "@/lib/utils"
import { savePDFToDatabase } from "@/lib/pdf-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define Vendor type here for use in ProductDialogs
interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
}

interface ProductDialogsProps {
  products: Product[]
  onAddProduct: (product: Product) => void
  onUpdateProduct: (product: Product) => void
  onDeleteProduct: (productId: string, productName: string) => void // Changed to soft delete
  currentAppCurrency: string
  user: any // Assuming user type from useAuth
  vendors: Vendor[] // Add vendors prop
}

export function ProductDialogs({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct, // Destructure new prop
  currentAppCurrency,
  user,
  vendors, // Destructure vendors from props
}: ProductDialogsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unitPrice: "",
    costPrice: "",
    stock: "",
    vendorId: "",
    category: "",
    sku: "",
  })
  const [purchaseHistoryFormData, setPurchaseHistoryFormData] = useState({
    date: "",
    quantity: "",
    unitCost: "",
  })

  const handleDownloadProductPdf = async (product: Product) => {
    try {
      setIsDownloadingPdf(true)
      const vendor = vendors.find((v) => v.id === product.vendorId)
      const doc = await generateProductPDF(product, vendor, currentAppCurrency)
      doc.save(`product-${product.sku}-${product.name.replace(/\s/g, "_")}.pdf`)

      // Save to database
      await savePDFToDatabase(doc, {
        filename: `product-${product.sku}-${product.name.replace(/\s/g, "_")}.pdf`,
        type: "product",
        entity_id: product.id,
        entity_type: "product",
      })
    } catch (error) {
      console.error("Error generating product PDF:", error)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleDownloadAllProductsPdf = async () => {
    try {
      setIsDownloadingPdf(true)
      const doc = await generateAllProductsPDF(products, vendors, currentAppCurrency)
      doc.save(`all-products-inventory-${getCurrentDate()}.pdf`)

      // Save to database
      await savePDFToDatabase(doc, {
        filename: `all-products-inventory-${getCurrentDate()}.pdf`,
        type: "products_export",
      })
    } catch (error) {
      console.error("Error generating all products PDF:", error)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleDownloadAllProductsExcel = () => {
    exportProductsToExcel(products, vendors)
  }

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    importProductsFromExcel(
      file,
      vendors,
      (importedProducts) => {
        importedProducts.forEach((product) => onAddProduct(product))
        setIsUploadDialogOpen(false)
        // Show success toast
      },
      (error) => {
        // Show error toast
      },
    )
    event.target.value = ""
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      unitPrice: "",
      costPrice: "",
      stock: "",
      vendorId: "",
      category: "",
      sku: "",
    })
    setPurchaseHistoryFormData({
      date: "",
      quantity: "",
      unitCost: "",
    })
  }

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description,
        unitPrice: editingProduct.unitPrice.toString(),
        costPrice: editingProduct.costPrice.toString(),
        stock: editingProduct.stock.toString(),
        vendorId: editingProduct.vendorId,
        category: editingProduct.category,
        sku: editingProduct.sku,
      })
    }
  }, [editingProduct])

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: generateId(),
      name: formData.name,
      description: formData.description,
      unitPrice: Number.parseFloat(formData.unitPrice),
      costPrice: Number.parseFloat(formData.costPrice),
      stock: Number.parseInt(formData.stock, 10),
      vendorId: formData.vendorId,
      category: formData.category,
      sku: formData.sku,
      purchaseHistory: [],
    }
    onAddProduct(newProduct)
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsEditDialogOpen(true)
  }

  const handleUpdateProduct = () => {
    if (editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        name: formData.name,
        description: formData.description,
        unitPrice: Number.parseFloat(formData.unitPrice),
        costPrice: Number.parseFloat(formData.costPrice),
        stock: Number.parseInt(formData.stock, 10),
        vendorId: formData.vendorId,
        category: formData.category,
        sku: formData.sku,
      }
      onUpdateProduct(updatedProduct)
      setIsEditDialogOpen(false)
      setEditingProduct(null)
      resetForm()
    }
  }

  const handleDeleteProduct = (productId: string, productName: string) => {
    onDeleteProduct(productId, productName) // Call the soft delete handler from parent
  }

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product)
    setIsViewDialogOpen(true)
  }

  const handleAddPurchaseHistory = () => {
    if (editingProduct) {
      const newPurchase: PurchaseHistoryItem = {
        id: generateId(),
        date: purchaseHistoryFormData.date,
        quantity: Number.parseInt(purchaseHistoryFormData.quantity, 10),
        unitCost: Number.parseFloat(purchaseHistoryFormData.unitCost),
        totalCost:
          Number.parseInt(purchaseHistoryFormData.quantity, 10) * Number.parseFloat(purchaseHistoryFormData.unitCost),
      }
      const updatedProduct: Product = {
        ...editingProduct,
        purchaseHistory: [...editingProduct.purchaseHistory, newPurchase],
        stock: editingProduct.stock + newPurchase.quantity, // Increase stock
      }
      onUpdateProduct(updatedProduct)
      setEditingProduct(updatedProduct) // Update editingProduct to reflect new history and stock
      setPurchaseHistoryFormData({
        date: "",
        quantity: "",
        unitCost: "",
      })
    }
  }

  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId)
    return vendor ? vendor.name : "N/A"
  }

  const getProfitability = (product: Product) => {
    const totalSalesValue = product.salesHistory?.reduce((sum, sale) => sum + sale.totalPrice, 0) || 0
    const totalCostOfSoldGoods =
      (product.salesHistory?.reduce((sum, sale) => sum + sale.quantity, 0) || 0) * product.costPrice
    return totalSalesValue - totalCostOfSoldGoods
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Package className="mr-3 h-8 w-8" />
              Product Management
            </h1>
            <p className="text-blue-100">Manage your inventory, add new products, and track stock levels</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadAllProductsExcel}
              disabled={products.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Excel Sheet
            </Button>
            <Button
              onClick={handleDownloadAllProductsPdf}
              disabled={products.length === 0 || isDownloadingPdf}
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
                    Upload Products from Excel
                  </DialogTitle>
                  <DialogDescription>Upload an Excel file with product information.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-blue-400 mb-3" />
                    <Label
                      htmlFor="product-excel-upload"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Click to select Excel file
                    </Label>
                    <Input
                      id="product-excel-upload"
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
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-blue-700 flex items-center">
                    <Plus className="mr-2 h-6 w-6" />
                    Add New Product
                  </DialogTitle>
                  <DialogDescription>Fill in the details to add a new product to your inventory.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="font-medium">
                      Product Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter product description"
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unitPrice" className="font-medium">
                        Unit Price ({currentAppCurrency})
                      </Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, unitPrice: e.target.value }))}
                        placeholder="e.g., 1500"
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="costPrice" className="font-medium">
                        Cost Price ({currentAppCurrency})
                      </Label>
                      <Input
                        id="costPrice"
                        type="number"
                        value={formData.costPrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, costPrice: e.target.value }))}
                        placeholder="e.g., 1000"
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock" className="font-medium">
                        Stock
                      </Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                        placeholder="e.g., 100"
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="font-medium">
                        Category
                      </Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., Electronics"
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sku" className="font-medium">
                      SKU
                    </Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                      placeholder="e.g., PROD-001"
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor" className="font-medium">
                      Vendor
                    </Label>
                    <Select
                      value={formData.vendorId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, vendorId: value }))}
                    >
                      <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddProduct}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    Add Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.sku}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {product.category}
                </Badge>
              </div>
              <p className="text-gray-700 text-sm mb-4 line-clamp-2">{product.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Unit Price:</p>
                  <p className="font-medium text-gray-900">{formatCurrency(product.unitPrice, currentAppCurrency)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Cost Price:</p>
                  <p className="font-medium text-gray-900">{formatCurrency(product.costPrice, currentAppCurrency)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Stock:</p>
                  <p className="font-medium text-gray-900">{product.stock}</p>
                </div>
                <div>
                  <p className="text-gray-600">Vendor:</p>
                  <p className="font-medium text-gray-900">{getVendorName(product.vendorId)}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadProductPdf(product)}
                  disabled={isDownloadingPdf}
                  title="Download Product PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleViewProduct(product)}>
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditProduct(product)}
                  disabled={user?.role !== "admin"}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                  disabled={user?.role !== "admin"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-700 flex items-center">
              <Package className="mr-2 h-6 w-6" />
              Product Details: {viewingProduct?.name}
            </DialogTitle>
            <DialogDescription>Comprehensive information about this product.</DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Package className="mr-2 h-5 w-5 text-blue-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Name</Label>
                    <p className="text-gray-900 font-medium">{viewingProduct.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">SKU</Label>
                    <p className="text-gray-900">{viewingProduct.sku}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Category</Label>
                    <p className="text-gray-900">{viewingProduct.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Vendor</Label>
                    <p className="text-gray-900">{getVendorName(viewingProduct.vendorId)}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <p className="text-gray-900">{viewingProduct.description}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                    Pricing & Stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Unit Price</Label>
                    <p className="text-gray-900 font-medium">
                      {formatCurrency(viewingProduct.unitPrice, currentAppCurrency)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Cost Price</Label>
                    <p className="text-gray-900 font-medium">
                      {formatCurrency(viewingProduct.costPrice, currentAppCurrency)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Current Stock</Label>
                    <p className="text-gray-900 font-medium">{viewingProduct.stock}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Unit Profit</Label>
                    <p className="text-gray-900 font-medium">
                      {formatCurrency(viewingProduct.unitPrice - viewingProduct.costPrice, currentAppCurrency)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Overall Profit (Sold)</Label>
                    <p className="text-gray-900 font-medium">
                      {formatCurrency(getProfitability(viewingProduct), currentAppCurrency)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <History className="mr-2 h-5 w-5 text-purple-600" />
                    Purchase History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewingProduct?.purchaseHistory && viewingProduct.purchaseHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Total Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingProduct.purchaseHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{formatDate(item.date)}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.unitCost, currentAppCurrency)}</TableCell>
                            <TableCell>{formatCurrency(item.totalCost, currentAppCurrency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-600">No purchase history available for this product.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-700 flex items-center">
              <Edit className="mr-2 h-6 w-6" />
              Edit Product: {editingProduct?.name}
            </DialogTitle>
            <DialogDescription>Update product details or add purchase history.</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="purchase-history">Purchase History</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="font-medium">
                    Product Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description" className="font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter product description"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-unitPrice" className="font-medium">
                      Unit Price ({currentAppCurrency})
                    </Label>
                    <Input
                      id="edit-unitPrice"
                      type="number"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, unitPrice: e.target.value }))}
                      placeholder="e.g., 1500"
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-costPrice" className="font-medium">
                      Cost Price ({currentAppCurrency})
                    </Label>
                    <Input
                      id="edit-costPrice"
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, costPrice: e.target.value }))}
                      placeholder="e.g., 1000"
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-stock" className="font-medium">
                      Stock
                    </Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                      placeholder="e.g., 100"
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-category" className="font-medium">
                      Category
                    </Label>
                    <Input
                      id="edit-category"
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Electronics"
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-sku" className="font-medium">
                    SKU
                  </Label>
                  <Input
                    id="edit-sku"
                    value={formData.sku}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g., PROD-001"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-vendor" className="font-medium">
                    Vendor
                  </Label>
                  <Select
                    value={formData.vendorId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, vendorId: value }))}
                  >
                    <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleUpdateProduct}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  Update Product
                </Button>
              </TabsContent>
              <TabsContent value="purchase-history" className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">Add New Purchase</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase-date" className="font-medium">
                      Date
                    </Label>
                    <Input
                      id="purchase-date"
                      type="date"
                      value={purchaseHistoryFormData.date}
                      onChange={(e) => setPurchaseHistoryFormData((prev) => ({ ...prev, date: e.target.value }))}
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchase-quantity" className="font-medium">
                      Quantity
                    </Label>
                    <Input
                      id="purchase-quantity"
                      type="number"
                      value={purchaseHistoryFormData.quantity}
                      onChange={(e) => setPurchaseHistoryFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                      placeholder="e.g., 10"
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="purchase-unit-cost" className="font-medium">
                      Unit Cost ({currentAppCurrency})
                    </Label>
                    <Input
                      id="purchase-unit-cost"
                      type="number"
                      value={purchaseHistoryFormData.unitCost}
                      onChange={(e) => setPurchaseHistoryFormData((prev) => ({ ...prev, unitCost: e.target.value }))}
                      placeholder="e.g., 950"
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddPurchaseHistory}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  Add Purchase
                </Button>

                <h4 className="text-lg font-semibold text-gray-800 mt-6">Existing Purchase History</h4>
                {editingProduct?.purchaseHistory && editingProduct.purchaseHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingProduct.purchaseHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitCost, currentAppCurrency)}</TableCell>
                          <TableCell>{formatCurrency(item.totalCost, currentAppCurrency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-600">No purchase history for this product yet.</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
