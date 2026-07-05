import { NextResponse } from "next/server"
import { addDeal, getDeals, updateDeal, deleteDeal } from "@/lib/auth"

export async function GET() {
  try {
    const deals = await getDeals()
    return NextResponse.json(deals)
  } catch (error) {
    console.error("[v0] Error fetching deals:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch deals" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, discountPercentage, expiryDate } = await request.json()
    const deal = await addDeal(name, description, discountPercentage, expiryDate)
    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error("[v0] Error adding deal:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add deal" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, description, discountPercentage, expiryDate } = await request.json()
    const deal = await updateDeal(id, name, description, discountPercentage, expiryDate)
    return NextResponse.json(deal)
  } catch (error) {
    console.error("[v0] Error updating deal:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update deal" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await deleteDeal(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting deal:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete deal" },
      { status: 500 }
    )
  }
}
