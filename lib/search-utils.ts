import type { Customer, Invoice } from "@/types/app"

const normalizedTextCache = new Map<string, string>()
const MAX_NORMALIZED_TEXT_CACHE_SIZE = 4096

function normalizeEmail(email?: string) {
  return normalizeSearchText(email)
}

export function normalizeSearchText(value?: string) {
  const rawValue = value ?? ""
  const cached = normalizedTextCache.get(rawValue)
  if (cached !== undefined) {
    normalizedTextCache.delete(rawValue)
    normalizedTextCache.set(rawValue, cached)
    return cached
  }

  const normalized = rawValue.trim().toLowerCase()
  if (normalizedTextCache.size >= MAX_NORMALIZED_TEXT_CACHE_SIZE) {
    const oldestValue = normalizedTextCache.keys().next().value
    if (oldestValue !== undefined) normalizedTextCache.delete(oldestValue)
  }
  normalizedTextCache.set(rawValue, normalized)
  return normalized
}

export function searchMatchesAny(values: Array<string | undefined>, term: string) {
  const normalizedTerm = normalizeSearchText(term)
  if (!normalizedTerm) return true
  return values.some((value) => normalizeSearchText(value).includes(normalizedTerm))
}

function getMatchScore(value: string, term: string): number | null {
  const text = normalizeSearchText(value)
  if (!text) return null

  if (text === term) return 0
  if (text.startsWith(term)) return 1

  const wordStartIndex = text.indexOf(` ${term}`)
  if (wordStartIndex >= 0) return 2 + wordStartIndex / 1000

  const includesIndex = text.indexOf(term)
  if (includesIndex >= 0) return 3 + includesIndex / 1000

  return null
}

export function searchAndRank<T>(items: T[], term: string, fields: Array<(item: T) => string | undefined>): T[] {
  const normalizedTerm = normalizeSearchText(term)
  if (!normalizedTerm) return items

  const scored: Array<{ item: T; score: number }> = []
  for (const item of items) {
    let bestScore: number | null = null
    for (const field of fields) {
      const score = getMatchScore(field(item) ?? "", normalizedTerm)
      if (score !== null && (bestScore === null || score < bestScore)) bestScore = score
    }
    if (bestScore !== null) scored.push({ item, score: bestScore })
  }

  scored.sort((a, b) => a.score - b.score)
  return scored.map(({ item }) => item)
}

export function getKeywordSuggestions<T>(
  items: T[],
  term: string,
  fields: Array<(item: T) => string | undefined>,
  limit = 8,
): string[] {
  const normalizedTerm = normalizeSearchText(term)

  const seen = new Set<string>()
  const suggestions: string[] = []

  for (const item of items) {
    for (const field of fields) {
      const value = (field(item) ?? "").trim()
      if (!value) continue

      const normalizedValue = normalizeSearchText(value)
      if (normalizedTerm && !normalizedValue.includes(normalizedTerm)) continue
      if (seen.has(normalizedValue)) continue

      seen.add(normalizedValue)
      suggestions.push(value)

      if (suggestions.length >= limit) {
        return suggestions
      }
    }
  }

  return suggestions
}

export function buildSearchableCustomers(customers: Customer[], invoices: Invoice[]): Customer[] {
  const merged = new Map<string, Customer>()

  customers.forEach((customer) => {
    const key = normalizeEmail(customer?.email)
    if (key) {
      merged.set(key, customer)
    }
  })

  invoices.forEach((invoice) => {
    const key = normalizeEmail(invoice?.customerEmail)
    if (key && !merged.has(key)) {
      merged.set(key, {
        id: `cust-${invoice.customerEmail}`,
        name: invoice.customerName,
        email: invoice.customerEmail,
        phone: invoice.customerPhone,
        type: "frequent",
        createdAt: invoice.createdAt,
      })
    }
  })

  return Array.from(merged.values())
}
