import { query } from "@/lib/db"
import { mapDatabaseRows, mapDatabaseRow } from "@/lib/db-mapper"

function pickPayloadValue(payload: any, snakeKey: string, camelKey: string) {
  const snake = payload?.[snakeKey]
  if (snake !== undefined) return snake
  return payload?.[camelKey]
}

function toNumberSafe(value: any, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim()
    if (!normalized) return fallback
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function getProducts() {
  const result = await query(
    `SELECT id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at FROM products ORDER BY created_at DESC`,
  )
  return mapDatabaseRows(result.rows)
}

export async function createProduct(payload: any) {
  const name = payload?.name
  const description = payload?.description
  const unitPrice = toNumberSafe(pickPayloadValue(payload, "unit_price", "unitPrice"), 0)
  const costPrice = toNumberSafe(pickPayloadValue(payload, "cost_price", "costPrice"), 0)
  const stock = toNumberSafe(payload?.stock, 0)
  const rawVendorId = pickPayloadValue(payload, "vendor_id", "vendorId")
  const vendorId = rawVendorId === "" ? null : (rawVendorId ?? null)
  const category = payload?.category ?? null
  const sku = payload?.sku ?? null
  const result = await query(
    `INSERT INTO products (name, description, unit_price, cost_price, stock, vendor_id, category, sku)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at`,
    [name, description ?? null, unitPrice, costPrice, stock, vendorId, category, sku],
  )
  return mapDatabaseRow(result.rows[0])
}

export async function updateProduct(id: string, payload: any) {
  const existingResult = await query(
    `SELECT id, name, description, unit_price, cost_price, stock, vendor_id, category, sku FROM products WHERE id=$1`,
    [id],
  )
  const current = existingResult.rows[0]
  if (!current) return null

  const name = payload?.name ?? current.name
  const description = payload?.description ?? current.description
  const unitPrice = toNumberSafe(
    pickPayloadValue(payload, "unit_price", "unitPrice"),
    toNumberSafe(current.unit_price, 0),
  )
  const costPrice = toNumberSafe(
    pickPayloadValue(payload, "cost_price", "costPrice"),
    toNumberSafe(current.cost_price, 0),
  )
  const stock = toNumberSafe(payload?.stock, toNumberSafe(current.stock, 0))
  const vendorInput = pickPayloadValue(payload, "vendor_id", "vendorId")
  const vendorId = vendorInput === undefined ? current.vendor_id : (vendorInput || null)
  const category = payload?.category ?? current.category
  const sku = payload?.sku ?? current.sku
  const result = await query(
    `UPDATE products SET name=$1, description=$2, unit_price=$3, cost_price=$4, stock=$5, vendor_id=$6, category=$7, sku=$8
     WHERE id=$9 RETURNING id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at`,
    [name, description ?? null, unitPrice, costPrice, stock, vendorId, category, sku, id],
  )
  return mapDatabaseRow(result.rows[0] ?? null)
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
