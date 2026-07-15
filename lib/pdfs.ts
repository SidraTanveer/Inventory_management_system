import { query } from "@/lib/db"
import { mapDatabaseRow, mapDatabaseRows } from "@/lib/db-mapper"

export interface PDFRecord {
  id: string
  filename: string
  type: string
  entityId?: string
  entityType?: string
  fileSize: number
  mimeType: string
  createdAt: string
  createdBy?: string
}

export async function savePDF(payload: {
  filename: string
  type: string
  pdf_data: Buffer
  entity_id?: string
  entity_type?: string
  created_by?: string
}) {
  const { filename, type, pdf_data, entity_id, entity_type, created_by } = payload
  const file_size = pdf_data.length
  const mime_type = "application/pdf"

  const res = await query(
    `INSERT INTO pdfs (filename, type, pdf_data, file_size, mime_type, entity_id, entity_type, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, filename, type, entity_id, entity_type, file_size, mime_type, created_at, created_by`,
    [filename, type, pdf_data, file_size, mime_type, entity_id || null, entity_type || null, created_by || null],
  )
  return mapDatabaseRow(res.rows[0])
}

export async function getPDFs(type?: string, limit: number = 100) {
  let sql = `SELECT id, filename, type, entity_id, entity_type, file_size, mime_type, created_at, created_by FROM pdfs`
  const params: any[] = []

  if (type) {
    sql += ` WHERE type = $1`
    params.push(type)
    sql += ` ORDER BY created_at DESC LIMIT $2`
    params.push(limit)
  } else {
    sql += ` ORDER BY created_at DESC LIMIT $1`
    params.push(limit)
  }

  const res = await query(sql, params)
  return mapDatabaseRows(res.rows)
}

export async function getPDFById(id: string) {
  const res = await query(
    `SELECT id, filename, type, entity_id, entity_type, pdf_data, file_size, mime_type, created_at, created_by 
     FROM pdfs WHERE id = $1`,
    [id],
  )
  return res.rows[0] ? mapDatabaseRow(res.rows[0]) : null
}

export async function getPDFsByEntity(entity_id: string, entity_type: string) {
  const res = await query(
    `SELECT id, filename, type, entity_id, entity_type, file_size, mime_type, created_at, created_by 
     FROM pdfs WHERE entity_id = $1 AND entity_type = $2 ORDER BY created_at DESC`,
    [entity_id, entity_type],
  )
  return mapDatabaseRows(res.rows)
}

export async function deletePDF(id: string) {
  const res = await query(`DELETE FROM pdfs WHERE id = $1 RETURNING id`, [id])
  return res.rows[0] ?? null
}

export async function deletePDFsByEntity(entity_id: string, entity_type: string) {
  const res = await query(
    `DELETE FROM pdfs WHERE entity_id = $1 AND entity_type = $2 RETURNING id`,
    [entity_id, entity_type],
  )
  return res.rows
}
