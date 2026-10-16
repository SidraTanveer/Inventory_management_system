import { query, transaction } from "@/lib/db"
import type { PoolClient } from "pg"
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

let invoiceDeliveryChargesSchema: Promise<void> | null = null

export async function ensureInvoiceDeliveryChargesSchema() {
  if (!invoiceDeliveryChargesSchema) {
    invoiceDeliveryChargesSchema = query(
      "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS delivery_charges NUMERIC(18,4) NOT NULL DEFAULT 0",
    )
      .then(() => undefined)
      .catch((error) => {
        invoiceDeliveryChargesSchema = null
        throw error
      })
  }
  await invoiceDeliveryChargesSchema
}

async function replaceInvoiceItems(client: PoolClient, invoiceId: string, invoiceDate: string | Date, items: any[]) {
  await client.query(`DELETE FROM invoice_items WHERE invoice_id=$1`, [invoiceId])
  await client.query(`DELETE FROM sales_history_items WHERE invoice_id=$1`, [invoiceId])
  const mappedItems = []

  for (const item of items) {
    const productId = item.product_id ?? item.productId ?? null
    const productName = item.product_name ?? item.productName
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unit_price ?? item.unitPrice) || 0
    const costPrice = Number(item.cost_price ?? item.costPrice) || 0
    await client.query(
      `INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, cost_price)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [invoiceId, productId || null, productName, quantity, unitPrice, costPrice],
    )
    await client.query(
      `INSERT INTO sales_history_items (invoice_id, product_id, date, quantity, unit_price, total_price, profit)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [invoiceId, productId || null, invoiceDate, quantity, unitPrice, quantity * unitPrice, (unitPrice - costPrice) * quantity],
    )
    mappedItems.push({ productId, productName, quantity, unitPrice, costPrice })
  }

  return mappedItems
}

export async function getInvoices() {
  await ensureInvoiceDeliveryChargesSchema()
  // Get invoices with their items in a single query using LEFT JOIN
  const res = await query(`
    SELECT 
      i.id, i.tracking_id, i.customer_name, i.customer_email, i.customer_phone, 
      i.total_amount, i.delivery_charges, i.total_cost, i.total_profit, i.profit_percentage,
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
        delivery_charges: row.delivery_charges,
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
  await ensureInvoiceDeliveryChargesSchema()
  const trackingId = payload.tracking_id ?? payload.trackingId
  const customerName = payload.customer_name ?? payload.customerName
  const customerEmail = payload.customer_email ?? payload.customerEmail
  const customerPhone = payload.customer_phone ?? payload.customerPhone
  const createdAt = payload.created_at ?? payload.createdAt ?? null
  const totalAmount = payload.total_amount ?? payload.totalAmount
  const deliveryCharges = parseDeliveryCharges(payload.delivery_charges ?? payload.deliveryCharges)
  const totalCost = payload.total_cost ?? payload.totalCost
  const totalProfit = payload.total_profit ?? payload.totalProfit
  const profitPercentage = payload.profit_percentage ?? payload.profitPercentage
  const { currency, status } = payload
  const items = Array.isArray(payload.items) ? payload.items : []
  await ensureInvoiceUniquenessGuard()

  const normalizedTrackingId = typeof trackingId === "string" && trackingId.trim() ? trackingId.trim() : null
  return transaction(async (client) => {
    let invoiceRow
    if (normalizedTrackingId) {
      const existing = await client.query(`SELECT id FROM invoices WHERE tracking_id=$1 LIMIT 1`, [normalizedTrackingId])
      if (existing.rows[0]) {
        const updated = await client.query(
          `UPDATE invoices
           SET customer_name=$1, customer_email=$2, customer_phone=$3, created_at=COALESCE($4, created_at),
               total_amount=$5, delivery_charges=$6, total_cost=$7, total_profit=$8, profit_percentage=$9, currency=$10, status=$11
           WHERE id=$12
           RETURNING id, tracking_id, customer_name, customer_email, customer_phone, total_amount, delivery_charges, total_cost,
                     total_profit, profit_percentage, created_at, currency, status`,
          [
            customerName,
            customerEmail,
            customerPhone ?? null,
            createdAt,
            Number(totalAmount) || 0,
            deliveryCharges,
            Number(totalCost) || 0,
            Number(totalProfit) || 0,
            Number(profitPercentage) || 0,
            currency ?? "USD",
            status ?? "pending",
            existing.rows[0].id,
          ],
        )
        invoiceRow = updated.rows[0]
        const mappedItems = await replaceInvoiceItems(client, invoiceRow.id, invoiceRow.created_at, items)
        const mapped = mapDatabaseRow(invoiceRow)
        return { ...mapped, id: mapped.trackingId || mapped.id, items: mappedItems }
      }
    }

    const inserted = await client.query(
      `INSERT INTO invoices (tracking_id, customer_name, customer_email, customer_phone, created_at, total_amount, delivery_charges, total_cost, total_profit, profit_percentage, currency, status)
       VALUES ($1,$2,$3,$4,COALESCE($5, NOW()),$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost,
                 delivery_charges, total_profit, profit_percentage, created_at, currency, status`,
      [
        normalizedTrackingId,
        customerName,
        customerEmail,
        customerPhone ?? null,
        createdAt,
        Number(totalAmount) || 0,
        deliveryCharges,
        Number(totalCost) || 0,
        Number(totalProfit) || 0,
        Number(profitPercentage) || 0,
        currency ?? "USD",
        status ?? "pending",
      ],
    )
    invoiceRow = inserted.rows[0]
    const mappedItems = await replaceInvoiceItems(client, invoiceRow.id, invoiceRow.created_at, items)
    const mapped = mapDatabaseRow(invoiceRow)
    return { ...mapped, id: mapped.trackingId || mapped.id, items: mappedItems }
  })
}

export async function updateInvoice(trackingIdOrId: string, payload: any) {
  await ensureInvoiceDeliveryChargesSchema()
  return transaction(async (client) => {
    const find = await client.query(
      `SELECT id, tracking_id FROM invoices WHERE tracking_id=$1 OR id::text=$1`,
      [trackingIdOrId],
    )
    const row = find.rows[0]
    if (!row) return null

    const customerName = payload.customer_name ?? payload.customerName
    const customerEmail = payload.customer_email ?? payload.customerEmail
    const customerPhone = payload.customer_phone ?? payload.customerPhone
    const trackingId = payload.tracking_id ?? payload.trackingId ?? row.tracking_id
    const createdAt = payload.created_at ?? payload.createdAt
    const totalAmount = payload.total_amount ?? payload.totalAmount
    const deliveryCharges = parseDeliveryCharges(payload.delivery_charges ?? payload.deliveryCharges)
    const totalCost = payload.total_cost ?? payload.totalCost
    const totalProfit = payload.total_profit ?? payload.totalProfit
    const profitPercentage = payload.profit_percentage ?? payload.profitPercentage
    const updated = await client.query(
      `UPDATE invoices
       SET tracking_id=$1, customer_name=$2, customer_email=$3, customer_phone=$4,
           total_amount=$5, delivery_charges=$6, total_cost=$7, total_profit=$8, profit_percentage=$9,
           currency=$10, status=$11, created_at=COALESCE($12, created_at)
       WHERE id=$13
       RETURNING id, tracking_id, customer_name, customer_email, customer_phone,
                 total_amount, delivery_charges, total_cost, total_profit, profit_percentage, created_at, currency, status`,
      [
        trackingId || null,
        customerName,
        customerEmail,
        customerPhone ?? null,
        Number(totalAmount) || 0,
        deliveryCharges,
        Number(totalCost) || 0,
        Number(totalProfit) || 0,
        Number(profitPercentage) || 0,
        payload.currency ?? "USD",
        payload.status ?? "pending",
        createdAt ?? null,
        row.id,
      ],
    )

    const mappedItems = await replaceInvoiceItems(
      client,
      row.id,
      createdAt ?? updated.rows[0].created_at,
      Array.isArray(payload.items) ? payload.items : [],
    )

    const mapped = mapDatabaseRow(updated.rows[0])
    return { ...mapped, id: mapped.trackingId || mapped.id, items: mappedItems }
  })
}

function parseDeliveryCharges(value: unknown) {
  const charges = Number(value ?? 0)
  if (!Number.isFinite(charges) || charges < 0) {
    throw new Error("Delivery charges must be a non-negative number.")
  }
  return charges
}

export async function deleteInvoice(trackingIdOrId: string) {
  return transaction(async (client) => {
    const find = await client.query(
      `SELECT id FROM invoices WHERE tracking_id=$1 OR id::text=$1`,
      [trackingIdOrId],
    )
    const row = find.rows[0]
    if (!row) return null
    const invoice = await client.query(`SELECT * FROM invoices WHERE id=$1`, [row.id])
    const items = await client.query(
      `SELECT product_id, product_name, quantity, unit_price, cost_price
       FROM invoice_items WHERE invoice_id=$1`,
      [row.id],
    )
    await client.query(
      `INSERT INTO trash_items (original_id, type, data) VALUES ($1,$2,$3)`,
      [row.id, "invoice", JSON.stringify({ ...invoice.rows[0], items: items.rows })],
    )
    await client.query(`DELETE FROM invoices WHERE id=$1`, [row.id])
    return { id: trackingIdOrId }
  })
}
