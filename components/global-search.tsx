"use client"

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency, formatDate } from "@/lib/utils"
import { buildSearchableCustomers, getKeywordSuggestions, searchAndRank } from "@/lib/search-utils"
import {
  Search,
  Package,
  FileText,
  Users,
  UserPlus,
  Building2,
  Gift,
  Trash2,
  UserRound,
  LayoutDashboard,
  Calendar,
  BarChart,
  DollarSign,
  SettingsIcon,
  Hash,
  User,
  Mail,
  Phone,
  Eye,
  Edit,
} from "lucide-react"
import type { Product, Invoice, Deal, TrashItem, Customer } from "@/types/app"
import type { User as AuthUser } from "@/types/auth"

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  invoices: Invoice[]
  users: AuthUser[]
  guestUsers: AuthUser[]
  vendors: any[]
  customers: Customer[]
  deals: Deal[]
  trashItems: TrashItem[]
  onNavigate: (tab: string) => void
  onViewInvoice: (invoice: Invoice) => void
  onEditInvoice: (invoice: Invoice) => void
  currentAppCurrency: string
}

export function GlobalSearch({
  isOpen,
  onClose,
  products,
  invoices,
  users,
  guestUsers,
  vendors,
  customers,
  deals,
  trashItems,
  onNavigate,
  onViewInvoice,
  onEditInvoice,
  currentAppCurrency,
}: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const searchableCustomers = useMemo(() => {
    return buildSearchableCustomers(customers, invoices)
  }, [customers, invoices])

  // Navigation items
  const navigationItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, description: "Overview and analytics" },
    { id: "daily-orders", name: "Daily Orders", icon: Calendar, description: "Today's orders and transactions" },
    { id: "products", name: "Products", icon: Package, description: "Manage inventory and products" },
    { id: "invoices", name: "Invoices", icon: FileText, description: "Create and manage invoices" },
    { id: "reports", name: "Reports", icon: BarChart, description: "Monthly income and analytics" },
    {
      id: "customer-profit",
      name: "Customer Profit",
      icon: DollarSign,
      description: "Customer profitability analysis",
    },
    { id: "users", name: "Users", icon: Users, description: "Manage system users" },
    { id: "guests", name: "Guests", icon: UserPlus, description: "Manage guest users" },
    { id: "vendors", name: "Vendors", icon: Building2, description: "Manage suppliers and vendors" },
    { id: "customers", name: "Customers", icon: UserRound, description: "Manage customer database" },
    { id: "deals", name: "Deals", icon: Gift, description: "Manage promotions and deals" },
    { id: "trash", name: "Trash", icon: Trash2, description: "Recover deleted items" },
    { id: "settings", name: "Settings", icon: SettingsIcon, description: "System configuration" },
  ]

  // Search results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim())
      return {
        navigation: [],
        products: [],
        invoices: [],
        users: [],
        guests: [],
        vendors: [],
        customers: [],
        deals: [],
        trash: [],
      }

    const term = searchTerm.toLowerCase()

    return {
      navigation: searchAndRank(navigationItems, term, [(item) => item.name, (item) => item.description]),
      products: searchAndRank(products, term, [
        (product) => product.name,
        (product) => product.description,
        (product) => product.sku,
        (product) => product.category,
      ]),
      invoices: searchAndRank(invoices, term, [
        (invoice) => invoice.id,
        (invoice) => invoice.customerName,
        (invoice) => invoice.customerEmail,
        (invoice) => invoice.trackingId,
      ]),
      users: searchAndRank(users, term, [(user) => user.name, (user) => user.email, (user) => user.role]),
      guests: searchAndRank(guestUsers, term, [(guest) => guest.name, (guest) => guest.email]),
      vendors: searchAndRank(vendors, term, [(vendor) => vendor.name, (vendor) => vendor.email, (vendor) => vendor.phone]),
      customers: searchAndRank(searchableCustomers, term, [
        (customer) => customer.name,
        (customer) => customer.email,
        (customer) => customer.phone,
      ]),
      deals: searchAndRank(deals, term, [(deal) => deal.name, (deal) => deal.description]),
      trash: searchAndRank(trashItems, term, [
        (item) => (item.data as any).name,
        (item) => item.originalId,
        (item) => item.type,
      ]),
    }
  }, [searchTerm, products, invoices, users, guestUsers, vendors, searchableCustomers, deals, trashItems])

  const totalResults = Object.values(searchResults).reduce((sum, results) => sum + results.length, 0)

  const globalSuggestions = useMemo(() => {
    const navSuggestions = getKeywordSuggestions(
      navigationItems,
      searchTerm,
      [(item) => item.name, (item) => item.description],
      4,
    )
    const invoiceSuggestions = getKeywordSuggestions(
      invoices,
      searchTerm,
      [(invoice) => invoice.id, (invoice) => invoice.trackingId, (invoice) => invoice.customerName],
      4,
    )
    const productSuggestions = getKeywordSuggestions(products, searchTerm, [(product) => product.name, (product) => product.sku], 4)
    const customerSuggestions = getKeywordSuggestions(
      searchableCustomers,
      searchTerm,
      [(customer) => customer.name, (customer) => customer.email],
      4,
    )

    return [...navSuggestions, ...invoiceSuggestions, ...productSuggestions, ...customerSuggestions].slice(0, 12)
  }, [searchTerm, navigationItems, invoices, products, searchableCustomers])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  // Clear search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
    }
  }, [isOpen])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 text-xs">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center text-xl font-semibold">
            <Search className="mr-2 h-5 w-5" />
            Global Search
          </DialogTitle>
        </DialogHeader>

        <div className="px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tracking IDs, customers, deals, and more..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              list="global-search-suggestions"
              className="pl-10 text-base"
              autoFocus
            />
            <datalist id="global-search-suggestions">
              {globalSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              {totalResults} result{totalResults !== 1 ? "s" : ""} found
            </div>
          )}
        </div>

        <ScrollArea className="max-h-[50vh] px-6">
          <div className="space-y-6 pb-6">
            {/* Navigation Results */}
            {searchResults.navigation.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Navigation ({searchResults.navigation.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.navigation.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        onNavigate(item.id)
                        onClose()
                      }}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-4 w-4 text-gray-600 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invoice Results */}
            {searchResults.invoices.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Invoices ({searchResults.invoices.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.invoices.map((invoice, index) => (
                    <div
                      key={`${invoice.id || invoice.trackingId || "no-id"}-${invoice.createdAt || "no-date"}-${index}`}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-blue-600">{invoice.id}</span>
                            {invoice.trackingId && (
                              <div className="flex items-center text-blue-600">
                                <Hash className="h-3 w-3 mr-1" />
                                <span className="font-mono text-xs">{invoice.trackingId}</span>
                              </div>
                            )}
                            {getStatusBadge(invoice.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {invoice.customerName}
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {invoice.customerEmail}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{formatDate(invoice.createdAt)}</span>
                              <span className="font-medium text-gray-900">
                                {formatCurrency(invoice.totalAmount, currentAppCurrency)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onViewInvoice(invoice)
                              onClose()
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onEditInvoice(invoice)
                              onClose()
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Results */}
            {searchResults.products.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Products ({searchResults.products.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.products.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        onNavigate("products")
                        onClose()
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            SKU: {product.sku} | Stock: {product.stock} | Category: {product.category}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">{product.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(product.unitPrice, currentAppCurrency)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Cost: {formatCurrency(product.costPrice, currentAppCurrency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Results */}
            {searchResults.customers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <UserRound className="mr-2 h-4 w-4" />
                  Customers ({searchResults.customers.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        onNavigate("customers")
                        onClose()
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {customer.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {customer.phone}
                            </div>
                          </div>
                        </div>
                        <Badge variant={customer.type === "frequent" ? "default" : "secondary"}>{customer.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deal Results */}
            {searchResults.deals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Gift className="mr-2 h-4 w-4" />
                  Deals ({searchResults.deals.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        onNavigate("deals")
                        onClose()
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{deal.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{deal.description}</div>
                          <div className="text-sm text-gray-500 mt-1">Expires: {formatDate(deal.expiryDate)}</div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">{deal.discountPercentage}% OFF</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Results */}
            {searchResults.users.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Users ({searchResults.users.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.users.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        onNavigate("users")
                        onClose()
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{user.email}</div>
                        </div>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vendor Results */}
            {searchResults.vendors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Building2 className="mr-2 h-4 w-4" />
                  Vendors ({searchResults.vendors.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        onNavigate("vendors")
                        onClose()
                      }}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{vendor.name}</div>
                        <div className="text-sm text-gray-600 mt-1 space-y-1">
                          <div>{vendor.email}</div>
                          <div>{vendor.phone}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trash Results */}
            {searchResults.trash.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Trash ({searchResults.trash.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.trash.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        onNavigate("trash")
                        onClose()
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{(item.data as any).name || item.originalId}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Type: {item.type} | Deleted: {formatDate(item.deletedAt)}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          Deleted
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchTerm && totalResults === 0 && (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try searching with different keywords or check your spelling.
                </p>
              </div>
            )}

            {/* Empty State */}
            {!searchTerm && (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Start typing to search</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Search across all your data including tracking IDs, invoices, products, customers, and more.
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> to close
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
