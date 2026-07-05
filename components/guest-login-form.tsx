"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import type { User } from "@/types/auth"

interface GuestLoginFormProps {
  onLoginSuccess: () => void
  onBackToMainLogin: () => void
  guestUsers: User[]
}

export function GuestLoginForm({ onLoginSuccess, onBackToMainLogin, guestUsers }: GuestLoginFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Check if the guest user exists in the allowed guest users list
    const guestUser = guestUsers.find(
      (guest) =>
        guest.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        guest.email.toLowerCase().trim() === email.toLowerCase().trim(),
    )

    if (!guestUser) {
      setError("Access denied. Please contact the administrator to get guest access.")
      setLoading(false)
      return
    }

    // Use the guest login with the actual guest user details
    const success = await login("guest", "guest", guestUser.name, guestUser.email)
    setLoading(false)

    if (success) {
      onLoginSuccess()
    } else {
      setError("Login failed. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_22%),linear-gradient(180deg,#f8fafc,#eef2ff)] p-4">
      <Card className="w-full max-w-md border border-white/70 bg-white/90 shadow-2xl shadow-indigo-200/30 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/95">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold" style={{ color: "var(--imperial-purple)" }}>
            Guest Access
          </CardTitle>
          <CardDescription>Enter your authorized guest credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: "var(--imperial-purple)" }}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Access as Guest"}
            </Button>
          </form>

          <div className="mt-4">
            <Button variant="link" className="w-full" onClick={onBackToMainLogin}>
              Back to Main Login
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="mb-2">Need guest access?</p>
            <p>Contact the administrator to get your name and email added to the guest list.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
