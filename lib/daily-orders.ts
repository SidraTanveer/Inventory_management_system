import { query } from "@/lib/db"
import { mapDatabaseRow, mapDatabaseRows } from "@/lib/db-mapper"

function hasValidDate(value: any) {
  if (typeof value !== "string" || !value) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

export async function ensureDailyOrdersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS daily_orders (
      invoice_id TEXT PRIMARY KEY,
      order_date DATE NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
}

export async function getDailyOrders() {
  await ensureDailyOrdersTable()
  const result = await query(`SELECT invoice_id, order_date, data, created_at, updated_at FROM daily_orders ORDER BY order_date DESC, updated_at DESC`)
  return mapDatabaseRows(result.rows).map((row: any) => {
    const dailyOrder = row.data ?? row
    if (dailyOrder && typeof dailyOrder === "object") {
      return {
        ...dailyOrder,
        id: dailyOrder.id ?? row.invoiceId,
        createdAt: hasValidDate(dailyOrder.createdAt) ? dailyOrder.createdAt : row.orderDate,
      }
    }
    return dailyOrder
  })
}

export async function upsertDailyOrder(invoice: any) {
  await ensureDailyOrdersTable()

  const invoiceId = invoice?.id ?? invoice?.invoiceId ?? invoice?.trackingId
  if (!invoiceId) return null

  const orderDate = typeof invoice?.createdAt === "string" && invoice.createdAt.length >= 10 ? invoice.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)

  const result = await query(
    `INSERT INTO daily_orders (invoice_id, order_date, data, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (invoice_id)
     DO UPDATE SET order_date = EXCLUDED.order_date, data = EXCLUDED.data, updated_at = NOW()
     RETURNING invoice_id, order_date, data, created_at, updated_at`,
    [invoiceId, orderDate, JSON.stringify(invoice)],
  )

  const row = result.rows[0]
  if (!row) return null
  const mapped = mapDatabaseRow(row)
  const dailyOrder = mapped.data ?? mapped
  if (dailyOrder && typeof dailyOrder === "object") {
    return {
      ...dailyOrder,
      id: dailyOrder.id ?? mapped.invoiceId,
      createdAt: hasValidDate(dailyOrder.createdAt) ? dailyOrder.createdAt : mapped.orderDate,
    }
  }
  return dailyOrder
}

export async function deleteDailyOrder(invoiceId: string) {
  await ensureDailyOrdersTable()
  const result = await query(`DELETE FROM daily_orders WHERE invoice_id = $1 RETURNING invoice_id`, [invoiceId])
  return result.rows[0] ?? null
}