import { NextResponse } from "next/server"
import { getVendors, createVendor, updateVendor, deleteVendor } from "@/lib/vendors"

export async function GET() {
  try {
    const vendors = await getVendors()
    return NextResponse.json(vendors)
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load vendors" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await createVendor(body)
    return NextResponse.json({ success: true, vendor: created })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create vendor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...payload } = body
    if (!id) return NextResponse.json({ success: false, error: "Vendor id required" }, { status: 400 })
    const updated = await updateVendor(id, payload)
    return NextResponse.json({ success: true, vendor: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update vendor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Vendor id is required" }, { status: 400 })
    const deleted = await deleteVendor(id)
    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete vendor" }, { status: 500 })
  }
}
