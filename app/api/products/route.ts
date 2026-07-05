import { NextResponse } from "next/server"
import { addProduct, getProducts, updateProduct, deleteProduct } from "@/lib/auth"

export async function GET() {
  try {
    const products = await getProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch products" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, unitPrice, costPrice, stock, vendorId, category, sku } = await request.json()
    const product = await addProduct(name, description, unitPrice, costPrice, stock, vendorId, category, sku)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("[v0] Error adding product:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add product" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, description, unitPrice, costPrice, stock, vendorId, category, sku } = await request.json()
    const product = await updateProduct(id, name, description, unitPrice, costPrice, stock, vendorId, category, sku)
    return NextResponse.json(product)
  } catch (error) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting product:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete product" },
      { status: 500 }
    )
  }
}
