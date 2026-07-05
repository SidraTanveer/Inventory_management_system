"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Package, TrendingUp, Users } from "lucide-react"

interface LandingPageProps {
  onEnterApp: () => void
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.18),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_20%),linear-gradient(180deg,#f8f4ff,#eef2ff)] flex items-center">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-12 w-12 text-purple-600 mr-3" />
            <h1
              className="text-6xl font-bold cursor-pointer hover:scale-105 transition-transform"
              style={{ color: "var(--imperial-purple)" }}
              onClick={onEnterApp}
            >
              Glow With Vibes
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Beauty, cosmetic & personal care. Wholesale Seller Beauty Products. Delivery all over Pakistan. Fast
            Customer Response, COD and easy returns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-3 shadow-lg shadow-fuchsia-500/10"
              style={{ backgroundColor: "var(--imperial-purple)" }}
              onClick={onEnterApp}
            >
              Enter Application
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3 bg-white/90 text-slate-800 shadow-sm shadow-slate-200/70 hover:bg-white"
              onClick={onEnterApp}
            >
              Learn More
            </Button>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3" asChild>
              <a href="/signup">Sign Up</a>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Package className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
              <p className="text-gray-600">Complete product tracking, stock management, and vendor relationships</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sales Analytics</h3>
              <p className="text-gray-600">Detailed reports, profit analysis, and business insights</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">User Management</h3>
              <p className="text-gray-600">Role-based access control and team collaboration</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-4">
            "Own your beauty. Confidence is the best makeup. Your beauty, your rules."
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <span>Instagram: @glow_with_vibes</span>
            <span>WhatsApp: +92 311 0263606</span>
          </div>
        </div>
      </div>
    </div>
  )
}
