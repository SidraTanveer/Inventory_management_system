export interface Product {
  id: string
  name: string
  description: string
  unitPrice: number
  costPrice: number
  stock: number
  vendorId: string
  category: string
  sku: string
  purchaseHistory: PurchaseHistoryItem[]
  salesHistory?: SalesHistoryItem[]
}

export interface PurchaseHistoryItem {
  id: string
  date: string
  quantity: number
  unitCost: number
  totalCost: number
}

export interface SalesHistoryItem {
  invoiceId: string
  date: string
  quantity: number
  unitPrice: number
  totalPrice: number
  profit: number
}

export interface Invoice {
  id: string
  trackingId?: string // Add tracking ID field
  customerName: string
  customerEmail: string
  customerPhone: string
  items: InvoiceItem[]
  totalAmount: number
  totalCost: number
  totalProfit: number
  profitPercentage: number
  createdAt: string
  currency: string
  status: "pending" | "completed" | "cancelled"
}

export interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  costPrice: number
}

export interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
}

export interface Deal {
  id: string
  name: string
  description: string
  discountPercentage: number
  expiryDate: string
  createdAt: string
}

// New interface for Customer
export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  type: "frequent" | "new" // Categorize customers
  createdAt: string
}

// New interface for TrashItem
export interface TrashItem {
  id: string
  originalId: string // To store the original ID of the item
  type: "product" | "invoice" | "deal" | "vendor" | "customer" // Added 'customer' type
  data: Product | Invoice | Deal | Vendor | Customer // Store the full original object
  deletedAt: string // ISO string timestamp
}
