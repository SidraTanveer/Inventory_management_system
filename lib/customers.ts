import { query } from "@/lib/db"

export async function getCustomers() {
  const res = await query(`SELECT id, name, email, phone, type, created_at FROM customers ORDER BY created_at DESC`)
  return res.rows
}

export async function createCustomer(payload: any) {
  const { name, email, phone, type } = payload
  const res = await query(
    `INSERT INTO customers (name, email, phone, type) VALUES ($1,$2,$3,$4) RETURNING id, name, email, phone, type, created_at`,
    [name, email ?? null, phone ?? null, type ?? 'new'],
  )
  return res.rows[0]
}

export async function updateCustomer(id: string, payload: any) {
  const { name, email, phone, type } = payload
  const res = await query(
    `UPDATE customers SET name=$1, email=$2, phone=$3, type=$4 WHERE id=$5 RETURNING id, name, email, phone, type, created_at`,
    [name, email ?? null, phone ?? null, type ?? 'new', id],
  )
  return res.rows[0] ?? null
}

export async function deleteCustomer(id: string) {
  const t = await query(`SELECT * FROM customers WHERE id=$1`, [id])
  const row = t.rows[0]
  if (!row) return null
  await query(`INSERT INTO trash_items (original_id, type, data) VALUES ($1,$2,$3)`, [id, 'customer', JSON.stringify(row)])
  const del = await query(`DELETE FROM customers WHERE id=$1 RETURNING id`, [id])
  return del.rows[0] ?? null
}
