"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)
    const success = await forgotPassword(email)
    setLoading(false)
    if (success) {
      setMessage("Password reset link sent. Check your email.")
    } else {
      setError("Unable to send reset link. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_22%),linear-gradient(180deg,#f8fafc,#eef2ff)] p-4">
      <Card className="w-full max-w-md border border-white/70 bg-white/90 shadow-2xl shadow-indigo-200/30 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/95">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold" style={{ color: "var(--imperial-purple)" }}>
            Forgot Password
          </CardTitle>
          <CardDescription>Enter your registered email to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} style={{ backgroundColor: "var(--imperial-purple)" }}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-600">
            <Link href="/login" className="text-purple-700 hover:text-purple-900">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
