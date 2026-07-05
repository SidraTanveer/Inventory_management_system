"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import type { User } from "@/types/auth"

interface LoginFormProps {
  onLoginSuccess: () => void
  onForgotPassword: () => void
  onGuestLogin: () => void
  guestUsers: User[]
}

export function LoginForm({ onLoginSuccess, onForgotPassword, onGuestLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const success = await login(email, password)
    setLoading(false)
    if (success) {
      onLoginSuccess()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_22%),linear-gradient(180deg,#f8fafc,#eef2ff)] p-4">
      <Card className="w-full max-w-md border border-white/70 bg-white/90 shadow-2xl shadow-indigo-200/30 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/95">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
          <CardDescription>Access your inventory dashboard</CardDescription>
        </CardHeader>
        <CardContent>
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
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: "var(--imperial-purple)" }}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={onGuestLogin}
              disabled={loading}
            >
              Continue as Guest
            </Button>

            <Button variant="link" className="w-full" onClick={onForgotPassword}>
              Forgot Password?
            </Button>

            <div className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-purple-700 hover:text-purple-900 font-medium">
                Sign Up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
