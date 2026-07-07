import { NextResponse } from "next/server"
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/products"

export async function GET() {
  try {
    const products = await getProducts()
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await createProduct(body)
    return NextResponse.json({ success: true, product: created })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to create product" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...payload } = body
    if (!id) return NextResponse.json({ success: false, error: "Product id required" }, { status: 400 })
    const updated = await updateProduct(id, payload)
    return NextResponse.json({ success: true, product: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update product" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Product id is required" }, { status: 400 })
    const deleted = await deleteProduct(id)
    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete product" }, { status: 500 })
  }
}
