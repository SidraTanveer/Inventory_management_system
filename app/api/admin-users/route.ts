import { NextRequest, NextResponse } from "next/server"
import {
  createGuestUser,
  createUser,
  deleteGuestUser,
  deleteManagedUser,
  findUserById,
  getGuestUsers,
  getManagedUsers,
  updateGuestUser,
  updateManagedUser,
} from "@/lib/auth"
import { verifyAuthSession } from "@/lib/auth-session"
import type { AuthSession } from "@/lib/auth-session"
import type { UserRole } from "@/types/auth"

const permissionKeys = ["dashboard", "products", "invoices", "reports", "settings"] as const

function validPermissions(value: unknown): value is Record<(typeof permissionKeys)[number], boolean> {
  if (typeof value !== "object" || value === null) return false
  return permissionKeys.every((key) => typeof (value as Record<string, unknown>)[key] === "boolean")
}

async function authorizeAdmin(request: NextRequest): Promise<AuthSession | null> {
  const token = request.cookies.get("ims_session")?.value
  const session = verifyAuthSession(token)
  if (!session || session.role !== "admin") return null
  const user = await findUserById(session.userId)
  return user?.role === "admin" ? session : null
}

export async function GET(request: NextRequest) {
  try {
    if (!(await authorizeAdmin(request))) {
      return NextResponse.json({ success: false, error: "Administrator login is required." }, { status: 401 })
    }
    const [users, guests] = await Promise.all([getManagedUsers(), getGuestUsers()])
    return NextResponse.json({ users, guests })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to load managed users." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await authorizeAdmin(request))) {
      return NextResponse.json({ success: false, error: "Administrator login is required." }, { status: 401 })
    }
    const body = await request.json()
    const { type, id, name, email, role, permissions, password } = body
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || !validPermissions(permissions)) {
      return NextResponse.json({ success: false, error: "Name, email, and valid permissions are required." }, { status: 400 })
    }

    if (type === "guest") {
      if (typeof id !== "string" || !id) {
        return NextResponse.json({ success: false, error: "A guest id is required." }, { status: 400 })
      }
      const guest = await createGuestUser(id, name.trim(), email.trim().toLowerCase(), permissions)
      return NextResponse.json({ success: true, guest }, { status: 201 })
    }

    if (type !== "user" || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ success: false, error: "A user password of at least 8 characters is required." }, { status: 400 })
    }
    if (!["admin", "sales", "guest"].includes(role)) {
      return NextResponse.json({ success: false, error: "A valid user role is required." }, { status: 400 })
    }
    const user = await createUser(name.trim(), email.trim().toLowerCase(), password, role as UserRole, permissions)
    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to save user." },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await authorizeAdmin(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Administrator login is required." }, { status: 401 })
    }
    const body = await request.json()
    const { type, id, name, email, role, permissions } = body
    if (
      typeof id !== "string" ||
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      !validPermissions(permissions)
    ) {
      return NextResponse.json({ success: false, error: "A valid id, name, email, and permissions are required." }, { status: 400 })
    }

    if (type === "guest") {
      const guest = await updateGuestUser(id, name.trim(), email.trim().toLowerCase(), permissions)
      if (!guest) return NextResponse.json({ success: false, error: "Guest user not found." }, { status: 404 })
      return NextResponse.json({ success: true, guest })
    }

    if (type !== "user" || !["admin", "sales", "guest"].includes(role)) {
      return NextResponse.json({ success: false, error: "A valid user role is required." }, { status: 400 })
    }
    if (id === session.userId && role !== "admin") {
      return NextResponse.json({ success: false, error: "You cannot remove administrator access from your active account." }, { status: 400 })
    }
    const user = await updateManagedUser(id, name.trim(), email.trim().toLowerCase(), role as UserRole, permissions)
    if (!user) return NextResponse.json({ success: false, error: "User not found." }, { status: 404 })
    return NextResponse.json({ success: true, user })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to update user." },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await authorizeAdmin(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Administrator login is required." }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const type = searchParams.get("type")
    if (!id || !["user", "guest"].includes(type ?? "")) {
      return NextResponse.json({ success: false, error: "A valid id and user type are required." }, { status: 400 })
    }
    if (type === "user" && id === session.userId) {
      return NextResponse.json({ success: false, error: "You cannot delete your active administrator account." }, { status: 400 })
    }
    const deleted = type === "guest" ? await deleteGuestUser(id) : await deleteManagedUser(id)
    if (!deleted) return NextResponse.json({ success: false, error: "User not found." }, { status: 404 })
    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to delete user." },
      { status: 500 },
    )
  }
}
