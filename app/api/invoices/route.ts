import { NextResponse } from "next/server"
import { addInvoice, getInvoices, updateInvoice, deleteInvoice } from "@/lib/auth"

export async function GET() {
  try {
    const invoices = await getInvoices()
    return NextResponse.json(invoices)
  } catch (error) {
    console.error("[v0] Error fetching invoices:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch invoices" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const {
      trackingId,
      customerName,
      customerEmail,
      customerPhone,
      totalAmount,
      totalCost,
      totalProfit,
      profitPercentage,
      currency,
      status,
    } = await request.json()
    const invoice = await addInvoice(
      trackingId,
      customerName,
      customerEmail,
      customerPhone,
      totalAmount,
      totalCost,
      totalProfit,
      profitPercentage,
      currency,
      status
    )
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error("[v0] Error adding invoice:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add invoice" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, totalAmount, totalCost, totalProfit, profitPercentage } = await request.json()
    const invoice = await updateInvoice(id, status, totalAmount, totalCost, totalProfit, profitPercentage)
    return NextResponse.json(invoice)
  } catch (error) {
    console.error("[v0] Error updating invoice:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update invoice" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await deleteInvoice(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting invoice:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete invoice" },
      { status: 500 }
    )
  }
}
