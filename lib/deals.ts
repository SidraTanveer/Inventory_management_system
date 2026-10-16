import { query, transaction } from "@/lib/db"
import { mapDatabaseRows, mapDatabaseRow } from "@/lib/db-mapper"

export async function getDeals() {
  const res = await query(`SELECT id, name, description, discount_percentage, expiry_date, created_at FROM deals ORDER BY created_at DESC`)
  return mapDatabaseRows(res.rows)
}

export async function createDeal(payload: any) {
  const { name, description } = payload
  const discountPercentage = payload.discount_percentage ?? payload.discountPercentage
  const expiryDate = payload.expiry_date ?? payload.expiryDate
  const res = await query(
    `INSERT INTO deals (name, description, discount_percentage, expiry_date) VALUES ($1,$2,$3,$4) RETURNING id, name, description, discount_percentage, expiry_date, created_at`,
    [name, description ?? null, Number(discountPercentage) || 0, expiryDate ?? null],
  )
  return mapDatabaseRow(res.rows[0])
}

export async function updateDeal(id: string, payload: any) {
  const { name, description } = payload
  const discountPercentage = payload.discount_percentage ?? payload.discountPercentage
  const expiryDate = payload.expiry_date ?? payload.expiryDate
  const res = await query(
    `UPDATE deals SET name=$1, description=$2, discount_percentage=$3, expiry_date=$4 WHERE id=$5 RETURNING id, name, description, discount_percentage, expiry_date, created_at`,
    [name, description ?? null, Number(discountPercentage) || 0, expiryDate ?? null, id],
  )
  return mapDatabaseRow(res.rows[0] ?? null)
}

export async function deleteDeal(id: string) {
  return transaction(async (client) => {
    const existing = await client.query(`SELECT * FROM deals WHERE id=$1`, [id])
    const row = existing.rows[0]
    if (!row) return null
    await client.query(
      `INSERT INTO trash_items (original_id, type, data) VALUES ($1,$2,$3)`,
      [id, "deal", JSON.stringify(row)],
    )
    const deleted = await client.query(`DELETE FROM deals WHERE id=$1 RETURNING id`, [id])
    return mapDatabaseRow(deleted.rows[0] ?? null)
  })
}
