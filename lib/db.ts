import { Pool } from "pg"

const connectionString = process.env.NEON_POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    "Missing database connection string. Set NEON_POSTGRES_URL or DATABASE_URL in your environment.",
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
