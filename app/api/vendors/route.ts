import { NextResponse } from "next/server"
import { addVendor, getVendors, updateVendor, deleteVendor } from "@/lib/auth"

export async function GET() {
  try {
    const vendors = await getVendors()
    return NextResponse.json({ success: true, vendors })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load vendors" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, address } = body
    const vendor = await addVendor(name, email, phone, address)
    return NextResponse.json({ success: true, vendor }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create vendor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, email, phone, address } = body
    if (!id) return NextResponse.json({ success: false, error: "Vendor id required" }, { status: 400 })
    const vendor = await updateVendor(id, name, email, phone, address)
    return NextResponse.json({ success: true, vendor })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update vendor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Vendor id is required" }, { status: 400 })
    await deleteVendor(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete vendor" }, { status: 500 })
  }
}
