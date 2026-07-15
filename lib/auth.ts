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
      message TEXT,
      role TEXT,
      password_hash TEXT,
      request_type TEXT DEFAULT 'login'
    )
  `)

  await query(`ALTER TABLE login_requests ADD COLUMN IF NOT EXISTS role TEXT`)
  await query(`ALTER TABLE login_requests ADD COLUMN IF NOT EXISTS password_hash TEXT`)
  await query(`ALTER TABLE login_requests ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'login'`)

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
    `INSERT INTO login_requests (id, email, name, status, message, request_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, name, attempted_at, status, message, role, request_type`,
    [id, email, name, "pending", message ?? null, "login"],
  )
  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    attemptedAt: row.attempted_at instanceof Date ? row.attempted_at.toISOString() : row.attempted_at,
    status: row.status,
    message: row.message ?? undefined,
  } as LoginRequest
}

export async function createSignupRequest(name: string, email: string, password: string, role: UserRole) {
  const existingUser = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email])
  if (existingUser.rows.length > 0) {
    throw new Error("A user with this email already exists.")
  }

  const existingPending = await query(
    "SELECT id FROM login_requests WHERE LOWER(email) = LOWER($1) AND status = 'pending' AND request_type = 'signup'",
    [email],
  )
  if (existingPending.rows.length > 0) {
    throw new Error("Your signup request is already pending admin approval.")
  }

  const id = randomUUID()
  const result = await query(
    `INSERT INTO login_requests (id, email, name, status, message, role, password_hash, request_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, email, name, attempted_at, status, message, role, request_type`,
    [
      id,
      email,
      name,
      "pending",
      "Signup request awaiting admin approval.",
      role,
      hashPassword(password),
      "signup",
    ],
  )

  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    attemptedAt: row.attempted_at instanceof Date ? row.attempted_at.toISOString() : row.attempted_at,
    status: row.status,
    message: row.message ?? undefined,
  } as LoginRequest
}

export async function findPendingSignupRequestByEmail(email: string) {
  const result = await query(
    "SELECT id FROM login_requests WHERE LOWER(email) = LOWER($1) AND status = 'pending' AND request_type = 'signup' ORDER BY attempted_at DESC LIMIT 1",
    [email],
  )
  return result.rows[0] ?? null
}

export async function getLoginRequests() {
  const result = await query(
    "SELECT id, email, name, attempted_at, status, message, role, request_type FROM login_requests ORDER BY attempted_at DESC",
  )
  return result.rows.map((row: any) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    attemptedAt: row.attempted_at instanceof Date ? row.attempted_at.toISOString() : row.attempted_at,
    status: row.status,
    message: row.message ?? undefined,
  })) as LoginRequest[]
}

export async function updateLoginRequestStatus(id: string, status: "approved" | "rejected") {
  const result = await query(
    "UPDATE login_requests SET status = $1 WHERE id = $2 RETURNING id, email, name, attempted_at, status, message, role, request_type",
    [status, id],
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    attemptedAt: row.attempted_at instanceof Date ? row.attempted_at.toISOString() : row.attempted_at,
    status: row.status,
    message: row.message ?? undefined,
  } as LoginRequest
}

export async function approveSignupRequest(id: string) {
  const requestResult = await query(
    "SELECT id, email, name, role, password_hash, status, request_type FROM login_requests WHERE id = $1",
    [id],
  )
  const request = requestResult.rows[0]
  if (!request) {
    throw new Error("Login request not found.")
  }
  if (request.status !== "pending") {
    throw new Error("Only pending requests can be approved.")
  }

  if (request.request_type === "signup") {
    if (!request.password_hash) {
      throw new Error("Signup request is missing credentials.")
    }

    const existingUser = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [request.email])
    if (existingUser.rows.length === 0) {
      const role = (request.role as UserRole) || "sales"
      await query(
        `INSERT INTO users (id, name, email, password_hash, role, permissions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          randomUUID(),
          request.name,
          request.email,
          request.password_hash,
          role,
          JSON.stringify(getPermissionsByRole(role)),
        ],
      )
    }
  }

  return updateLoginRequestStatus(id, "approved")
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
