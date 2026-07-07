import { NextResponse } from "next/server"
import { addDeal, getDeals, updateDeal, deleteDeal } from "@/lib/auth"

export async function GET() {
  try {
    const deals = await getDeals()
    return NextResponse.json({ success: true, deals })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load deals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, discountPercentage, expiryDate } = body
    const deal = await addDeal(name, description, discountPercentage, expiryDate)
    return NextResponse.json({ success: true, deal }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create deal" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, discountPercentage, expiryDate } = body
    if (!id) return NextResponse.json({ success: false, error: "Deal id required" }, { status: 400 })
    const deal = await updateDeal(id, name, description, discountPercentage, expiryDate)
    return NextResponse.json({ success: true, deal })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update deal" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Deal id is required" }, { status: 400 })
    await deleteDeal(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete deal" }, { status: 500 })
  }
}
