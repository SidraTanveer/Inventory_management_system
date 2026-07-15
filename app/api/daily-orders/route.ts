import { NextResponse } from "next/server"
import { deleteDailyOrder, getDailyOrders, upsertDailyOrder } from "@/lib/daily-orders"

export async function GET() {
  try {
    const dailyOrders = await getDailyOrders()
    return NextResponse.json(dailyOrders)
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load daily orders" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const invoice = body.invoice ?? body
    const saved = await upsertDailyOrder(invoice)
    return NextResponse.json({ success: true, dailyOrder: saved })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to save daily order" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get("invoiceId")
    if (!invoiceId) return NextResponse.json({ success: false, error: "Invoice id is required" }, { status: 400 })
    const deleted = await deleteDailyOrder(invoiceId)
    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete daily order" }, { status: 500 })
  }
}