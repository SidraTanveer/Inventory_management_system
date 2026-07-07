"use client"

import { jsPDF } from "jspdf"
import type { Customer, Invoice, Product } from "@/types/app"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
}

export async function generateCustomersPDF(customers: Customer[], invoices: Invoice[], currency: string) {
  const doc = new jsPDF("l", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let currentY = 15

  // Header
  doc.setFont("Times", "Bold")
  doc.setFontSize(20)
  doc.setTextColor(128, 0, 128)
  doc.text("GLOW WITH VIBES", pageWidth / 2, currentY, { align: "center" })
  currentY += 10

  doc.setFont("Times", "Roman")
  doc.setFontSize(14)
  doc.setTextColor(100, 100, 100)
  doc.text("Customer Database Report with Purchase History", pageWidth / 2, currentY, { align: "center" })
  currentY += 5
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: "center" })
  currentY += 10

  // Summary
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  doc.setFont("Times", "Bold")
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Total Customers: ${customers.length}`, 15, currentY)
  const frequentCount = customers.filter((c) => c.type === "frequent").length
  doc.text(`Frequent Customers: ${frequentCount}`, 15, currentY + 5)
  doc.text(`Total Revenue: ${formatCurrency(totalRevenue, currency)}`, 15, currentY + 10)
  currentY += 20

  // Detailed customer information with purchase history
  customers.forEach((customer) => {
    if (currentY > pageHeight - 40) {
      doc.addPage()
      currentY = 15
    }

    // Customer header
    doc.setFillColor(240, 240, 255)
    doc.rect(15, currentY - 5, pageWidth - 30, 10, "F")
    doc.setFont("Times", "Bold")
    doc.setFontSize(12)
    doc.setTextColor(128, 0, 128)
    doc.text(customer.name, 15, currentY)
    currentY += 10

    // Customer details
    doc.setFont("Times", "Roman")
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Email: ${customer.email}`, 15, currentY)
    doc.text(`Phone: ${customer.phone}`, 100, currentY)
    doc.text(`Type: ${customer.type}`, 180, currentY)
    currentY += 5
    doc.text(`Customer Since: ${formatDate(customer.createdAt)}`, 15, currentY)
    currentY += 8

    // Purchase history
    const customerInvoices = invoices.filter((inv) => inv.customerName === customer.name)
    if (customerInvoices.length > 0) {
      doc.setFont("Times", "Bold")
      doc.setFontSize(10)
      doc.text("Purchase History:", 15, currentY)
      currentY += 5

      // Table header
      doc.setFillColor(250, 250, 250)
      doc.rect(15, currentY - 3, pageWidth - 30, 7, "F")
      doc.setFont("Times", "Bold")
      doc.setFontSize(9)
      doc.text("Invoice ID", 15, currentY)
      doc.text("Date", 60, currentY)
      doc.text("Products", 90, currentY)
      doc.text("Quantity", 160, currentY)
      doc.text("Amount", 190, currentY)
      doc.text("Status", 230, currentY)
      currentY += 7

      // Invoice rows
      doc.setFont("Times", "Roman")
      doc.setFontSize(8)
      customerInvoices.forEach((invoice) => {
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = 15
        }

        doc.text(invoice.id, 15, currentY)
        doc.text(formatDate(invoice.createdAt), 60, currentY)

        // List products
        const productNames = invoice.items.map((item) => item.productName).join(", ")
        const truncatedProducts = productNames.length > 40 ? productNames.substring(0, 37) + "..." : productNames
        doc.text(truncatedProducts, 90, currentY)

        const totalQty = invoice.items.reduce((sum, item) => sum + item.quantity, 0)
        doc.text(totalQty.toString(), 160, currentY)
        doc.text(formatCurrency(invoice.totalAmount, currency), 190, currentY)
        doc.text((invoice.status ?? "pending").toString(), 230, currentY)
        currentY += 5
      })

      // Customer summary
      const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
      doc.setFont("Times", "Bold")
      doc.setFontSize(9)
      doc.text(`Total Orders: ${customerInvoices.length}`, 15, currentY + 3)
      doc.text(`Total Spent: ${formatCurrency(totalSpent, currency)}`, 100, currentY + 3)
      currentY += 10
    } else {
      doc.setFont("Times", "Italic")
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text("No purchase history", 15, currentY)
      currentY += 10
    }

    currentY += 5
  })

  // Footer
  doc.setFont("Times", "Roman")
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text("Glow With Vibes - Customer Database Report", pageWidth / 2, pageHeight - 10, { align: "center" })

  return doc
}

export async function generateVendorsPDF(vendors: Vendor[], products: Product[], currency: string) {
  const doc = new jsPDF("l", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let currentY = 15

  // Header
  doc.setFont("Times", "Bold")
  doc.setFontSize(20)
  doc.setTextColor(128, 0, 128)
  doc.text("GLOW WITH VIBES", pageWidth / 2, currentY, { align: "center" })
  currentY += 10

  doc.setFont("Times", "Roman")
  doc.setFontSize(14)
  doc.setTextColor(100, 100, 100)
  doc.text("Vendor Database Report with Product Details", pageWidth / 2, currentY, { align: "center" })
  currentY += 5
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: "center" })
  currentY += 10

  // Summary
  doc.setFont("Times", "Bold")
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Total Vendors: ${vendors.length}`, 15, currentY)
  doc.text(`Total Products: ${products.length}`, 15, currentY + 5)
  currentY += 15

  // Detailed vendor information
  vendors.forEach((vendor) => {
    if (currentY > pageHeight - 40) {
      doc.addPage()
      currentY = 15
    }

    // Vendor header
    doc.setFillColor(240, 255, 240)
    doc.rect(15, currentY - 5, pageWidth - 30, 10, "F")
    doc.setFont("Times", "Bold")
    doc.setFontSize(12)
    doc.setTextColor(0, 128, 0)
    doc.text(vendor.name, 15, currentY)
    currentY += 10

    // Vendor details
    doc.setFont("Times", "Roman")
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Email: ${vendor.email}`, 15, currentY)
    doc.text(`Phone: ${vendor.phone}`, 100, currentY)
    currentY += 5
    doc.text(`Address: ${vendor.address}`, 15, currentY)
    currentY += 5
    doc.text(`Vendor Since: ${formatDate(vendor.createdAt)}`, 15, currentY)
    currentY += 8

    // Products from this vendor
    const vendorProducts = products.filter((p) => p.vendorId === vendor.id)
    if (vendorProducts.length > 0) {
      doc.setFont("Times", "Bold")
      doc.setFontSize(10)
      doc.text(`Products Supplied (${vendorProducts.length}):`, 15, currentY)
      currentY += 5

      // Table header
      doc.setFillColor(250, 250, 250)
      doc.rect(15, currentY - 3, pageWidth - 30, 7, "F")
      doc.setFont("Times", "Bold")
      doc.setFontSize(9)
      doc.text("Product Name", 15, currentY)
      doc.text("SKU", 80, currentY)
      doc.text("Category", 120, currentY)
      doc.text("Cost Price", 160, currentY)
      doc.text("Unit Price", 190, currentY)
      doc.text("Stock", 220, currentY)
      doc.text("Value", 245, currentY)
      currentY += 7

      // Product rows
      doc.setFont("Times", "Roman")
      doc.setFontSize(8)
      let totalValue = 0
      vendorProducts.forEach((product) => {
        if (currentY > pageHeight - 20) {
          doc.addPage()
          currentY = 15
        }

        const productValue = product.unitPrice * product.stock
        totalValue += productValue

        doc.text(product.name.substring(0, 25), 15, currentY)
        doc.text(product.sku, 80, currentY)
        doc.text(product.category, 120, currentY)
        doc.text(formatCurrency(product.costPrice, currency), 160, currentY)
        doc.text(formatCurrency(product.unitPrice, currency), 190, currentY)
        doc.text(product.stock.toString(), 220, currentY)
        doc.text(formatCurrency(productValue, currency), 245, currentY)
        currentY += 5
      })

      // Vendor summary
      doc.setFont("Times", "Bold")
      doc.setFontSize(9)
      doc.text(`Total Products: ${vendorProducts.length}`, 15, currentY + 3)
      doc.text(`Total Inventory Value: ${formatCurrency(totalValue, currency)}`, 100, currentY + 3)
      currentY += 10
    } else {
      doc.setFont("Times", "Italic")
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text("No products from this vendor", 15, currentY)
      currentY += 10
    }

    currentY += 5
  })

  // Footer
  doc.setFont("Times", "Roman")
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text("Glow With Vibes - Vendor Database Report", pageWidth / 2, pageHeight - 10, { align: "center" })

  return doc
}

export async function generateInvoicesSummaryPDF(invoices: Invoice[], currency: string) {
  const doc = new jsPDF("l", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let currentY = 15

  // Header
  doc.setFont("Times", "Bold")
  doc.setFontSize(20)
  doc.setTextColor(128, 0, 128)
  doc.text("GLOW WITH VIBES", pageWidth / 2, currentY, { align: "center" })
  currentY += 10

  doc.setFont("Times", "Roman")
  doc.setFontSize(14)
  doc.setTextColor(100, 100, 100)
  doc.text("Invoices Summary Report with Product Details", pageWidth / 2, currentY, { align: "center" })
  currentY += 5
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: "center" })
  currentY += 10

  // Summary Statistics
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalProfit = invoices.reduce((sum, inv) => sum + inv.totalProfit, 0)
  const completedCount = invoices.filter((inv) => inv.status === "completed").length

  doc.setFont("Times", "Bold")
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Total Invoices: ${invoices.length}`, 15, currentY)
  doc.text(`Completed: ${completedCount}`, 15, currentY + 5)
  doc.text(`Pending: ${invoices.length - completedCount}`, 15, currentY + 10)
  doc.text(`Total Revenue: ${formatCurrency(totalAmount, currency)}`, 100, currentY)
  doc.text(`Total Profit: ${formatCurrency(totalProfit, currency)}`, 100, currentY + 5)
  doc.text(`Profit Margin: ${((totalProfit / totalAmount) * 100).toFixed(1)}%`, 100, currentY + 10)
  currentY += 20

  // Detailed invoice information
  invoices.forEach((invoice) => {
    if (currentY > pageHeight - 50) {
      doc.addPage()
      currentY = 15
    }

    // Invoice header
    doc.setFillColor(255, 240, 240)
    doc.rect(15, currentY - 5, pageWidth - 30, 10, "F")
    doc.setFont("Times", "Bold")
    doc.setFontSize(11)
    doc.setTextColor(128, 0, 128)
    doc.text(`Invoice: ${invoice.id}`, 15, currentY)
    doc.text(`Date: ${formatDate(invoice.createdAt)}`, 150, currentY)
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 230, currentY)
    currentY += 10

    // Customer details
    doc.setFont("Times", "Roman")
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text(`Customer: ${invoice.customerName}`, 15, currentY)
    doc.text(`Email: ${invoice.customerEmail}`, 100, currentY)
    doc.text(`Phone: ${invoice.customerPhone}`, 180, currentY)
    currentY += 7

    // Products table header
    doc.setFillColor(250, 250, 250)
    doc.rect(15, currentY - 3, pageWidth - 30, 7, "F")
    doc.setFont("Times", "Bold")
    doc.setFontSize(8)
    doc.text("Product", 15, currentY)
    doc.text("Qty", 120, currentY)
    doc.text("Unit Price", 145, currentY)
    doc.text("Cost Price", 175, currentY)
    doc.text("Total", 205, currentY)
    doc.text("Profit", 235, currentY)
    currentY += 7

    // Product rows
    doc.setFont("Times", "Roman")
    doc.setFontSize(8)
    invoice.items.forEach((item) => {
      if (currentY > pageHeight - 20) {
        doc.addPage()
        currentY = 15
      }

      const itemTotal = item.quantity * item.unitPrice
      const itemCost = item.quantity * item.costPrice
      const itemProfit = itemTotal - itemCost

      doc.text(item.productName.substring(0, 35), 15, currentY)
      doc.text(item.quantity.toString(), 120, currentY)
      doc.text(formatCurrency(item.unitPrice, currency), 145, currentY)
      doc.text(formatCurrency(item.costPrice, currency), 175, currentY)
      doc.text(formatCurrency(itemTotal, currency), 205, currentY)
      doc.text(formatCurrency(itemProfit, currency), 235, currentY)
      currentY += 5
    })

    // Invoice totals
    doc.setFont("Times", "Bold")
    doc.setFontSize(9)
    doc.text(`Total Amount: ${formatCurrency(invoice.totalAmount, currency)}`, 15, currentY + 3)
    doc.text(`Total Profit: ${formatCurrency(invoice.totalProfit, currency)}`, 100, currentY + 3)
    doc.text(`Profit %: ${invoice.profitPercentage.toFixed(1)}%`, 180, currentY + 3)
    currentY += 12
  })

  // Footer
  doc.setFont("Times", "Roman")
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text("Glow With Vibes - Invoices Summary Report", pageWidth / 2, pageHeight - 10, { align: "center" })

  return doc
}
