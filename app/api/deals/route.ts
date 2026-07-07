import { NextResponse } from "next/server"
import { getDeals, createDeal, updateDeal, deleteDeal } from "@/lib/deals"

export async function GET() {
  try {
    const deals = await getDeals()
    return NextResponse.json(deals)
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load deals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await createDeal(body)
    return NextResponse.json({ success: true, deal: created })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create deal" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...payload } = body
    if (!id) return NextResponse.json({ success: false, error: "Deal id required" }, { status: 400 })
    const updated = await updateDeal(id, payload)
    return NextResponse.json({ success: true, deal: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update deal" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Deal id is required" }, { status: 400 })
    const deleted = await deleteDeal(id)
    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete deal" }, { status: 500 })
  }
}
