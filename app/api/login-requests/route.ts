import { NextRequest, NextResponse } from "next/server"
import { approveSignupRequest, findUserById, getLoginRequests, updateLoginRequestStatus } from "@/lib/auth"
import { verifyAuthSession } from "@/lib/auth-session"

async function authorizeAdmin(request: NextRequest) {
  const session = verifyAuthSession(request.cookies.get("ims_session")?.value)
  if (!session || session.role !== "admin") return false
  const user = await findUserById(session.userId)
  return user?.role === "admin"
}

export async function GET(request: NextRequest) {
  try {
    if (!(await authorizeAdmin(request))) {
      return NextResponse.json({ success: false, error: "Administrator login is required." }, { status: 401 })
    }
    const requests = await getLoginRequests()
    return NextResponse.json(requests)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to load login requests",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await authorizeAdmin(request))) {
      return NextResponse.json({ success: false, error: "Administrator login is required." }, { status: 401 })
    }
    const body = await request.json()
    const { id, action } = body

    if (!id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "id and action ('approve' or 'reject') are required" },
        { status: 400 },
      )
    }

    const updated =
      action === "approve"
        ? await approveSignupRequest(id)
        : await updateLoginRequestStatus(id, "rejected")

    if (!updated) {
      return NextResponse.json({ success: false, error: "Login request not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, request: updated })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to update login request",
      },
      { status: 500 },
    )
  }
}
