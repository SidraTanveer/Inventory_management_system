import { query } from "@/lib/db"
import { mapDatabaseRows, mapDatabaseRow } from "@/lib/db-mapper"

export async function getCustomers() {
  const res = await query(`SELECT id, name, email, phone, address, type, created_at FROM customers ORDER BY created_at DESC`)
  return mapDatabaseRows(res.rows)
}

export async function createCustomer(payload: any) {
  const { name, email, phone, address, type } = payload
  const res = await query(
    `INSERT INTO customers (name, email, phone, address, type) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, phone, address, type, created_at`,
    [name, email ?? null, phone ?? null, address ?? null, type ?? 'new'],
  )
  return mapDatabaseRow(res.rows[0])
}

export async function updateCustomer(id: string, payload: any) {
  const { name, email, phone, address, type } = payload
  const res = await query(
    `UPDATE customers SET name=$1, email=$2, phone=$3, address=$4, type=$5 WHERE id=$6 RETURNING id, name, email, phone, address, type, created_at`,
    [name, email ?? null, phone ?? null, address ?? null, type ?? 'new', id],
  )
  return mapDatabaseRow(res.rows[0] ?? null)
}

export async function deleteCustomer(id: string) {
  const t = await query(`SELECT * FROM customers WHERE id=$1`, [id])
  const row = t.rows[0]
  if (!row) return null
  await query(`INSERT INTO trash_items (original_id, type, data) VALUES ($1,$2,$3)`, [id, 'customer', JSON.stringify(row)])
  const del = await query(`DELETE FROM customers WHERE id=$1 RETURNING id`, [id])
  return mapDatabaseRow(del.rows[0] ?? null)
}
