"use client"

import jsPDF from "jspdf"
import type { Product } from "@/types/app"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
}

export async function generateProductPDF(product: Product, vendor: Vendor | undefined, currentAppCurrency: string) {
  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = margin

  // Header
  doc.setFillColor(147, 51, 234)
  doc.rect(0, 0, pageWidth, 35, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(24)
  doc.text("GLOW WITH VIBES", margin, 15)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Beauty, Cosmetic & Personal Care", margin, 22)
  doc.text("Wholesale Seller | Delivery All Over Pakistan", margin, 27)
  doc.text("Phone: +92 311 0263606", margin, 32)

  yPos = 45

  // Product Details Section
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("PRODUCT DETAILS", margin, yPos)
  yPos += 12

  doc.setFillColor(240, 240, 240)
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 50, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)

  const col1X = margin + 5
  const col2X = pageWidth / 2

  doc.text("Product Name:", col1X, yPos)
  doc.setFont("helvetica", "normal")
  doc.text(product.name, col1X + 40, yPos)

  yPos += 8
  doc.setFont("helvetica", "bold")
  doc.text("SKU:", col1X, yPos)
  doc.setFont("helvetica", "normal")
  doc.text(product.sku ?? "N/A", col1X + 40, yPos)

  yPos += 8
  doc.setFont("helvetica", "bold")
  doc.text("Category:", col1X, yPos)
  doc.setFont("helvetica", "normal")
  doc.text(product.category ?? "N/A", col1X + 40, yPos)

  yPos -= 24
  doc.setFont("helvetica", "bold")
  doc.text("Unit Price:", col2X, yPos)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(34, 197, 94)
  doc.text(formatCurrency(product.unitPrice ?? 0, currentAppCurrency), col2X + 35, yPos)

  yPos += 8
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Cost Price:", col2X, yPos)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(239, 68, 68)
  doc.text(formatCurrency(product.costPrice ?? 0, currentAppCurrency), col2X + 35, yPos)

  yPos += 8
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Current Stock:", col2X, yPos)
  doc.setFont("helvetica", "normal")
  doc.text((product.stock ?? 0).toString(), col2X + 35, yPos)

  yPos += 16

  // Description
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Description:", margin, yPos)
  yPos += 6

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  const descriptionLines = doc.splitTextToSize(product.description ?? "No description available.", pageWidth - 2 * margin - 10)
  descriptionLines.forEach((line: string) => {
    doc.text(line, margin + 5, yPos)
    yPos += 5
  })

  yPos += 5

  // Vendor Information
  if (vendor) {
    doc.setFillColor(230, 230, 250)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 35, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(147, 51, 234)
    doc.text("VENDOR INFORMATION", margin + 5, yPos + 5)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Name: ${vendor.name}`, margin + 5, yPos + 12)
    doc.text(`Email: ${vendor.email}`, margin + 5, yPos + 18)
    doc.text(`Phone: ${vendor.phone}`, margin + 5, yPos + 24)
    doc.text(`Address: ${vendor.address}`, margin + 5, yPos + 30)

    yPos += 40
  }

  // Purchase History Table
  if (product.purchaseHistory && product.purchaseHistory.length > 0) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text("PURCHASE HISTORY", margin, yPos)
    yPos += 8

    // Table header
    doc.setFillColor(147, 51, 234)
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)

    const colWidths = {
      date: 35,
      quantity: 30,
      unitCost: 40,
      totalCost: 40,
    }

    let xPos = margin + 3
    doc.text("Date", xPos, yPos)
    xPos += colWidths.date
    doc.text("Qty", xPos, yPos)
    xPos += colWidths.quantity
    doc.text("Unit Cost", xPos, yPos)
    xPos += colWidths.unitCost
    doc.text("Total Cost", xPos, yPos)

    yPos += 10

    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    for (let i = 0; i < product.purchaseHistory.length; i++) {
      const purchase = product.purchaseHistory[i]

      if (yPos > pageHeight - 30) {
        doc.addPage()
        yPos = margin
      }

      doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255)
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 7, "F")

      xPos = margin + 3
      doc.text(formatDate(purchase.date), xPos, yPos)
      xPos += colWidths.date
      doc.text((purchase.quantity ?? 0).toString(), xPos, yPos)
      xPos += colWidths.quantity
      doc.text(formatCurrency(purchase.unitCost ?? 0, currentAppCurrency), xPos, yPos)
      xPos += colWidths.unitCost
      doc.text(formatCurrency(purchase.totalCost ?? 0, currentAppCurrency), xPos, yPos)

      yPos += 8
    }
  }

  // Footer
  const footerY = pageHeight - 25
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(147, 51, 234)
  doc.text("Connect With Us:", margin, footerY)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(50, 50, 150)
  doc.textWithLink("Instagram: @glow_with_vibes", margin, footerY + 6, {
    url: "https://www.instagram.com/glow_with_vibes",
  })
  doc.textWithLink("WhatsApp: +92 311 0263606", margin, footerY + 11, { url: "tel:+923110263606" })

  return doc
}

export async function generateAllProductsPDF(products: Product[], vendors: Vendor[], currentAppCurrency: string) {
  const doc = new jsPDF("l", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  let yPos = margin

  // Header
  doc.setFillColor(147, 51, 234)
  doc.rect(0, 0, pageWidth, 30, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text("GLOW WITH VIBES", pageWidth / 2, 12, { align: "center" })

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("Complete Product Inventory Report", pageWidth / 2, 20, { align: "center" })
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 25, { align: "center" })

  yPos = 38

  // Summary Section
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0)
  const totalValue = products.reduce((sum, p) => sum + p.unitPrice * p.stock, 0)
  const totalCost = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0)

  doc.text(`Total Products: ${products.length}`, margin + 5, yPos + 2)
  doc.text(`Total Stock: ${totalStock}`, margin + 50, yPos + 2)
  doc.text(`Total Inventory Value: ${formatCurrency(totalValue, currentAppCurrency)}`, margin + 100, yPos + 2)
  doc.text(`Total Cost: ${formatCurrency(totalCost, currentAppCurrency)}`, margin + 200, yPos + 2)

  yPos += 18

  // Table Header
  doc.setFillColor(147, 51, 234)
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)

  const colWidths = {
    name: 50,
    sku: 25,
    category: 30,
    vendor: 40,
    unitPrice: 30,
    costPrice: 30,
    stock: 20,
    value: 35,
  }

  let xPos = margin + 2
  doc.text("Product Name", xPos, yPos)
  xPos += colWidths.name
  doc.text("SKU", xPos, yPos)
  xPos += colWidths.sku
  doc.text("Category", xPos, yPos)
  xPos += colWidths.category
  doc.text("Vendor", xPos, yPos)
  xPos += colWidths.vendor
  doc.text("Unit Price", xPos, yPos)
  xPos += colWidths.unitPrice
  doc.text("Cost", xPos, yPos)
  xPos += colWidths.costPrice
  doc.text("Stock", xPos, yPos)
  xPos += colWidths.stock
  doc.text("Total Value", xPos, yPos)

  yPos += 10

  // Table Rows
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)

  for (let i = 0; i < products.length; i++) {
    const product = products[i]

    if (yPos > pageHeight - 20) {
      doc.addPage()
      yPos = margin

      // Repeat header on new page
      doc.setFillColor(147, 51, 234)
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)

      xPos = margin + 2
      doc.text("Product Name", xPos, yPos)
      xPos += colWidths.name
      doc.text("SKU", xPos, yPos)
      xPos += colWidths.sku
      doc.text("Category", xPos, yPos)
      xPos += colWidths.category
      doc.text("Vendor", xPos, yPos)
      xPos += colWidths.vendor
      doc.text("Unit Price", xPos, yPos)
      xPos += colWidths.unitPrice
      doc.text("Cost", xPos, yPos)
      xPos += colWidths.costPrice
      doc.text("Stock", xPos, yPos)
      xPos += colWidths.stock
      doc.text("Total Value", xPos, yPos)

      yPos += 10
      doc.setTextColor(0, 0, 0)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
    }

    doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255)
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 7, "F")

    const vendor = vendors.find((v) => v.id === product.vendorId)
    const productValue = product.unitPrice * product.stock

    xPos = margin + 2
    const nameLines = doc.splitTextToSize(product.name, colWidths.name - 2)
    doc.text(nameLines[0] || "", xPos, yPos)
    xPos += colWidths.name

    doc.text(product.sku, xPos, yPos)
    xPos += colWidths.sku

    doc.text(product.category, xPos, yPos)
    xPos += colWidths.category

    doc.text(vendor?.name || "N/A", xPos, yPos)
    xPos += colWidths.vendor

    doc.setTextColor(34, 197, 94)
    doc.text(formatCurrency(product.unitPrice, currentAppCurrency), xPos, yPos)
    xPos += colWidths.unitPrice

    doc.setTextColor(239, 68, 68)
    doc.text(formatCurrency(product.costPrice, currentAppCurrency), xPos, yPos)
    xPos += colWidths.costPrice

    doc.setTextColor(0, 0, 0)
    doc.text(product.stock.toString(), xPos, yPos)
    xPos += colWidths.stock

    doc.setTextColor(147, 51, 234)
    doc.setFont("helvetica", "bold")
    doc.text(formatCurrency(productValue, currentAppCurrency), xPos, yPos)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)

    yPos += 8
  }

  return doc
}
