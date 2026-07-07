import { Pool } from "pg"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const connectionString =
  process.env.NEON_POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.storage_POSTGRES_URL_NON_POOLING ||
  process.env.STORAGE_POSTGRES_URL_NON_POOLING ||
  process.env.storage_POSTGRES_URL ||
  process.env.STORAGE_POSTGRES_URL ||
  process.env.storage_POSTGRES_PRISMA_URL ||
  process.env.STORAGE_POSTGRES_PRISMA_URL

// Only throw error at runtime, not at build time
let pool: Pool | null = null

function getPool() {
  if (!pool && connectionString) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  }
  if (!pool) {
    throw new Error(
      "Missing database connection string. Set NEON_POSTGRES_URL, DATABASE_URL, or a supported Supabase storage POSTGRES URL in your environment.",
    )
  }
  return pool
}

export async function query<T = any>(text: string, params?: any[]) {
  const currentPool = getPool()
  const client = await currentPool.connect()
  try {
    const result = await client.query(text, params)
    return result as { rows: T[] }
  } finally {
    client.release()
  }
}

export async function testConnection() {
  const result = await query("SELECT NOW() as now")
  return result.rows[0]
}

export async function createUsersTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      permissions JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
  )
}
