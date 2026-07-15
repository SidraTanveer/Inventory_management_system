"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User, AuthContextType, UserRole, LoginRequest } from "@/types/auth"
import { useToast } from "@/hooks/use-toast"

type RegisteredUser = {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
}

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
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([])
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

  // Simulate admin password for demonstration purposes (no database)
  const [adminSimulatedPassword, setAdminSimulatedPassword] = useState("password")

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    // Load simulated password if stored (for persistence across sessions)
    const storedAdminPass = localStorage.getItem("adminSimulatedPassword")
    if (storedAdminPass) {
      setAdminSimulatedPassword(storedAdminPass)
    }

    const storedLoginRequests = localStorage.getItem("ims_login_requests")
    if (storedLoginRequests) {
      try {
        setLoginRequests(JSON.parse(storedLoginRequests))
      } catch {
        setLoginRequests([])
      }
    }

    fetchLoginRequestsFromServer()
  }, [])

  const persistRegisteredUsers = (users: RegisteredUser[]) => {
    setRegisteredUsers(users)
    localStorage.setItem("ims_registered_users", JSON.stringify(users))
  }

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
        body: JSON.stringify({ type: "login", email, password, name: guestName, message: "Login attempt from web client" }),
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
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (userId === "user-1" && user?.role === "admin") {
      if (currentPassword !== adminSimulatedPassword) {
        toast({
          title: "Password Change Failed",
          description: "Current password is incorrect.",
          variant: "destructive",
        })
        return false
      }
      if (newPassword === currentPassword) {
        toast({
          title: "Password Change Failed",
          description: "New password cannot be the same as the current password.",
          variant: "destructive",
        })
        return false
      }

      // Simulate password update
      setAdminSimulatedPassword(newPassword)
      localStorage.setItem("adminSimulatedPassword", newPassword) // Persist simulated password
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      })
      return true
    } else {
      toast({
        title: "Password Change Failed",
        description: "You do not have permission to change this password.",
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
