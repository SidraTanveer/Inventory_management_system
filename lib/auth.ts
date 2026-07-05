import { createHash, randomUUID } from "crypto"
import { query } from "@/lib/db"
import type { UserRole, LoginRequest } from "@/types/auth"

const defaultAdminEmail = "nomanandy20@gmail.com"
const defaultAdminPassword = "password"

const getPermissionsByRole = (role: UserRole) => {
  if (role === "admin") {
    return {
      dashboard: true,
      products: true,
      invoices: true,
      reports: true,
      settings: true,
    }
  }

  return {
    dashboard: true,
    products: true,
    invoices: true,
    reports: false,
    settings: false,
  }
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export async function ensureAuthTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS login_requests (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      status TEXT NOT NULL,
      message TEXT
    )
  `)

  await query(
    `INSERT INTO users (id, name, email, password_hash, role, permissions)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO NOTHING`,
    [
      randomUUID(),
      "Admin User",
      defaultAdminEmail,
      hashPassword(defaultAdminPassword),
      "admin",
      JSON.stringify(getPermissionsByRole("admin")),
    ],
  )

  await query(
    `INSERT INTO users (id, name, email, password_hash, role, permissions)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO NOTHING`,
    [
      randomUUID(),
      "Sales Manager",
      "sales@example.com",
      hashPassword("password"),
      "sales",
      JSON.stringify(getPermissionsByRole("sales")),
    ],
  )
}

export async function normalizePermissions(role: UserRole) {
  return getPermissionsByRole(role)
}

export async function findUserByEmail(email: string) {
  const result = await query(
    "SELECT id, name, email, role, permissions, created_at, password_hash FROM users WHERE LOWER(email) = LOWER($1)",
    [email],
  )
  return result.rows[0] ?? null
}

export async function verifyUserCredentials(email: string, password: string) {
  const result = await query(
    "SELECT id, name, email, role, permissions, created_at, password_hash FROM users WHERE LOWER(email) = LOWER($1)",
    [email],
  )
  const user = result.rows[0]
  if (!user) {
    return null
  }

  const passwordHash = hashPassword(password)
  if (user.password_hash !== passwordHash) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    permissions: user.permissions,
    createdAt: user.created_at.toISOString(),
  }
}

export async function createUser(name: string, email: string, password: string, role: UserRole) {
  const existingUser = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email])
  if (existingUser.rows.length > 0) {
    throw new Error("A user with this email already exists.")
  }

  const id = randomUUID()
  const inserted = await query(
    `INSERT INTO users (id, name, email, password_hash, role, permissions)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, role, permissions, created_at`,
    [
      id,
      name,
      email,
      hashPassword(password),
      role,
      JSON.stringify(getPermissionsByRole(role)),
    ],
  )

  const user = inserted.rows[0]
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    permissions: user.permissions,
    createdAt: user.created_at.toISOString(),
  }
}

export async function saveLoginRequest(email: string, name: string, message?: string) {
  const id = randomUUID()
  const result = await query(
    `INSERT INTO login_requests (id, email, name, status, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, attempted_at, status, message`,
    [id, email, name, "pending", message ?? null],
  )
  return result.rows[0] as LoginRequest
}

export async function getLoginRequests() {
  const result = await query(
    "SELECT id, email, name, attempted_at, status, message FROM login_requests ORDER BY attempted_at DESC",
  )
  return result.rows as LoginRequest[]
}

export async function updateLoginRequestStatus(id: string, status: "approved" | "rejected") {
  const result = await query(
    "UPDATE login_requests SET status = $1 WHERE id = $2 RETURNING id, email, name, attempted_at, status, message",
    [status, id],
  )
  return result.rows[0] as LoginRequest | null
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
  const result = await query("SELECT password_hash FROM users WHERE id = $1", [userId])
  const user = result.rows[0]
  if (!user) {
    throw new Error("User not found.")
  }

  const currentHash = hashPassword(currentPassword)
  if (user.password_hash !== currentHash) {
    throw new Error("Current password is incorrect.")
  }

  if (currentPassword === newPassword) {
    throw new Error("New password cannot be the same as the current password.")
  }

  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hashPassword(newPassword), userId])
  return true
}
