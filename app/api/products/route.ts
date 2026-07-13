import { NextResponse } from "next/server"
import { addProduct, getProducts, updateProduct, deleteProduct } from "@/lib/auth"

export async function GET() {
  try {
    const products = await getProducts()
    return NextResponse.json({ success: true, products })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, unitPrice, costPrice, stock, vendorId, category, sku } = body
    const product = await addProduct(name, description, unitPrice, costPrice, stock, vendorId, category, sku)
    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create product" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, unitPrice, costPrice, stock, vendorId, category, sku } = body
    if (!id) return NextResponse.json({ success: false, error: "Product id required" }, { status: 400 })
    const product = await updateProduct(id, name, description, unitPrice, costPrice, stock, vendorId, category, sku)
    return NextResponse.json({ success: true, product })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update product" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Product id is required" }, { status: 400 })
    await deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete product" }, { status: 500 })
  }
}
