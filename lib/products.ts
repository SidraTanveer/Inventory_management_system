import { query } from "@/lib/db"

export async function getProducts() {
  const result = await query(
    `SELECT id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at FROM products ORDER BY created_at DESC`,
  )
  return result.rows
}

export async function createProduct(payload: any) {
  const { name, description, unit_price, cost_price, stock, vendor_id, category, sku } = payload
  const result = await query(
    `INSERT INTO products (name, description, unit_price, cost_price, stock, vendor_id, category, sku)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at`,
    [name, description ?? null, Number(unit_price) || 0, Number(cost_price) || 0, Number(stock) || 0, vendor_id ?? null, category ?? null, sku ?? null],
  )
  return result.rows[0]
}

export async function updateProduct(id: string, payload: any) {
  const { name, description, unit_price, cost_price, stock, vendor_id, category, sku } = payload
  const result = await query(
    `UPDATE products SET name=$1, description=$2, unit_price=$3, cost_price=$4, stock=$5, vendor_id=$6, category=$7, sku=$8
     WHERE id=$9 RETURNING id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at`,
    [name, description ?? null, Number(unit_price) || 0, Number(cost_price) || 0, Number(stock) || 0, vendor_id ?? null, category ?? null, sku ?? null, id],
  )
  return result.rows[0] ?? null
}

export async function deleteProduct(id: string) {
  // Soft-delete: move to trash_items then delete from products
  const t = await query(`SELECT id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at FROM products WHERE id=$1`, [id])
  const row = t.rows[0]
  if (!row) return null

  await query(
    `INSERT INTO trash_items (original_id, type, data) VALUES ($1, $2, $3)`,
    [id, 'product', JSON.stringify(row)],
  )

  const del = await query(`DELETE FROM products WHERE id=$1 RETURNING id`, [id])
  return del.rows[0] ?? null
}
