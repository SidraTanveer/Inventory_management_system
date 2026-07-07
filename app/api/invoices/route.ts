import { NextResponse } from "next/server"
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from "@/lib/invoices"

export async function GET() {
  try {
    const invoices = await getInvoices()
    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load invoices" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await createInvoice(body)
    return NextResponse.json({ success: true, invoice: created })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create invoice" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...payload } = body
    if (!id) return NextResponse.json({ success: false, error: "Invoice id required" }, { status: 400 })
    const updated = await updateInvoice(id, payload)
    return NextResponse.json({ success: true, invoice: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update invoice" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Invoice id is required" }, { status: 400 })
    const deleted = await deleteInvoice(id)
    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete invoice" }, { status: 500 })
  }
}
