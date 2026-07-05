"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, loginRequests } = useAuth()

  useEffect(() => {
    if (!email) {
      setStatusMessage("")
      return
    }

    const request = loginRequests.find((request) => request.email.toLowerCase() === email.toLowerCase())
    if (request) {
      if (request.status === "pending") {
        setStatusMessage("Your login request is pending admin approval.")
      } else if (request.status === "approved") {
        setStatusMessage("Your login request has been approved by the admin. Please try logging in again.")
      } else if (request.status === "rejected") {
        setStatusMessage("Your login request was rejected. Please contact the administrator.")
      }
    } else {
      setStatusMessage("")
    }
  }, [email, loginRequests])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    const success = await login(email, password)
    setLoading(false)
    if (success) {
      router.push("/")
    } else {
      setError("Invalid email or password. Your request has been sent to the admin for review.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_22%),linear-gradient(180deg,#f8fafc,#eef2ff)] p-4">
      <Card className="w-full max-w-md border border-white/70 bg-white/90 shadow-2xl shadow-indigo-200/30 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/95">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold" style={{ color: "var(--imperial-purple)" }}>
            Glow With Vibes
          </CardTitle>
          <CardDescription>Beauty, cosmetic & personal care inventory management</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {statusMessage && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {statusMessage}
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} style={{ backgroundColor: "var(--imperial-purple)" }}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <Link href="/signup" className="block text-center text-sm text-purple-700 hover:text-purple-900">
              Don't have an account? Sign up
            </Link>
            <Link href="/forgot-password" className="block text-center text-sm text-slate-600 hover:text-slate-900">
              Forgot Password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
