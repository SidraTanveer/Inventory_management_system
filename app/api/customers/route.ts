import { NextResponse } from "next/server"
import { addCustomer, getCustomers, updateCustomer, deleteCustomer } from "@/lib/auth"

export async function GET() {
  try {
    const customers = await getCustomers()
    return NextResponse.json({ success: true, customers })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load customers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, type } = body
    const customer = await addCustomer(name, email, phone, type)
    return NextResponse.json({ success: true, customer }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create customer" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, email, phone, type } = body
    if (!id) return NextResponse.json({ success: false, error: "Customer id required" }, { status: 400 })
    const customer = await updateCustomer(id, name, email, phone, type)
    return NextResponse.json({ success: true, customer })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update customer" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Customer id is required" }, { status: 400 })
    await deleteCustomer(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete customer" }, { status: 500 })
  }
}
