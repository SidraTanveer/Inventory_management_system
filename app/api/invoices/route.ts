import { NextResponse } from "next/server"
import { addInvoice, getInvoices, updateInvoice, deleteInvoice } from "@/lib/auth"

export async function GET() {
  try {
    const invoices = await getInvoices()
    return NextResponse.json({ success: true, invoices })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load invoices" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { trackingId, customerName, customerEmail, customerPhone, totalAmount, totalCost, totalProfit, profitPercentage, currency, status } = body
    const invoice = await addInvoice(trackingId, customerName, customerEmail, customerPhone, totalAmount, totalCost, totalProfit, profitPercentage, currency, status)
    return NextResponse.json({ success: true, invoice }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create invoice" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, status, totalAmount, totalCost, totalProfit, profitPercentage } = body
    if (!id) return NextResponse.json({ success: false, error: "Invoice id required" }, { status: 400 })
    const invoice = await updateInvoice(id, status, totalAmount, totalCost, totalProfit, profitPercentage)
    return NextResponse.json({ success: true, invoice })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update invoice" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Invoice id is required" }, { status: 400 })
    await deleteInvoice(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete invoice" }, { status: 500 })
  }
}
