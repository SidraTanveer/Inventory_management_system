/**
 * Convert snake_case database fields to camelCase for TypeScript types
 */
function toSafeNumber(value: any) {
  if (value === null || value === undefined || value === "") return value
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim()
    if (!normalized) return value
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : value
  }
  if (typeof value === "number") return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : value
}

const NUMERIC_KEYS = new Set([
  "unitPrice",
  "costPrice",
  "stock",
  "quantity",
  "unitCost",
  "totalCost",
  "totalAmount",
  "totalProfit",
  "profitPercentage",
  "discountPercentage",
  "revenue",
  "salesValue",
  "purchaseCost",
  "profit",
  "overallProfit",
  "quantitySold",
  "totalPrice",
  "avgOrderValue",
  "averageOrderValue",
])

function mapValue(key: string | undefined, value: any): any {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => mapValue(undefined, item))
  }

  if (value && typeof value === "object") {
    return mapDatabaseRow(value)
  }

  if (key && NUMERIC_KEYS.has(key)) {
    return toSafeNumber(value)
  }

  return value
}

export function mapDatabaseRow(row: any): any {
  if (!row || typeof row !== 'object') return row
  
  const mapped: any = {}
  for (const [key, value] of Object.entries(row)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
    mapped[camelKey] = mapValue(camelKey, value)
  }
  return mapped
}

export function mapDatabaseRows(rows: any[]): any[] {
  return rows.map(mapDatabaseRow)
}
