"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, getCurrentDate } from "@/lib/utils"
import { buildSearchableCustomers, getKeywordSuggestions, searchAndRank } from "@/lib/search-utils"
import { Plus, Minus, Search, X, Hash, RefreshCw, User, Calendar } from "lucide-react"
import type { Product, Invoice, InvoiceItem, Customer } from "@/types/app"

interface InvoiceCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (invoice: Invoice) => void
  products: Product[]
  customers: Customer[]
  existingInvoices: Invoice[]
  currentAppCurrency: string
  isAdmin: boolean
}

const composeInvoiceDateTime = (date: string, time: string) => {
  if (!date) return ""
  if (!time) return date
  return `${date}T${time}:00`
}

export function InvoiceCreateDialog({
  isOpen,
  onClose,
  onSave,
  products,
  customers,
  existingInvoices,
  currentAppCurrency,
  isAdmin,
}: InvoiceCreateDialogProps) {
  const { toast } = useToast()
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [trackingId, setTrackingId] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [showInvoiceSearch, setShowInvoiceSearch] = useState(false)
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("")
  const [invoiceDate, setInvoiceDate] = useState<string>(getCurrentDate())
  const [invoiceTime, setInvoiceTime] = useState<string>("")

  const searchableCustomers = useMemo(() => {
    return buildSearchableCustomers(customers, existingInvoices)
  }, [customers, existingInvoices])

  const filteredProducts = searchAndRank(products, productSearchTerm, [
    (product) => product.name,
    (product) => product.sku,
  ])

  const filteredCustomers = searchAndRank(searchableCustomers, customerSearchTerm, [
    (customer) => customer.name,
    (customer) => customer.email,
    (customer) => customer.phone,
  ])

  const filteredInvoices = searchAndRank(existingInvoices, invoiceSearchTerm, [
    (invoice) => invoice.id,
    (invoice) => invoice.customerName,
    (invoice) => invoice.customerEmail,
    (invoice) => invoice.trackingId,
  ])

  const customerSuggestions = useMemo(() => {
    return getKeywordSuggestions(
      searchableCustomers,
      customerSearchTerm,
      [(customer) => customer.name, (customer) => customer.email, (customer) => customer.phone],
      10,
    )
  }, [searchableCustomers, customerSearchTerm])

  const invoiceSuggestions = useMemo(() => {
    return getKeywordSuggestions(
      existingInvoices,
      invoiceSearchTerm,
      [
        (invoice) => invoice.id,
        (invoice) => invoice.trackingId,
        (invoice) => invoice.customerName,
        (invoice) => invoice.customerEmail,
      ],
      10,
    )
  }, [existingInvoices, invoiceSearchTerm])

  const productSuggestions = useMemo(() => {
    return getKeywordSuggestions(products, productSearchTerm, [(product) => product.name, (product) => product.sku], 10)
  }, [products, productSearchTerm])

  const generateTrackingId = () => {
    const prefix = "TRK"
    const randomNum = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}-${randomNum}-${randomStr}`
  }

  const validateTrackingId = (id: string) => {
    if (!id.trim()) return true
    return !existingInvoices.some((invoice) => invoice.trackingId === id.trim())
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
    setProductSearchTerm("")
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
    setCustomerSearchTerm("")
  }

  const clearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerName("")
    setCustomerEmail("")
    setCustomerPhone("")
  }

  const selectInvoice = (invoice: Invoice) => {
    setCustomerName(invoice.customerName)
    setCustomerEmail(invoice.customerEmail)
    setCustomerPhone(invoice.customerPhone)
    setShowInvoiceSearch(false)
    setInvoiceSearchTerm("")

    const existingCustomer = searchableCustomers.find((c) => c.email === invoice.customerEmail)
    if (existingCustomer) {
      setSelectedCustomer(existingCustomer)
    }

    toast({
      title: "Customer Data Filled",
      description: `Customer information from invoice ${invoice.id} has been auto-filled.`,
    })
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

    const newInvoice: Invoice = {
      id: "",
      trackingId: trackingId.trim() || undefined,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      items,
      totalAmount,
      totalCost,
      totalProfit,
      profitPercentage,
      createdAt: composeInvoiceDateTime(invoiceDate, invoiceTime),
      currency: currentAppCurrency,
      status: "pending",
    }

    onSave(newInvoice)
    handleClose()
  }

  const handleClose = () => {
    setCustomerName("")
    setCustomerEmail("")
    setCustomerPhone("")
    setTrackingId("")
    setItems([])
    setProductSearchTerm("")
    setCustomerSearchTerm("")
    setSelectedCustomer(null)
    setShowCustomerSearch(false)
    setShowInvoiceSearch(false)
    setInvoiceSearchTerm("")
    setInvoiceDate(getCurrentDate())
    setInvoiceTime("")
    onClose()
  }

  useEffect(() => {
    if (!isOpen) {
      handleClose()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg -mx-6 -mt-6 px-6 py-4">
          <DialogTitle className="text-2xl font-bold text-white">Create New Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Invoice Date Picker Section */}
          <Card className="border-2 border-orange-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b-2 border-orange-200">
              <CardTitle className="flex items-center text-orange-700">
                <Calendar className="mr-2 h-5 w-5" />
                Invoice Date
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="invoiceDate" className="text-gray-700 font-semibold mb-2 block">
                    Select Invoice Date
                  </Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full border-2 border-orange-200 focus:border-orange-400 bg-white text-gray-900"
                  />
                </div>
                <div className="w-[180px]">
                  <Label htmlFor="invoiceTime" className="text-gray-700 font-semibold mb-2 block">
                    Invoice Time
                  </Label>
                  <Input
                    id="invoiceTime"
                    type="time"
                    value={invoiceTime}
                    onChange={(e) => setInvoiceTime(e.target.value)}
                    className="w-full border-2 border-orange-200 focus:border-orange-400 bg-white text-gray-900"
                  />
                </div>
                <div className="pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInvoiceDate(getCurrentDate())}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50 bg-white"
                  >
                    Today
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Select a date for this invoice. If you select a future date, the invoice will be saved in that month's
                records.
              </p>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="border-2 border-purple-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-purple-200">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center text-purple-700">
                  <User className="mr-2 h-5 w-5" />
                  Customer Information
                </span>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search Customers
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInvoiceSearch(!showInvoiceSearch)}
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search Invoices
                  </Button>
                  {selectedCustomer && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearCustomer}
                      className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {showCustomerSearch && (
                <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                  <Input
                    placeholder="Search customers by name or email..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    list="invoice-create-customer-suggestions"
                    className="mb-3 border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <datalist id="invoice-create-customer-suggestions">
                    {customerSuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 border-2 border-purple-200 rounded cursor-pointer hover:bg-white hover:border-purple-400 transition-all bg-white"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.email}</div>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      </div>
                    ))}
                    {filteredCustomers.length === 0 && customerSearchTerm && (
                      <div className="text-center text-gray-500 py-4">No customers found</div>
                    )}
                  </div>
                </div>
              )}

              {showInvoiceSearch && (
                <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                  <Input
                    placeholder="Search invoices by ID, customer name, or email..."
                    value={invoiceSearchTerm}
                    onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                    list="invoice-create-invoice-suggestions"
                    className="mb-3 border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <datalist id="invoice-create-invoice-suggestions">
                    {invoiceSuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {filteredInvoices.map((invoice, index) => (
                      <div
                        key={`${invoice.id || invoice.trackingId || "no-id"}-${invoice.createdAt || "no-date"}-${index}`}
                        className="p-3 border-2 border-purple-200 rounded cursor-pointer hover:bg-white hover:border-purple-400 transition-all bg-white"
                        onClick={() => selectInvoice(invoice)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{invoice.customerName}</div>
                            <div className="text-sm text-gray-600">{invoice.customerEmail}</div>
                            <div className="text-sm text-gray-500">Invoice: {invoice.id}</div>
                            {invoice.trackingId && (
                              <div className="text-sm text-purple-600 flex items-center">
                                <Hash className="h-3 w-3 mr-1" />
                                {invoice.trackingId}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="border-purple-300 text-purple-600">
                            {formatCurrency(invoice.totalAmount, currentAppCurrency)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {filteredInvoices.length === 0 && invoiceSearchTerm && (
                      <div className="text-center text-gray-500 py-4">No invoices found</div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerName" className="text-gray-700 font-semibold">
                    Customer Name *
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail" className="text-gray-700 font-semibold">
                    Email *
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="text-gray-700 font-semibold">
                    Phone
                  </Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 mt-1"
                  />
                </div>
              </div>

              {/* Tracking ID Section */}
              <div>
                <Label htmlFor="trackingId" className="flex items-center text-gray-700 font-semibold">
                  <Hash className="mr-2 h-4 w-4" />
                  Tracking ID (Optional)
                </Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="trackingId"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Enter custom tracking ID or generate one"
                    className={`border-2 ${!validateTrackingId(trackingId) ? "border-red-500" : "border-purple-200"} focus:border-purple-500 focus:ring-purple-500`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTrackingId(generateTrackingId())}
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {trackingId && !validateTrackingId(trackingId) && (
                  <p className="text-sm text-red-600 mt-1">This tracking ID already exists</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Search and Selection */}
          <Card className="border-2 border-blue-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-200">
              <CardTitle className="text-blue-700">Add Products</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Input
                  placeholder="Search products by name or SKU..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  list="invoice-create-product-suggestions"
                  className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <datalist id="invoice-create-product-suggestions">
                  {productSuggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
                {productSearchTerm && (
                  <div className="max-h-40 overflow-y-auto border-2 border-blue-200 rounded-lg bg-blue-50">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 border-b-2 border-blue-100 last:border-b-0 cursor-pointer hover:bg-white transition-colors flex justify-between items-center"
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
            <Card className="border-2 border-green-200 shadow-md">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                <CardTitle className="text-green-700">Invoice Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center space-x-4 p-4 border-2 border-green-200 rounded-lg bg-green-50 hover:bg-white transition-colors"
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
                          className="border-green-300 text-green-600 hover:bg-green-100"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.productId, Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 text-center border-2 border-green-200 focus:border-green-500"
                          min="1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                          className="border-green-300 text-green-600 hover:bg-green-100"
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
                          className="border-2 border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div className="w-24 text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice, currentAppCurrency)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeItem(item.productId)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
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
            <Card className="border-2 border-yellow-200 shadow-md bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader className="bg-gradient-to-r from-yellow-100 to-orange-100 border-b-2 border-yellow-200">
                <CardTitle className="text-yellow-800">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-yellow-200">
                    <span className="font-semibold text-gray-700">Total Cost:</span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(totalCost, currentAppCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-yellow-200">
                    <span className="font-semibold text-gray-700">Total Amount:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(totalAmount, currentAppCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-yellow-200">
                    <span className="font-semibold text-gray-700">Total Profit:</span>
                    <span className={`text-lg font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(totalProfit, currentAppCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-yellow-200">
                    <span className="font-semibold text-gray-700">Profit Margin:</span>
                    <span className={`text-lg font-bold ${profitPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {profitPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={items.length === 0}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
            >
              Create Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
