"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"
import { syncDataAcrossDevices, exportAllData, importAllData, getCurrentDate, getCurrentDateTime } from "@/lib/utils"

interface DataSyncManagerProps {
  onDataSync: (syncedData: any) => void
}

export function DataSyncManager({ onDataSync }: DataSyncManagerProps) {
  const { toast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<string>("")
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")

  useEffect(() => {
    // Get device info
    const deviceId = localStorage.getItem("device_id") || "Unknown"
    const userAgent = navigator.userAgent
    let deviceType = "Desktop"

    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      if (/iPad/.test(userAgent)) {
        deviceType = "Tablet"
      } else {
        deviceType = "Mobile"
      }
    }

    setDeviceInfo(`${deviceType} (${deviceId.slice(0, 8)})`)

    // Check last sync time
    const lastSync = localStorage.getItem("last_sync_time")
    if (lastSync) {
      setLastSyncTime(lastSync)
    }
  }, [])

  const handleSyncData = async () => {
    setIsSyncing(true)
    setSyncStatus("syncing")

    try {
      const dataKeys = ["ims_products", "ims_invoices", "ims_users", "ims_guest_users", "ims_deals", "ims_vendors"]

      const syncedData = syncDataAcrossDevices(dataKeys)

      // Update parent component with synced data
      onDataSync(syncedData)

      const currentTime = getCurrentDateTime()
      setLastSyncTime(currentTime)
      localStorage.setItem("last_sync_time", currentTime)
      setSyncStatus("success")

      toast({
        title: "Data Synchronized Successfully",
        description: "Your data has been synced across all devices.",
      })

      // Reset status after 3 seconds
      setTimeout(() => setSyncStatus("idle"), 3000)
    } catch (error) {
      console.error("Sync error:", error)
      setSyncStatus("error")
      toast({
        title: "Sync Failed",
        description: "There was an error syncing your data. Please try again.",
        variant: "destructive",
      })

      // Reset status after 3 seconds
      setTimeout(() => setSyncStatus("idle"), 3000)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleExportData = () => {
    try {
      const exportedData = exportAllData()
      const blob = new Blob([exportedData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `glow-with-vibes-backup-${getCurrentDate()}.json`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)

      toast({
        title: "Data Exported Successfully",
        description: "Your backup file has been downloaded.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      })
    }
  }

  const handleImportData = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const jsonData = e.target?.result as string
            const success = importAllData(jsonData)

            if (success) {
              toast({
                title: "Data Imported Successfully",
                description: "Your data has been restored. Please refresh the page.",
              })

              // Trigger a page reload after 2 seconds to load the imported data
              setTimeout(() => {
                window.location.reload()
              }, 2000)
            } else {
              throw new Error("Import failed")
            }
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "The backup file is invalid or corrupted.",
              variant: "destructive",
            })
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const getDeviceIcon = () => {
    if (deviceInfo.includes("Mobile")) return <Smartphone className="h-4 w-4" />
    if (deviceInfo.includes("Tablet")) return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Cloud className="h-4 w-4" />
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Data Synchronization & Backup
        </CardTitle>
        <CardDescription>Sync your data across devices and create backups to prevent data loss</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Info */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {getDeviceIcon()}
            <span className="font-medium">Current Device:</span>
            <Badge variant="outline">{deviceInfo}</Badge>
          </div>
          {lastSyncTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last sync: {lastSyncTime}
            </div>
          )}
        </div>

        <Separator />

        {/* Sync Controls */}
        <div className="space-y-4">
          <h4 className="font-medium">Cloud Synchronization</h4>
          <p className="text-sm text-muted-foreground">
            Sync your data across all devices. This ensures you have the latest data regardless of which device you use.
          </p>

          <Button
            onClick={handleSyncData}
            disabled={isSyncing}
            className="w-full"
            variant={syncStatus === "success" ? "default" : "outline"}
          >
            {getSyncStatusIcon()}
            {isSyncing ? "Syncing..." : "Sync Data Across Devices"}
          </Button>
        </div>

        <Separator />

        {/* Backup Controls */}
        <div className="space-y-4">
          <h4 className="font-medium">Data Backup & Restore</h4>
          <p className="text-sm text-muted-foreground">
            Create manual backups of your data or restore from a previous backup file.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={handleExportData} variant="outline" className="w-full bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export Backup
            </Button>

            <Button onClick={handleImportData} variant="outline" className="w-full bg-transparent">
              <Upload className="h-4 w-4 mr-2" />
              Import Backup
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {syncStatus === "success" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Data synchronized successfully!</span>
            </div>
          </div>
        )}

        {syncStatus === "error" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Sync failed. Please try again.</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">How it works:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • <strong>Sync:</strong> Automatically merges data from all your devices
            </li>
            <li>
              • <strong>Export:</strong> Downloads a backup file to your device
            </li>
            <li>
              • <strong>Import:</strong> Restores data from a backup file
            </li>
            <li>
              • <strong>Auto-sync:</strong> Happens automatically when you login
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
