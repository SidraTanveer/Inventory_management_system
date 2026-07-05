"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Invoice, Product } from "@/types/app"
import { formatCurrency } from "@/lib/utils"
import jsPDF from "jspdf"
import { useAuth } from "@/hooks/useAuth"
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  BarChart3,
  Percent,
  Building2,
  Phone,
  Clock,
  SlidersHorizontal,
  RotateCw,
  Eye,
  Hash,
} from "lucide-react"

interface MonthlyIncomeProps {
  invoices: Invoice[]
  products: Product[]
  currentAppCurrency: string
  onViewInvoice: (invoice: Invoice) => void
  onDownloadPdf: (invoice: Invoice) => void
}

type ReportOptions = {
  includeHeader: boolean
  includeExecutiveSummary: boolean
  includeKpis: boolean
  includeFinancialPerformance: boolean
  includeOperationalPerformance: boolean
  includeTopCustomers: boolean
  includeTopProducts: boolean
  includeSalesInventoryTable: boolean
  includeTransactionRecords: boolean
  includeFooter: boolean
  tableColumns: {
    date: boolean
    category: boolean
    product: boolean
    quantitySold: boolean
    unitPrice: boolean
    totalSales: boolean
  }
}

const defaultOptions: ReportOptions = {
  includeHeader: true,
  includeExecutiveSummary: true,
  includeKpis: true,
  includeFinancialPerformance: true,
  includeOperationalPerformance: true,
  includeTopCustomers: true,
  includeTopProducts: true,
  includeSalesInventoryTable: true,
  includeTransactionRecords: true,
  includeFooter: true,
  tableColumns: {
    date: true,
    category: true,
    product: true,
    quantitySold: true,
    unitPrice: true,
    totalSales: true,
  },
}

export function MonthlyIncome({
  invoices,
  products,
  currentAppCurrency,
  onViewInvoice,
  onDownloadPdf,
}: MonthlyIncomeProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`
  })
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [options, setOptions] = useState<ReportOptions>(defaultOptions)
  const { user } = useAuth()

  const reportRef = useRef<HTMLDivElement | null>(null)
  const pdfContentRef = useRef<HTMLDivElement | null>(null)

  // Persist and restore options
  useEffect(() => {
    const saved = localStorage.getItem("ims_report_options")
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ReportOptions
        setOptions({
          ...defaultOptions,
          ...parsed,
          tableColumns: { ...defaultOptions.tableColumns, ...parsed.tableColumns },
        })
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("ims_report_options", JSON.stringify(options))
  }, [options])

  // Generate month options for the last 24 months
  const monthOptions = useMemo(() => {
    const opts = []
    const currentDate = new Date()
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`
      const label = date.toLocaleDateString("en-US", { year: "numeric", month: "long" })
      opts.push({ value, label })
    }
    return opts
  }, [])

  // Filter invoices for selected month
  const monthlyInvoices = useMemo(() => {
    const [year, month] = selectedMonth.split("-")
    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt)
      return (
        invoiceDate.getFullYear() === Number.parseInt(year) && invoiceDate.getMonth() + 1 === Number.parseInt(month)
      )
    })
  }, [invoices, selectedMonth])

  // Calculate monthly metrics
  const monthlyMetrics = useMemo(() => {
    const totalRevenue = monthlyInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    const totalCost = monthlyInvoices.reduce((sum, invoice) => sum + invoice.totalCost, 0)
    const totalProfit = monthlyInvoices.reduce((sum, invoice) => sum + invoice.totalProfit, 0)
    const totalOrders = monthlyInvoices.length
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    const uniqueCustomers = new Set(monthlyInvoices.map((invoice) => invoice.customerEmail)).size

    const totalItems = monthlyInvoices.reduce(
      (sum, invoice) => sum + invoice.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    )

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const completedOrders = monthlyInvoices.filter((inv) => (inv.status ?? "pending") === "completed").length
    const pendingOrders = monthlyInvoices.filter((inv) => (inv.status ?? "pending") === "pending").length
    const cancelledOrders = monthlyInvoices.filter((inv) => (inv.status ?? "pending") === "cancelled").length

    // Top customers by revenue
    const customerRevenue: { [key: string]: { name: string; email: string; revenue: number; orders: number } } = {}
    monthlyInvoices.forEach((invoice) => {
      const key = invoice.customerEmail || invoice.customerName
      if (!customerRevenue[key]) {
        customerRevenue[key] = {
          name: invoice.customerName,
          email: invoice.customerEmail,
          revenue: 0,
          orders: 0,
        }
      }
      customerRevenue[key].revenue += invoice.totalAmount
      customerRevenue[key].orders += 1
    })

    const topCustomers = Object.values(customerRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Top products sold
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {}
    monthlyInvoices.forEach((invoice) => {
      invoice.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          }
        }
        productSales[item.productId].quantity += item.quantity
        productSales[item.productId].revenue += item.quantity * item.unitPrice
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalOrders,
      profitMargin,
      uniqueCustomers,
      totalItems,
      avgOrderValue,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      topCustomers,
      topProducts,
    }
  }, [monthlyInvoices])

  // Build Sales Inventory Report table rows
  type SalesRow = {
    date: string
    category: string
    product: string
    quantitySold: number
    unitPrice: number
    totalSales: number
  }

  const productById = useMemo(() => {
    const map: Record<string, Product> = {}
    products.forEach((p) => (map[p.id] = p))
    return map
  }, [products])

  const salesRows = useMemo<SalesRow[]>(() => {
    const rows: SalesRow[] = []
    monthlyInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prod = productById[item.productId]
        rows.push({
          date: new Date(inv.createdAt).toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          }),
          category: prod?.category ?? "Unknown",
          product: item.productName,
          quantitySold: item.quantity,
          unitPrice: item.unitPrice,
          totalSales: item.quantity * item.unitPrice,
        })
      })
    })
    // Sort by date, then category, then product
    rows.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      if (a.category !== b.category) return a.category.localeCompare(b.category)
      return a.product.localeCompare(b.product)
    })
    return rows
  }, [monthlyInvoices, productById])

  const salesTotals = useMemo(() => {
    const totalQty = salesRows.reduce((s, r) => s + r.quantitySold, 0)
    const totalAmount = salesRows.reduce((s, r) => s + r.totalSales, 0)
    return { totalQty, totalAmount }
  }, [salesRows])

  // Previous month metrics for comparison
  const previousMonthMetrics = useMemo(() => {
    const [year, month] = selectedMonth.split("-")
    const currentDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
    const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const prevYear = previousDate.getFullYear()
    const prevMonth = previousDate.getMonth() + 1

    const prevMonthInvoices = invoices.filter((invoice) => {
      const d = new Date(invoice.createdAt)
      return d.getFullYear() === prevYear && d.getMonth() + 1 === prevMonth
    })

    const prevRevenue = prevMonthInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    const prevProfit = prevMonthInvoices.reduce((sum, invoice) => sum + invoice.totalProfit, 0)
    const prevOrders = prevMonthInvoices.length

    return { prevRevenue, prevProfit, prevOrders }
  }, [invoices, selectedMonth])

  const monthOverMonthChanges = useMemo(() => {
    const revenueChange =
      previousMonthMetrics.prevRevenue > 0
        ? ((monthlyMetrics.totalRevenue - previousMonthMetrics.prevRevenue) / previousMonthMetrics.prevRevenue) * 100
        : monthlyMetrics.totalRevenue > 0
          ? 100
          : 0

    const profitChange =
      previousMonthMetrics.prevProfit > 0
        ? ((monthlyMetrics.totalProfit - previousMonthMetrics.prevProfit) / previousMonthMetrics.prevProfit) * 100
        : monthlyMetrics.totalProfit > 0
          ? 100
          : 0

    const ordersChange =
      previousMonthMetrics.prevOrders > 0
        ? ((monthlyMetrics.totalOrders - previousMonthMetrics.prevOrders) / previousMonthMetrics.prevOrders) * 100
        : monthlyMetrics.totalOrders > 0
          ? 100
          : 0

    return { revenueChange, profitChange, ordersChange }
  }, [monthlyMetrics, previousMonthMetrics])

  const formatSelectedMonth = () => {
    const [year, month] = selectedMonth.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" })
  }

  // Create invoice-grouped rows for PDF table
  type InvoiceGroupRow = {
    trackingId: string
    date: string
    customerName: string
    customerEmail: string
    customerPhone: string
    status: string
    items: Array<{
      productName: string
      category: string
      quantity: number
      unitPrice: number
      purchasePrice: number
      totalSales: number
      totalCost: number
      profit: number
      profitMargin: number
    }>
    invoiceTotalSales: number
    invoiceTotalCost: number
    invoiceTotalProfit: number
  }

  const invoiceGroupedRows = useMemo<InvoiceGroupRow[]>(() => {
    const rows: InvoiceGroupRow[] = []

    // Sort invoices by date descending (most recent first)
    const sortedInvoices = [...monthlyInvoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    sortedInvoices.forEach((inv) => {
      const items = inv.items.map((item) => {
        const prod = productById[item.productId]
        const totalSales = item.quantity * item.unitPrice
        const totalCost = item.quantity * item.costPrice
        const profit = totalSales - totalCost
        const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0

        return {
          productName: item.productName,
          category: prod?.category ?? "Unknown",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          purchasePrice: item.costPrice,
          totalSales: totalSales,
          totalCost: totalCost,
          profit: profit,
          profitMargin: profitMargin,
        }
      })

      rows.push({
        trackingId: inv.trackingId || inv.id.slice(0, 8),
        date: new Date(inv.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        customerName: inv.customerName,
        customerEmail: inv.customerEmail,
        customerPhone: inv.customerPhone,
        status: (inv.status ?? "pending").charAt(0).toUpperCase() + (inv.status ?? "pending").slice(1),
        items: items,
        invoiceTotalSales: inv.totalAmount,
        invoiceTotalCost: inv.totalCost,
        invoiceTotalProfit: inv.totalProfit,
      })
    })

    return rows
  }, [monthlyInvoices, productById])

  // Update the detailedTotals calculation to use the new structure:
  const detailedTotals = useMemo(() => {
    const totalQty = invoiceGroupedRows.reduce(
      (s, r) => s + r.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    )
    const totalSales = invoiceGroupedRows.reduce((s, r) => s + r.invoiceTotalSales, 0)
    const totalCost = invoiceGroupedRows.reduce((s, r) => s + r.invoiceTotalCost, 0)
    const totalProfit = totalSales - totalCost
    const avgProfitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0
    return { totalQty, totalSales, totalCost, totalProfit, avgProfitMargin }
  }, [invoiceGroupedRows])

  // PDF generation with invoice-style design
  const handleGenerateReport = async () => {
    if (!pdfContentRef.current) return
    setIsGeneratingPdf(true)

    try {
      await new Promise((r) => setTimeout(r, 100))

      const pdf = new jsPDF("l", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15

      // Helper function to add new page
      let yPos = margin
      const addNewPage = () => {
        pdf.addPage()
        yPos = margin
      }

      // Header with company info
      pdf.setFillColor(147, 51, 234) // Purple background
      pdf.rect(0, 0, pageWidth, 40, "F")

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(24)
      pdf.setFont("helvetica", "bold")
      pdf.text("GLOW WITH VIBES", margin, 15)

      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.text("Beauty, Cosmetic & Personal Care", margin, 22)
      pdf.text("Wholesale Seller | Delivery All Over Pakistan", margin, 27)
      pdf.text("Phone: +92 311 0263606", margin, 32)

      // Report title
      yPos = 50
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("MONTHLY BUSINESS REPORT", pageWidth / 2, yPos, { align: "center" })

      yPos += 8
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text(formatSelectedMonth(), pageWidth / 2, yPos, { align: "center" })

      yPos += 15

      // Summary section
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 35, "F")

      pdf.setFontSize(11)
      pdf.setFont("helvetica", "bold")
      pdf.text("Financial Summary", margin + 5, yPos + 7)

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(10)

      const col1X = margin + 5
      const col2X = pageWidth / 2 + 5

      pdf.text("Total Sales:", col1X, yPos + 14)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(34, 197, 94)
      pdf.text(formatCurrency(monthlyMetrics.totalRevenue, currentAppCurrency), col1X + 30, yPos + 14)

      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(0, 0, 0)
      pdf.text("Total Cost:", col1X, yPos + 21)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(239, 68, 68)
      pdf.text(formatCurrency(monthlyMetrics.totalCost, currentAppCurrency), col1X + 30, yPos + 21)

      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(0, 0, 0)
      pdf.text("Net Profit:", col1X, yPos + 28)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(59, 130, 246)
      pdf.text(formatCurrency(monthlyMetrics.totalProfit, currentAppCurrency), col1X + 30, yPos + 28)

      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(0, 0, 0)
      pdf.text("Total Orders:", col2X, yPos + 14)
      pdf.setFont("helvetica", "bold")
      pdf.text(monthlyMetrics.totalOrders.toString(), col2X + 30, yPos + 14)

      pdf.setFont("helvetica", "normal")
      pdf.text("Profit Margin:", col2X, yPos + 21)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(147, 51, 234)
      pdf.text(monthlyMetrics.profitMargin.toFixed(1) + "%", col2X + 30, yPos + 21)

      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(0, 0, 0)
      pdf.text("Total Items Sold:", col2X, yPos + 28)
      pdf.setFont("helvetica", "bold")
      pdf.text(monthlyMetrics.totalItems.toString(), col2X + 35, yPos + 28)

      yPos += 45

      // Detailed Transaction Table
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("Detailed Monthly Invoices", margin, yPos)

      yPos += 8

      // Table header
      pdf.setFillColor(147, 51, 234)
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, "F")

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "bold")

      const colWidths = {
        trackingId: 18,
        date: 20,
        status: 16,
        customer: 40,
        product: 50,
        qty: 12,
        unitPrice: 22,
        purchasePrice: 22,
        totalSales: 24,
        profit: 22,
        margin: 14,
      }

      let xPos = margin
      pdf.text("Tracking ID", xPos + colWidths.trackingId / 2, yPos + 6.5, { align: "center" })
      xPos += colWidths.trackingId
      pdf.text("Date", xPos + colWidths.date / 2, yPos + 6.5, { align: "center" })
      xPos += colWidths.date
      pdf.text("Status", xPos + colWidths.status / 2, yPos + 6.5, { align: "center" })
      xPos += colWidths.status
      pdf.text("Customer", xPos + colWidths.customer / 2, yPos + 6.5, { align: "center" })
      xPos += colWidths.customer
      pdf.text("Product", xPos + colWidths.product / 2, yPos + 6.5, { align: "center" })
      xPos += colWidths.product
      pdf.text("Qty", xPos + colWidths.qty / 2, yPos + 6.5, { align: "center" })
      xPos += colWidths.qty
      pdf.text("Unit Price", xPos + colWidths.unitPrice / 2, yPos + 6.5, { align: "center" })
      xPos += colWidths.unitPrice
      pdf.text("Purchase", xPos + colWidths.purchasePrice / 2, yPos + 6.5, { align: "center" })
      xPos += colWidths.purchasePrice
      pdf.text("Total Sales", xPos + colWidths.totalSales / 2, yPos + 6.5, { align: "center" })
      xPos += colWidths.totalSales
      pdf.text("Profit", xPos + colWidths.profit / 2, yPos + 6.5, { align: "center" })
      xPos += colWidths.profit
      pdf.text("Margin%", xPos + colWidths.margin / 2, yPos + 6.5, { align: "center" })

      yPos += 10
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)

      // Table rows
      invoiceGroupedRows.forEach((invoiceRow, invoiceIndex) => {
        invoiceRow.items.forEach((item, itemIndex) => {
          // Check if we need a new page
          if (yPos > pageHeight - 35) {
            addNewPage()

            // Redraw header
            pdf.setFillColor(147, 51, 234)
            pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, "F")
            pdf.setTextColor(255, 255, 255)
            pdf.setFont("helvetica", "bold")
            pdf.setFontSize(10)

            xPos = margin + 3
            pdf.text("Tracking ID", xPos + colWidths.trackingId / 2, yPos + 6.5, { align: "center" })
            xPos += colWidths.trackingId
            pdf.text("Date", xPos + colWidths.date / 2, yPos + 6.5, { align: "center" })
            xPos += colWidths.date
            pdf.text("Status", xPos + colWidths.status / 2, yPos + 6.5, { align: "center" })
            xPos += colWidths.status
            pdf.text("Customer", xPos + colWidths.customer / 2, yPos + 6.5, { align: "center" })
            xPos += colWidths.customer
            pdf.text("Product", xPos + colWidths.product / 2, yPos + 6.5, { align: "center" })
            xPos += colWidths.product
            pdf.text("Qty", xPos + colWidths.qty / 2, yPos + 6.5, { align: "center" })
            xPos += colWidths.qty
            pdf.text("Unit Price", xPos + colWidths.unitPrice / 2, yPos + 6.5, { align: "center" })
            xPos += colWidths.unitPrice
            pdf.text("Purchase", xPos + colWidths.purchasePrice / 2, yPos + 6.5, { align: "center" })
            xPos += colWidths.purchasePrice
            pdf.text("Total Sales", xPos + colWidths.totalSales / 2, yPos + 6.5, { align: "center" })
            xPos += colWidths.totalSales
            pdf.text("Profit", xPos + colWidths.profit / 2, yPos + 6.5, { align: "center" })
            xPos += colWidths.profit
            pdf.text("Margin%", xPos + colWidths.margin / 2, yPos + 6.5, { align: "center" })

            yPos += 10
            pdf.setFont("helvetica", "normal")
            pdf.setFontSize(8)
          }

          const baseRowHeight = 8
          let maxLines = 1

          // Calculate required lines for product name
          let productLines = pdf.splitTextToSize(item.productName, colWidths.product - 4)
          maxLines = Math.max(maxLines, productLines.length)

          // Calculate required lines for customer name (only on first item)
          if (itemIndex === 0) {
            const customerLines = pdf.splitTextToSize(invoiceRow.customerName, colWidths.customer - 4)
            maxLines = Math.max(maxLines, customerLines.length + 1) // +1 for email line
          }

          const rowHeight = baseRowHeight + (maxLines - 1) * 3

          // Alternating row colors
          if (invoiceIndex % 2 === 0) {
            pdf.setFillColor(249, 250, 251)
            pdf.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, "F")
          }

          pdf.setTextColor(0, 0, 0)
          xPos = margin

          // Only show invoice details on first item
          if (itemIndex === 0) {
            // Tracking ID
            pdf.setFont("helvetica", "bold")
            pdf.setTextColor(147, 51, 234)
            const trackingLines = pdf.splitTextToSize(invoiceRow.trackingId, colWidths.trackingId - 2)
            pdf.text(trackingLines, xPos + colWidths.trackingId / 2, yPos + 5, {
              align: "center",
              maxWidth: colWidths.trackingId - 2,
            })
            xPos += colWidths.trackingId

            // Date
            pdf.setFont("helvetica", "normal")
            pdf.setTextColor(0, 0, 0)
            pdf.text(invoiceRow.date, xPos + colWidths.date / 2, yPos + 5, { align: "center" })
            xPos += colWidths.date

            // Status
            pdf.setFont("helvetica", "bold")
            if (invoiceRow.status === "Completed") {
              pdf.setTextColor(34, 197, 94)
            } else if (invoiceRow.status === "Pending") {
              pdf.setTextColor(234, 179, 8)
            } else {
              pdf.setTextColor(239, 68, 68)
            }
            pdf.text(invoiceRow.status, xPos + colWidths.status / 2, yPos + 5, { align: "center" })
            xPos += colWidths.status

            // Customer (name and email centered)
            pdf.setFont("helvetica", "bold")
            pdf.setTextColor(0, 0, 0)
            pdf.setFontSize(8)
            const customerNameLines = pdf.splitTextToSize(invoiceRow.customerName, colWidths.customer - 4)
            pdf.text(customerNameLines[0], xPos + colWidths.customer / 2, yPos + 3, {
              align: "center",
              maxWidth: colWidths.customer - 4,
            })

            pdf.setFont("helvetica", "normal")
            pdf.setFontSize(6)
            pdf.setTextColor(100, 100, 100)
            const emailLines = pdf.splitTextToSize(invoiceRow.customerEmail, colWidths.customer - 4)
            pdf.text(emailLines[0], xPos + colWidths.customer / 2, yPos + 6.5, {
              align: "center",
              maxWidth: colWidths.customer - 4,
            })
            pdf.setFontSize(8)
            xPos += colWidths.customer
          } else {
            // Skip invoice columns for additional items
            xPos += colWidths.trackingId + colWidths.date + colWidths.status + colWidths.customer
          }

          // Product (centered, multi-line support)
          pdf.setFont("helvetica", "normal")
          pdf.setTextColor(0, 0, 0)
          // const productLines = pdf.splitTextToSize(item.productName, colWidths.product - 4) // This line was duplicated
          productLines = pdf.splitTextToSize(item.productName, colWidths.product - 4) // Corrected to use the already declared productLines
          let productYPos = yPos + 3
          if (productLines.length > 1) {
            productYPos = yPos + 2.5
          }
          productLines.forEach((line: string, i: number) => {
            pdf.text(line, xPos + colWidths.product / 2, productYPos + i * 3, {
              align: "center",
              maxWidth: colWidths.product - 4,
            })
          })
          xPos += colWidths.product

          // Quantity (centered)
          pdf.text(item.quantity.toString(), xPos + colWidths.qty / 2, yPos + 5, { align: "center" })
          xPos += colWidths.qty

          // Unit Price (centered)
          pdf.text(formatCurrency(item.unitPrice, currentAppCurrency), xPos + colWidths.unitPrice / 2, yPos + 5, {
            align: "center",
          })
          xPos += colWidths.unitPrice

          // Purchase Price (centered)
          pdf.text(
            formatCurrency(item.purchasePrice, currentAppCurrency),
            xPos + colWidths.purchasePrice / 2,
            yPos + 5,
            {
              align: "center",
            },
          )
          xPos += colWidths.purchasePrice

          // Total Sales (centered, bold green)
          pdf.setFont("helvetica", "bold")
          pdf.setTextColor(34, 197, 94)
          pdf.text(formatCurrency(item.totalSales, currentAppCurrency), xPos + colWidths.totalSales / 2, yPos + 5, {
            align: "center",
          })
          xPos += colWidths.totalSales

          // Profit (centered, color based on value)
          pdf.setTextColor(item.profit >= 0 ? 34 : 239, item.profit >= 0 ? 197 : 68, item.profit >= 0 ? 94 : 68)
          pdf.text(formatCurrency(item.profit, currentAppCurrency), xPos + colWidths.profit / 2, yPos + 5, {
            align: "center",
          })
          xPos += colWidths.profit

          // Margin (centered, purple)
          pdf.setTextColor(147, 51, 234)
          pdf.text(item.profitMargin.toFixed(1) + "%", xPos + colWidths.margin / 2, yPos + 5, {
            align: "center",
          })

          pdf.setFont("helvetica", "normal")
          yPos += rowHeight
        })

        // Add invoice total row after all items
        const totalRowHeight = 7

        // Check if we need a new page for the total row
        if (yPos > pageHeight - 40) {
          addNewPage()
        }

        pdf.setFillColor(230, 230, 250) // Light purple background
        pdf.rect(margin, yPos, pageWidth - 2 * margin, totalRowHeight, "F")

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(8)
        pdf.setTextColor(80, 80, 80)

        xPos = margin

        // "Invoice Total" label spanning first columns
        const labelSpan =
          colWidths.trackingId +
          colWidths.date +
          colWidths.status +
          colWidths.customer +
          colWidths.product +
          colWidths.qty +
          colWidths.unitPrice +
          colWidths.purchasePrice
        pdf.text("Invoice Total", xPos + labelSpan / 2, yPos + 4.5, { align: "center" })
        xPos += labelSpan

        // Total Sales
        pdf.setTextColor(34, 197, 94)
        pdf.text(
          formatCurrency(invoiceRow.invoiceTotalSales, currentAppCurrency),
          xPos + colWidths.totalSales / 2,
          yPos + 4.5,
          {
            align: "center",
          },
        )
        xPos += colWidths.totalSales

        // Total Profit
        pdf.setTextColor(
          invoiceRow.invoiceTotalProfit >= 0 ? 34 : 239,
          invoiceRow.invoiceTotalProfit >= 0 ? 197 : 68,
          invoiceRow.invoiceTotalProfit >= 0 ? 94 : 68,
        )
        pdf.text(
          formatCurrency(invoiceRow.invoiceTotalProfit, currentAppCurrency),
          xPos + colWidths.profit / 2,
          yPos + 4.5,
          {
            align: "center",
          },
        )
        xPos += colWidths.profit

        // Profit Margin
        const invoiceMargin =
          invoiceRow.invoiceTotalSales > 0 ? (invoiceRow.invoiceTotalProfit / invoiceRow.invoiceTotalSales) * 100 : 0
        pdf.setTextColor(147, 51, 234)
        pdf.text(invoiceMargin.toFixed(1) + "%", xPos + colWidths.margin / 2, yPos + 4.5, {
          align: "center",
        })

        yPos += totalRowHeight + 2 // Add spacing between invoices
        pdf.setFontSize(8)
      })

      // Totals row
      yPos += 2
      pdf.setFillColor(147, 51, 234)
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, "F")

      pdf.setTextColor(255, 255, 255)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)

      xPos = margin
      const totalLabelSpan =
        colWidths.trackingId + colWidths.date + colWidths.status + colWidths.customer + colWidths.product
      pdf.text("GRAND TOTALS", xPos + totalLabelSpan / 2, yPos + 6.5, { align: "center" })
      xPos += totalLabelSpan

      pdf.text(detailedTotals.totalQty.toString(), xPos + colWidths.qty / 2, yPos + 6.5, { align: "center" })
      xPos += colWidths.qty + colWidths.unitPrice + colWidths.purchasePrice

      pdf.text(
        formatCurrency(detailedTotals.totalSales, currentAppCurrency),
        xPos + colWidths.totalSales / 2,
        yPos + 6.5,
        { align: "center" },
      )
      xPos += colWidths.totalSales

      pdf.text(
        formatCurrency(detailedTotals.totalProfit, currentAppCurrency),
        xPos + colWidths.profit / 2,
        yPos + 6.5,
        { align: "center" },
      )
      xPos += colWidths.profit

      pdf.text(detailedTotals.avgProfitMargin.toFixed(1) + "%", xPos + colWidths.margin / 2, yPos + 6.5, {
        align: "center",
      })

      yPos += 15

      // Footer
      if (yPos > pageHeight - 45) {
        addNewPage()
      }

      pdf.setFillColor(245, 245, 245)
      pdf.rect(0, pageHeight - 40, pageWidth, 40, "F")

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(16)
      pdf.setTextColor(147, 51, 234)

      const instagramText = "Instagram: @glow_with_vibes"
      const instagramY = pageHeight - 30
      pdf.textWithLink(instagramText, margin, instagramY, { url: "https://instagram.com/glow_with_vibes" })

      const facebookText = "Facebook: Glow with Vibes"
      const facebookY = pageHeight - 24
      pdf.textWithLink(facebookText, margin, facebookY, {
        url: "https://www.facebook.com/profile.php?id=61550835242923",
      })

      const linkedinText = "LinkedIn: Noman Ali"
      const linkedinY = pageHeight - 18
      pdf.textWithLink(linkedinText, margin, linkedinY, { url: "https://www.linkedin.com/in/noman-ali" })

      const phoneText = "Phone: +92 311 0263606"
      const phoneY = pageHeight - 12
      pdf.textWithLink(phoneText, margin, phoneY, { url: "https://wa.me/923110263606" })

      pdf.setFontSize(8)
      pdf.setTextColor(0, 0, 0)
      const reportDate = `Report Generated: ${new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      })}`
      const reportDateWidth = pdf.getTextWidth(reportDate)
      pdf.text(reportDate, pageWidth - margin - reportDateWidth, pageHeight - 30)

      pdf.setFont("helvetica", "italic")
      const confidential = "Confidential Business Information"
      const confidentialWidth = pdf.getTextWidth(confidential)
      pdf.text(confidential, pageWidth - margin - confidentialWidth, pageHeight - 12)

      // Save PDF
      const today = new Date().toISOString().split("T")[0]
      const filename = `Glow_With_Vibes_Monthly_Report_${formatSelectedMonth().replace(" ", "_")}_${today}.pdf`
      pdf.save(filename)
    } catch (err) {
      console.error("Failed to generate PDF:", err)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // UI helpers
  const toggleSection = (key: keyof Omit<ReportOptions, "tableColumns">) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  const toggleColumn = (key: keyof ReportOptions["tableColumns"]) => {
    setOptions((prev) => ({ ...prev, tableColumns: { ...prev.tableColumns, [key]: !prev.tableColumns[key] } }))
  }
  const resetOptions = () => setOptions(defaultOptions)

  const hasAnyTableColumn = Object.values(options.tableColumns).some(Boolean)

  return (
    <div className="space-y-6">
      {/* Hidden PDF content reference */}
      <div ref={pdfContentRef} className="hidden" />

      {/* Admin Report Builder */}
      {user?.role === "admin" && (
        <Card data-pdf-hidden="true" className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <SlidersHorizontal className="h-5 w-5 text-purple-600" />
              Report Builder (Admin Only)
            </CardTitle>
            <CardDescription>Customize which sections and columns appear in your monthly report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Report Sections */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Report Sections
                </h4>
                <div className="space-y-2 pl-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sec-header"
                      checked={options.includeHeader}
                      onCheckedChange={() => toggleSection("includeHeader")}
                    />
                    <Label htmlFor="sec-header" className="cursor-pointer">
                      Header Banner
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sec-summary"
                      checked={options.includeExecutiveSummary}
                      onCheckedChange={() => toggleSection("includeExecutiveSummary")}
                    />
                    <Label htmlFor="sec-summary" className="cursor-pointer">
                      Executive Summary
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sec-kpis"
                      checked={options.includeKpis}
                      onCheckedChange={() => toggleSection("includeKpis")}
                    />
                    <Label htmlFor="sec-kpis" className="cursor-pointer">
                      KPI Cards
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sec-financial"
                      checked={options.includeFinancialPerformance}
                      onCheckedChange={() => toggleSection("includeFinancialPerformance")}
                    />
                    <Label htmlFor="sec-financial" className="cursor-pointer">
                      Financial Performance
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sec-operational"
                      checked={options.includeOperationalPerformance}
                      onCheckedChange={() => toggleSection("includeOperationalPerformance")}
                    />
                    <Label htmlFor="sec-operational" className="cursor-pointer">
                      Operational Performance
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sec-top-cust"
                      checked={options.includeTopCustomers}
                      onCheckedChange={() => toggleSection("includeTopCustomers")}
                    />
                    <Label htmlFor="sec-top-cust" className="cursor-pointer">
                      Top Customers
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sec-top-prod"
                      checked={options.includeTopProducts}
                      onCheckedChange={() => toggleSection("includeTopProducts")}
                    />
                    <Label htmlFor="sec-top-prod" className="cursor-pointer">
                      Top Products
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sec-sales-table"
                      checked={options.includeSalesInventoryTable}
                      onCheckedChange={() => toggleSection("includeSalesInventoryTable")}
                    />
                    <Label htmlFor="sec-sales-table" className="cursor-pointer font-semibold text-red-700">
                      Sales Inventory Table
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sec-transactions"
                      checked={options.includeTransactionRecords}
                      onCheckedChange={() => toggleSection("includeTransactionRecords")}
                    />
                    <Label htmlFor="sec-transactions" className="cursor-pointer">
                      Transaction Records
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sec-footer"
                      checked={options.includeFooter}
                      onCheckedChange={() => toggleSection("includeFooter")}
                    />
                    <Label htmlFor="sec-footer" className="cursor-pointer">
                      Footer / Contact Info
                    </Label>
                  </div>
                </div>
              </div>

              {/* Table Columns */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-red-600" />
                  Sales Table Columns
                </h4>
                <div className="space-y-2 pl-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="col-date"
                      checked={options.tableColumns.date}
                      onCheckedChange={() => toggleColumn("date")}
                    />
                    <Label htmlFor="col-date" className="cursor-pointer">
                      Date
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="col-category"
                      checked={options.tableColumns.category}
                      onCheckedChange={() => toggleColumn("category")}
                    />
                    <Label htmlFor="col-category" className="cursor-pointer">
                      Category
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="col-product"
                      checked={options.tableColumns.product}
                      onCheckedChange={() => toggleColumn("product")}
                    />
                    <Label htmlFor="col-product" className="cursor-pointer">
                      Product
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="col-qty"
                      checked={options.tableColumns.quantitySold}
                      onCheckedChange={() => toggleColumn("quantitySold")}
                    />
                    <Label htmlFor="col-qty" className="cursor-pointer">
                      Quantity Sold
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="col-unit"
                      checked={options.tableColumns.unitPrice}
                      onCheckedChange={() => toggleColumn("unitPrice")}
                    />
                    <Label htmlFor="col-unit" className="cursor-pointer">
                      Unit Price
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="col-total"
                      checked={options.tableColumns.totalSales}
                      onCheckedChange={() => toggleColumn("totalSales")}
                    />
                    <Label htmlFor="col-total" className="cursor-pointer">
                      Total Sales ({currentAppCurrency})
                    </Label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  Report Actions
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="month-select" className="text-xs text-gray-600 mb-1 block">
                      Select Month
                    </Label>
                    <Select onValueChange={setSelectedMonth} defaultValue={selectedMonth}>
                      <SelectTrigger id="month-select" className="w-full">
                        <Calendar className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {monthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" onClick={resetOptions} className="w-full bg-transparent">
                    <RotateCw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>

                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingPdf}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-admin controls */}
      {user?.role !== "admin" && (
        <div className="flex items-center justify-between" data-pdf-hidden="true">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Monthly Income Report</h1>
            <p className="text-gray-600">Comprehensive financial analysis for {formatSelectedMonth()}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select onValueChange={setSelectedMonth} defaultValue={selectedMonth}>
              <SelectTrigger className="w-[200px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleGenerateReport} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? (
                <>
                  <Clock className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Rest of the UI remains the same - Report display sections */}
      <div ref={reportRef} className="space-y-6">
        {/* Header Section */}
        {options.includeHeader && (
          <div data-section="header" className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <BarChart3 className="mr-3 h-8 w-8" />
                  Monthly Income Report
                </h1>
                <p className="text-blue-100">
                  Comprehensive financial analysis and business insights for {formatSelectedMonth()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Executive Summary */}
        {options.includeExecutiveSummary && (
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow" data-section="summary">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Executive Summary - {formatSelectedMonth()}
              </CardTitle>
              <CardDescription>Monthly business performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 space-y-3">
                <p>
                  During <span className="font-semibold text-blue-600">{formatSelectedMonth()}</span>, our business
                  processed <span className="font-semibold text-blue-600">{monthlyMetrics.totalOrders}</span> orders,
                  generating a total revenue of{" "}
                  <span className="font-semibold text-green-600">
                    {formatCurrency(monthlyMetrics.totalRevenue, currentAppCurrency)}
                  </span>
                  .
                </p>
                <p>
                  Our profit margin stood at{" "}
                  <span className="font-semibold text-purple-600">{monthlyMetrics.profitMargin.toFixed(1)}%</span>, with
                  a total profit of{" "}
                  <span className="font-semibold text-green-600">
                    {formatCurrency(monthlyMetrics.totalProfit, currentAppCurrency)}
                  </span>
                  . We served <span className="font-semibold text-blue-600">{monthlyMetrics.uniqueCustomers}</span>{" "}
                  unique customers and sold{" "}
                  <span className="font-semibold text-purple-600">{monthlyMetrics.totalItems}</span> items in total.
                </p>
                <p>
                  The average order value was{" "}
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(monthlyMetrics.avgOrderValue, currentAppCurrency)}
                  </span>
                  , with <span className="font-semibold text-green-600">{monthlyMetrics.completedOrders}</span>{" "}
                  completed orders out of {monthlyMetrics.totalOrders} total orders.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        {options.includeKpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-section="kpis">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(monthlyMetrics.totalRevenue, currentAppCurrency)}
                    </div>
                    <div className="flex items-center mt-1">
                      {monthOverMonthChanges.revenueChange >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                      )}
                      <span
                        className={`text-xs ${monthOverMonthChanges.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {monthOverMonthChanges.revenueChange >= 0 ? "+" : ""}
                        {monthOverMonthChanges.revenueChange.toFixed(1)}% vs last month
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Profit</p>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(monthlyMetrics.totalProfit, currentAppCurrency)}
                    </div>
                    <div className="flex items-center mt-1">
                      <Percent className="h-3 w-3 mr-1 text-blue-600" />
                      <span className="text-xs text-blue-600">
                        {monthlyMetrics.profitMargin.toFixed(1)}% profit margin
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <div className="text-2xl font-bold text-purple-600">{monthlyMetrics.totalOrders}</div>
                    <div className="flex items-center mt-1">
                      {monthOverMonthChanges.ordersChange >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                      )}
                      <span
                        className={`text-xs ${monthOverMonthChanges.ordersChange >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {monthOverMonthChanges.ordersChange >= 0 ? "+" : ""}
                        {monthOverMonthChanges.ordersChange.toFixed(1)}% vs last month
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unique Customers</p>
                    <div className="text-2xl font-bold text-orange-600">{monthlyMetrics.uniqueCustomers}</div>
                    <div className="flex items-center mt-1">
                      <Package className="h-3 w-3 mr-1 text-orange-600" />
                      <span className="text-xs text-orange-600">{monthlyMetrics.totalItems} items sold</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Financial & Operational Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Performance */}
          {options.includeFinancialPerformance && (
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow" data-section="financial">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                  Financial Performance
                </CardTitle>
                <CardDescription>Revenue, costs, and profitability analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border-l-4 border-l-green-500 pl-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Revenue</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(monthlyMetrics.totalRevenue, currentAppCurrency)}
                      </span>
                    </div>
                  </div>
                  <div className="border-l-4 border-l-red-500 pl-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Cost</span>
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrency(monthlyMetrics.totalCost, currentAppCurrency)}
                      </span>
                    </div>
                  </div>
                  <div className="border-l-4 border-l-blue-500 pl-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Net Profit</span>
                      <span
                        className={`text-lg font-bold ${monthlyMetrics.totalProfit >= 0 ? "text-blue-600" : "text-red-600"}`}
                      >
                        {formatCurrency(monthlyMetrics.totalProfit, currentAppCurrency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Profit Margin</span>
                    <span className="text-sm font-bold text-blue-600">{monthlyMetrics.profitMargin.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, monthlyMetrics.profitMargin))} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operational Performance */}
          {options.includeOperationalPerformance && (
            <Card
              className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow"
              data-section="operational"
            >
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <BarChart3 className="mr-2 h-5 w-5 text-purple-600" />
                  Operational Performance
                </CardTitle>
                <CardDescription>Orders, customers, and operational metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border-l-4 border-l-green-500">
                    <div className="text-2xl font-bold text-green-800">{monthlyMetrics.completedOrders}</div>
                    <div className="text-xs text-green-600 font-medium">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border-l-4 border-l-yellow-500">
                    <div className="text-2xl font-bold text-yellow-800">{monthlyMetrics.pendingOrders}</div>
                    <div className="text-xs text-yellow-600 font-medium">Pending</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border-l-4 border-l-red-500">
                    <div className="text-2xl font-bold text-red-800">{monthlyMetrics.cancelledOrders}</div>
                    <div className="text-xs text-red-600 font-medium">Cancelled</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-l-4 border-l-blue-500 pl-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Average Order Value</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(monthlyMetrics.avgOrderValue, currentAppCurrency)}
                      </span>
                    </div>
                  </div>
                  <div className="border-l-4 border-l-purple-500 pl-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Items per Order</span>
                      <span className="text-lg font-bold text-purple-600">
                        {monthlyMetrics.totalOrders > 0
                          ? (monthlyMetrics.totalItems / monthlyMetrics.totalOrders).toFixed(1)
                          : "0"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          {options.includeTopCustomers && (
            <Card
              className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow"
              data-section="top-customers"
            >
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Users className="mr-2 h-5 w-5 text-blue-600" />
                  Top Customers
                </CardTitle>
                <CardDescription>Highest revenue generating customers this month</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyMetrics.topCustomers.length > 0 ? (
                  <div className="space-y-4">
                    {monthlyMetrics.topCustomers.map((customer, index) => (
                      <div
                        key={customer.email || customer.name}
                        className="p-4 rounded-lg border hover:shadow-md transition-shadow hover:bg-blue-50/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <p className="text-sm text-gray-500">{customer.email}</p>
                              <p className="text-xs text-gray-400">{customer.orders} orders</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">
                              {formatCurrency(customer.revenue, currentAppCurrency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
                    <p className="mt-1 text-sm text-gray-500">No customer data available for this month.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top Products */}
          {options.includeTopProducts && (
            <Card
              className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow"
              data-section="top-products"
            >
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Package className="mr-2 h-5 w-5 text-green-600" />
                  Top Products
                </CardTitle>
                <CardDescription>Best selling products by revenue this month</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyMetrics.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {monthlyMetrics.topProducts.map((product, index) => (
                      <div
                        key={product.name}
                        className="p-4 rounded-lg border hover:shadow-md transition-shadow hover:bg-green-50/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.quantity} units sold</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatCurrency(product.revenue, currentAppCurrency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-sm text-gray-500">No product sales data available for this month.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sales Inventory Report Table */}
        {options.includeSalesInventoryTable && (
          <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow" data-section="sales-table">
            <CardHeader className="pb-2 bg-red-50">
              <CardTitle className="flex items-center text-red-900">
                <FileText className="mr-2 h-5 w-5 text-red-600" />
                Sales Inventory Report Template
              </CardTitle>
              <CardDescription>Detailed sales breakdown by date, category, and product</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {salesRows.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <div className="max-h-[480px] overflow-auto" data-pdf-expand="true">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-red-100 sticky top-0">
                        <tr className="text-left">
                          {options.tableColumns.date && (
                            <th className="border border-gray-300 p-2 font-semibold text-gray-900">Date</th>
                          )}
                          {options.tableColumns.category && (
                            <th className="border border-gray-300 p-2 font-semibold text-gray-900">Category</th>
                          )}
                          {options.tableColumns.product && (
                            <th className="border border-gray-300 p-2 font-semibold text-gray-900">Product</th>
                          )}
                          {options.tableColumns.quantitySold && (
                            <th className="border border-gray-300 p-2 font-semibold text-gray-900 text-center">
                              Quantity Sold
                            </th>
                          )}
                          {options.tableColumns.unitPrice && (
                            <th className="border border-gray-300 p-2 font-semibold text-gray-900 text-right">
                              Unit Price
                            </th>
                          )}
                          {options.tableColumns.totalSales && (
                            <th className="border border-gray-300 p-2 font-semibold text-gray-900 text-right">
                              Total Sales ({currentAppCurrency})
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {salesRows.map((row, idx) => (
                          <tr key={`${row.product}-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            {options.tableColumns.date && (
                              <td className="border border-gray-300 p-2 text-gray-700">{row.date}</td>
                            )}
                            {options.tableColumns.category && (
                              <td className="border border-gray-300 p-2 text-gray-700">{row.category}</td>
                            )}
                            {options.tableColumns.product && (
                              <td className="border border-gray-300 p-2 text-gray-700">{row.product}</td>
                            )}
                            {options.tableColumns.quantitySold && (
                              <td className="border border-gray-300 p-2 tabular-nums text-center text-gray-900">
                                {row.quantitySold}
                              </td>
                            )}
                            {options.tableColumns.unitPrice && (
                              <td className="border border-gray-300 p-2 tabular-nums text-right text-gray-900">
                                {formatCurrency(row.unitPrice, currentAppCurrency)}
                              </td>
                            )}
                            {options.tableColumns.totalSales && (
                              <td className="border border-gray-300 p-2 tabular-nums text-right font-medium text-gray-900">
                                {formatCurrency(row.totalSales, currentAppCurrency)}
                              </td>
                            )}
                          </tr>
                        ))}

                        {/* Totals row */}
                        <tr className="bg-red-100 font-semibold">
                          <td
                            className="border border-gray-300 p-2 text-gray-900"
                            colSpan={
                              Number(options.tableColumns.date) +
                              Number(options.tableColumns.category) +
                              Number(options.tableColumns.product)
                            }
                          >
                            Total
                          </td>
                          {options.tableColumns.quantitySold && (
                            <td className="border border-gray-300 p-2 tabular-nums text-center text-gray-900">
                              {salesTotals.totalQty}
                            </td>
                          )}
                          {options.tableColumns.unitPrice && (
                            <td className="border border-gray-300 p-2 text-center text-gray-500">—</td>
                          )}
                          {options.tableColumns.totalSales && (
                            <td className="border border-gray-300 p-2 tabular-nums text-right text-gray-900">
                              {formatCurrency(salesTotals.totalAmount, currentAppCurrency)}
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No sales data found for this month.</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction Records */}
        {options.includeTransactionRecords && (
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow" data-section="transactions">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center text-gray-900">
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                  Transaction Records - {formatSelectedMonth()}
                </div>
                <Badge className="bg-blue-100 text-blue-800">{monthlyInvoices.length} Transactions</Badge>
              </CardTitle>
              <CardDescription>Complete list of all transactions for the selected month</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyInvoices.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto" data-pdf-expand="true">
                  {monthlyInvoices
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((invoice, index) => (
                      <div
                        key={invoice.id}
                        className="p-4 rounded-lg border hover:shadow-md transition-all duration-200 hover:bg-blue-50/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium text-gray-900">{invoice.customerName}</p>
                                <Badge
                                  className={
                                    (invoice.status ?? "pending") === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : (invoice.status ?? "pending") === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                  }
                                >
                                  {(invoice.status ?? "pending").charAt(0).toUpperCase() +
                                    (invoice.status ?? "pending").slice(1)}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                {invoice.trackingId && (
                                  <span className="flex items-center">
                                    <Hash className="h-3 w-3 mr-1 text-blue-500" />
                                    <span className="text-blue-600 font-mono">{invoice.trackingId}</span>
                                  </span>
                                )}
                                <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                                <span>{invoice.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-bold text-gray-900">
                                {formatCurrency(invoice.totalAmount, currentAppCurrency)}
                              </p>
                              <p
                                className={`text-sm font-medium ${invoice.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {formatCurrency(invoice.totalProfit, currentAppCurrency)} profit
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewInvoice(invoice)}
                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDownloadPdf(invoice)}
                                className="border-green-200 text-green-600 hover:bg-green-50"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-gray-500 mb-4">No transactions found for {formatSelectedMonth()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        {options.includeFooter && (
          <Card className="border-l-4 border-l-gray-500 hover:shadow-lg transition-shadow" data-section="footer">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Building2 className="mr-2 h-5 w-5 text-gray-600" />
                GLOW WITH VIBES
              </CardTitle>
              <CardDescription>Beauty, Cosmetic & Personal Care</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Business Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">About Us</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Beauty, cosmetic & personal care. Wholesales Seller Beauty Products. Delivery all over Pakistan.
                    Fast Customer Response, COD and easy returns.
                  </p>
                </div>

                {/* Connect With Us */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Connect With Us</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center">
                      <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
                      Instagram: @glow_with_vibes
                    </p>
                    <p className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      LinkedIn: Noman Ali
                    </p>
                    <p className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                      Facebook: Glow with Vibes
                    </p>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <Phone className="h-4 w-4 mr-2" />
                      <span>+92 311 0263606</span>
                    </div>
                  </div>
                </div>

                {/* Report Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Report Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Report Period: {formatSelectedMonth()}</p>
                    <p>Generated: {new Date().toLocaleDateString()}</p>
                    <p>Total Records: {salesRows.length}</p>
                    <p>Currency: {currentAppCurrency}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-l-blue-500">
                    <p className="text-xs text-gray-600">
                      GLOW WITH VIBES - This report contains confidential business information.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
