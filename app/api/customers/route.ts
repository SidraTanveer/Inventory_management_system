import { NextResponse } from "next/server"
import { addCustomer, getCustomers, updateCustomer, deleteCustomer } from "@/lib/auth"

export async function GET() {
  try {
    const customers = await getCustomers()
    return NextResponse.json(customers)
  } catch (error) {
    console.error("[v0] Error fetching customers:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch customers" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, type } = await request.json()
    const customer = await addCustomer(name, email, phone, type)
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("[v0] Error adding customer:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add customer" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, email, phone, type } = await request.json()
    const customer = await updateCustomer(id, name, email, phone, type)
    return NextResponse.json(customer)
  } catch (error) {
    console.error("[v0] Error updating customer:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update customer" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await deleteCustomer(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting customer:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete customer" },
      { status: 500 }
    )
  }
}
