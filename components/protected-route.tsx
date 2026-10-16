"use client"

import { useAuth } from "@/hooks/useAuth"
import { LoginForm } from "./login-form"
import type { User } from "@/types/auth"
import type React from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: keyof User["permissions"]
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user } = useAuth()

  if (!user) {
    return <LoginForm onLoginSuccess={() => {}} onForgotPassword={() => {}} onGuestLogin={() => {}} />
  }

  if (requiredPermission && !user.permissions[requiredPermission]) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
