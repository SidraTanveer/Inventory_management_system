import { NextResponse } from "next/server"
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "@/lib/customers"

export async function GET() {
  try {
    const customers = await getCustomers()
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load customers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await createCustomer(body)
    return NextResponse.json({ success: true, customer: created })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create customer" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...payload } = body
    if (!id) return NextResponse.json({ success: false, error: "Customer id required" }, { status: 400 })
    const updated = await updateCustomer(id, payload)
    return NextResponse.json({ success: true, customer: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update customer" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Customer id is required" }, { status: 400 })
    const deleted = await deleteCustomer(id)
    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete customer" }, { status: 500 })
  }
}
