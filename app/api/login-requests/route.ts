import { NextResponse } from "next/server"
import { getLoginRequests } from "@/lib/auth"

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
