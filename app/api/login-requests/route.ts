import { NextResponse } from "next/server"
import { approveSignupRequest, getLoginRequests, updateLoginRequestStatus } from "@/lib/auth"

export async function GET() {
  try {
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

export async function PATCH(request: Request) {
  try {
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
