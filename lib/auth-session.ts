import { createHmac, timingSafeEqual } from "crypto"
import type { UserRole } from "@/types/auth"

const sessionCookieName = "ims_session"
const sessionDurationSeconds = 60 * 60 * 12

export interface AuthSession {
  userId: string
  role: UserRole
  expiresAt: number
}

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.")
  }
  return secret
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url")
}

export function createAuthSession(userId: string, role: UserRole) {
  const session: AuthSession = {
    userId,
    role,
    expiresAt: Math.floor(Date.now() / 1000) + sessionDurationSeconds,
  }
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function verifyAuthSession(token?: string): AuthSession | null {
  if (!token) return null
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return null

  const expectedSignature = Buffer.from(sign(payload))
  const receivedSignature = Buffer.from(signature)
  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return null
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthSession
    if (
      typeof session.userId !== "string" ||
      !["admin", "sales", "guest"].includes(session.role) ||
      !Number.isInteger(session.expiresAt) ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null
    }
    return session
  } catch {
    return null
  }
}

export function setAuthSessionCookie(response: Response, token: string) {
  const secure = process.env.NODE_ENV === "production"
  response.headers.append(
    "Set-Cookie",
    `${sessionCookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDurationSeconds}${secure ? "; Secure" : ""}`,
  )
}

export function clearAuthSessionCookie(response: Response) {
  const secure = process.env.NODE_ENV === "production"
  response.headers.append(
    "Set-Cookie",
    `${sessionCookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? "; Secure" : ""}`,
  )
}

export { sessionCookieName, sessionDurationSeconds }
