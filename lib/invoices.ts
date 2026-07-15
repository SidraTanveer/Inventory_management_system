import { query } from "@/lib/db"
import { mapDatabaseRows, mapDatabaseRow } from "@/lib/db-mapper"

async function ensureInvoiceUniquenessGuard() {
  try {
    const exists = await query<{ table_exists: string | null }>(
      "SELECT to_regclass('public.invoices') AS table_exists",
    )
    if (!exists.rows[0]?.table_exists) return

    await query(`
      DO $$
      BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS invoices_tracking_id_unique_idx
        ON invoices (tracking_id)
        WHERE tracking_id IS NOT NULL;
      EXCEPTION WHEN OTHERS THEN
        -- Keep app flow working even if legacy duplicate data blocks index creation.
        NULL;
      END
      $$;
    `)
  } catch {
    // Best-effort guard only.
  }
}

export async function getInvoices() {
  // Get invoices with their items in a single query using LEFT JOIN
  const res = await query(`
    SELECT 
      i.id, i.tracking_id, i.customer_name, i.customer_email, i.customer_phone, 
      i.total_amount, i.total_cost, i.total_profit, i.profit_percentage, 
      i.created_at, i.currency, i.status,
      ii.product_id, ii.product_name, ii.quantity, ii.unit_price, ii.cost_price
    FROM invoices i
    LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
    ORDER BY i.created_at DESC, ii.product_id
  `)
  
  // Group items by invoice id
  const invoiceMap = new Map()
  res.rows.forEach((row: any) => {
    const invoiceId = row.id
    if (!invoiceMap.has(invoiceId)) {
      const mapped = mapDatabaseRow({
        id: row.id,
        tracking_id: row.tracking_id,
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        customer_phone: row.customer_phone,
        total_amount: row.total_amount,
        total_cost: row.total_cost,
        total_profit: row.total_profit,
        profit_percentage: row.profit_percentage,
        created_at: row.created_at,
        currency: row.currency,
        status: row.status
      })
      invoiceMap.set(invoiceId, {
        ...mapped,
        id: mapped.trackingId || mapped.id,
        items: []
      })
    }
    
    // Add item if it exists
    if (row.product_id) {
      invoiceMap.get(invoiceId).items.push(mapDatabaseRow({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: row.quantity,
        unit_price: row.unit_price,
        cost_price: row.cost_price
      }))
    }
  })
  
  return Array.from(invoiceMap.values())
}

export async function createInvoice(payload: any) {
  const { tracking_id, customer_name, customer_email, customer_phone, created_at, total_amount, total_cost, total_profit, profit_percentage, currency, status, items } = payload
  await ensureInvoiceUniquenessGuard()

  const invoiceCreatedAt = created_at ?? null
  const normalizedTrackingId = typeof tracking_id === "string" && tracking_id.trim() ? tracking_id.trim() : null

  if (normalizedTrackingId) {
    const existing = await query(
      `SELECT id FROM invoices WHERE tracking_id = $1 LIMIT 1`,
      [normalizedTrackingId],
    )

    const existingRow = existing.rows[0] as { id: string } | undefined
    if (existingRow?.id) {
      const updated = await query(
        `UPDATE invoices
         SET customer_name=$1, customer_email=$2, customer_phone=$3, created_at=COALESCE($4, created_at),
             total_amount=$5, total_cost=$6, total_profit=$7, profit_percentage=$8, currency=$9, status=$10
         WHERE id=$11
         RETURNING id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, created_at, currency, status`,
        [
          customer_name,
          customer_email,
          customer_phone ?? null,
          invoiceCreatedAt,
          Number(total_amount) || 0,
          Number(total_cost) || 0,
          Number(total_profit) || 0,
          Number(profit_percentage) || 0,
          currency ?? "USD",
          status ?? "pending",
          existingRow.id,
        ],
      )

      await query(`DELETE FROM invoice_items WHERE invoice_id = $1`, [existingRow.id])
      const mappedItems: any[] = []
      if (Array.isArray(items) && items.length > 0) {
        for (const it of items) {
          await query(
            `INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, cost_price) VALUES ($1,$2,$3,$4,$5,$6)`,
            [
              existingRow.id,
              it.product_id ?? null,
              it.product_name,
              Number(it.quantity) || 0,
              Number(it.unit_price) || 0,
              Number(it.cost_price) || 0,
            ],
          )

          mappedItems.push({
            productId: it.product_id,
            productName: it.product_name,
            quantity: it.quantity,
            unitPrice: it.unit_price,
            costPrice: it.cost_price,
          })
        }
      }

      const mapped = mapDatabaseRow(updated.rows[0])
      return { ...mapped, id: mapped.trackingId || mapped.id, items: mappedItems }
    }
  }

  // Insert invoice and related items transactionally
  const inserted = await query(
    `INSERT INTO invoices (tracking_id, customer_name, customer_email, customer_phone, created_at, total_amount, total_cost, total_profit, profit_percentage, currency, status)
     VALUES ($1,$2,$3,$4,COALESCE($5, NOW()),$6,$7,$8,$9,$10,$11) RETURNING id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, created_at, currency, status`,
    [normalizedTrackingId, customer_name, customer_email, customer_phone ?? null, invoiceCreatedAt, Number(total_amount) || 0, Number(total_cost) || 0, Number(total_profit) || 0, Number(profit_percentage) || 0, currency ?? 'USD', status ?? 'pending'],
  )

  const invoiceRow = inserted.rows[0]
  const mappedItems: any[] = []

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
      
      // Add to mapped items
      mappedItems.push({
        productId: it.product_id,
        productName: it.product_name,
        quantity: it.quantity,
        unitPrice: it.unit_price,
        costPrice: it.cost_price
      })
    }
  }

  // Return object shaped for client: use tracking_id as id if available
  const mapped = mapDatabaseRow(invoiceRow)
  return { ...mapped, id: mapped.trackingId || mapped.id, items: mappedItems }
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
  const mapped = mapDatabaseRow(updatedRow)
  
  // Load items for this invoice
  const itemsRes = await query(`SELECT product_id, product_name, quantity, unit_price, cost_price FROM invoice_items WHERE invoice_id=$1`, [row.id])
  const items = itemsRes.rows.map((item: any) => mapDatabaseRow(item))
  
  return { ...mapped, id: mapped.trackingId || mapped.id, items }
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
