"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Download, FileText, User, Mail, Phone, Hash, Calendar, DollarSign, Package, TrendingUp } from "lucide-react"
import type { Invoice } from "@/types/app"

interface InvoiceViewDialogProps {
  invoice: Invoice
  isOpen: boolean
  onClose: () => void
  onDownloadPdf: () => void
  currentAppCurrency: string
}

export function InvoiceViewDialog({
  invoice,
  isOpen,
  onClose,
  onDownloadPdf,
  currentAppCurrency,
}: InvoiceViewDialogProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center text-2xl font-bold text-gray-900">
              <FileText className="mr-2 h-6 w-6" />
              Invoice Details
            </span>
            <Button onClick={onDownloadPdf} className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Invoice {invoice.id}</h3>
                  {invoice.trackingId && (
                    <div className="flex items-center text-blue-600 mt-1">
                      <Hash className="h-4 w-4 mr-1" />
                      <span className="font-mono">{invoice.trackingId}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600 mt-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(invoice.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(invoice.status)}
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(invoice.totalAmount, currentAppCurrency)}
                    </div>
                    <div
                      className={`text-sm font-medium ${invoice.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      Profit: {formatCurrency(invoice.totalProfit, currentAppCurrency)} (
                      {(invoice.profitPercentage ?? 0).toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <User className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Name</span>
                  </div>
                  <div className="font-medium text-gray-900">{invoice.customerName}</div>
                </div>
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Mail className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <div className="font-medium text-gray-900">{invoice.customerEmail}</div>
                </div>
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Phone className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Phone</span>
                  </div>
                  <div className="font-medium text-gray-900">{invoice.customerPhone || "Not provided"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Invoice Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-900">Product</th>
                      <th className="text-left p-3 font-medium text-gray-900">Quantity</th>
                      <th className="text-left p-3 font-medium text-gray-900">Unit Price</th>
                      <th className="text-left p-3 font-medium text-gray-900">Cost Price</th>
                      <th className="text-left p-3 font-medium text-gray-900">Total</th>
                      <th className="text-left p-3 font-medium text-gray-900">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{item.productName}</div>
                        </td>
                        <td className="p-3 text-gray-600">{item.quantity}</td>
                        <td className="p-3 text-gray-600">{formatCurrency(item.unitPrice, currentAppCurrency)}</td>
                        <td className="p-3 text-gray-600">{formatCurrency(item.costPrice, currentAppCurrency)}</td>
                        <td className="p-3 font-medium text-gray-900">
                          {formatCurrency(item.quantity * item.unitPrice, currentAppCurrency)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-medium ${(item.unitPrice - item.costPrice) * item.quantity >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency((item.unitPrice - item.costPrice) * item.quantity, currentAppCurrency)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-red-800 mb-1">Total Cost</div>
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(invoice.totalCost, currentAppCurrency)}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">Total Amount</div>
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(invoice.totalAmount, currentAppCurrency)}
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${invoice.totalProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                    <div
                      className={`text-sm font-medium mb-1 ${invoice.totalProfit >= 0 ? "text-green-800" : "text-red-800"}`}
                    >
                      Total Profit
                    </div>
                    <div
                      className={`text-xl font-bold ${invoice.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(invoice.totalProfit, currentAppCurrency)}
                    </div>
                    <div className={`text-sm ${invoice.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {(invoice.profitPercentage ?? 0).toFixed(1)}% margin
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-lg font-medium text-gray-900">Final Amount</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(invoice.totalAmount, currentAppCurrency)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onDownloadPdf} className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
