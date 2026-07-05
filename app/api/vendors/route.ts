import { NextResponse } from "next/server"
import { addVendor, getVendors, updateVendor, deleteVendor } from "@/lib/auth"

export async function GET() {
  try {
    const vendors = await getVendors()
    return NextResponse.json(vendors)
  } catch (error) {
    console.error("[v0] Error fetching vendors:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch vendors" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, address } = await request.json()
    const vendor = await addVendor(name, email, phone, address)
    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    console.error("[v0] Error adding vendor:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add vendor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, email, phone, address } = await request.json()
    const vendor = await updateVendor(id, name, email, phone, address)
    return NextResponse.json(vendor)
  } catch (error) {
    console.error("[v0] Error updating vendor:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update vendor" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await deleteVendor(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting vendor:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete vendor" },
      { status: 500 }
    )
  }
}
