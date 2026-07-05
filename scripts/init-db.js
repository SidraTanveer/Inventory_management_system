const { readFileSync } = require("fs")
const { Pool } = require("pg")
const path = require("path")

function loadEnv(filePath) {
  const env = {}
  const content = readFileSync(filePath, "utf8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const [key, ...rest] = trimmed.split("=")
    env[key] = rest.join("=").trim()
  }
  return env
}

const root = path.resolve(__dirname, "..")
const envPath = path.join(root, ".env.local")
const env = loadEnv(envPath)
const connectionString = env.NEON_POSTGRES_URL || env.DATABASE_URL

if (!connectionString) {
  throw new Error("Missing database connection string. Set NEON_POSTGRES_URL or DATABASE_URL in .env.local or the environment.")
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
})

async function main() {
  const sqlPath = path.join(root, "scripts", "create_tables.sql")
  const sql = readFileSync(sqlPath, "utf8")
  await pool.query(sql)
  console.log("✅ Database tables created successfully.")
}

main()
  .then(() => pool.end())
  .catch((error) => {
    console.error("Failed to create database tables:", error)
    process.exit(1)
  })
