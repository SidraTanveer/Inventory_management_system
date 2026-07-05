import type { Invoice } from "@/types/app"
import { formatCurrency, formatDate } from "@/lib/utils"

export async function generateDailyOrdersPDF(invoices: Invoice[], selectedDate: string, currency: string) {
  try {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF("l", "mm", "a4") // landscape format
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    let currentY = 15

    // Header
    doc.setFont("Times", "Bold")
    doc.setFontSize(24)
    doc.setTextColor(128, 0, 128)
    doc.text("GLOW WITH VIBES", pageWidth / 2, currentY, { align: "center" })
    currentY += 8

    doc.setFont("Times", "Roman")
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text("Daily Orders Report", pageWidth / 2, currentY, { align: "center" })
    currentY += 5
    doc.text(`Date: ${formatDate(selectedDate)}`, pageWidth / 2, currentY, { align: "center" })
    currentY += 5
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, currentY, { align: "center" })

    // Divider
    doc.setDrawColor(200, 200, 200)
    doc.line(15, currentY + 5, pageWidth - 15, currentY + 5)
    currentY += 12

    // Summary Statistics
    const totalOrders = invoices.length
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const totalProfit = invoices.reduce((sum, inv) => sum + inv.totalProfit, 0)
    const completedOrders = invoices.filter((inv) => inv.status === "completed").length
    const pendingOrders = invoices.filter((inv) => inv.status === "pending").length

    doc.setFont("Times", "Bold")
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text("Summary Statistics", 15, currentY)
    currentY += 6

    doc.setFont("Times", "Roman")
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    const statsText = [
      `Total Orders: ${totalOrders}`,
      `Completed: ${completedOrders}`,
      `Pending: ${pendingOrders}`,
      `Total Revenue: ${formatCurrency(totalRevenue, currency)}`,
      `Total Profit: ${formatCurrency(totalProfit, currency)}`,
      `Average Order Value: ${formatCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0, currency)}`,
    ]

    const statsPerRow = 3
    let statsX = 15
    let statsY = currentY

    statsText.forEach((stat, index) => {
      if (index > 0 && index % statsPerRow === 0) {
        statsY += 6
        statsX = 15
      }
      doc.text(stat, statsX, statsY)
      statsX += 65
    })

    currentY = statsY + 12

    // Table Header
    doc.setFillColor(240, 240, 240)
    doc.rect(15, currentY - 4, pageWidth - 30, 6, "F")

    doc.setFont("Times", "Bold")
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)

    const columns = [
      { label: "Invoice ID", x: 15, width: 25 },
      { label: "Customer", x: 42, width: 35 },
      { label: "Amount", x: 79, width: 22 },
      { label: "Profit", x: 103, width: 22 },
      { label: "Status", x: 127, width: 20 },
      { label: "Time", x: 149, width: 25 },
    ]

    columns.forEach((col) => {
      doc.text(col.label, col.x, currentY)
    })

    currentY += 8

    // Table Rows
    doc.setFont("Times", "Roman")
    doc.setFontSize(8)
    doc.setTextColor(50, 50, 50)

    let rowCount = 0
    invoices.forEach((invoice) => {
      if (currentY > pageHeight - 30) {
        doc.addPage()
        currentY = 15

        // Repeat header on new page
        doc.setFillColor(240, 240, 240)
        doc.rect(15, currentY - 4, pageWidth - 30, 6, "F")
        doc.setFont("Times", "Bold")
        doc.setFontSize(9)
        columns.forEach((col) => {
          doc.text(col.label, col.x, currentY)
        })
        currentY += 8
        doc.setFont("Times", "Roman")
        doc.setFontSize(8)
      }

      // Alternate row colors
      if (rowCount % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(15, currentY - 3, pageWidth - 30, 5, "F")
      }

      doc.text(invoice.id, 15, currentY)
      doc.text(invoice.customerName.substring(0, 20), 42, currentY)
      doc.text(formatCurrency(invoice.totalAmount, currency), 79, currentY)
      doc.text(formatCurrency(invoice.totalProfit, currency), 103, currentY)

      const statusColor = invoice.status === "completed" ? [0, 128, 0] : [255, 165, 0]
      doc.setTextColor(...statusColor)
      doc.text(invoice.status?.toUpperCase() || "PENDING", 127, currentY)
      doc.setTextColor(50, 50, 50)

      const time = new Date(invoice.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      doc.text(time, 149, currentY)

      currentY += 6
      rowCount++
    })

    // Footer
    const footerY = pageHeight - 15
    doc.setFont("Times", "Roman")
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text("Glow With Vibes - Daily Orders Report", pageWidth / 2, footerY, { align: "center" })

    const dateStr = new Date(selectedDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    doc.save(`daily-orders-${dateStr.replace(/\s/g, "-")}.pdf`)

    return true
  } catch (error) {
    console.error("Error generating daily orders PDF:", error)
    throw error
  }
}
