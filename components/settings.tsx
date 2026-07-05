"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { ChangePasswordForm } from "@/components/change-password-form"
import { DataSyncManager } from "@/components/data-sync-manager"
import { SettingsIcon, Palette, Shield, Database } from "lucide-react"
import { getCurrentDateTime } from "@/lib/utils" // Import getCurrentDateTime

interface SettingsProps {
  onCurrencyChange: (currency: string) => void
  onDataSync?: (syncedData: any) => void
}

export function Settings({ onCurrencyChange, onDataSync }: SettingsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedCurrency, setSelectedCurrency] = useState("PKR")

  const currencies = [
    { value: "PKR", label: "Pakistani Rupee (PKR)" },
    { value: "USD", label: "US Dollar (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "GBP", label: "British Pound (GBP)" },
    { value: "AED", label: "UAE Dirham (AED)" },
    { value: "SAR", label: "Saudi Riyal (SAR)" },
  ]

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency)
    onCurrencyChange(currency)
    localStorage.setItem("selectedCurrency", currency)
    toast({
      title: "Currency Updated",
      description: `Currency has been changed to ${currency}`,
    })
  }

  const handleDataSyncComplete = (syncedData: any) => {
    if (onDataSync) {
      onDataSync(syncedData)
    }
    toast({
      title: "Data Synchronized",
      description: "Your data has been synced across all devices successfully.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Display Preferences
          </CardTitle>
          <CardDescription>Customize how data is displayed in the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Synchronization */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Data Management</h2>
        </div>
        <DataSyncManager onDataSync={handleDataSyncComplete} />
      </div>

      <Separator />

      {/* Security Settings - Only for Admin */}
      {user?.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Manage your account security and password</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}

      {/* Application Info */}
      <Card>
        <CardHeader>
          <CardTitle>Application Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version:</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>{getCurrentDateTime()}</span> {/* Changed to display current date and time */}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Developer:</span>
            <span>Glow With Vibes Team</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current User:</span>
            <span>
              {user?.name} ({user?.role})
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
