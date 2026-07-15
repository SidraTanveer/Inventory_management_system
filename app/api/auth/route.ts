import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { ensureAuthTables, findUserByEmail, hashPassword, saveLoginRequest, createSignupRequest, findPendingSignupRequestByEmail } from "@/lib/auth"

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, email, password, name, role, message } = body

    await ensureAuthTables()

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

      return NextResponse.json({ success: true, user: safeUser })
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
