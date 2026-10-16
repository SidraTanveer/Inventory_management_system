import { query, transaction } from "@/lib/db"
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
  const products = mapDatabaseRows(result.rows)
  const productIds = products.map((product: any) => product.id)
  if (productIds.length === 0) return products.map((product: any) => ({ ...product, purchaseHistory: [], salesHistory: [] }))

  const [purchaseResult, salesResult] = await Promise.all([
    query(
      `SELECT id, product_id, date, quantity, unit_cost, total_cost
       FROM purchase_history_items WHERE product_id = ANY($1::uuid[]) ORDER BY date`,
      [productIds],
    ),
    query(
      `SELECT sh.product_id, COALESCE(i.tracking_id, sh.invoice_id::text) AS invoice_id,
              sh.date, sh.quantity, sh.unit_price, sh.total_price, sh.profit
       FROM sales_history_items sh
       LEFT JOIN invoices i ON i.id = sh.invoice_id
       WHERE sh.product_id = ANY($1::uuid[]) ORDER BY sh.date`,
      [productIds],
    ),
  ])

  const purchasesByProduct = new Map<string, any[]>()
  for (const row of purchaseResult.rows) {
    const purchase = mapDatabaseRow(row)
    const history = purchasesByProduct.get(purchase.productId) ?? []
    history.push(purchase)
    purchasesByProduct.set(purchase.productId, history)
  }
  const salesByProduct = new Map<string, any[]>()
  for (const row of salesResult.rows) {
    const sale = mapDatabaseRow(row)
    const history = salesByProduct.get(sale.productId) ?? []
    history.push(sale)
    salesByProduct.set(sale.productId, history)
  }

  return products.map((product: any) => ({
    ...product,
    purchaseHistory: purchasesByProduct.get(product.id) ?? [],
    salesHistory: salesByProduct.get(product.id) ?? [],
  }))
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
  return transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO products (name, description, unit_price, cost_price, stock, vendor_id, category, sku)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at`,
      [name, description ?? null, unitPrice, costPrice, stock, vendorId, category, sku],
    )
    const product = result.rows[0]
    const purchaseHistory = Array.isArray(payload?.purchaseHistory) ? payload.purchaseHistory : []
    for (const purchase of purchaseHistory) {
      await client.query(
        `INSERT INTO purchase_history_items (product_id, date, quantity, unit_cost, total_cost)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          product.id,
          purchase.date,
          toNumberSafe(purchase.quantity),
          toNumberSafe(purchase.unitCost),
          toNumberSafe(purchase.totalCost),
        ],
      )
    }
    return { ...mapDatabaseRow(product), purchaseHistory: mapDatabaseRows(
      (await client.query(
        `SELECT id, product_id, date, quantity, unit_cost, total_cost
         FROM purchase_history_items WHERE product_id = $1 ORDER BY date`,
        [product.id],
      )).rows,
    ), salesHistory: [] }
  })
}

export async function updateProduct(id: string, payload: any) {
  return transaction(async (client) => {
    const existingResult = await client.query(
      `SELECT id, name, description, unit_price, cost_price, stock, vendor_id, category, sku
       FROM products WHERE id=$1`,
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
    const result = await client.query(
      `UPDATE products SET name=$1, description=$2, unit_price=$3, cost_price=$4, stock=$5, vendor_id=$6, category=$7, sku=$8
       WHERE id=$9 RETURNING id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at`,
      [name, description ?? null, unitPrice, costPrice, stock, vendorId, category, sku, id],
    )

    if (Array.isArray(payload?.purchaseHistory)) {
      await client.query(`DELETE FROM purchase_history_items WHERE product_id=$1`, [id])
      for (const purchase of payload.purchaseHistory) {
        await client.query(
          `INSERT INTO purchase_history_items (product_id, date, quantity, unit_cost, total_cost)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            id,
            purchase.date,
            toNumberSafe(purchase.quantity),
            toNumberSafe(purchase.unitCost),
            toNumberSafe(purchase.totalCost),
          ],
        )
      }
    }

    const purchaseResult = await client.query(
      `SELECT id, product_id, date, quantity, unit_cost, total_cost
       FROM purchase_history_items WHERE product_id = $1 ORDER BY date`,
      [id],
    )
    const salesResult = await client.query(
      `SELECT sh.product_id, COALESCE(i.tracking_id, sh.invoice_id::text) AS invoice_id,
              sh.date, sh.quantity, sh.unit_price, sh.total_price, sh.profit
       FROM sales_history_items sh
       LEFT JOIN invoices i ON i.id = sh.invoice_id
       WHERE sh.product_id = $1 ORDER BY sh.date`,
      [id],
    )
    return {
      ...mapDatabaseRow(result.rows[0] ?? null),
      purchaseHistory: mapDatabaseRows(purchaseResult.rows),
      salesHistory: mapDatabaseRows(salesResult.rows),
    }
  })
}

export async function deleteProduct(id: string) {
  return transaction(async (client) => {
    const result = await client.query(
      `SELECT id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at
       FROM products WHERE id=$1`,
      [id],
    )
    const row = result.rows[0]
    if (!row) return null

    const purchaseResult = await client.query(
      `SELECT id, product_id, date, quantity, unit_cost, total_cost
       FROM purchase_history_items WHERE product_id = $1 ORDER BY date`,
      [id],
    )
    const salesResult = await client.query(
      `SELECT sh.product_id, COALESCE(i.tracking_id, sh.invoice_id::text) AS invoice_id,
              sh.date, sh.quantity, sh.unit_price, sh.total_price, sh.profit
       FROM sales_history_items sh
       LEFT JOIN invoices i ON i.id = sh.invoice_id
       WHERE sh.product_id = $1 ORDER BY sh.date`,
      [id],
    )
    const data = {
      ...mapDatabaseRow(row),
      purchaseHistory: mapDatabaseRows(purchaseResult.rows),
      salesHistory: mapDatabaseRows(salesResult.rows),
    }
    await client.query(
      `INSERT INTO trash_items (original_id, type, data) VALUES ($1, $2, $3)`,
      [id, "product", JSON.stringify(data)],
    )
    const deleted = await client.query(`DELETE FROM products WHERE id=$1 RETURNING id`, [id])
    return deleted.rows[0] ?? null
  })
}
