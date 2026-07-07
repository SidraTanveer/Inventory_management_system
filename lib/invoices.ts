import { query } from "@/lib/db"

export async function getInvoices() {
  const res = await query(`SELECT id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, created_at, currency, status FROM invoices ORDER BY created_at DESC`)
  return res.rows.map((r: any) => ({ ...r, id: r.tracking_id || r.id }))
}

export async function createInvoice(payload: any) {
  const { tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, currency, status, items } = payload

  // Insert invoice and related items transactionally
  const inserted = await query(
    `INSERT INTO invoices (tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, currency, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, created_at, currency, status`,
    [tracking_id ?? null, customer_name, customer_email, customer_phone ?? null, Number(total_amount) || 0, Number(total_cost) || 0, Number(total_profit) || 0, Number(profit_percentage) || 0, currency ?? 'USD', status ?? 'pending'],
  )

  const invoiceRow = inserted.rows[0]

  if (Array.isArray(items) && items.length > 0) {
    for (const it of items) {
      await query(
        `INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, cost_price) VALUES ($1,$2,$3,$4,$5,$6)`,
        [invoiceRow.id, it.product_id ?? null, it.product_name, Number(it.quantity) || 0, Number(it.unit_price) || 0, Number(it.cost_price) || 0],
      )

      // Insert sales history item
      await query(
        `INSERT INTO sales_history_items (invoice_id, product_id, date, quantity, unit_price, total_price, profit) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [invoiceRow.id, it.product_id ?? null, invoiceRow.created_at, Number(it.quantity) || 0, Number(it.unit_price) || 0, Number(it.quantity) * Number(it.unit_price) || 0, (Number(it.unit_price) - Number(it.cost_price || 0)) * Number(it.quantity) || 0],
      )
    }
  }

  // Return object shaped for client: use tracking_id as id if available
  return { ...invoiceRow, id: invoiceRow.tracking_id || invoiceRow.id }
}

export async function updateInvoice(trackingIdOrId: string, payload: any) {
  // Find by tracking_id or id
  const find = await query(`SELECT id, tracking_id FROM invoices WHERE tracking_id=$1 OR id=$1`, [trackingIdOrId])
  const row = find.rows[0]
  if (!row) return null

  const { customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, currency, status } = payload
  const updated = await query(
    `UPDATE invoices SET customer_name=$1, customer_email=$2, customer_phone=$3, total_amount=$4, total_cost=$5, total_profit=$6, profit_percentage=$7, currency=$8, status=$9 WHERE id=$10 RETURNING id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, created_at, currency, status`,
    [customer_name, customer_email, customer_phone ?? null, Number(total_amount) || 0, Number(total_cost) || 0, Number(total_profit) || 0, Number(profit_percentage) || 0, currency ?? 'USD', status ?? 'pending', row.id],
  )

  const updatedRow = updated.rows[0]
  return { ...updatedRow, id: updatedRow.tracking_id || updatedRow.id }
}

export async function deleteInvoice(trackingIdOrId: string) {
  const find = await query(`SELECT id FROM invoices WHERE tracking_id=$1 OR id=$1`, [trackingIdOrId])
  const row = find.rows[0]
  if (!row) return null
  // Move to trash
  const inv = await query(`SELECT * FROM invoices WHERE id=$1`, [row.id])
  await query(`INSERT INTO trash_items (original_id, type, data) VALUES ($1,$2,$3)`, [row.id, 'invoice', JSON.stringify(inv.rows[0])])
  await query(`DELETE FROM invoices WHERE id=$1`, [row.id])
  return { id: trackingIdOrId }
}
