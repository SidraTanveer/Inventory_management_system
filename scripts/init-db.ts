process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { readFile } from "fs/promises"
import path from "path"
import { Pool } from "pg"

interface EnvMap {
  [key: string]: string
}

function loadEnv(filePath: string): Promise<EnvMap> {
  return readFile(filePath, "utf8").then((content) => {
    const env: EnvMap = {}
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const [key, ...rest] = trimmed.split("=")
      env[key] = rest.join("=").trim()
    }
    return env
  })
}

async function main() {
  const root = path.resolve(__dirname, "..")
  const envPath = path.join(root, ".env.local")
  const env = await loadEnv(envPath)
  const connectionString =
    env.NEON_POSTGRES_URL ||
    env.DATABASE_URL ||
    env.storage_POSTGRES_URL_NON_POOLING ||
    env.STORAGE_POSTGRES_URL_NON_POOLING ||
    env.storage_POSTGRES_URL ||
    env.STORAGE_POSTGRES_URL ||
    env.storage_POSTGRES_PRISMA_URL ||
    env.STORAGE_POSTGRES_PRISMA_URL

  if (!connectionString) {
    throw new Error(
      "Missing database connection string. Set NEON_POSTGRES_URL, DATABASE_URL, or a supported Supabase storage POSTGRES URL in .env.local or the environment.",
    )
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  const sqlPath = path.join(root, "scripts", "create_tables.sql")
  const sql = await readFile(sqlPath, "utf8")

  try {
    await pool.query(sql)
    console.log("✅ Database tables created successfully.")
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error("Failed to create database tables:", error)
  process.exit(1)
})
