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

// Vendor functions
export async function addVendor(name: string, email: string, phone: string, address: string) {
  const id = randomUUID()
  const result = await query(
    `INSERT INTO vendors (id, name, email, phone, address, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, name, email, phone, address, created_at`,
    [id, name, email, phone, address],
  )
  return result.rows[0]
}

export async function getVendors() {
  const result = await query("SELECT id, name, email, phone, address, created_at FROM vendors ORDER BY created_at DESC")
  return result.rows
}

export async function updateVendor(id: string, name: string, email: string, phone: string, address: string) {
  const result = await query(
    `UPDATE vendors SET name = $2, email = $3, phone = $4, address = $5 WHERE id = $1
     RETURNING id, name, email, phone, address, created_at`,
    [id, name, email, phone, address],
  )
  return result.rows[0]
}

export async function deleteVendor(id: string) {
  await query("DELETE FROM vendors WHERE id = $1", [id])
  return true
}

// Product functions
export async function addProduct(
  name: string,
  description: string,
  unitPrice: number,
  costPrice: number,
  stock: number,
  vendorId: string,
  category: string,
  sku: string,
) {
  const id = randomUUID()
  const result = await query(
    `INSERT INTO products (id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at`,
    [id, name, description, unitPrice, costPrice, stock, vendorId, category, sku],
  )
  return result.rows[0]
}

export async function getProducts() {
  const result = await query(
    "SELECT id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at FROM products ORDER BY created_at DESC",
  )
  return result.rows
}

export async function updateProduct(
  id: string,
  name: string,
  description: string,
  unitPrice: number,
  costPrice: number,
  stock: number,
  vendorId: string,
  category: string,
  sku: string,
) {
  const result = await query(
    `UPDATE products SET name = $2, description = $3, unit_price = $4, cost_price = $5, stock = $6, vendor_id = $7, category = $8, sku = $9 WHERE id = $1
     RETURNING id, name, description, unit_price, cost_price, stock, vendor_id, category, sku, created_at`,
    [id, name, description, unitPrice, costPrice, stock, vendorId, category, sku],
  )
  return result.rows[0]
}

export async function deleteProduct(id: string) {
  await query("DELETE FROM products WHERE id = $1", [id])
  return true
}

// Customer functions
export async function addCustomer(name: string, email: string, phone: string, type: string) {
  const id = randomUUID()
  const result = await query(
    `INSERT INTO customers (id, name, email, phone, type, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, name, email, phone, type, created_at`,
    [id, name, email, phone, type],
  )
  return result.rows[0]
}

export async function getCustomers() {
  const result = await query("SELECT id, name, email, phone, type, created_at FROM customers ORDER BY created_at DESC")
  return result.rows
}

export async function updateCustomer(id: string, name: string, email: string, phone: string, type: string) {
  const result = await query(
    `UPDATE customers SET name = $2, email = $3, phone = $4, type = $5 WHERE id = $1
     RETURNING id, name, email, phone, type, created_at`,
    [id, name, email, phone, type],
  )
  return result.rows[0]
}

export async function deleteCustomer(id: string) {
  await query("DELETE FROM customers WHERE id = $1", [id])
  return true
}

// Deal functions
export async function addDeal(name: string, description: string, discountPercentage: number, expiryDate: string) {
  const id = randomUUID()
  const result = await query(
    `INSERT INTO deals (id, name, description, discount_percentage, expiry_date, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, name, description, discount_percentage, expiry_date, created_at`,
    [id, name, description, discountPercentage, expiryDate],
  )
  return result.rows[0]
}

export async function getDeals() {
  const result = await query("SELECT id, name, description, discount_percentage, expiry_date, created_at FROM deals ORDER BY created_at DESC")
  return result.rows
}

export async function updateDeal(id: string, name: string, description: string, discountPercentage: number, expiryDate: string) {
  const result = await query(
    `UPDATE deals SET name = $2, description = $3, discount_percentage = $4, expiry_date = $5 WHERE id = $1
     RETURNING id, name, description, discount_percentage, expiry_date, created_at`,
    [id, name, description, discountPercentage, expiryDate],
  )
  return result.rows[0]
}

export async function deleteDeal(id: string) {
  await query("DELETE FROM deals WHERE id = $1", [id])
  return true
}

// Invoice functions
export async function addInvoice(
  trackingId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  totalAmount: number,
  totalCost: number,
  totalProfit: number,
  profitPercentage: number,
  currency: string,
  status: string,
) {
  const id = randomUUID()
  const result = await query(
    `INSERT INTO invoices (id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, currency, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
     RETURNING id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, currency, status, created_at`,
    [id, trackingId, customerName, customerEmail, customerPhone, totalAmount, totalCost, totalProfit, profitPercentage, currency, status],
  )
  return result.rows[0]
}

export async function getInvoices() {
  const result = await query(
    "SELECT id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, currency, status, created_at FROM invoices ORDER BY created_at DESC",
  )
  return result.rows
}

export async function updateInvoice(
  id: string,
  status: string,
  totalAmount: number,
  totalCost: number,
  totalProfit: number,
  profitPercentage: number,
) {
  const result = await query(
    `UPDATE invoices SET status = $2, total_amount = $3, total_cost = $4, total_profit = $5, profit_percentage = $6 WHERE id = $1
     RETURNING id, tracking_id, customer_name, customer_email, customer_phone, total_amount, total_cost, total_profit, profit_percentage, currency, status, created_at`,
    [id, status, totalAmount, totalCost, totalProfit, profitPercentage],
  )
  return result.rows[0]
}

export async function deleteInvoice(id: string) {
  await query("DELETE FROM invoices WHERE id = $1", [id])
  return true
}
