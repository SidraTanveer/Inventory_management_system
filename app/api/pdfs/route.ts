import { NextResponse } from "next/server"
import { getPDFs, getPDFById, getPDFsByEntity, savePDF, deletePDF } from "@/lib/pdfs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const type = searchParams.get("type")
    const entity_id = searchParams.get("entity_id")
    const entity_type = searchParams.get("entity_type")
    const limit = parseInt(searchParams.get("limit") || "100")

    if (id) {
      const pdf = await getPDFById(id)
      if (!pdf) return NextResponse.json({ success: false, error: "PDF not found" }, { status: 404 })
      return NextResponse.json(pdf)
    }

    if (entity_id && entity_type) {
      const pdfs = await getPDFsByEntity(entity_id, entity_type)
      return NextResponse.json(pdfs)
    }

    const pdfs = await getPDFs(type || undefined, limit)
    return NextResponse.json(pdfs)
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load PDFs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      const body = await request.json()
      const { filename, type, pdf_data, entity_id, entity_type, created_by } = body

      if (!filename || !type || !pdf_data) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
      }

      // Convert base64 to Buffer
      const buffer = Buffer.from(pdf_data, "base64")
      const pdf = await savePDF({ filename, type, pdf_data: buffer, entity_id, entity_type, created_by })
      return NextResponse.json({ success: true, pdf })
    } else {
      // Handle form data with binary file
      const formData = await request.formData()
      const file = formData.get("file") as File
      const filename = (formData.get("filename") as string) || file.name
      const type = (formData.get("type") as string) || "document"
      const entity_id = (formData.get("entity_id") as string) || undefined
      const entity_type = (formData.get("entity_type") as string) || undefined
      const created_by = (formData.get("created_by") as string) || undefined

      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const pdf = await savePDF({ filename, type, pdf_data: buffer, entity_id, entity_type, created_by })
      return NextResponse.json({ success: true, pdf })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to save PDF" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ success: false, error: "PDF id required" }, { status: 400 })

    const deleted = await deletePDF(id)
    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to delete PDF" }, { status: 500 })
  }
}
