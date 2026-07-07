import { query } from "@/lib/db"

export async function getTrashItems() {
  const res = await query(`SELECT id, original_id, type, data, deleted_at FROM trash_items ORDER BY deleted_at DESC`)
  return res.rows.map((row: any) => ({
    id: row.id,
    originalId: row.original_id,
    type: row.type,
    data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
    deletedAt: row.deleted_at,
  }))
}

export async function createTrashItem(payload: any) {
  const { originalId, type, data, deletedAt } = payload
  const res = await query(
    `INSERT INTO trash_items (original_id, type, data, deleted_at)
     VALUES ($1,$2,$3,$4)
     RETURNING id, original_id, type, data, deleted_at`,
    [originalId, type, JSON.stringify(data), deletedAt ? new Date(deletedAt) : new Date()],
  )
  const row = res.rows[0]
  return {
    id: row.id,
    originalId: row.original_id,
    type: row.type,
    data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
    deletedAt: row.deleted_at,
  }
}

export async function restoreTrashItem(id: string) {
  const res = await query(`SELECT id, original_id, type, data FROM trash_items WHERE id = $1`, [id])
  const item = res.rows[0]
  if (!item) return null

  const data = typeof item.data === "string" ? JSON.parse(item.data) : (item.data as Record<string, any>)
  let restored: any = null

  if (item.type === "product") {
    const result = await query(
      `INSERT INTO products (id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO NOTHING
       RETURNING id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at`,
      [data.id, data.name, data.description, data.unitPrice ?? data.unit_price, data.costPrice ?? data.cost_price, data.stock, data.vendorId ?? data.vendor_id, data.category, data.sku, data.createdAt ?? data.created_at],
    )
    restored = result.rows[0] ?? data
  } else if (item.type === "vendor") {
    const result = await query(
      `INSERT INTO vendors (id, name, email, phone, address, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO NOTHING
       RETURNING id, name, email, phone, address, created_at`,
      [data.id, data.name, data.email, data.phone, data.address, data.createdAt ?? data.created_at],
    )
    restored = result.rows[0] ?? data
  } else if (item.type === "customer") {
    const result = await query(
      `INSERT INTO customers (id, name, email, phone, type, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO NOTHING
       RETURNING id, name, email, phone, type, created_at`,
      [data.id, data.name, data.email, data.phone, data.type, data.createdAt ?? data.created_at],
    )
    restored = result.rows[0] ?? data
  } else if (item.type === "deal") {
    const result = await query(
      `INSERT INTO deals (id, name, description, discount_percentage, expiry_date, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO NOTHING
       RETURNING id, name, description, discount_percentage, expiry_date, created_at`,
      [data.id, data.name, data.description, data.discountPercentage ?? data.discount_percentage, data.expiryDate ?? data.expiry_date, data.createdAt ?? data.created_at],
    )
    restored = result.rows[0] ?? data
  } else if (item.type === "invoice") {
    const result = await query(
      `INSERT INTO invoices (id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, created_at, currency, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO NOTHING
       RETURNING id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, created_at, currency, status`,
      [
        data.id,
        data.trackingId ?? data.tracking_id ?? null,
        data.customerName ?? data.customer_name,
        data.customerEmail ?? data.customer_email,
        data.customerPhone ?? data.customer_phone,
        data.totalAmount ?? data.total_amount,
        data.totalCost ?? data.total_cost,
        data.totalProfit ?? data.total_profit,
        data.profitPercentage ?? data.profit_percentage,
        data.createdAt ?? data.created_at,
        data.currency,
        data.status,
      ],
    )
    restored = result.rows[0] ?? data
  }

  await query(`DELETE FROM trash_items WHERE id = $1`, [id])
  return restored
}

export async function deleteTrashItems(ids?: string[]) {
  if (Array.isArray(ids) && ids.length > 0) {
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(",")
    await query(`DELETE FROM trash_items WHERE id IN (${placeholders})`, ids)
    return ids
  }

  await query(`DELETE FROM trash_items`)
  return []
}
