import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import {
  ensureAuthTables,
  changeUserPassword,
  findUserById,
  findGuestByNameAndEmail,
  findUserByEmail,
  hashPassword,
  saveLoginRequest,
  createSignupRequest,
  findPendingSignupRequestByEmail,
} from "@/lib/auth"
import { clearAuthSessionCookie, createAuthSession, setAuthSessionCookie, verifyAuthSession } from "@/lib/auth-session"

export async function GET() {
  try {
    await ensureAuthTables()
    const admin = await findUserByEmail("nomanandy20@gmail.com")
    return NextResponse.json({ success: true, ready: true, admin: !!admin })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, email, password, name, guestEmail, role, message } = body

    if (type === "logout") {
      const response = NextResponse.json({ success: true })
      clearAuthSessionCookie(response)
      return response
    }

    if (type === "change-password") {
      const session = verifyAuthSession(request.cookies.get("ims_session")?.value)
      if (!session || session.userId !== body.userId || session.role !== "admin") {
        return NextResponse.json({ success: false, error: "An administrator session is required." }, { status: 401 })
      }
      if (
        typeof body.currentPassword !== "string" ||
        typeof body.newPassword !== "string" ||
        body.newPassword.length < 8
      ) {
        return NextResponse.json({ success: false, error: "A current password and a new password of at least 8 characters are required." }, { status: 400 })
      }
      const user = await findUserById(session.userId)
      if (user?.role !== "admin") {
        return NextResponse.json({ success: false, error: "An administrator session is required." }, { status: 401 })
      }
      await changeUserPassword(body.userId, body.currentPassword, body.newPassword)
      return NextResponse.json({ success: true })
    }

    await ensureAuthTables()

    if (type === "guest-login") {
      if (!name || !guestEmail) {
        return NextResponse.json({ success: false, error: "Guest name and email are required." }, { status: 400 })
      }
      const guest = await findGuestByNameAndEmail(name, guestEmail)
      if (!guest) {
        return NextResponse.json({ success: false, error: "Guest access was not found." }, { status: 403 })
      }
      const response = NextResponse.json({ success: true, user: guest })
      setAuthSessionCookie(response, createAuthSession(guest.id, guest.role))
      return response
    }

    if (type === "login") {
      if (!email || !password) {
        return NextResponse.json({ success: false, error: "Email and password are required." }, { status: 400 })
      }
      const user = await findUserByEmail(email)
      if (!user) {
        const pendingSignup = await findPendingSignupRequestByEmail(email)
        if (pendingSignup) {
          return NextResponse.json(
            { success: false, error: "Your signup request is pending admin approval. Please wait for approval." },
            { status: 403 },
          )
        }
        const requestResult = await saveLoginRequest(email, name ?? email, message)
        return NextResponse.json({ success: false, request: requestResult, error: "User not found. Request created." }, { status: 404 })
      }

      const hashed = hashPassword(password)
      if (!user.password_hash || hashed !== user.password_hash) {
        const requestResult = await saveLoginRequest(email, name ?? email, message)
        return NextResponse.json({ success: false, request: requestResult, error: "Invalid password. Request created." }, { status: 401 })
      }

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.created_at,
      }

      const response = NextResponse.json({ success: true, user: safeUser })
      setAuthSessionCookie(response, createAuthSession(user.id, user.role))
      return response
    }

    if (type === "register") {
      if (!name || !email || !password || !role) {
        return NextResponse.json({ success: false, error: "All registration fields are required." }, { status: 400 })
      }
      const requestResult = await createSignupRequest(name, email, password, role)
      return NextResponse.json({ success: true, request: requestResult, message: "Signup request submitted for admin approval." })
    }

    return NextResponse.json({ success: false, error: "Unsupported auth type." }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
