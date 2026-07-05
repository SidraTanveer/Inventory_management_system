export type UserRole = "admin" | "sales" | "guest"

export interface UserPermissions {
  dashboard: boolean
  products: boolean
  invoices: boolean
  reports: boolean
  settings: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  permissions: UserPermissions
  createdAt: string
}

export interface LoginRequest {
  id: string
  name: string
  email: string
  attemptedAt: string
  status: "pending" | "approved" | "rejected"
  message?: string
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string, guestName?: string, guestEmail?: string) => Promise<boolean>
  logout: () => void
  register: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean> // Added changePassword
  loginRequests: LoginRequest[]
  addLoginRequest: (email: string, name: string, message?: string) => void
  approveLoginRequest: (requestId: string) => void
  rejectLoginRequest: (requestId: string) => void
}
