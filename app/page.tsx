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
import { DailyOrders } from "@/components/daily-orders"
import { GlobalSearch } from "@/components/global-search"
import { PDFUploadParser } from "@/components/pdf-upload-parser"
import { ThemeToggle } from "@/components/theme-toggle"
// import { v4 as generateId } from "uuid"

import type { User as AuthUser, LoginRequest } from "@/types/auth"
import type { Product, Invoice, Deal, TrashItem, Customer } from "@/types/app"

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
  | "settings"
  | "customer-profit"
  | "deals"
  | "trash"
  | "daily-orders"
  | "login-requests"

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
  const [showLandingPage, setShowLandingPage] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard")
  const [showGuestLogin, setShowGuestLogin] = useState(false)
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [currentAppCurrency, setCurrentAppCurrency] = useState<string>(getInitialCurrency())

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const loaded = loadFromLocalStorage("ims_products")
      return Array.isArray(loaded) && loaded.length > 0 ? loaded : initialMockProducts
    } catch (err) {
      console.error("[v0] Error loading products:", err)
      return initialMockProducts
    }
  })

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const loaded = loadFromLocalStorage("ims_invoices")
      return Array.isArray(loaded) ? loaded : mockInvoices
    } catch (err) {
      console.error("[v0] Error loading invoices:", err)
      return mockInvoices
    }
  })

  const [users, setUsers] = useState<AuthUser[]>(() => {
    const saved = loadFromLocalStorage("ims_users")
    return (
      saved || [
        {
          id: "user-1",
          name: "Admin User",
          email: "nomanandy20@gmail.com",
          role: "admin",
          permissions: {
            dashboard: true,
            products: true,
            invoices: true,
            reports: true,
            settings: true,
          },
          createdAt: "2024-01-01",
        },
        {
          id: "user-2",
          name: "Sales Manager",
          email: "sales@example.com",
          role: "sales",
          permissions: {
            dashboard: true,
            products: true,
            invoices: true,
            reports: false,
            settings: false,
          },
          createdAt: "2024-01-05",
        },
      ]
    )
  })

  const [guestUsers, setGuestUsers] = useState<AuthUser[]>(() => {
    const saved = loadFromLocalStorage("ims_guest_users")
    return (
      saved || [
        {
          id: "guest-1",
          name: "Temporary Viewer",
          email: "viewer@example.com",
          role: "guest",
          permissions: {
            dashboard: true,
            products: true,
            invoices: true,
            reports: false,
            settings: false,
          },
          createdAt: "2024-03-01",
        },
        {
          id: "guest-2",
          name: "John Doe",
          email: "john.doe@example.com",
          role: "guest",
          permissions: {
            dashboard: true,
            products: true,
            invoices: true,
            reports: false,
            settings: false,
          },
          createdAt: "2024-03-15",
        },
        {
          id: "guest-3",
          name: "Jane Smith",
          email: "jane.smith@example.com",
          role: "guest",
          permissions: {
            dashboard: true,
            products: true,
            invoices: true,
            reports: false,
            settings: false,
          },
          createdAt: "2024-03-20",
        },
      ]
    )
  })

  const [deals, setDeals] = useState<Deal[]>(() => {
    const saved = loadFromLocalStorage("ims_deals")
    return saved || mockDeals
  })

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const loaded = loadFromLocalStorage("ims_customers")
      return Array.isArray(loaded) ? loaded : mockCustomers
    } catch (err) {
      console.error("[v0] Error loading customers:", err)
      return mockCustomers
    }
  })

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    try {
      const loaded = loadFromLocalStorage("ims_vendors")
      return Array.isArray(loaded) ? loaded : mockVendors
    } catch (err) {
      console.error("[v0] Error loading vendors:", err)
      return mockVendors
    }
  })

  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    const saved = loadFromLocalStorage("ims_trash")
    return saved || []
  })

  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false)

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
    const performAutoSync = async () => {
      try {
        // The localStorage saves are handled by individual useEffect hooks
        console.log("[v0] Auto-sync check: data persisted to localStorage")
      } catch (error) {
        console.error("[v0] Auto-sync failed:", error)
      }
    }

    const syncInterval = setInterval(performAutoSync, 60000)
    return () => clearInterval(syncInterval)
  }, [])

  useEffect(() => {
    if (Array.isArray(products)) {
      saveToLocalStorage("ims_products", products)
    }
  }, [products])

  useEffect(() => {
    if (Array.isArray(invoices)) {
      saveToLocalStorage("ims_invoices", invoices)
    }
  }, [invoices])

  useEffect(() => {
    if (Array.isArray(customers)) {
      saveToLocalStorage("ims_customers", customers)
    }
  }, [customers])

  useEffect(() => {
    if (Array.isArray(vendors)) {
      saveToLocalStorage("ims_vendors", vendors)
    }
  }, [vendors])

  useEffect(() => {
    if (Array.isArray(deals)) {
      saveToLocalStorage("ims_deals", deals)
    }
  }, [deals])

  useEffect(() => {
    if (Array.isArray(trashItems)) {
      saveToLocalStorage("ims_trash", trashItems)
    }
  }, [trashItems])

  useEffect(() => {
    const loadDataFromServer = async () => {
      try {
        // Load products
        const prodRes = await fetch('/api/products')
        if (prodRes.ok) {
          const prodData = await prodRes.json()
          if (prodData.success && Array.isArray(prodData.products)) {
            setProducts(prodData.products)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading products from server:", error instanceof Error ? error.message : error)
      }

      try {
        // Load invoices
        const invRes = await fetch('/api/invoices')
        if (invRes.ok) {
          const invData = await invRes.json()
          if (invData.success && Array.isArray(invData.invoices)) {
            setInvoices(invData.invoices)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading invoices from server:", error instanceof Error ? error.message : error)
      }

      try {
        // Load customers
        const custRes = await fetch('/api/customers')
        if (custRes.ok) {
          const custData = await custRes.json()
          if (custData.success && Array.isArray(custData.customers)) {
            setCustomers(custData.customers)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading customers from server:", error instanceof Error ? error.message : error)
      }

      try {
        // Load vendors
        const vendRes = await fetch('/api/vendors')
        if (vendRes.ok) {
          const vendData = await vendRes.json()
          if (vendData.success && Array.isArray(vendData.vendors)) {
            setVendors(vendData.vendors)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading vendors from server:", error instanceof Error ? error.message : error)
      }

      try {
        // Load deals
        const dealRes = await fetch('/api/deals')
        if (dealRes.ok) {
          const dealData = await dealRes.json()
          if (dealData.success && Array.isArray(dealData.deals)) {
            setDeals(dealData.deals)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading deals from server:", error instanceof Error ? error.message : error)
      }

      try {
        // Load trash
        const trashRes = await fetch('/api/trash')
        if (trashRes.ok) {
          const trashData = await trashRes.json()
          if (trashData.success && Array.isArray(trashData.trashItems)) {
            setTrashItems(trashData.trashItems)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading trash from server:", error instanceof Error ? error.message : error)
      }
    }

    loadDataFromServer()
  }, [])

  useEffect(() => {
    if (Array.isArray(users)) {
      saveToLocalStorage("ims_users", users)
    }
  }, [users])

  useEffect(() => {
    const cleanUpTrash = () => {
      const now = new Date()
      const updatedTrash = trashItems.filter((item) => {
        const deletedDate = new Date(item.deletedAt)
        const daysSinceDeletion = getDaysSince(item.deletedAt)
        return daysSinceDeletion < 60
      })

      if (updatedTrash.length !== trashItems.length) {
        setTrashItems(updatedTrash)
        toast({
          title: "Trash Auto-Cleaned",
          description: "Items older than 60 days have been permanently removed from trash.",
        })
      }
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

  const handleDataSync = (syncedData: any) => {
    if (syncedData["ims_products"]) setProducts(syncedData["ims_products"])
    if (syncedData["ims_invoices"]) setInvoices(syncedData["ims_invoices"])
    if (syncedData["ims_users"]) setUsers(syncedData["ims_users"])
    if (syncedData["ims_guest_users"]) setGuestUsers(syncedData["ims_guest_users"])
    if (syncedData["ims_deals"]) setDeals(syncedData["ims_deals"])
    if (syncedData["ims_vendors"]) setVendors(syncedData["ims_vendors"])
    if (syncedData["ims_customers"]) setCustomers(syncedData["ims_customers"])
    if (syncedData["ims_trash"]) setTrashItems(syncedData["ims_trash"])
  }

  const handleMoveToTrash = (item: Product | Invoice | Deal | Vendor | Customer, type: TrashItem["type"]) => {
    const newTrashItem: TrashItem = {
      id: generateId(),
      originalId: item.id,
      type,
      data: item,
      deletedAt: getCurrentDateTime(),
    }
    setTrashItems((prev) => [...prev, newTrashItem])

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
    toast({ title: 'Moved to Trash', description: `${(item as any).name || item.id} moved to trash.` })
  }

  const handleRecoverItem = (trashItemId: string) => {
    const itemToRecover = trashItems.find((t) => t.id === trashItemId)
    if (!itemToRecover) return

    const restore = async () => {
      try {
        await fetch('/api/trash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: trashItemId }),
        })
      } catch (error) {
        console.warn('Failed to restore trash item on server', error)
      }
    }

    if (itemToRecover.type === "product") {
      setProducts((prev) => [...prev, itemToRecover.data as Product])
    } else if (itemToRecover.type === "invoice") {
      setInvoices((prev) => [...prev, itemToRecover.data as Invoice])
    } else if (itemToRecover.type === "deal") {
      setDeals((prev) => [...prev, itemToRecover.data as Deal])
    } else if (itemToRecover.type === "vendor") {
      setVendors((prev) => [...prev, itemToRecover.data as Vendor])
    } else if (itemToRecover.type === "customer") {
      setCustomers((prev) => [...prev, itemToRecover.data as Customer])
    }

    setTrashItems((prev) => prev.filter((t) => t.id !== trashItemId))
    restore()
    toast({
      title: 'Item Recovered',
      description: `${(itemToRecover.data as any).name || itemToRecover.originalId} recovered.`,
    })
  }

  const handleEmptyTrash = (itemIds?: string[]) => {
    const removeTrash = async () => {
      try {
        const qs = itemIds?.map((id) => `id=${encodeURIComponent(id)}`).join('&')
        await fetch(`/api/trash${qs ? `?${qs}` : ''}`, { method: 'DELETE' })
      } catch (error) {
        console.warn('Failed to permanently delete trash items on server', error)
      }
    }

    if (itemIds) {
      setTrashItems((prev) => prev.filter((item) => !itemIds.includes(item.id)))
      removeTrash()
      toast({ title: 'Items Permanently Deleted', description: `${itemIds.length} items permanently deleted.` })
    } else {
      setTrashItems([])
      removeTrash()
      toast({ title: 'Trash Emptied', description: 'All items in trash have been permanently deleted.' })
    }
  }

  const handleAddProduct = (newProduct: Product) => {
    const create = async () => {
      try {
        const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProduct) })
        const json = await res.json()
        if (json.success && json.product) {
          setProducts((prev) => [json.product, ...prev])
        } else {
          // fallback to local
          setProducts((prev) => [newProduct, ...prev])
        }
      } catch (e) {
        setProducts((prev) => [newProduct, ...prev])
      }
    }
    create()
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been added to inventory.`,
    })
  }

  const handleUpdateProduct = (updatedProduct: Product) => {
    const update = async () => {
      try {
        const res = await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedProduct) })
        const json = await res.json()
        if (json.success && json.product) {
          setProducts((prev) => prev.map((p) => (p.id === json.product.id ? json.product : p)))
        } else {
          setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)))
        }
      } catch (e) {
        setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)))
      }
    }
    update()
    toast({
      title: "Product Updated",
      description: `${updatedProduct.name} has been updated successfully.`,
    })
  }

  const handleDeleteProduct = (productId: string, productName: string) => {
    const productToDelete = products.find((p) => p.id === productId)
    if (productToDelete) {
      const remove = async () => {
        try {
          await fetch(`/api/products?id=${productId}`, { method: 'DELETE' })
        } catch (e) {
          // ignore
        }
        handleMoveToTrash(productToDelete, "product")
      }
      remove()
    }
  }

  const handleCreateInvoice = (newInvoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => {
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

    const create = async () => {
      const payload = {
        tracking_id: invoiceId,
        customer_name: newInvoice.customerName,
        customer_email: newInvoice.customerEmail,
        customer_phone: newInvoice.customerPhone,
        total_amount: newInvoice.totalAmount,
        total_cost: newInvoice.totalCost,
        total_profit: newInvoice.totalProfit,
        profit_percentage: newInvoice.profitPercentage,
        currency: newInvoice.currency,
        status: newInvoice.status,
        items: newInvoice.items?.map((it) => ({ product_id: it.productId, product_name: it.productName, quantity: it.quantity, unit_price: it.unitPrice, cost_price: it.costPrice })) || [],
      }
      try {
        const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const json = await res.json()
        if (json.success && json.invoice) {
          setInvoices((prev) => [json.invoice, ...prev])
          toast({ title: 'Invoice Created', description: `Invoice ${invoiceId} has been created successfully for ${invoiceMonth}/${invoiceYear}!` })
          return
        }
      } catch (e) {
        console.error('Invoice create failed, falling back to local state', e)
      }

      // Fallback to local state
      const completeInvoice: Invoice = {
        ...newInvoice,
        id: invoiceId,
        createdAt: invoiceDateString,
      }
      setInvoices((prev) => [completeInvoice, ...prev])
      toast({ title: 'Invoice Created (local)', description: `Invoice ${invoiceId} saved locally.` })
    }

    create()
  }

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    const update = async () => {
      try {
        const res = await fetch('/api/invoices', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedInvoice) })
        const json = await res.json()
        if (json.success && json.invoice) {
          setInvoices((prev) => prev.map((inv) => (inv.id === updatedInvoice.id ? json.invoice : inv)))
          setEditingInvoice(null)
          toast({ title: 'Invoice Updated', description: `Invoice ${updatedInvoice.id} has been updated successfully.` })
          return
        }
      } catch (e) {
        console.error('Invoice update failed, falling back to local state', e)
      }
      setInvoices((prev) => prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv)))
      setEditingInvoice(null)
      toast({ title: 'Invoice Updated (local)', description: `Invoice ${updatedInvoice.id} updated locally.` })
    }

    update()
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    const invoiceToDelete = invoices.find((inv) => inv.id === invoiceId)
    if (invoiceToDelete) {
      const remove = async () => {
        try {
          await fetch(`/api/invoices?id=${invoiceId}`, { method: 'DELETE' })
        } catch (e) {
          // ignore
        }
        handleMoveToTrash(invoiceToDelete, "invoice")
      }
      remove()
    }
  }

  const handleAddInvoices = (newInvoices: Invoice[]) => {
    const updatedInvoices = [...newInvoices, ...invoices]
    setInvoices(updatedInvoices)
    toast({
      title: "Invoices Imported",
      description: `Successfully imported ${newInvoices.length} invoices from Excel.`,
    })
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
  }

  const handleMarkInvoiceAsPaid = (invoiceId: string) => {
    const updatedInvoices = invoices.map((inv) => (inv.id === invoiceId ? { ...inv, status: "completed" } : inv))
    setInvoices(updatedInvoices)
    toast({
      title: "Invoice Marked as Paid",
      description: `Invoice ${invoiceId} has been marked as completed.`,
    })
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
      doc.setDrawColor(0, 0, 0)
      doc.line(100, yPosition - 5, 190, yPosition - 5)

      doc.setFont("Times", "Bold")
      doc.setFontSize(14)
      doc.text("Total Amount:", 100, yPosition)
      doc.text(formatCurrency(invoice.totalAmount, invoice.currency || currentAppCurrency), 170, yPosition)

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

  const handleAddDeal = (newDeal: Deal) => {
    const create = async () => {
      try {
        const res = await fetch('/api/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDeal) })
        const json = await res.json()
        if (json.success && json.deal) {
          setDeals((prev) => [json.deal, ...prev])
          return
        }
      } catch (e) {
        // fallback to local
      }
      setDeals((prev) => [...prev, { ...newDeal, createdAt: getCurrentDate() }])
    }
    create()
    toast({
      title: "Deal Created",
      description: `${newDeal.name} has been added.`,
    })
  }

  const handleUpdateDeal = (updatedDeal: Deal) => {
    const update = async () => {
      try {
        const res = await fetch('/api/deals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedDeal) })
        const json = await res.json()
        if (json.success && json.deal) {
          setDeals((prev) => prev.map((d) => (d.id === json.deal.id ? json.deal : d)))
          return
        }
      } catch (e) {
        // fallback
      }
      setDeals((prev) => prev.map((d) => (d.id === updatedDeal.id ? updatedDeal : d)))
    }
    update()
    toast({
      title: "Deal Updated",
      description: `${updatedDeal.name} has been updated.`,
    })
  }

  const handleDeleteDeal = (dealId: string) => {
    const dealToDelete = deals.find((d) => d.id === dealId)
    if (dealToDelete) {
      const remove = async () => {
        try {
          await fetch(`/api/deals?id=${dealId}`, { method: 'DELETE' })
        } catch (e) {
          // ignore
        }
        handleMoveToTrash(dealToDelete, "deal")
      }
      remove()
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

  const handleAddVendor = (newVendor: Vendor) => {
    const create = async () => {
      try {
        const res = await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newVendor) })
        const json = await res.json()
        if (json.success && json.vendor) {
          setVendors((prev) => [json.vendor, ...prev])
          return
        }
      } catch (e) {
        // fallback
      }
      setVendors((prev) => [newVendor, ...prev])
    }
    create()
  }

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    const update = async () => {
      try {
        const res = await fetch('/api/vendors', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedVendor) })
        const json = await res.json()
        if (json.success && json.vendor) {
          setVendors((prev) => prev.map((v) => (v.id === json.vendor.id ? json.vendor : v)))
          return
        }
      } catch (e) {
        // fallback
      }
      setVendors((prev) => prev.map((v) => (v.id === updatedVendor.id ? updatedVendor : v)))
    }
    update()
  }

  const handleDeleteVendor = (vendorId: string) => {
    const vendorToDelete = vendors.find((v) => v.id === vendorId)
    if (vendorToDelete) {
      const remove = async () => {
        try {
          await fetch(`/api/vendors?id=${vendorId}`, { method: 'DELETE' })
        } catch (e) {
          // ignore
        }
        handleMoveToTrash(vendorToDelete, "vendor")
      }
      remove()
    }
  }

  const handleAddCustomer = (newCustomer: Customer) => {
    const create = async () => {
      try {
        const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCustomer) })
        const json = await res.json()
        if (json.success && json.customer) {
          setCustomers((prev) => [json.customer, ...prev])
          return
        }
      } catch (e) {
        // fallback
      }
      setCustomers((prev) => [newCustomer, ...prev])
    }
    create()
  }

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    const update = async () => {
      try {
        const res = await fetch('/api/customers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedCustomer) })
        const json = await res.json()
        if (json.success && json.customer) {
          setCustomers((prev) => prev.map((c) => (c.id === json.customer.id ? json.customer : c)))
          return
        }
      } catch (e) {
        // fallback
      }
      setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)))
    }
    update()
  }

  const handleDeleteCustomer = (customerId: string) => {
    const customerToDelete = customers.find((c) => c.id === customerId)
    if (customerToDelete) {
      const remove = async () => {
        try {
          await fetch(`/api/customers?id=${customerId}`, { method: 'DELETE' })
        } catch (e) {
          // ignore
        }
        handleMoveToTrash(customerToDelete, "customer")
      }
      remove()
    }
  }

  if (showGuestLogin) {
    return (
      <GuestLoginForm
        onLoginSuccess={handleGuestLoginSuccess}
        onBackToMainLogin={handleBackToMainLogin}
        guestUsers={guestUsers}
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
        guestUsers={guestUsers}
      />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="w-72 border-r border-slate-200/80 bg-white/90 p-6 shadow-2xl shadow-violet-500/10 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/95">
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
        <nav className="space-y-2">
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
            onViewInvoice={handleViewInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onDownloadPdf={handleDownloadPdf}
            onDownloadCustomerInvoices={handleDownloadCustomerInvoices}
            onMarkInvoiceAsPaid={handleMarkInvoiceAsPaid}
            onCreateInvoice={handleCreateInvoice}
            currentAppCurrency={currentAppCurrency}
            user={user}
            customers={customers}
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
              <p className="mt-2 text-sm text-slate-600">Review failed login attempts and approve or reject them manually.</p>
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
            onAddUser={(user) => {
              const updatedUsers = [...users, { ...user, createdAt: getCurrentDate() }]
              setUsers(updatedUsers)
            }}
            onUpdateUser={(user) => setUsers(users.map((u) => (u.id === user.id ? user : u)))}
            onDeleteUser={(id) => {
              setUsers(users.filter((u) => u.id !== id))
              toast({ title: "User Deleted", description: "User has been permanently removed." })
            }}
          />
        )}
        {activeTab === "guests" && (
          <GuestManagement
            guestUsers={guestUsers}
            onAddGuest={(guest) => {
              const updatedGuests = [...guestUsers, { ...guest, createdAt: getCurrentDate() }]
              setGuestUsers(updatedGuests)
            }}
            onUpdateGuest={(guest) => setGuestUsers(guestUsers.map((g) => (g.id === guest.id ? guest : g)))}
            onDeleteGuest={(id) => {
              setGuestUsers(guestUsers.filter((g) => g.id !== id))
              toast({ title: "Guest Deleted", description: "Guest has been permanently removed." })
            }}
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
              onProductsExtracted={(products) => {
                setProducts((prev) => [...prev, ...products])
                toast({ title: "Products Imported", description: `${products.length} products added from PDF.` })
              }}
              onInvoicesExtracted={(invoices) => {
                setInvoices((prev) => [...prev, ...invoices])
                toast({ title: "Invoices Imported", description: `${invoices.length} invoices added from PDF.` })
              }}
              onVendorsExtracted={(vendors) => {
                setVendors((prev) => [...prev, ...vendors])
                toast({ title: "Vendors Imported", description: `${vendors.length} vendors added from PDF.` })
              }}
              onCustomersExtracted={(customers) => {
                setCustomers((prev) => [...prev, ...customers])
                toast({ title: "Customers Imported", description: `${customers.length} customers added from PDF.` })
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
          setActiveTab(tab)
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
