import { query } from "@/lib/db"
import { mapDatabaseRows, mapDatabaseRow } from "@/lib/db-mapper"

export async function getVendors() {
  const res = await query(`SELECT id, name, email, phone, address, created_at FROM vendors ORDER BY created_at DESC`)
  return mapDatabaseRows(res.rows)
}

export async function createVendor(payload: any) {
  const { name, email, phone, address } = payload
  const res = await query(
    `INSERT INTO vendors (name, email, phone, address) VALUES ($1,$2,$3,$4) RETURNING id, name, email, phone, address, created_at`,
    [name, email ?? null, phone ?? null, address ?? null],
  )
  return mapDatabaseRow(res.rows[0])
}

export async function updateVendor(id: string, payload: any) {
  const { name, email, phone, address } = payload
  const res = await query(
    `UPDATE vendors SET name=$1, email=$2, phone=$3, address=$4 WHERE id=$5 RETURNING id, name, email, phone, address, created_at`,
    [name, email ?? null, phone ?? null, address ?? null, id],
  )
  return mapDatabaseRow(res.rows[0] ?? null)
}

export async function deleteVendor(id: string) {
  const t = await query(`SELECT * FROM vendors WHERE id=$1`, [id])
  const row = t.rows[0]
  if (!row) return null
  await query(`INSERT INTO trash_items (original_id, type, data) VALUES ($1,$2,$3)`, [id, 'vendor', JSON.stringify(row)])
  const del = await query(`DELETE FROM vendors WHERE id=$1 RETURNING id`, [id])
  return mapDatabaseRow(del.rows[0] ?? null)
}
