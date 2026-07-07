import { NextResponse } from "next/server"
import { createTrashItem, getTrashItems, restoreTrashItem, deleteTrashItems } from "@/lib/trash"

export async function GET() {
  try {
    const items = await getTrashItems()
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load trash" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (body.originalId && body.type && body.data) {
      const item = await createTrashItem(body)
      return NextResponse.json({ success: true, item })
    }

    const { id } = body
    if (!id) return NextResponse.json({ success: false, error: "Trash item id required" }, { status: 400 })

    const restored = await restoreTrashItem(id)
    return NextResponse.json({ success: true, restored })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to process trash request" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.getAll("id")
    const deleted = await deleteTrashItems(ids.length > 0 ? ids : undefined)
    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete trash items" }, { status: 500 })
  }
}
