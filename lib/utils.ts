import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencyCode = "USD"): string {
  let locale = "en-US"
  if (currencyCode === "PKR") {
    locale = "en-PK" // Use Pakistani English locale for 'Rs.' symbol
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function getCurrentDateTime(): string {
  const now = new Date()
  return now.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}

export function getInitialCurrency(): string {
  // In a real application, this might come from user settings,
  // environment variables, or a more sophisticated detection.
  // For now, we'll default to PKR.
  return "PKR"
}

export function generateId(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0]
}

// New helper function to calculate days since a given date
export function getDaysSince(dateString: string): number {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Helper to check if localStorage is available (browser environment)
function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
  } catch {
    return false
  }
}

// Add these two new internal helper functions at the top of the file, before `saveToLocalStorage`.
// They will load the raw stored object with metadata.
function _loadRawStoredData(key: string): { data: any; lastUpdated: string; version: string; deviceId: string } | null {
  if (!isLocalStorageAvailable()) return null
  
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Ensure it's the full object with metadata
      if (parsed && typeof parsed === "object" && "data" in parsed && "lastUpdated" in parsed) {
        return parsed
      }
      // If it's an old format (just data), wrap it with minimal metadata for compatibility
      // This ensures syncDataAcrossDevices always gets an object with lastUpdated
      return { data: parsed, lastUpdated: "1970-01-01T00:00:00.000Z", version: "legacy", deviceId: "unknown" }
    }
    return null
  } catch (error) {
    console.error(`Error loading raw data for key ${key}:`, error)
    return null
  }
}

function _loadRawCloudBackupData(
  key: string,
): { data: any; lastUpdated: string; version: string; deviceId: string } | null {
  if (!isLocalStorageAvailable()) return null
  
  try {
    const cloudKey = `cloud_backup_${key}`
    const stored = localStorage.getItem(cloudKey)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed === "object" && "data" in parsed && "lastUpdated" in parsed) {
        return parsed
      }
      return { data: parsed, lastUpdated: "1970-01-01T00:00:00.000Z", version: "legacy", deviceId: "unknown" }
    }
    return null
  } catch (error) {
    console.error(`Error loading raw cloud backup for key ${key}:`, error)
    return null
  }
}

// Enhanced data persistence with cloud sync simulation
export function saveToLocalStorage(key: string, data: any): void {
  if (!isLocalStorageAvailable()) return
  
  try {
    const dataWithTimestamp = {
      data,
      lastUpdated: getCurrentDateTime(),
      version: "1.0.0",
      deviceId: getDeviceId(),
    }
    localStorage.setItem(key, JSON.stringify(dataWithTimestamp))

    // Also save to cloud simulation (using a different key for cloud backup)
    saveToCloudBackup(key, dataWithTimestamp)
  } catch (error) {
    console.error(`Error saving to localStorage for key ${key}:`, error)
  }
}

// Modify the existing loadFromLocalStorage function to use the new internal helper.
// This function will continue to return just the data part for components.
// Replace the existing `export function loadFromLocalStorage(key: string): any { ... }` with:
export function loadFromLocalStorage(key: string): any {
  const rawData = _loadRawStoredData(key)
  return rawData ? rawData.data : null
}

// Modify the existing loadFromCloudBackup function to use the new internal helper.
// Replace the existing `export function loadFromCloudBackup(key: string): any { ... }` with:
export function loadFromCloudBackup(key: string): any {
  const rawData = _loadRawCloudBackupData(key)
  return rawData ? rawData.data : null
}

// Cloud backup simulation using localStorage with different keys
function saveToCloudBackup(key: string, data: any): void {
  if (!isLocalStorageAvailable()) return
  
  try {
    const cloudKey = `cloud_backup_${key}`
    localStorage.setItem(cloudKey, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving to cloud backup for key ${key}:`, error)
  }
}

// Modify the syncDataAcrossDevices function to use the new internal helpers for comparison.
// Replace the existing `export function syncDataAcrossDevices(keys: string[]): { [key: string]: any } { ... }` with:
export function syncDataAcrossDevices(keys: string[]): { [key: string]: any } {
  const syncedData: { [key: string]: any } = {}
  const currentDeviceId = getDeviceId()
  const currentTime = getCurrentDateTime()

  keys.forEach((key) => {
    const localStored = _loadRawStoredData(key) // Get full object with metadata
    const cloudStored = _loadRawCloudBackupData(key) // Get full object with metadata

    let dataToPersist = null
    let lastUpdatedTimestamp = 0

    const localTimestamp = localStored ? new Date(localStored.lastUpdated).getTime() : 0
    const cloudTimestamp = cloudStored ? new Date(cloudStored.lastUpdated).getTime() : 0

    if (localStored && cloudStored) {
      if (cloudTimestamp > localTimestamp) {
        dataToPersist = cloudStored.data
        lastUpdatedTimestamp = cloudTimestamp
      } else {
        dataToPersist = localStored.data
        lastUpdatedTimestamp = localTimestamp
      }
    } else if (localStored) {
      dataToPersist = localStored.data
      lastUpdatedTimestamp = localTimestamp
    } else if (cloudStored) {
      dataToPersist = cloudStored.data
      lastUpdatedTimestamp = cloudTimestamp
    }

    // If data exists (either local or cloud), save the most recent version to both local and cloud
    // with the current timestamp to mark it as the latest sync point.
    if (dataToPersist !== null) {
      const dataWithCurrentTimestamp = {
        data: dataToPersist,
        lastUpdated: currentTime, // Update to current time for the new sync point
        version: "1.0.0",
        deviceId: currentDeviceId,
      }
      localStorage.setItem(key, JSON.stringify(dataWithCurrentTimestamp))
      localStorage.setItem(`cloud_backup_${key}`, JSON.stringify(dataWithCurrentTimestamp))
      syncedData[key] = dataToPersist // Return just the data part to the component
    } else {
      // If no data was found for this key anywhere, initialize with empty array/object if needed
      // For this project, initial data is handled by useState, so this branch might not be hit often
      // unless a key is completely new and not in initial mocks.
      syncedData[key] = null // Or [] or {} depending on expected type
    }
  })

  return syncedData
}

// Device identification for sync purposes
function getDeviceId(): string {
  if (!isLocalStorageAvailable()) return "unknown-device"
  
  try {
    let deviceId = localStorage.getItem("device_id")
    if (!deviceId) {
      deviceId = generateId()
      localStorage.setItem("device_id", deviceId)
    }
    return deviceId
  } catch {
    return "unknown-device"
  }
}

// Export all data for backup
export function exportAllData(): string {
  const allData = {
    products: loadFromLocalStorage("ims_products"),
    invoices: loadFromLocalStorage("ims_invoices"),
    users: loadFromLocalStorage("ims_users"),
    guestUsers: loadFromLocalStorage("ims_guest_users"),
    deals: loadFromLocalStorage("ims_deals"),
    vendors: loadFromLocalStorage("ims_vendors"),
    customers: loadFromLocalStorage("ims_customers"), // Include customers
    trashItems: loadFromLocalStorage("ims_trash"), // Include trash items
    settings: {
      currency: "PKR", // Assuming default currency is PKR
      exportDate: getCurrentDateTime(),
      deviceId: getDeviceId(),
    },
  }

  return JSON.stringify(allData, null, 2)
}

// Import data from backup
export function importAllData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData)

    if (data.products) saveToLocalStorage("ims_products", data.products)
    if (data.invoices) saveToLocalStorage("ims_invoices", data.invoices)
    if (data.users) saveToLocalStorage("ims_users", data.users)
    if (data.guestUsers) saveToLocalStorage("ims_guest_users", data.guestUsers)
    if (data.deals) saveToLocalStorage("ims_deals", data.deals)
    if (data.vendors) saveToLocalStorage("ims_vendors", data.vendors)
    if (data.customers) saveToLocalStorage("ims_customers", data.customers) // Import customers
    if (data.trashItems) saveToLocalStorage("ims_trash", data.trashItems) // Import trash items

    return true
  } catch (error) {
    console.error("Error importing data:", error)
    return false
  }
}

// Export data to Excel with enhanced features
export async function exportToExcel(data: {
  products: any[]
  invoices: any[]
  users: any[]
  guestUsers: any[]
  deals: any[]
  vendors: any[]
  customers: any[] // Include customers in export
  dashboardStats: any
  settings: any
  trashItems: any[] // Include trash items in export
}): Promise<void> {
  try {
    const xlsxModule = await import("xlsx")
    const XLSX = (xlsxModule as any).default ?? xlsxModule

    const workbook = XLSX.utils.book_new()

    // Dashboard Summary Sheet
    const dashboardData = [
      ["Metric", "Value", "Last Updated", "Device ID"],
      ["Total Products", data.products.length, getCurrentDate(), getDeviceId()],
      ["Total Invoices", data.invoices.length, getCurrentDate(), getDeviceId()],
      ["Total Users", data.users.length, getCurrentDate(), getDeviceId()],
      ["Total Guests", data.guestUsers.length, getCurrentDate(), getDeviceId()],
      ["Total Deals", data.deals.length, getCurrentDate(), getDeviceId()],
      ["Total Vendors", data.vendors.length, getCurrentDate(), getDeviceId()],
      ["Total Customers", data.customers.length, getCurrentDate(), getDeviceId()], // New: Customers count
      ["Total Trash Items", data.trashItems.length, getCurrentDate(), getDeviceId()], // New: Trash items count
      ["Export Date", getCurrentDate(), getCurrentDateTime(), getDeviceId()],
    ]
    const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData)
    XLSX.utils.book_append_sheet(workbook, dashboardSheet, "Dashboard")

    // Products Sheet with enhanced data
    if (data.products.length > 0) {
      const productsData = data.products.map((product) => ({
        "Product ID": product.id,
        Name: product.name,
        Description: product.description,
        SKU: product.sku,
        Category: product.category,
        "Unit Price": product.unitPrice,
        "Cost Price": product.costPrice,
        Stock: product.stock,
        "Vendor ID": product.vendorId,
        "Profit per Unit": product.unitPrice - product.costPrice,
        "Profit Margin %":
          product.unitPrice > 0
            ? (((product.unitPrice - product.costPrice) / product.unitPrice) * 100).toFixed(2)
            : "0",
        "Last Updated": getCurrentDate(),
        "Device ID": getDeviceId(),
      }))
      const productsSheet = XLSX.utils.json_to_sheet(productsData)
      XLSX.utils.book_append_sheet(workbook, productsSheet, "Products")
    }

    // Enhanced Invoices Sheet
    if (data.invoices.length > 0) {
      const invoicesData = data.invoices.map((invoice) => ({
        "Invoice ID": invoice.id,
        "Customer Name": invoice.customerName,
        "Customer Email": invoice.customerEmail,
        "Customer Phone": invoice.customerPhone,
        "Total Amount": invoice.totalAmount,
        "Total Cost": invoice.totalCost,
        "Total Profit": invoice.totalProfit,
        "Profit Percentage": invoice.profitPercentage,
        Currency: invoice.currency,
        "Created Date": invoice.createdAt,
        Status: invoice.status, // New: Invoice Status
        "Items Count": invoice.items.length,
        "Last Updated": getCurrentDate(),
        "Device ID": getDeviceId(),
      }))
      const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData)
      XLSX.utils.book_append_sheet(workbook, invoicesSheet, "Invoices")
    }

    // New: Customers Sheet
    if (data.customers.length > 0) {
      const customersData = data.customers.map((customer) => ({
        "Customer ID": customer.id,
        Name: customer.name,
        Email: customer.email,
        Phone: customer.phone,
        Type: customer.type,
        "Created At": customer.createdAt,
        "Last Updated": getCurrentDate(),
        "Device ID": getDeviceId(),
      }))
      const customersSheet = XLSX.utils.json_to_sheet(customersData)
      XLSX.utils.book_append_sheet(workbook, customersSheet, "Customers")
    }

    // New: Trash Items Sheet
    if (data.trashItems.length > 0) {
      const trashData = data.trashItems.map((item) => ({
        "Trash ID": item.id,
        "Original ID": item.originalId,
        "Item Type": item.type,
        "Item Name": item.data.name || item.data.id, // Use name if available, else ID
        "Deleted At": item.deletedAt,
        "Last Updated": getCurrentDate(),
        "Device ID": getDeviceId(),
      }))
      const trashSheet = XLSX.utils.json_to_sheet(trashData)
      XLSX.utils.book_append_sheet(workbook, trashSheet, "Trash")
    }

    // Generate filename with device info
    const filename = `Glow_With_Vibes_Complete_Data_${getCurrentDate().replace(/-/g, "_")}_${getDeviceId().slice(0, 8)}.xlsx`

    const wbout = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    })

    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error exporting to Excel:", error)
    throw new Error("Failed to export data to Excel")
  }
}
