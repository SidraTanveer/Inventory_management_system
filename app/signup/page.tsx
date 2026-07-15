"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"sales" | "admin">("sales")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { register } = useAuth()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    const success = await register(email, password, name, role)
    setLoading(false)
    if (success) {
      setSuccessMessage(`Signup request for ${name} has been submitted. You can login after admin approval.`)
      setShowSuccessPopup(true)
    } else {
      setError("Registration failed. Please try again with a different email.")
    }
  }

  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false)
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_22%),linear-gradient(180deg,#f8fafc,#eef2ff)] p-4">
      <Dialog open={showSuccessPopup} onOpenChange={setShowSuccessPopup}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-700">Request Submitted</DialogTitle>
            <DialogDescription className="text-slate-600">{successMessage}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSuccessPopupClose} className="bg-green-600 hover:bg-green-700 text-white">
              Continue to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Card className="w-full max-w-md border border-white/70 bg-white/90 shadow-2xl shadow-indigo-200/30 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/95">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold" style={{ color: "var(--imperial-purple)" }}>
            Create Account
          </CardTitle>
          <CardDescription>Register for Glow With Vibes management system</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
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
                placeholder="Create a password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "sales" | "admin")}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >
                <option value="sales">Sales</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading} style={{ backgroundColor: "var(--imperial-purple)" }}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600">
            Already have an account? <Link href="/login" className="text-purple-700 hover:text-purple-900">Login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
