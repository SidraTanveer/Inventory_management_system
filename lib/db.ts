import { Pool, type PoolClient } from "pg"

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

if (!connectionString) {
  throw new Error(
    "Missing database connection string. Set NEON_POSTGRES_URL, DATABASE_URL, or a supported Supabase storage POSTGRES URL in your environment.",
  )
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
})

export async function query<T = any>(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result as { rows: T[] }
  } finally {
    client.release()
  }
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await work(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    try {
      await client.query("ROLLBACK")
    } catch (rollbackError) {
      console.error("Database transaction rollback failed:", rollbackError)
    }
    throw error
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
