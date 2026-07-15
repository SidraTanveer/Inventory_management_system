import type { Customer, Invoice } from "@/types/app"

function normalizeEmail(email?: string) {
  return (email ?? "").trim().toLowerCase()
}

function normalizeText(value?: string) {
  return (value ?? "").trim().toLowerCase()
}

function getMatchScore(value: string, term: string): number | null {
  const text = normalizeText(value)
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
  const normalizedTerm = normalizeText(term)
  if (!normalizedTerm) return items

  const scored = items
    .map((item) => {
      const scores = fields
        .map((field) => getMatchScore(field(item) ?? "", normalizedTerm))
        .filter((score): score is number => score !== null)

      if (scores.length === 0) return null
      return { item, score: Math.min(...scores) }
    })
    .filter((entry): entry is { item: T; score: number } => entry !== null)

  scored.sort((a, b) => a.score - b.score)
  return scored.map((entry) => entry.item)
}

export function getKeywordSuggestions<T>(
  items: T[],
  term: string,
  fields: Array<(item: T) => string | undefined>,
  limit = 8,
): string[] {
  const normalizedTerm = normalizeText(term)
  const ranked = normalizedTerm ? searchAndRank(items, normalizedTerm, fields) : items

  const seen = new Set<string>()
  const suggestions: string[] = []

  for (const item of ranked) {
    for (const field of fields) {
      const value = (field(item) ?? "").trim()
      if (!value) continue

      const normalizedValue = value.toLowerCase()
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
