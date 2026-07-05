"use client"

import { useAuth } from "@/hooks/useAuth"
import type { User } from "@/types/auth"

export function useGuestLogin() {
  const { login } = useAuth()

  const handleGuestLogin = async (guestUser: User) => {
    // Use the actual guest credentials but authenticate as the specific guest
    await login("viewer@example.com", "password")
  }

  return handleGuestLogin
}
