import { query } from "@/lib/db"

export async function getDeals() {
  const res = await query(`SELECT id, name, description, discount_percentage, expiry_date, created_at FROM deals ORDER BY created_at DESC`)
  return res.rows
}

export async function createDeal(payload: any) {
  const { name, description, discount_percentage, expiry_date } = payload
  const res = await query(
    `INSERT INTO deals (name, description, discount_percentage, expiry_date) VALUES ($1,$2,$3,$4) RETURNING id, name, description, discount_percentage, expiry_date, created_at`,
    [name, description ?? null, Number(discount_percentage) || 0, expiry_date ?? null],
  )
  return res.rows[0]
}

export async function updateDeal(id: string, payload: any) {
  const { name, description, discount_percentage, expiry_date } = payload
  const res = await query(
    `UPDATE deals SET name=$1, description=$2, discount_percentage=$3, expiry_date=$4 WHERE id=$5 RETURNING id, name, description, discount_percentage, expiry_date, created_at`,
    [name, description ?? null, Number(discount_percentage) || 0, expiry_date ?? null, id],
  )
  return res.rows[0] ?? null
}

export async function deleteDeal(id: string) {
  const t = await query(`SELECT * FROM deals WHERE id=$1`, [id])
  const row = t.rows[0]
  if (!row) return null
  await query(`INSERT INTO trash_items (original_id, type, data) VALUES ($1,$2,$3)`, [id, 'deal', JSON.stringify(row)])
  const del = await query(`DELETE FROM deals WHERE id=$1 RETURNING id`, [id])
  return del.rows[0] ?? null
}
