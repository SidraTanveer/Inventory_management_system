"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Package,
  FileText,
  BarChart,
  SettingsIcon,
  Users,
  UserPlus,
  Building2,
  DollarSign,
  Gift,
  Trash2,
  UserRound,
  Calendar,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserManagement } from "@/components/user-management"
import { GuestManagement } from "@/components/guest-management"
import { MonthlyIncome } from "@/components/monthly-income"
import { VendorManagement } from "@/components/vendor-management"
import { Settings as AppSettings } from "@/components/settings"
import { DashboardOverview } from "@/components/dashboard-overview"
import { InvoiceManagement } from "@/components/invoice-management"
import { InvoiceCreateDialog } from "@/components/invoice-create-dialog"
import { AuthProvider, useAuth } from "@/hooks/useAuth"
import { LoginForm } from "@/components/login-form"
import { ForgotPassword } from "@/components/forgot-password"
import { InvoiceViewDialog } from "@/components/invoice-view-dialog"
import { InvoiceEditDialog } from "@/components/invoice-edit-dialog"
import { ProductDialogs } from "@/components/product-dialogs"
import { ProductSearch } from "@/components/product-search"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CustomerProfitDetails } from "@/components/customer-profit-details"
import { DealManagement } from "@/components/deal-management"
import { LandingPage } from "@/components/landing-page"
import { GuestLoginForm } from "@/components/guest-login-form"
import { TrashManagement } from "@/components/trash-management"
import { CustomerManagement } from "@/components/customer-management"
import { PostOfficeManagement } from "@/components/post-office-management"
import { DailyOrders } from "@/components/daily-orders"
import { GlobalSearch } from "@/components/global-search"
import { PDFUploadParser } from "@/components/pdf-upload-parser"
import { ThemeToggle } from "@/components/theme-toggle"
// import { v4 as generateId } from "uuid"

import type { User as AuthUser, LoginRequest } from "@/types/auth"
import type { Product, Invoice, Deal, TrashItem, Customer, PostOfficeRecord } from "@/types/app"

import {
  formatCurrency,
  getInitialCurrency,
  formatDate,
  saveToLocalStorage,
  loadFromLocalStorage,
  getCurrentDate,
  getCurrentDateTime,
  getDaysSince,
} from "@/lib/utils"
import { savePDFToDatabase } from "@/lib/pdf-utils"
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)

async function requestApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const payload: unknown = await response.json()
  const responseBody =
    typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : undefined

  if (!response.ok || responseBody?.success === false) {
    const message =
      typeof responseBody?.error === "string" ? responseBody.error : `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return payload as T
}

const toSafeNumber = (value: any, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim()
    if (!normalized) return fallback
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeProduct = (product: Product): Product => ({
  ...product,
  unitPrice: toSafeNumber(product.unitPrice),
  costPrice: toSafeNumber(product.costPrice),
  stock: toSafeNumber(product.stock),
  purchaseHistory: Array.isArray(product.purchaseHistory)
    ? product.purchaseHistory.map((purchase) => ({
        ...purchase,
        quantity: toSafeNumber(purchase.quantity),
        unitCost: toSafeNumber(purchase.unitCost),
        totalCost: toSafeNumber(purchase.totalCost),
      }))
    : [],
  salesHistory: Array.isArray(product.salesHistory)
    ? product.salesHistory.map((sale) => ({
        ...sale,
        quantity: toSafeNumber(sale.quantity),
        unitPrice: toSafeNumber(sale.unitPrice),
        totalPrice: toSafeNumber(sale.totalPrice),
        profit: toSafeNumber(sale.profit),
      }))
    : product.salesHistory,
})

const normalizeProducts = (items: Product[]) => items.map(normalizeProduct)

const mergeInvoicesById = (primary: Invoice[], secondary: Invoice[]) => {
  const merged = new Map<string, Invoice>()
  ;[...primary, ...secondary].forEach((invoice) => {
    if (invoice?.id && !merged.has(invoice.id)) merged.set(invoice.id, invoice)
  })
  return Array.from(merged.values())
}

const dedupeInvoices = (items: Invoice[]) => mergeInvoicesById(items, [])

const getProductKey = (product: Product) => product?.id || `${product?.sku || ""}-${product?.name || ""}`

const mergeProductsById = (primary: Product[], secondary: Product[]) => {
  const merged = new Map<string, Product>()
  ;[...primary, ...secondary].forEach((product) => {
    const key = getProductKey(product)
    if (key && !merged.has(key)) {
      merged.set(key, normalizeProduct(product))
    }
  })
  return Array.from(merged.values())
}

const getCustomerKey = (customer: Customer) => (customer?.email || "").trim().toLowerCase() || customer?.id

const mergeCustomers = (primary: Customer[], secondary: Customer[]) => {
  const merged = new Map<string, Customer>()
  ;[...primary, ...secondary].forEach((customer) => {
    const key = getCustomerKey(customer)
    if (key && !merged.has(key)) {
      merged.set(key, customer)
    }
  })
  return Array.from(merged.values())
}

const mergeVendors = (primary: Vendor[], secondary: Vendor[]) => {
  const merged = new Map<string, Vendor>()
  ;[...primary, ...secondary].forEach((vendor) => {
    const key = (vendor?.email || "").trim().toLowerCase() || vendor?.id
    if (key && !merged.has(key)) {
      merged.set(key, vendor)
    }
  })
  return Array.from(merged.values())
}

const mergeDeals = (primary: Deal[], secondary: Deal[]) => {
  const merged = new Map<string, Deal>()
  ;[...primary, ...secondary].forEach((deal) => {
    if (deal?.id && !merged.has(deal.id)) {
      merged.set(deal.id, deal)
    }
  })
  return Array.from(merged.values())
}

const getUserKey = (user: AuthUser) => (user?.email || "").trim().toLowerCase() || user?.id

const mergeUsers = (primary: AuthUser[], secondary: AuthUser[]) => {
  const merged = new Map<string, AuthUser>()
  ;[...primary, ...secondary].forEach((u) => {
    const key = getUserKey(u)
    if (key && !merged.has(key)) {
      merged.set(key, u)
    }
  })
  return Array.from(merged.values())
}

// Enhanced mock data with PKR prices
const initialMockProducts: Product[] = [
  {
    id: "prod-1",
    name: 'MacBook Pro 16"',
    description: "High performance laptop with M2 Pro chip for professional use",
    unitPrice: 695000,
    costPrice: 529000,
    stock: 25,
    vendorId: "vendor-1",
    category: "Electronics",
    sku: "MBP-16-001",
    purchaseHistory: [
      { id: "pur-1", date: "2024-01-15", quantity: 30, unitCost: 529000, totalCost: 15870000 },
      { id: "pur-2", date: "2024-03-10", quantity: 20, unitCost: 529000, totalCost: 10580000 },
    ],
  },
  {
    id: "prod-2",
    name: "Logitech MX Master 3",
    description: "Advanced wireless mouse with precision scrolling and ergonomic design",
    unitPrice: 27500,
    costPrice: 18000,
    stock: 150,
    vendorId: "vendor-2",
    category: "Accessories",
    sku: "LGT-MX3-001",
    purchaseHistory: [
      { id: "pur-3", date: "2024-02-01", quantity: 100, unitCost: 18000, totalCost: 1800000 },
      { id: "pur-4", date: "2024-04-15", quantity: 150, unitCost: 18000, totalCost: 2700000 },
    ],
  },
  {
    id: "prod-3",
    name: "Keychron K8 Mechanical Keyboard",
    description: "Wireless mechanical keyboard with hot-swappable switches",
    unitPrice: 52500,
    costPrice: 33400,
    stock: 75,
    vendorId: "vendor-1",
    category: "Accessories",
    sku: "KEY-K8-001",
    purchaseHistory: [
      { id: "pur-5", date: "2024-01-20", quantity: 50, unitCost: 33400, totalCost: 1670000 },
      { id: "pur-6", date: "2024-03-25", quantity: 75, unitCost: 33400, totalCost: 2505000 },
    ],
  },
  {
    id: "prod-4",
    name: 'Dell UltraSharp 27" 4K Monitor',
    description: "Professional 4K UHD monitor with USB-C connectivity",
    unitPrice: 180700,
    costPrice: 125300,
    stock: 8,
    vendorId: "vendor-3",
    category: "Electronics",
    sku: "DELL-U27-001",
    purchaseHistory: [
      { id: "pur-7", date: "2024-02-10", quantity: 40, unitCost: 125300, totalCost: 5012000 },
      { id: "pur-8", date: "2024-04-05", quantity: 50, unitCost: 125300, totalCost: 6265000 },
    ],
  },
  {
    id: "prod-5",
    name: "Sony WH-1000XM5 Headphones",
    description: "Industry-leading noise canceling wireless headphones",
    unitPrice: 111100,
    costPrice: 78000,
    stock: 45,
    vendorId: "vendor-2",
    category: "Audio",
    sku: "SONY-WH5-001",
    purchaseHistory: [
      { id: "pur-9", date: "2024-03-01", quantity: 30, unitCost: 78000, totalCost: 2340000 },
      { id: "pur-10", date: "2024-05-20", quantity: 25, unitCost: 78000, totalCost: 1950000 },
    ],
  },
]

const mockInvoices: Invoice[] = [
  {
    id: "INV-2024-001",
    trackingId: "TRK-123456-ABCD",
    customerName: "Alice Johnson",
    customerEmail: "alice.johnson@techcorp.com",
    customerPhone: "+923001234567",
    items: [
      { productId: "prod-1", productName: 'MacBook Pro 16"', quantity: 2, unitPrice: 695000, costPrice: 529000 },
      {
        productId: "prod-3",
        productName: "Keychron K8 Mechanical Keyboard",
        quantity: 2,
        unitPrice: 52500,
        costPrice: 33400,
      },
    ],
    totalAmount: 1495000,
    deliveryCharges: 0,
    totalCost: 1124800,
    totalProfit: 370200,
    profitPercentage: 24.8,
    createdAt: "2024-06-15",
    currency: "PKR",
    status: "completed",
  },
  {
    id: "INV-2024-002",
    trackingId: "TRK-789012-EFGH",
    customerName: "Bob Smith",
    customerEmail: "bob.smith@designstudio.com",
    customerPhone: "+923012345678",
    items: [
      {
        productId: "prod-4",
        productName: 'Dell UltraSharp 27" 4K Monitor',
        quantity: 3,
        unitPrice: 180700,
        costPrice: 125300,
      },
      { productId: "prod-2", productName: "Logitech MX Master 3", quantity: 3, unitPrice: 27500, costPrice: 18000 },
    ],
    totalAmount: 624600,
    deliveryCharges: 0,
    totalCost: 430000,
    totalProfit: 194700,
    profitPercentage: 31.2,
    createdAt: "2024-06-20",
    currency: "PKR",
    status: "pending",
  },
  {
    id: "INV-2024-003",
    customerName: "Carol Davis",
    customerEmail: "carol.davis@startup.io",
    customerPhone: "+923023456789",
    items: [
      {
        productId: "prod-5",
        productName: "Sony WH-1000XM5 Headphones",
        quantity: 5,
        unitPrice: 111100,
        costPrice: 78000,
      },
    ],
    totalAmount: 555500,
    deliveryCharges: 0,
    totalCost: 390000,
    totalProfit: 165500,
    profitPercentage: 29.8,
    createdAt: "2024-06-25",
    currency: "PKR",
    status: "completed",
  },
  {
    id: "INV-2024-004",
    trackingId: "TRK-345678-IJKL",
    customerName: "David Wilson",
    customerEmail: "david.wilson@agency.com",
    customerPhone: "+923034567890",
    items: [
      { productId: "prod-1", productName: 'MacBook Pro 16"', quantity: 1, unitPrice: 695000, costPrice: 529000 },
      { productId: "prod-2", productName: "Logitech MX Master 3", quantity: 1, unitPrice: 27500, costPrice: 18000 },
    ],
    totalAmount: 722500,
    deliveryCharges: 0,
    totalCost: 547000,
    totalProfit: 175500,
    profitPercentage: 24.3,
    createdAt: "2024-06-28",
    currency: "PKR",
    status: "pending",
  },
]

const mockDeals: Deal[] = [
  {
    id: "deal-1",
    name: "Eid Mubarak Sale",
    description: "Celebrate Eid with 20% off on all electronics!",
    discountPercentage: 20,
    expiryDate: "2024-08-31",
    createdAt: "2024-07-01",
  },
  {
    id: "deal-2",
    name: "Summer Glow Up",
    description: "Flat 15% off on all beauty and personal care items.",
    discountPercentage: 15,
    expiryDate: "2024-07-31",
    createdAt: "2024-06-20",
  },
]

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
}

const mockVendors: Vendor[] = [
  {
    id: "vendor-1",
    name: "Tech Solutions Inc.",
    email: "contact@techsolutions.com",
    phone: "+92-300-1234567",
    address: "123 Tech Street, Karachi, Pakistan",
    createdAt: "2024-01-15",
  },
  {
    id: "vendor-2",
    name: "Global Electronics",
    email: "sales@globalelectronics.com",
    phone: "+92-301-2345678",
    address: "456 Electronics Ave, Lahore, Pakistan",
    createdAt: "2024-02-01",
  },
  {
    id: "vendor-3",
    name: "Premium Displays",
    email: "info@premiumdisplays.com",
    phone: "+92-302-3456789",
    address: "789 Display Road, Islamabad, Pakistan",
    createdAt: "2024-02-10",
  },
]

const mockCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Alice Johnson",
    email: "alice.johnson@techcorp.com",
    phone: "+923001234567",
    type: "frequent",
    createdAt: "2023-01-01",
  },
  {
    id: "cust-2",
    name: "Bob Smith",
    email: "bob.smith@designstudio.com",
    phone: "+923012345678",
    type: "frequent",
    createdAt: "2023-02-10",
  },
  {
    id: "cust-3",
    name: "Carol Davis",
    email: "carol.davis@startup.io",
    phone: "+923023456789",
    type: "new",
    createdAt: "2024-05-01",
  },
  {
    id: "cust-4",
    name: "David Wilson",
    email: "david.wilson@agency.com",
    phone: "+923034567890",
    type: "new",
    createdAt: "2024-06-01",
  },
]

type ActiveTab =
  | "dashboard"
  | "products"
  | "invoices"
  | "reports"
  | "users"
  | "guests"
  | "vendors"
  | "customers"
  | "post-office"
  | "settings"
  | "customer-profit"
  | "deals"
  | "trash"
  | "daily-orders"
  | "login-requests"
  | "login"
  | "forgot-password"

function DashboardPageContent() {
  const beautyQuotes = [
    "Own your beauty.",
    "Confidence is the best makeup.",
    "Your beauty, your rules.",
    "Beauty redefined.",
    "Unlock your beauty potential.",
    "Where beauty meets brilliance.",
    "Embrace your natural beauty.",
    "Feel confident in your own skin.",
    "Beauty that speaks volumes.",
    "Define your beauty story.",
    "Unveil your unique radiance.",
    "Healthy skin, beautiful you.",
    "Glow with the flow.",
    "Glowing made easy.",
    "Unveil your natural glow.",
    "Radiate elegance, one shade at a time.",
    "The road to clear skin.",
    "Flawless skin in no time.",
    "Love your skin enough.",
    "Crafted with love for your skin.",
  ]

  const { user, logout, loginRequests, approveLoginRequest, rejectLoginRequest } = useAuth()
  const { toast } = useToast()
  const reportPersistenceError = (action: string, error: unknown) => {
    console.error(`Unable to ${action}:`, error)
    toast({
      title: "Could not save changes",
      description: error instanceof Error ? error.message : `Unable to ${action}. Please try again.`,
      variant: "destructive",
    })
  }
  const [showLandingPage, setShowLandingPage] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard")
  const [showGuestLogin, setShowGuestLogin] = useState(false)
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [isDatabaseDataLoaded, setIsDatabaseDataLoaded] = useState(false)
  const [currentAppCurrency, setCurrentAppCurrency] = useState<string>(() => {
    if (typeof window === "undefined") return getInitialCurrency()
    return localStorage.getItem("selectedCurrency") || getInitialCurrency()
  })

  const [products, setProducts] = useState<Product[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])
  const [guestUsers, setGuestUsers] = useState<AuthUser[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [postOfficeRecords, setPostOfficeRecords] = useState<PostOfficeRecord[]>([])

  const persistPostOfficeRecords = (updater: (prev: PostOfficeRecord[]) => PostOfficeRecord[]) => {
    setPostOfficeRecords((prev) => {
      const nextRecords = updater(prev)
      saveToLocalStorage("ims_post_office_records", nextRecords)
      return nextRecords
    })
  }

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])

  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false)

  const refreshDataFromDatabase = async () => {
    const [productsData, invoicesData, customersData, postOfficeData, vendorsData, dealsData, trashData] =
      await Promise.all([
        requestApi<Product[]>("/api/products"),
        requestApi<Invoice[]>("/api/invoices"),
        requestApi<Customer[]>("/api/customers"),
        requestApi<PostOfficeRecord[]>("/api/post-office"),
        requestApi<Vendor[]>("/api/vendors"),
        requestApi<Deal[]>("/api/deals"),
        requestApi<TrashItem[]>("/api/trash"),
      ])

    if (
      !Array.isArray(productsData) ||
      !Array.isArray(invoicesData) ||
      !Array.isArray(customersData) ||
      !Array.isArray(postOfficeData) ||
      !Array.isArray(vendorsData) ||
      !Array.isArray(dealsData) ||
      !Array.isArray(trashData)
    ) {
      throw new Error("The database returned invalid saved data.")
    }

    setProducts(normalizeProducts(productsData))
    setInvoices(invoicesData)
    setCustomers(customersData)
    setPostOfficeRecords(postOfficeData)
    setVendors(vendorsData)
    setDeals(dealsData)
    setTrashItems(trashData)
    setIsDatabaseDataLoaded(true)
  }

  const refreshManagedUsersFromDatabase = async () => {
    const result = await requestApi<{ users: AuthUser[]; guests: AuthUser[] }>("/api/admin-users")
    if (!Array.isArray(result.users) || !Array.isArray(result.guests)) {
      throw new Error("The database returned invalid user data.")
    }
    setUsers(result.users)
    setGuestUsers(result.guests)
  }

  useEffect(() => {
    console.log("[v0] Verifying loaded data on mount:")
    const productsLoaded = loadFromLocalStorage("ims_products")?.length || 0
    const invoicesLoaded = loadFromLocalStorage("ims_invoices")?.length || 0
    const customersLoaded = loadFromLocalStorage("ims_customers")?.length || 0
    const vendorsLoaded = loadFromLocalStorage("ims_vendors")?.length || 0

    console.log("[v0] Products loaded:", productsLoaded)
    console.log("[v0] Invoices loaded:", invoicesLoaded)
    console.log("[v0] Customers loaded:", customersLoaded)
    console.log("[v0] Vendors loaded:", vendorsLoaded)
  }, []) // Added empty dependency array to run only once on mount

  useEffect(() => {
    if (isDatabaseDataLoaded && Array.isArray(products)) {
      saveToLocalStorage("ims_products", products)
    }
  }, [products, isDatabaseDataLoaded])

  useEffect(() => {
    if (isDatabaseDataLoaded && Array.isArray(invoices)) {
      saveToLocalStorage("ims_invoices", invoices)
    }
  }, [invoices, isDatabaseDataLoaded])

  useEffect(() => {
    if (isDatabaseDataLoaded && Array.isArray(customers)) {
      saveToLocalStorage("ims_customers", customers)
    }
  }, [customers, isDatabaseDataLoaded])

  useEffect(() => {
    if (isDatabaseDataLoaded && Array.isArray(postOfficeRecords)) {
      saveToLocalStorage("ims_post_office_records", postOfficeRecords)
    }
  }, [postOfficeRecords, isDatabaseDataLoaded])

  useEffect(() => {
    if (isDatabaseDataLoaded && Array.isArray(vendors)) {
      saveToLocalStorage("ims_vendors", vendors)
    }
  }, [vendors, isDatabaseDataLoaded])

  useEffect(() => {
    if (isDatabaseDataLoaded && Array.isArray(deals)) {
      saveToLocalStorage("ims_deals", deals)
    }
  }, [deals, isDatabaseDataLoaded])

  useEffect(() => {
    if (isDatabaseDataLoaded && Array.isArray(trashItems)) {
      saveToLocalStorage("ims_trash", trashItems)
    }
  }, [trashItems, isDatabaseDataLoaded])

  useEffect(() => {
    refreshDataFromDatabase().catch((error) => reportPersistenceError("load saved data", error))
  }, [toast])

  useEffect(() => {
    if (user?.role !== "admin") return

    refreshManagedUsersFromDatabase().catch((error) =>
      reportPersistenceError("load user and guest lists", error),
    )
  }, [user?.id, user?.role])

  useEffect(() => {
    if (isDatabaseDataLoaded && Array.isArray(users)) {
      saveToLocalStorage("ims_users", users)
    }
  }, [users, isDatabaseDataLoaded])

  useEffect(() => {
    if (isDatabaseDataLoaded && Array.isArray(guestUsers)) {
      saveToLocalStorage("ims_guest_users", guestUsers)
    }
  }, [guestUsers, isDatabaseDataLoaded])

  useEffect(() => {
    const cleanUpTrash = () => {
      const expiredIds = trashItems
        .filter((item) => getDaysSince(item.deletedAt) >= 60)
        .map((item) => item.id)
      if (expiredIds.length === 0) return

      const deleteExpiredItems = async () => {
        try {
          const query = expiredIds.map((id) => `id=${encodeURIComponent(id)}`).join("&")
          await requestApi(`/api/trash?${query}`, { method: "DELETE" })
          setTrashItems((prev) => prev.filter((item) => !expiredIds.includes(item.id)))
          toast({
            title: "Trash Auto-Cleaned",
            description: "Items older than 60 days have been permanently removed from trash.",
          })
        } catch (error) {
          reportPersistenceError("clean up expired trash items", error)
        }
      }

      deleteExpiredItems()
    }

    cleanUpTrash()

    const interval = setInterval(cleanUpTrash, 24 * 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [trashItems, toast])

  useEffect(() => {
    if (user && activeTab === "login") {
      setActiveTab("dashboard")
    } else if (!user && activeTab !== "login" && activeTab !== "forgot-password" && !showLandingPage) {
      setActiveTab("dashboard")
    }
  }, [user, activeTab, showLandingPage])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault()
        setIsGlobalSearchOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleEnterApp = () => {
    setShowLandingPage(false)
  }

  const handleLoginSuccess = () => {
    setShowForgotPassword(false)
    setActiveTab("dashboard")
  }

  const handleForgotPassword = () => {
    setShowForgotPassword(true)
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
  }

  const handleGuestLogin = () => {
    setShowGuestLogin(true)
  }

  const handleBackToMainLogin = () => {
    setShowGuestLogin(false)
  }

  const handleGuestLoginSuccess = () => {
    setShowGuestLogin(false)
    setActiveTab("dashboard")
  }

  const handleDataSync = async (syncedData: any) => {
    if (!syncedData || Object.keys(syncedData).length === 0) {
      await refreshDataFromDatabase()
      if (user?.role === "admin") await refreshManagedUsersFromDatabase()
      return
    }

    try {
      const failedImports: string[] = []
      if (Array.isArray(syncedData["ims_products"])) {
        for (const product of syncedData["ims_products"]) {
          if (!(await handleAddProduct(normalizeProduct(product)))) failedImports.push("products")
        }
      }
      if (Array.isArray(syncedData["ims_invoices"]) && !(await handleAddInvoices(syncedData["ims_invoices"]))) {
        failedImports.push("invoices")
      }
      if (Array.isArray(syncedData["ims_deals"])) {
        for (const deal of syncedData["ims_deals"]) if (!(await handleAddDeal(deal))) failedImports.push("deals")
      }
      if (Array.isArray(syncedData["ims_vendors"])) {
        for (const vendor of syncedData["ims_vendors"]) if (!(await handleAddVendor(vendor))) failedImports.push("vendors")
      }
      if (Array.isArray(syncedData["ims_customers"])) {
        for (const customer of syncedData["ims_customers"]) {
          if (!(await handleAddCustomer(customer))) failedImports.push("customers")
        }
      }
      if (Array.isArray(syncedData["ims_users"]) && syncedData["ims_users"].length > 0) {
        throw new Error("User backup imports cannot include passwords. Create or reset user passwords through User Management.")
      }
      if (Array.isArray(syncedData["ims_guest_users"])) {
        for (const guest of syncedData["ims_guest_users"]) {
          const result = await requestApi<{ guest: AuthUser }>("/api/admin-users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "guest", ...guest }),
          })
          if (!result.guest) throw new Error("An imported guest was not saved to the database.")
        }
      }

      if (Array.isArray(syncedData["ims_trash"])) {
        for (const item of syncedData["ims_trash"]) {
          await requestApi("/api/trash", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          })
        }
        setTrashItems(await requestApi<TrashItem[]>("/api/trash"))
      }
      if (Array.isArray(syncedData["ims_guest_users"])) {
        await refreshManagedUsersFromDatabase()
      }
      if (failedImports.length > 0) {
        throw new Error(`Some imported ${Array.from(new Set(failedImports)).join(", ")} could not be saved.`)
      }
    } catch (error) {
      reportPersistenceError("import and save the selected backup data", error)
      throw error
    }
  }

  const handleMoveToTrash = async (item: Product | Invoice | Deal | Vendor | Customer, type: TrashItem["type"]) => {
    if (type === "product") {
      setProducts((prev) => prev.filter((p) => p.id !== item.id))
    } else if (type === "invoice") {
      setInvoices((prev) => prev.filter((i) => i.id !== item.id))
    } else if (type === "deal") {
      setDeals((prev) => prev.filter((d) => d.id !== item.id))
    } else if (type === "vendor") {
      setVendors((prev) => prev.filter((v) => v.id !== item.id))
    } else if (type === "customer") {
      setCustomers((prev) => prev.filter((c) => c.id !== item.id))
    }
    try {
      setTrashItems(await requestApi<TrashItem[]>("/api/trash"))
    } catch (error) {
      reportPersistenceError("refresh the trash", error)
    }
    toast({ title: 'Moved to Trash', description: `${(item as any).name || item.id} moved to trash.` })
  }

  const handleRecoverItem = async (trashItemId: string) => {
    const itemToRecover = trashItems.find((t) => t.id === trashItemId)
    if (!itemToRecover) return

    try {
      const result = await requestApi<{ restored: unknown }>("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trashItemId }),
      })
      if (!result.restored) throw new Error("The item could not be restored from the database.")
    } catch (error) {
      reportPersistenceError("restore this item", error)
      return
    }

    try {
      await refreshDataFromDatabase()
    } catch (error) {
      reportPersistenceError("refresh data after restoring this item", error)
      return
    }
    setTrashItems((prev) => prev.filter((t) => t.id !== trashItemId))
    toast({
      title: 'Item Recovered',
      description: `${(itemToRecover.data as any).name || itemToRecover.originalId} recovered.`,
    })
  }

  const handleEmptyTrash = async (itemIds?: string[]) => {
    try {
      const query = itemIds?.map((id) => `id=${encodeURIComponent(id)}`).join("&")
      await requestApi(`/api/trash${query ? `?${query}` : ""}`, { method: "DELETE" })
      if (itemIds) {
        setTrashItems((prev) => prev.filter((item) => !itemIds.includes(item.id)))
        toast({ title: "Items Permanently Deleted", description: `${itemIds.length} items permanently deleted.` })
      } else {
        setTrashItems([])
        toast({ title: "Trash Emptied", description: "All items in trash have been permanently deleted." })
      }
    } catch (error) {
      reportPersistenceError("permanently delete the selected trash items", error)
    }
  }

  const handleAddProduct = async (newProduct: Product) => {
    const savingToast = toast({
      title: "Saving Product",
      description: `${newProduct.name} is being saved to the database.`,
    })
    try {
      const result = await requestApi<{ product: Product }>("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          unitPrice: Number(newProduct.unitPrice) || 0,
          costPrice: Number(newProduct.costPrice) || 0,
          stock: Number(newProduct.stock) || 0,
          vendorId: newProduct.vendorId,
          category: newProduct.category,
          sku: newProduct.sku,
          purchaseHistory: newProduct.purchaseHistory,
        }),
      })
      if (!result.product) throw new Error("The product was not returned by the database.")
      setProducts((prev) => mergeProductsById([normalizeProduct(result.product)], prev))
    } catch (error) {
      savingToast.dismiss()
      reportPersistenceError("add this product", error)
      return false
    }
    savingToast.dismiss()
    window.alert(`${newProduct.name} was saved to the database and added to inventory.`)
    return true
  }

  const handleUpdateProduct = async (updatedProduct: Product): Promise<Product | null> => {
    const savingToast = toast({
      title: "Saving Product Changes",
      description: `${updatedProduct.name} is being updated in the database.`,
    })
    try {
      const result = await requestApi<{ product: Product }>("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updatedProduct.id,
          name: updatedProduct.name,
          description: updatedProduct.description,
          unitPrice: Number(updatedProduct.unitPrice) || 0,
          costPrice: Number(updatedProduct.costPrice) || 0,
          stock: Number(updatedProduct.stock) || 0,
          vendorId: updatedProduct.vendorId,
          category: updatedProduct.category,
          sku: updatedProduct.sku,
          purchaseHistory: updatedProduct.purchaseHistory,
        }),
      })
      if (!result.product) throw new Error("The product was not returned by the database.")
      const savedProduct = normalizeProduct(result.product)
      setProducts((prev) =>
        mergeProductsById([savedProduct], prev.filter((product) => product.id !== savedProduct.id)),
      )
      savingToast.dismiss()
      window.alert(`${savedProduct.name} was successfully updated in the database.`)
      return savedProduct
    } catch (error) {
      savingToast.dismiss()
      reportPersistenceError("update this product", error)
    }
    return null
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    const productToDelete = products.find((p) => p.id === productId)
    if (!productToDelete) return
    const deletingToast = toast({
      title: "Deleting Product",
      description: `${productName} is being moved to the Recycle Bin.`,
    })
    try {
      const result = await requestApi<{ deleted: { id: string } | null }>(
        `/api/products?id=${encodeURIComponent(productId)}`,
        { method: "DELETE" },
      )
      if (!result.deleted) throw new Error("Product was not found in the database.")
      deletingToast.dismiss()
      await handleMoveToTrash(productToDelete, "product")
    } catch (error) {
      deletingToast.dismiss()
      reportPersistenceError(`delete ${productName}`, error)
    }
  }

  const handleCreateInvoice = async (newInvoice: Omit<Invoice, "id" | "createdAt"> & { createdAt?: string }) => {
    console.log("[v0] Creating invoice with date:", newInvoice.createdAt || "no createdAt")

    const invoiceDateString = newInvoice.createdAt || getCurrentDate()
    const invoiceDate = new Date(invoiceDateString)

    const invoiceMonth = (invoiceDate.getMonth() + 1).toString().padStart(2, "0")
    const invoiceYear = invoiceDate.getFullYear().toString()

    console.log("[v0] Invoice month/year:", invoiceMonth, invoiceYear)
    console.log("[v0] Invoice date string:", invoiceDateString)

    // Find all invoices for this month/year
    const invoicesThisMonthYear = invoices.filter((inv) => {
      const invDate = new Date(inv.createdAt)
      const invMonth = (invDate.getMonth() + 1).toString().padStart(2, "0")
      const invYear = invDate.getFullYear().toString()
      return invMonth === invoiceMonth && invYear === invoiceYear
    })

    console.log("[v0] Invoices in this month/year:", invoicesThisMonthYear.length)

    let maxInvoiceNum = 0
    invoicesThisMonthYear.forEach((inv) => {
      const parts = inv.id.split("_")
      if (parts.length === 3) {
        const num = Number.parseInt(parts[2], 10)
        if (!Number.isNaN(num) && num > maxInvoiceNum) {
          maxInvoiceNum = num
        }
      }
    })

    const nextInvoiceNumber = (maxInvoiceNum + 1).toString().padStart(3, "0")
    const invoiceId = `${invoiceMonth}_${invoiceYear}_${nextInvoiceNumber}`

    console.log("[v0] New invoice ID:", invoiceId)

    const payload = {
      tracking_id: invoiceId,
      customer_name: newInvoice.customerName,
      customer_email: newInvoice.customerEmail,
      customer_phone: newInvoice.customerPhone,
      created_at: newInvoice.createdAt,
      total_amount: newInvoice.totalAmount,
      delivery_charges: newInvoice.deliveryCharges,
      total_cost: newInvoice.totalCost,
      total_profit: newInvoice.totalProfit,
      profit_percentage: newInvoice.profitPercentage,
      currency: newInvoice.currency,
      status: newInvoice.status,
      items: newInvoice.items?.map((item) => ({
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        cost_price: item.costPrice,
      })) || [],
    }
    try {
      const result = await requestApi<{ invoice: Invoice }>("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!result.invoice) throw new Error("The invoice was not returned by the database.")
      setInvoices((prev) => mergeInvoicesById([result.invoice], prev))
      toast({
        title: "Invoice Created",
        description: `Invoice ${invoiceId} has been created successfully for ${invoiceMonth}/${invoiceYear}!`,
      })
    } catch (error) {
      reportPersistenceError("create this invoice", error)
    }
  }

  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    try {
      const result = await requestApi<{ invoice: Invoice }>("/api/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedInvoice),
      })
      if (!result.invoice) throw new Error("The invoice was not returned by the database.")
      setInvoices((prev) => prev.map((invoice) => (invoice.id === updatedInvoice.id ? result.invoice : invoice)))
      setEditingInvoice(null)
      toast({
        title: "Invoice Updated",
        description: `Invoice ${updatedInvoice.id} has been updated and saved to the database.`,
      })
    } catch (error) {
      reportPersistenceError("update this invoice", error)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    const invoiceToDelete = invoices.find((inv) => inv.id === invoiceId)
    if (!invoiceToDelete) return
    try {
      const result = await requestApi<{ deleted: { id: string } | null }>(
        `/api/invoices?id=${encodeURIComponent(invoiceId)}`,
        { method: "DELETE" },
      )
      if (!result.deleted) throw new Error("Invoice was not found in the database.")
      await handleMoveToTrash(invoiceToDelete, "invoice")
    } catch (error) {
      reportPersistenceError(`delete invoice ${invoiceId}`, error)
    }
  }

  const handleAddInvoices = async (newInvoices: Invoice[]) => {
    const savedInvoices: Invoice[] = []
    try {
      for (const invoice of newInvoices) {
        const result = await requestApi<{ invoice: Invoice }>("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tracking_id: invoice.trackingId || invoice.id,
            customer_name: invoice.customerName,
            customer_email: invoice.customerEmail,
            customer_phone: invoice.customerPhone,
            created_at: invoice.createdAt,
            total_amount: invoice.totalAmount,
            delivery_charges: invoice.deliveryCharges ?? 0,
            total_cost: invoice.totalCost,
            total_profit: invoice.totalProfit,
            profit_percentage: invoice.profitPercentage,
            currency: invoice.currency,
            status: invoice.status,
            items: invoice.items.map((item) => ({
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              cost_price: item.costPrice,
            })),
          }),
        })
        if (!result.invoice) throw new Error(`Invoice ${invoice.id} was not returned by the database.`)
        savedInvoices.push(result.invoice)
      }
    } catch (error) {
      if (savedInvoices.length > 0) setInvoices((prev) => mergeInvoicesById(savedInvoices, prev))
      reportPersistenceError(`import invoices (${savedInvoices.length} of ${newInvoices.length} saved)`, error)
      return false
    }
    setInvoices((prev) => mergeInvoicesById(savedInvoices, prev))
    toast({ title: "Invoices Imported", description: `Successfully imported ${savedInvoices.length} invoices.` })
    return true
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
  }

  const handleMarkInvoiceAsPaid = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId)
    if (!invoice) return
    handleUpdateInvoice({ ...invoice, status: "completed" })
  }

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      let currentY = 15

      doc.setFont("Times", "Bold")
      doc.setFontSize(20)
      doc.setTextColor(128, 0, 128)
      doc.text("GLOW WITH VIBES", 105, 20, { align: "center" })
      doc.setFont("Times", "Roman")

      doc.setFontSize(14)
      doc.setTextColor(100, 100, 100)
      const companyDescription =
        "Beauty, cosmetic & personal care. Wholesales Seller Beauty Products. Delivery all over Pakistan. Fast Customer Response, COD and easy returns."
      const splitDescription = doc.splitTextToSize(companyDescription, 150)
      currentY = 30
      splitDescription.forEach((line: string) => {
        doc.text(line, 105, currentY, { align: "center" })
        currentY += 5
      })

      const prominentQuote = beautyQuotes[Math.floor(Math.random() * beautyQuotes.length)]
      doc.setFont("Times", "BoldItalic")
      doc.setFontSize(18)
      doc.setTextColor(128, 0, 128)
      doc.text(`"${prominentQuote}"`, 105, currentY + 10, { align: "center" })

      doc.setDrawColor(200, 200, 200)
      doc.line(20, currentY + 25, 190, currentY + 25)

      doc.setFont("Times", "Roman")
      doc.setFontSize(21)
      doc.setTextColor(0, 0, 0)
      doc.text("INVOICE", 20, currentY + 35)

      doc.setFont("Times", "Roman")
      doc.setFontSize(15)
      doc.text(`Invoice ID: ${invoice.id}`, 20, currentY + 45)
      if (invoice.trackingId) {
        doc.text(`Tracking ID: ${invoice.trackingId}`, 20, currentY + 52)
        doc.text(`Date: ${invoice.createdAt}`, 20, currentY + 59)
      } else {
        doc.text(`Date: ${invoice.createdAt}`, 20, currentY + 52)
      }

      doc.setFont("Times", "Roman")
      doc.setFontSize(15)
      doc.text("Bill To:", 120, currentY + 35)
      doc.text(`Name: ${invoice.customerName}`, 120, currentY + 45)
      doc.text(`Email: ${invoice.customerEmail}`, 120, currentY + 52)
      doc.text(`Phone: ${invoice.customerPhone}`, 120, currentY + 59)

      let yPosition = invoice.trackingId ? currentY + 74 : currentY + 67
      doc.setFillColor(240, 240, 240)
      doc.rect(20, yPosition - 5, 170, 10, "F")

      doc.setFont("Times", "Roman")
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text("Product", 20, yPosition)
      doc.text("Qty", 105, yPosition)
      doc.text(`Unit Price`, 130, yPosition)
      doc.text(`Total`, 170, yPosition)

      yPosition += 15

      doc.setFont("Times", "Roman")
      doc.setFontSize(14)
      invoice.items.forEach((item) => {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 30
        }

        doc.text(item.productName, 20, yPosition)
        doc.text(item.quantity.toString(), 105, yPosition)
        doc.text(formatCurrency(item.unitPrice, invoice.currency || currentAppCurrency), 130, yPosition)
        doc.text(formatCurrency(item.quantity * item.unitPrice, invoice.currency || currentAppCurrency), 170, yPosition)

        yPosition += 10
      })

      yPosition += 10
      if (yPosition > 230) {
        doc.addPage()
        yPosition = 30
      }
      doc.setDrawColor(0, 0, 0)
      doc.line(100, yPosition - 5, 190, yPosition - 5)

      doc.setFont("Times", "Bold")
      doc.setFontSize(14)
      doc.text("Products Subtotal:", 100, yPosition)
      doc.text(formatCurrency(invoice.totalAmount, invoice.currency || currentAppCurrency), 170, yPosition)
      yPosition += 8
      doc.setFont("Times", "Roman")
      doc.text("Delivery Charges:", 100, yPosition)
      doc.text(
        formatCurrency(invoice.deliveryCharges || 0, invoice.currency || currentAppCurrency),
        170,
        yPosition,
      )
      yPosition += 8
      doc.setFont("Times", "Bold")
      doc.text("Customer Total:", 100, yPosition)
      doc.text(
        formatCurrency(invoice.totalAmount + (invoice.deliveryCharges || 0), invoice.currency || currentAppCurrency),
        170,
        yPosition,
      )

      const contactSectionY = doc.internal.pageSize.height - 50
      doc.setFont("Times", "Roman")
      doc.setFontSize(15)
      doc.setTextColor(0, 0, 0)
      doc.text("Connect With Us:", 20, contactSectionY)

      doc.setFont("Times", "Roman")
      doc.setFontSize(13)
      doc.setTextColor(128, 0, 128)

      doc.textWithLink("Instagram: @glow_with_vibes", 20, contactSectionY + 9, {
        url: "https://www.instagram.com/glow_with_vibes",
      })
      doc.textWithLink("LinkedIn: Noman Ali", 20, contactSectionY + 16, {
        url: "https://www.linkedin.com/in/noman-ali-134004246",
      })
      doc.textWithLink("Facebook: Glow with Vibes", 20, contactSectionY + 23, {
        url: "https://web.facebook.com/Glowwithvibes",
      })
      const whatsappY = contactSectionY + 30
      doc.textWithLink("WhatsApp: +92 311 0263606", 20, whatsappY, { url: "tel:+923110263606" })

      const thankYouY = whatsappY + 10
      doc.setFont("Times", "Roman")
      doc.setFontSize(13)
      doc.setTextColor(100, 100, 100)
      doc.text("Thank you for your business!", 105, thankYouY, { align: "center" })
      doc.text("For any queries, contact us at your convenience.", 105, thankYouY + 5, { align: "center" })

      doc.save(`invoice-${invoice.id}-${invoice.customerName.replace(/\s/g, "_")}.pdf`)

      // Save PDF to database
      await savePDFToDatabase(doc, {
        filename: `invoice-${invoice.id}-${invoice.customerName.replace(/\s/g, "_")}.pdf`,
        type: "invoice",
        entity_id: invoice.id,
        entity_type: "invoice",
        created_by: invoice.customerEmail,
      })

      toast({
        title: "PDF Downloaded Successfully",
        description: `Invoice ${invoice.id} has been downloaded as a PDF file.`,
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadCustomerInvoices = (customerName: string) => {
    const customerInvoices = invoices.filter((inv) => inv.customerName === customerName)
    if (customerInvoices.length > 0) {
      customerInvoices.forEach((invoice, index) => {
        setTimeout(() => {
          handleDownloadPdf(invoice)
        }, index * 500)
      })
      toast({
        title: "Customer Invoices Downloaded",
        description: `All ${customerInvoices.length} invoices for ${customerName} are being downloaded.`,
      })
    } else {
      toast({
        title: "No Invoices Found",
        description: `No invoices found for ${customerName}.`,
        variant: "destructive",
      })
    }
  }

  const handleAddDeal = async (newDeal: Deal) => {
    try {
      const result = await requestApi<{ deal: Deal }>("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDeal),
      })
      if (!result.deal) throw new Error("The deal was not returned by the database.")
      setDeals((prev) => mergeDeals([result.deal], prev))
    } catch (error) {
      reportPersistenceError("create this deal", error)
      return false
    }
    toast({
      title: "Deal Created",
      description: `${newDeal.name} has been added.`,
    })
    return true
  }

  const handleUpdateDeal = async (updatedDeal: Deal) => {
    try {
      const result = await requestApi<{ deal: Deal }>("/api/deals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDeal),
      })
      if (!result.deal) throw new Error("The deal was not returned by the database.")
      setDeals((prev) => mergeDeals([result.deal], prev.filter((deal) => deal.id !== result.deal.id)))
    } catch (error) {
      reportPersistenceError("update this deal", error)
      return
    }
    toast({
      title: "Deal Updated",
      description: `${updatedDeal.name} has been updated.`,
    })
  }

  const handleDeleteDeal = async (dealId: string) => {
    const dealToDelete = deals.find((d) => d.id === dealId)
    if (!dealToDelete) return
    try {
      const result = await requestApi<{ deleted: { id: string } | null }>(
        `/api/deals?id=${encodeURIComponent(dealId)}`,
        { method: "DELETE" },
      )
      if (!result.deleted) throw new Error("Deal was not found in the database.")
      await handleMoveToTrash(dealToDelete, "deal")
    } catch (error) {
      reportPersistenceError("delete this deal", error)
    }
  }

  const handleDownloadDealPdf = async (deal: Deal) => {
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      let currentY = 15
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      doc.setFont("Times", "Bold")
      doc.setFontSize(28)
      doc.setTextColor(128, 0, 128)
      doc.text("GLOW WITH VIBES", pageWidth / 2, currentY, { align: "center" })
      currentY += 10

      doc.setFont("Times", "Roman")
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text("Special Deals just for You!", pageWidth / 2, currentY, { align: "center" })
      currentY += 15

      doc.setDrawColor(128, 0, 128)
      doc.setLineWidth(0.5)
      doc.line(20, currentY, pageWidth - 20, currentY)
      currentY += 15

      doc.setFont("Times", "Bold")
      doc.setFontSize(18)
      doc.text(deal.name, 20, currentY)
      currentY += 10

      doc.setTextColor(255, 0, 0)
      doc.setFont("Times", "bolditalic")
      doc.setFontSize(22)
      doc.text(`Discount: ${deal.discountPercentage}% OFF`, 20, currentY)
      currentY += 7

      doc.setTextColor(50, 50, 50)
      doc.setFont("Times", "Roman")
      doc.setFontSize(12)

      doc.text(`Expiry Date: ${formatDate(deal.expiryDate)}`, 20, currentY)
      currentY += 7
      doc.text(`Created On: ${formatDate(deal.createdAt)}`, 20, currentY)
      currentY += 15

      doc.setFont("Times", "Bold")
      doc.setFontSize(14)
      doc.text("Description:", 20, currentY)
      currentY += 7

      doc.setFont("Times", "Roman")
      doc.setFontSize(12)
      const splitDescription = doc.splitTextToSize(deal.description, pageWidth - 60)
      splitDescription.forEach((line: string) => {
        doc.text(line, 20, currentY)
        currentY += 7
      })
      currentY += 15

      const contactSectionY = pageHeight - 60

      doc.setFont("Times", "Bold")
      doc.setFontSize(14)
      doc.text("Contact Us for more details:", 20, contactSectionY)
      let contactLinksY = contactSectionY + 7

      doc.setFont("Times", "Roman")
      doc.setFontSize(10)
      doc.setTextColor(50, 50, 150)
      doc.textWithLink("Instagram: @glow_with_vibes", 20, contactLinksY, {
        url: "https://www.instagram.com/glow_with_vibes",
      })
      contactLinksY += 5
      doc.textWithLink("LinkedIn: Noman Ali", 20, contactLinksY, {
        url: "https://www.linkedin.com/in/noman-ali-134004246",
      })
      contactLinksY += 5
      doc.textWithLink("Facebook: Glow with Vibes", 20, contactLinksY, {
        url: "https://web.facebook.com/Glowwithvibes",
      })
      contactLinksY += 5
      doc.textWithLink("WhatsApp: +92 311 0263606", 20, contactLinksY, { url: "tel:+923110263606" })

      const footerText = "Glow With Vibes - Terms and Conditions apply."
      doc.setFont("Times", "Roman")
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" })

      doc.save(`deal-${deal.name.replace(/\s/g, "_")}.pdf`)

      // Save PDF to database
      await savePDFToDatabase(doc, {
        filename: `deal-${deal.name.replace(/\s/g, "_")}.pdf`,
        type: "deal",
        entity_id: deal.id,
        entity_type: "deal",
      })

      toast({
        title: "Deal PDF Downloaded",
        description: `Deal "${deal.name}" has been downloaded as a PDF.`,
      })
    } catch (error) {
      console.error("Error generating deal PDF:", error)
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the deal PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddVendor = async (newVendor: Vendor) => {
    try {
      const result = await requestApi<{ vendor: Vendor }>("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVendor),
      })
      if (!result.vendor) throw new Error("The vendor was not returned by the database.")
      setVendors((prev) => mergeVendors([result.vendor], prev))
      return true
    } catch (error) {
      reportPersistenceError("add this vendor", error)
      return false
    }
  }

  const handleUpdateVendor = async (updatedVendor: Vendor) => {
    try {
      const result = await requestApi<{ vendor: Vendor }>("/api/vendors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedVendor),
      })
      if (!result.vendor) throw new Error("The vendor was not returned by the database.")
      setVendors((prev) => mergeVendors([result.vendor], prev.filter((vendor) => vendor.id !== result.vendor.id)))
    } catch (error) {
      reportPersistenceError("update this vendor", error)
    }
  }

  const handleDeleteVendor = async (vendorId: string) => {
    const vendorToDelete = vendors.find((v) => v.id === vendorId)
    if (!vendorToDelete) return
    try {
      const result = await requestApi<{ deleted: { id: string } | null }>(
        `/api/vendors?id=${encodeURIComponent(vendorId)}`,
        { method: "DELETE" },
      )
      if (!result.deleted) throw new Error("Vendor was not found in the database.")
      await handleMoveToTrash(vendorToDelete, "vendor")
    } catch (error) {
      reportPersistenceError("delete this vendor", error)
    }
  }

  const handleAddCustomer = async (newCustomer: Customer) => {
    try {
      const result = await requestApi<{ customer: Customer }>("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      })
      if (!result.customer) throw new Error("The customer was not returned by the database.")
      setCustomers((prev) => mergeCustomers([result.customer], prev))
      return true
    } catch (error) {
      reportPersistenceError("add this customer", error)
      return false
    }
  }

  const handleUpsertCustomerFromPostOfficeRecord = async (record: PostOfficeRecord) => {
    const normalizedName = record.customerName.trim()
    const normalizedPhone = record.phone.trim()
    const normalizedAddress = record.customerAddress.trim()
    const generatedEmail = normalizedPhone
      ? `${normalizedPhone.replace(/\D/g, "")}@customer.local`
      : `${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, ".") || "customer"}@customer.local`

    const existingCustomer = customers.find((customer) => {
      const sameName = customer.name.toLowerCase() === normalizedName.toLowerCase()
      const samePhone = customer.phone.replace(/\D/g, "") === normalizedPhone.replace(/\D/g, "")
      const sameEmail = customer.email.toLowerCase() === generatedEmail.toLowerCase()
      return sameName || samePhone || sameEmail
    })

    const customerPayload: Customer = {
      id: existingCustomer?.id || generateId(),
      name: normalizedName,
      email: existingCustomer?.email || generatedEmail,
      phone: normalizedPhone,
      address: normalizedAddress || existingCustomer?.address || "",
      type: existingCustomer?.type || "new",
      createdAt: existingCustomer?.createdAt || getCurrentDate(),
    }

    if (existingCustomer) {
      return handleUpdateCustomer(customerPayload)
    }

    return handleAddCustomer(customerPayload)
  }

  const handleAddPostOfficeRecord = async (newRecord: PostOfficeRecord) => {
    try {
      if (!(await handleUpsertCustomerFromPostOfficeRecord(newRecord))) return
      const result = await requestApi<{ record: PostOfficeRecord }>("/api/post-office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      })
      if (!result.record) throw new Error("The post office record was not returned by the database.")
      persistPostOfficeRecords((prev) => [result.record, ...prev])
    } catch (error) {
      reportPersistenceError("save this post office record", error)
    }
  }

  const handleUpdatePostOfficeRecord = async (updatedRecord: PostOfficeRecord) => {
    try {
      if (!(await handleUpsertCustomerFromPostOfficeRecord(updatedRecord))) return
      const result = await requestApi<{ record: PostOfficeRecord }>("/api/post-office", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRecord),
      })
      if (!result.record) throw new Error("The post office record was not returned by the database.")
      persistPostOfficeRecords((prev) =>
        prev.map((record) => (record.id === updatedRecord.id ? result.record : record)),
      )
    } catch (error) {
      reportPersistenceError("update this post office record", error)
    }
  }

  const handleDeletePostOfficeRecord = async (recordId: string) => {
    try {
      const result = await requestApi<{ deleted: { id: string } | null }>(
        `/api/post-office?id=${encodeURIComponent(recordId)}`,
        { method: "DELETE" },
      )
      if (!result.deleted) throw new Error("Post office record was not found in the database.")
      persistPostOfficeRecords((prev) => prev.filter((record) => record.id !== recordId))
    } catch (error) {
      reportPersistenceError("delete this post office record", error)
    }
  }

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    try {
      const result = await requestApi<{ customer: Customer }>("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCustomer),
      })
      if (!result.customer) throw new Error("The customer was not returned by the database.")
      setCustomers((prev) =>
        mergeCustomers([result.customer], prev.filter((customer) => customer.id !== result.customer.id)),
      )
      return true
    } catch (error) {
      reportPersistenceError("update this customer", error)
      return false
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    const customerToDelete = customers.find((c) => c.id === customerId)
    if (!customerToDelete) return
    try {
      const result = await requestApi<{ deleted: { id: string } | null }>(
        `/api/customers?id=${encodeURIComponent(customerId)}`,
        { method: "DELETE" },
      )
      if (!result.deleted) throw new Error("Customer was not found in the database.")
      await handleMoveToTrash(customerToDelete, "customer")
    } catch (error) {
      reportPersistenceError("delete this customer", error)
    }
  }

  const handleAddManagedUser = async (managedUser: AuthUser, password: string) => {
    try {
      const result = await requestApi<{ user: AuthUser }>("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "user", ...managedUser, password }),
      })
      if (!result.user) throw new Error("The user was not returned by the database.")
      setUsers((current) => mergeUsers([result.user], current))
      toast({ title: "User Added", description: `${result.user.name} has been saved to the database.` })
      return true
    } catch (error) {
      reportPersistenceError("add this user", error)
      return false
    }
  }

  const handleUpdateManagedUser = async (managedUser: AuthUser) => {
    try {
      const result = await requestApi<{ user: AuthUser }>("/api/admin-users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "user", ...managedUser }),
      })
      if (!result.user) throw new Error("The user was not returned by the database.")
      setUsers((current) => mergeUsers([result.user], current.filter((item) => item.id !== result.user.id)))
      toast({ title: "User Updated", description: `${result.user.name}'s changes were saved to the database.` })
      return true
    } catch (error) {
      reportPersistenceError("update this user", error)
      return false
    }
  }

  const handleDeleteManagedUser = async (id: string) => {
    try {
      await requestApi(`/api/admin-users?id=${encodeURIComponent(id)}&type=user`, { method: "DELETE" })
      setUsers((current) => current.filter((item) => item.id !== id))
      toast({ title: "User Deleted", description: "User has been removed from the database." })
      return true
    } catch (error) {
      reportPersistenceError("delete this user", error)
      return false
    }
  }

  const handleAddGuest = async (guest: AuthUser) => {
    try {
      const result = await requestApi<{ guest: AuthUser }>("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "guest", ...guest }),
      })
      if (!result.guest) throw new Error("The guest was not returned by the database.")
      setGuestUsers((current) => mergeUsers([result.guest], current))
      toast({ title: "Guest Added", description: `${result.guest.name} has been saved to the database.` })
      return true
    } catch (error) {
      reportPersistenceError("add this guest", error)
      return false
    }
  }

  const handleUpdateGuest = async (guest: AuthUser) => {
    try {
      const result = await requestApi<{ guest: AuthUser }>("/api/admin-users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "guest", ...guest }),
      })
      if (!result.guest) throw new Error("The guest was not returned by the database.")
      setGuestUsers((current) => mergeUsers([result.guest], current.filter((item) => item.id !== result.guest.id)))
      toast({ title: "Guest Updated", description: `${result.guest.name}'s changes were saved to the database.` })
      return true
    } catch (error) {
      reportPersistenceError("update this guest", error)
      return false
    }
  }

  const handleDeleteGuest = async (id: string) => {
    try {
      await requestApi(`/api/admin-users?id=${encodeURIComponent(id)}&type=guest`, { method: "DELETE" })
      setGuestUsers((current) => current.filter((guest) => guest.id !== id))
      toast({ title: "Guest Deleted", description: "Guest has been removed from the database." })
      return true
    } catch (error) {
      reportPersistenceError("delete this guest", error)
      return false
    }
  }

  if (showGuestLogin) {
    return (
      <GuestLoginForm
        onLoginSuccess={handleGuestLoginSuccess}
        onBackToMainLogin={handleBackToMainLogin}
      />
    )
  }

  if (showLandingPage) {
    return <LandingPage onEnterApp={handleEnterApp} />
  }

  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={handleBackToLogin} />
  }

  if (!user) {
    return (
      <LoginForm
        onLoginSuccess={handleLoginSuccess}
        onForgotPassword={handleForgotPassword}
        onGuestLogin={handleGuestLogin}
      />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="w-72 h-full flex flex-col border-r border-slate-200/80 bg-white/90 p-6 shadow-2xl shadow-violet-500/10 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/95">
        <div className="mb-6">
          <div className="text-3xl font-black tracking-tight bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-500 bg-clip-text text-transparent">
            Glow With Vibes
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Beauty product inventory with a modern glow. Manage stock, sales, and teams with delight.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full mb-4 justify-start bg-white/80 text-slate-700 shadow-sm shadow-slate-200/80 hover:bg-white dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800"
          onClick={() => setIsGlobalSearchOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" /> Search Everything
          <kbd className="ml-auto text-[10px] font-semibold uppercase tracking-[0.28em] bg-slate-200 px-2 py-1 rounded-full text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Ctrl+K
          </kbd>
        </Button>
        <ThemeToggle />
        <nav className="mt-4 flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
          <Button
            variant={activeTab === "dashboard" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "dashboard" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button
            variant={activeTab === "daily-orders" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "daily-orders" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("daily-orders")}
          >
            <Calendar className="mr-2 h-4 w-4" /> Daily Orders
          </Button>
          <Button
            variant={activeTab === "products" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "products" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("products")}
          >
            <Package className="mr-2 h-4 w-4" /> Products
          </Button>
          <Button
            variant={activeTab === "invoices" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "invoices" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("invoices")}
          >
            <FileText className="mr-2 h-4 w-4" /> Invoices
          </Button>
          <Button
            variant={activeTab === "reports" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "reports" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("reports")}
          >
            <BarChart className="mr-2 h-4 w-4" /> Reports
          </Button>
          {user?.role === "admin" && (
            <>
              <Button
                variant={activeTab === "customer-profit" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  activeTab === "customer-profit" && "bg-purple-600 text-white hover:bg-purple-700",
                )}
                onClick={() => setActiveTab("customer-profit")}
              >
                <DollarSign className="mr-2 h-4 w-4" /> Customer Profit
              </Button>
              <Button
                variant={activeTab === "login-requests" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  activeTab === "login-requests" && "bg-purple-600 text-white hover:bg-purple-700",
                )}
                onClick={() => setActiveTab("login-requests")}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Login Requests
              </Button>
            </>
          )}
          <Button
            variant={activeTab === "users" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "users" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("users")}
          >
            <Users className="mr-2 h-4 w-4" /> Users
          </Button>
          <Button
            variant={activeTab === "guests" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "guests" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("guests")}
          >
            <UserPlus className="mr-2 h-4 w-4" /> Guests
          </Button>
          <Button
            variant={activeTab === "vendors" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "vendors" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("vendors")}
          >
            <Building2 className="mr-2 h-4 w-4" /> Vendors
          </Button>
          <Button
            variant={activeTab === "customers" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "customers" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("customers")}
          >
            <UserRound className="mr-2 h-4 w-4" /> Customers
          </Button>
          <Button
            variant={activeTab === "post-office" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "post-office" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("post-office")}
          >
            <Package className="mr-2 h-4 w-4" /> Post Office
          </Button>
          <Button
            variant={activeTab === "deals" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "deals" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("deals")}
          >
            <Gift className="mr-2 h-4 w-4" /> Deals
          </Button>
          <Button
            variant={activeTab === "trash" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "trash" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("trash")}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Trash ({trashItems.length})
          </Button>
          <Button
            variant={activeTab === "settings" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeTab === "settings" && "bg-purple-600 text-white hover:bg-purple-700",
            )}
            onClick={() => setActiveTab("settings")}
          >
            <SettingsIcon className="mr-2 h-4 w-4" /> Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              logout()
              setShowLandingPage(true)
            }}
          >
            Logout
          </Button>
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        {activeTab === "dashboard" && (
          <DashboardOverview
            products={products}
            invoices={invoices}
            users={users}
            guestUsers={guestUsers}
            onViewInvoice={handleViewInvoice}
            onCreateInvoice={() => setIsCreateInvoiceOpen(true)}
            currentAppCurrency={currentAppCurrency}
          />
        )}
        {activeTab === "daily-orders" && (
          <DailyOrders
            invoices={invoices}
            products={products}
            customers={customers}
            onViewInvoice={handleViewInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onDownloadPdf={handleDownloadPdf}
            onDownloadCustomerInvoices={handleDownloadCustomerInvoices}
            onMarkInvoiceAsPaid={handleMarkInvoiceAsPaid}
            onCreateInvoice={handleCreateInvoice}
            currentAppCurrency={currentAppCurrency}
            user={user}
          />
        )}
        {activeTab === "products" && (
          <div className="space-y-6">
            <ProductDialogs
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              currentAppCurrency={currentAppCurrency}
              user={user}
              vendors={vendors}
            />
            <ProductSearch products={products} currentAppCurrency={currentAppCurrency} />
          </div>
        )}
        {activeTab === "invoices" && (
          <InvoiceManagement
            invoices={invoices}
            products={products}
            customers={customers}
            onViewInvoice={handleViewInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onCreateInvoice={() => setIsCreateInvoiceOpen(true)}
            onDownloadPdf={handleDownloadPdf}
            onDownloadCustomerInvoices={handleDownloadCustomerInvoices}
            onMarkInvoiceAsPaid={handleMarkInvoiceAsPaid}
            onAddInvoices={handleAddInvoices}
            currentAppCurrency={currentAppCurrency}
            user={user}
          />
        )}
        {activeTab === "reports" && (
          <MonthlyIncome
            invoices={invoices}
            products={products}
            onViewInvoice={handleViewInvoice}
            onDownloadPdf={handleDownloadPdf}
            currentAppCurrency={currentAppCurrency}
          />
        )}
        {activeTab === "customer-profit" && user?.role === "admin" && (
          <CustomerProfitDetails
            invoices={invoices}
            products={products}
            currentAppCurrency={currentAppCurrency}
            onViewInvoice={handleViewInvoice}
          />
        )}
        {activeTab === "login-requests" && user?.role === "admin" && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Login Requests</h2>
              <p className="mt-2 text-sm text-slate-600">Review pending login and signup requests, then approve or reject manually.</p>
            </div>
            {loginRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600">
                No login requests available.
              </div>
            ) : (
              <div className="space-y-4">
                {loginRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{request.name}</p>
                        <p className="text-sm text-slate-500">{request.email}</p>
                      </div>
                      <div className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 bg-slate-100">
                        {request.status}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-slate-500">Attempted at: {new Date(request.attemptedAt).toLocaleString()}</div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => approveLoginRequest(request.id)}
                          disabled={request.status !== "pending"}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rejectLoginRequest(request.id)}
                          disabled={request.status !== "pending"}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                    {request.message && <p className="mt-3 text-sm text-slate-500">{request.message}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "users" && (
          <UserManagement
            users={users}
            onAddUser={handleAddManagedUser}
            onUpdateUser={handleUpdateManagedUser}
            onDeleteUser={handleDeleteManagedUser}
          />
        )}
        {activeTab === "guests" && (
          <GuestManagement
            guestUsers={guestUsers}
            onAddGuest={handleAddGuest}
            onUpdateGuest={handleUpdateGuest}
            onDeleteGuest={handleDeleteGuest}
          />
        )}
        {activeTab === "vendors" && (
          <VendorManagement
            products={products}
            onUpdateProduct={handleUpdateProduct}
            currentAppCurrency={currentAppCurrency}
            allInvoices={invoices}
            vendors={vendors}
            setVendors={setVendors}
            onAddVendor={handleAddVendor}
            onUpdateVendor={handleUpdateVendor}
            onDeleteVendor={handleDeleteVendor}
          />
        )}
        {activeTab === "customers" && (
          <CustomerManagement
            customers={customers}
            invoices={invoices}
            currentAppCurrency={currentAppCurrency}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}
        {activeTab === "post-office" && (
          <PostOfficeManagement
            records={postOfficeRecords}
            customers={customers}
            onAddRecord={handleAddPostOfficeRecord}
            onUpdateRecord={handleUpdatePostOfficeRecord}
            onDeleteRecord={handleDeletePostOfficeRecord}
            onAddCustomerFromSlip={handleUpsertCustomerFromPostOfficeRecord}
          />
        )}
        {activeTab === "deals" && (
          <DealManagement
            deals={deals}
            onAddDeal={handleAddDeal}
            onUpdateDeal={handleUpdateDeal}
            onDeleteDeal={handleDeleteDeal}
            onDownloadDealPdf={handleDownloadDealPdf}
          />
        )}
        {activeTab === "trash" && (
          <TrashManagement
            trashItems={trashItems}
            onRecoverItem={handleRecoverItem}
            onEmptyTrash={handleEmptyTrash}
            currentAppCurrency={currentAppCurrency}
          />
        )}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <AppSettings onCurrencyChange={setCurrentAppCurrency} onDataSync={handleDataSync} />
            <PDFUploadParser
              onProductsExtracted={async (products) => {
                let savedCount = 0
                for (const product of products) {
                  if (await handleAddProduct(normalizeProduct(product))) savedCount += 1
                }
                toast({ title: "Products Imported", description: `${savedCount} of ${products.length} products saved.` })
              }}
              onInvoicesExtracted={async (invoices) => {
                await handleAddInvoices(invoices)
              }}
              onVendorsExtracted={async (vendors) => {
                let savedCount = 0
                for (const vendor of vendors) {
                  if (await handleAddVendor(vendor)) savedCount += 1
                }
                toast({ title: "Vendors Imported", description: `${savedCount} of ${vendors.length} vendors saved.` })
              }}
              onCustomersExtracted={async (customers) => {
                let savedCount = 0
                for (const customer of customers) {
                  if (await handleAddCustomer(customer)) savedCount += 1
                }
                toast({ title: "Customers Imported", description: `${savedCount} of ${customers.length} customers saved.` })
              }}
            />
          </div>
        )}
      </main>

      {viewingInvoice && (
        <InvoiceViewDialog
          invoice={viewingInvoice}
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onDownloadPdf={() => handleDownloadPdf(viewingInvoice)}
          currentAppCurrency={currentAppCurrency}
        />
      )}
      {editingInvoice && (
        <InvoiceEditDialog
          invoice={editingInvoice}
          products={products}
          customers={customers}
          existingInvoices={invoices}
          isOpen={!!editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSave={handleUpdateInvoice}
          currentAppCurrency={currentAppCurrency}
          user={user}
        />
      )}
      <InvoiceCreateDialog
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSave={handleCreateInvoice}
        products={products}
        customers={customers}
        existingInvoices={invoices}
        currentAppCurrency={currentAppCurrency}
        isAdmin={user?.role === "admin"}
      />
      <GlobalSearch
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        products={products}
        invoices={invoices}
        users={users}
        guestUsers={guestUsers}
        vendors={vendors}
        customers={customers}
        deals={deals}
        trashItems={trashItems}
        onNavigate={(tab) => {
          setActiveTab(tab as ActiveTab)
          setIsGlobalSearchOpen(false)
        }}
        onViewInvoice={(invoice) => {
          handleViewInvoice(invoice)
          setIsGlobalSearchOpen(false)
        }}
        onEditInvoice={(invoice) => {
          handleEditInvoice(invoice)
          setIsGlobalSearchOpen(false)
        }}
        currentAppCurrency={currentAppCurrency}
      />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardPageContent />
      <Toaster />
    </AuthProvider>
  )
}
