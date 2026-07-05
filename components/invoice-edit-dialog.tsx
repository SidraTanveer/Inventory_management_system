"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Plus, Minus, Search, X, Hash, RefreshCw, User, Calendar } from "lucide-react"
import type { Product, Invoice, InvoiceItem, Customer } from "@/types/app"

interface InvoiceEditDialogProps {
  invoice: Invoice
  products: Product[]
  customers: Customer[]
  existingInvoices: Invoice[]
  isOpen: boolean
  onClose: () => void
  onSave: (invoice: Invoice) => void
  currentAppCurrency: string
  user: any
}

export function InvoiceEditDialog({
  invoice,
  products,
  customers,
  existingInvoices,
  isOpen,
  onClose,
  onSave,
  currentAppCurrency,
  user,
}: InvoiceEditDialogProps) {
  const { toast } = useToast()
  const [customerName, setCustomerName] = useState(invoice.customerName)
  const [customerEmail, setCustomerEmail] = useState(invoice.customerEmail)
  const [customerPhone, setCustomerPhone] = useState(invoice.customerPhone)
  const [trackingId, setTrackingId] = useState(invoice.trackingId || "")
  const [status, setStatus] = useState<Invoice["status"]>(invoice.status)
  const [items, setItems] = useState<InvoiceItem[]>(invoice.items)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [invoiceDate, setInvoiceDate] = useState(invoice.createdAt)

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const generateTrackingId = () => {
    const prefix = "TRK"
    const randomNum = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}-${randomNum}-${randomStr}`
  }

  const validateTrackingId = (id: string) => {
    if (!id.trim()) return true // Empty is allowed
    // Check if it's the same as current invoice's tracking ID
    if (id.trim() === invoice.trackingId) return true
    // Check if it exists in other invoices
    return !existingInvoices.some((inv) => inv.id !== invoice.id && inv.trackingId === id.trim())
  }

  const addItem = (product: Product) => {
    const existingItem = items.find((item) => item.productId === product.id)
    if (existingItem) {
      setItems(items.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.unitPrice,
          costPrice: product.costPrice,
        },
      ])
    }
    setSearchTerm("")
  }

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter((item) => item.productId !== productId))
    } else {
      setItems(items.map((item) => (item.productId === productId ? { ...item, quantity } : item)))
    }
  }

  const updateItemPrice = (productId: string, unitPrice: number) => {
    setItems(items.map((item) => (item.productId === productId ? { ...item, unitPrice } : item)))
  }

  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId))
  }

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerName(customer.name)
    setCustomerEmail(customer.email)
    setCustomerPhone(customer.phone)
    setShowCustomerSearch(false)
    setSearchTerm("")
  }

  const clearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerName("")
    setCustomerEmail("")
    setCustomerPhone("")
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0)
  const totalProfit = totalAmount - totalCost
  const profitPercentage = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0

  const handleSave = () => {
    if (!customerName.trim() || !customerEmail.trim() || items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in customer details and add at least one item.",
        variant: "destructive",
      })
      return
    }

    if (trackingId.trim() && !validateTrackingId(trackingId)) {
      toast({
        title: "Duplicate Tracking ID",
        description: "This tracking ID already exists. Please use a different one.",
        variant: "destructive",
      })
      return
    }

    const updatedInvoice: Invoice = {
      ...invoice,
      trackingId: trackingId.trim() || undefined,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      status,
      items,
      totalAmount,
      totalCost,
      totalProfit,
      profitPercentage,
      createdAt: invoiceDate,
    }

    onSave(updatedInvoice)
  }

  const handleClose = () => {
    setCustomerName(invoice.customerName)
    setCustomerEmail(invoice.customerEmail)
    setCustomerPhone(invoice.customerPhone)
    setTrackingId(invoice.trackingId || "")
    setStatus(invoice.status)
    setItems(invoice.items)
    setSearchTerm("")
    setSelectedCustomer(null)
    setShowCustomerSearch(false)
    setInvoiceDate(invoice.createdAt)
    onClose()
  }

  useEffect(() => {
    if (isOpen) {
      setCustomerName(invoice.customerName)
      setCustomerEmail(invoice.customerEmail)
      setCustomerPhone(invoice.customerPhone)
      setTrackingId(invoice.trackingId || "")
      setStatus(invoice.status)
      setItems(invoice.items)
      setInvoiceDate(invoice.createdAt)

      // Find matching customer
      const matchingCustomer = customers.find((c) => c.email === invoice.customerEmail)
      if (matchingCustomer) {
        setSelectedCustomer(matchingCustomer)
      }
    }
  }, [isOpen, invoice, customers])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Edit Invoice {invoice.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="bg-white border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
              <CardTitle className="flex items-center justify-between text-gray-900">
                <span className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-orange-600" />
                  Customer Information
                </span>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                    className="bg-white hover:bg-orange-50 text-gray-900"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search Customers
                  </Button>
                  {selectedCustomer && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearCustomer}
                      className="bg-white hover:bg-red-50 text-gray-900"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 bg-white">
              {showCustomerSearch && (
                <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                  <Input
                    placeholder="Search customers by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-3 bg-white"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 border-2 border-gray-200 rounded cursor-pointer bg-white hover:bg-orange-50 hover:border-orange-300 transition-colors"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.email}</div>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      </div>
                    ))}
                    {filteredCustomers.length === 0 && searchTerm && (
                      <div className="text-center text-gray-500 py-4">No customers found</div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerName" className="text-gray-900 font-semibold">
                    Customer Name *
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="bg-white border-2 border-gray-300 focus:border-orange-500"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail" className="text-gray-900 font-semibold">
                    Email *
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="bg-white border-2 border-gray-300 focus:border-orange-500"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="text-gray-900 font-semibold">
                    Phone
                  </Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="bg-white border-2 border-gray-300 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Invoice Date Section */}
                <div>
                  <Label htmlFor="invoiceDate" className="flex items-center text-gray-900 font-semibold">
                    <Calendar className="mr-2 h-4 w-4 text-orange-600" />
                    Invoice Date
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="bg-white border-2 border-orange-300 focus:border-orange-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setInvoiceDate(new Date().toISOString().split("T")[0])}
                      className="bg-white hover:bg-orange-50 text-gray-900"
                      title="Set to today"
                    >
                      Today
                    </Button>
                  </div>
                </div>

                {/* Tracking ID Section */}
                <div>
                  <Label htmlFor="trackingId" className="flex items-center text-gray-900 font-semibold">
                    <Hash className="mr-2 h-4 w-4 text-orange-600" />
                    Tracking ID (Optional)
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="trackingId"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="Enter custom tracking ID or generate one"
                      className={`bg-white border-2 ${!validateTrackingId(trackingId) ? "border-red-500" : "border-gray-300 focus:border-orange-500"}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTrackingId(generateTrackingId())}
                      className="bg-white hover:bg-orange-50 text-gray-900"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {trackingId && !validateTrackingId(trackingId) && (
                    <p className="text-sm text-red-600 mt-1 font-medium">This tracking ID already exists</p>
                  )}
                </div>

                {/* Status Section */}
                <div>
                  <Label htmlFor="status" className="text-gray-900 font-semibold">
                    Invoice Status
                  </Label>
                  <Select value={status} onValueChange={(value: Invoice["status"]) => setStatus(value)}>
                    <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-orange-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Search and Selection */}
          <Card className="bg-white border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-gray-900">Add Products</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 bg-white">
              <div className="space-y-4">
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border-2 border-gray-300 focus:border-blue-500"
                />
                {searchTerm && (
                  <div className="max-h-40 overflow-y-auto border-2 border-blue-200 rounded-lg bg-white">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 border-b-2 last:border-b-0 cursor-pointer hover:bg-blue-50 flex justify-between items-center transition-colors"
                        onClick={() => addItem(product)}
                      >
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">
                            SKU: {product.sku} | Stock: {product.stock} | Price:{" "}
                            {formatCurrency(product.unitPrice, currentAppCurrency)}
                          </div>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="p-4 text-center text-gray-500">No products found</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Items */}
          {items.length > 0 && (
            <Card className="bg-white border-2 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                <CardTitle className="text-gray-900">Invoice Items</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 bg-white">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center space-x-4 p-3 border-2 border-gray-200 rounded-lg bg-white hover:border-green-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.productName}</div>
                        <div className="text-sm text-gray-600">
                          Cost: {formatCurrency(item.costPrice, currentAppCurrency)} | Profit:{" "}
                          {formatCurrency((item.unitPrice - item.costPrice) * item.quantity, currentAppCurrency)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                          className="bg-white hover:bg-gray-100 text-gray-900"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.productId, Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 text-center bg-white border-2 border-gray-300"
                          min="1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                          className="bg-white hover:bg-gray-100 text-gray-900"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItemPrice(item.productId, Number(e.target.value))}
                          min="0"
                          step="0.01"
                          disabled={user?.role !== "admin"}
                          className="bg-white border-2 border-gray-300"
                        />
                      </div>
                      <div className="w-24 text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice, currentAppCurrency)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeItem(item.productId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Summary */}
          {items.length > 0 && (
            <Card className="bg-white border-2 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
                <CardTitle className="text-gray-900">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 bg-white">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-900">
                    <span className="font-semibold">Total Cost:</span>
                    <span className="text-red-600 font-bold">{formatCurrency(totalCost, currentAppCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-lg">{formatCurrency(totalAmount, currentAppCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900">
                    <span className="font-semibold">Total Profit:</span>
                    <span className={`font-bold text-lg ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(totalProfit, currentAppCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-900">
                    <span className="font-semibold">Profit Margin:</span>
                    <span className={`font-bold ${profitPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {profitPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={handleClose} className="bg-white hover:bg-gray-100 text-gray-900">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={items.length === 0}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Update Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
