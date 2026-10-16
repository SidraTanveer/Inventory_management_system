"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User, AuthContextType, UserRole, LoginRequest } from "@/types/auth"
import { useToast } from "@/hooks/use-toast"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loginRequests, setLoginRequests] = useState<LoginRequest[]>([])
  const { toast } = useToast()

  const fetchLoginRequestsFromServer = async () => {
    try {
      const response = await fetch("/api/login-requests")
      if (!response.ok) {
        return
      }
      const result = await response.json()
      if (Array.isArray(result)) {
        persistLoginRequests(result)
      }
    } catch (error) {
      console.warn("Unable to fetch login requests from server:", error)
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    const storedLoginRequests = localStorage.getItem("ims_login_requests")
    if (storedLoginRequests) {
      try {
        setLoginRequests(JSON.parse(storedLoginRequests))
      } catch {
        setLoginRequests([])
      }
    }

  }, [])

  useEffect(() => {
    if (user?.role === "admin") {
      fetchLoginRequestsFromServer()
    }
  }, [user])

  const persistLoginRequests = (requests: LoginRequest[]) => {
    setLoginRequests(requests)
    localStorage.setItem("ims_login_requests", JSON.stringify(requests))
  }

  const login = async (email: string, password: string, guestName?: string, guestEmail?: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: email === "guest" ? "guest-login" : "login",
          email,
          password,
          name: guestName,
          guestEmail,
          message: "Login attempt from web client",
        }),
      })
      const result = await response.json()

      if (result.success && result.user) {
        const authenticatedUser: User = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          permissions: result.user.permissions,
          createdAt: result.user.createdAt,
        }
        setUser(authenticatedUser)
        localStorage.setItem("currentUser", JSON.stringify(authenticatedUser))
        toast({
          title: "Login Successful",
          description: `Welcome back, ${authenticatedUser.name}!`,
        })
        return true
      }

      if (!result.success && result.request) {
        setLoginRequests((prev) => {
          const withoutDuplicate = prev.filter((request) => request.id !== result.request.id)
          return [result.request, ...withoutDuplicate]
        })
      }

      toast({
        title: "Login Failed",
        description: result.error || "Invalid email or password.",
        variant: "destructive",
      })
      return false
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Server error while logging in.",
        variant: "destructive",
      })
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "logout" }),
    }).catch((error) => console.error("Unable to end server session:", error))
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
  }

  const register = async (email: string, password: string, name: string, role: User["role"]): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "register", email, password, name, role }),
      })
      const result = await response.json()

      if (result.success && (result.request || result.message)) {
        if (result.request) {
          setLoginRequests((prev) => {
            const withoutDuplicate = prev.filter((request) => request.id !== result.request.id)
            return [result.request, ...withoutDuplicate]
          })
        }
        toast({
          title: "Request Submitted",
          description: result.message || `Signup request for ${name} has been sent to admin for approval.`,
        })
        return true
      }

      toast({
        title: "Registration Failed",
        description: result.error || "Unable to create account.",
        variant: "destructive",
      })
      return false
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Server error while registering.",
        variant: "destructive",
      })
      return false
    }
  }

  const addLoginRequest = (email: string, name: string, message?: string) => {
    const newRequest: LoginRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      email,
      name,
      attemptedAt: new Date().toISOString(),
      status: "pending",
      message,
    }
    persistLoginRequests([newRequest, ...loginRequests])
  }

  const approveLoginRequest = async (requestId: string) => {
    try {
      const response = await fetch("/api/login-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId, action: "approve" }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to approve request")
      }

      await fetchLoginRequestsFromServer()
      toast({
        title: "Request Approved",
        description: "The request has been approved and account access is now enabled.",
      })
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Unable to approve request.",
        variant: "destructive",
      })
    }
  }

  const rejectLoginRequest = async (requestId: string) => {
    try {
      const response = await fetch("/api/login-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId, action: "reject" }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to reject request")
      }

      await fetchLoginRequestsFromServer()
      toast({
        title: "Request Rejected",
        description: "The request has been rejected.",
        variant: "destructive",
      })
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "Unable to reject request.",
        variant: "destructive",
      })
    }
  }

  const forgotPassword = async (email: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    toast({
      title: "Password Reset",
      description: `Password reset link sent to ${email}.`,
    })
    return true
  }

  const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "change-password", userId, currentPassword, newPassword }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to change password.")
      }
      toast({
        title: "Password Changed",
        description: "Your password has been updated in the database.",
      })
      return true
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: error instanceof Error ? error.message : "Unable to update your password.",
        variant: "destructive",
      })
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        forgotPassword,
        changePassword,
        loginRequests,
        addLoginRequest,
        approveLoginRequest,
        rejectLoginRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
