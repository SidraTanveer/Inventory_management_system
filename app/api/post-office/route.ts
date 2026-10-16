import { NextResponse } from "next/server"
import {
  getPostOfficeRecords,
  createPostOfficeRecord,
  updatePostOfficeRecord,
  deletePostOfficeRecord,
} from "@/lib/post-office"

export async function GET() {
  try {
    const records = await getPostOfficeRecords()
    return NextResponse.json(records)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to load post office records" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await createPostOfficeRecord(body)
    return NextResponse.json({ success: true, record: created })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to create post office record" },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...payload } = body
    if (!id) {
      return NextResponse.json({ success: false, error: "Post office record id required" }, { status: 400 })
    }
    const updated = await updatePostOfficeRecord(id, payload)
    if (!updated) return NextResponse.json({ success: false, error: "Post office record not found" }, { status: 404 })
    return NextResponse.json({ success: true, record: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to update post office record" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, error: "Post office record id is required" }, { status: 400 })
    }
    const deleted = await deletePostOfficeRecord(id)
    if (!deleted) return NextResponse.json({ success: false, error: "Post office record not found" }, { status: 404 })
    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to delete post office record" },
      { status: 500 },
    )
  }
}
