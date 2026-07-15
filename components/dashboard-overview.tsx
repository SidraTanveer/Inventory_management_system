"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Product, Invoice } from "@/types/app"
import type { User } from "@/types/auth"
import { formatCurrency } from "@/lib/utils"
import {
  Package,
  FileText,
  Users,
  DollarSign,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  Star,
  Activity,
  Calculator,
  Percent,
  RefreshCw,
  Calendar,
  BarChart,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardOverviewProps {
  products: Product[]
  invoices: Invoice[]
  users: User[]
  guestUsers: User[]
  onViewInvoice: (invoice: Invoice) => void
  onCreateInvoice: () => void
  currentAppCurrency: string
}

export function DashboardOverview({
  products,
  invoices,
  users,
  guestUsers,
  onViewInvoice,
  onCreateInvoice,
  currentAppCurrency,
}: DashboardOverviewProps) {
  // Monthly filter state
  const currentMonth = new Date().getMonth() + 1 // 1-indexed
  const currentYear = new Date().getFullYear()

  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString())
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [showAllTime, setShowAllTime] = useState(false)

  // Available years from invoices
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    if (invoices && Array.isArray(invoices)) {
      invoices.forEach((invoice) => {
        const year = new Date(invoice.createdAt).getFullYear().toString()
        years.add(year)
      })
    }
    years.add(currentYear.toString())
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [invoices, currentYear])

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  const getMonthName = (monthValue: string) => {
    const month = months.find((m) => m.value === monthValue)
    return month ? month.label : ""
  }

  // Filter invoices based on selected month/year or show all time
  const filteredInvoices = useMemo(() => {
    if (!invoices || !Array.isArray(invoices)) return []
    if (showAllTime) return invoices

    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt)
      return (
        invoiceDate.getMonth() + 1 === Number.parseInt(selectedMonth) &&
        invoiceDate.getFullYear() === Number.parseInt(selectedYear)
      )
    })
  }, [invoices, selectedMonth, selectedYear, showAllTime])

  // Calculate yearly profit for selected year
  const yearlyProfit = useMemo(() => {
    if (!invoices || !Array.isArray(invoices)) return 0
    return invoices
      .filter((invoice) => {
        const invoiceDate = new Date(invoice.createdAt)
        return invoiceDate.getFullYear() === Number.parseInt(selectedYear)
      })
      .reduce((sum, invoice) => sum + (Number(invoice.totalProfit) || 0), 0)
  }, [invoices, selectedYear])

  // Calculate metrics based on filtered invoices
  const totalProducts = products.length
  const totalStockValue = useMemo(() => {
    if (!products || !Array.isArray(products)) return 0
    return products.reduce((sum, product) => sum + (Number(product.stock) || 0) * (Number(product.costPrice) || 0), 0)
  }, [products])

  const totalInvoices = filteredInvoices.length
  const totalSalesValue = useMemo(() => {
    return filteredInvoices.reduce((sum, invoice) => sum + (Number(invoice.totalAmount) || 0), 0)
  }, [filteredInvoices])

  const totalCostValue = useMemo(() => {
    return filteredInvoices.reduce((sum, invoice) => sum + (Number(invoice.totalCost) || 0), 0)
  }, [filteredInvoices])

  const totalProfit = useMemo(() => {
    return filteredInvoices.reduce((sum, invoice) => sum + (Number(invoice.totalProfit) || 0), 0)
  }, [filteredInvoices])

  const totalUsers = users.length + guestUsers.length

  // Calculate profit margin percentage
  const profitMargin = useMemo(() => {
    const sales = Number(totalSalesValue) || 0
    const profit = Number(totalProfit) || 0
    return sales > 0 ? (profit / sales) * 100 : 0
  }, [totalSalesValue, totalProfit])

  // Low stock products (less than 10 items)
  const lowStockProducts = useMemo(() => {
    return products.filter((product) => product.stock < 10)
  }, [products])

  // Top selling products based on filtered invoice items
  const topSellingProducts = useMemo(() => {
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {}

    filteredInvoices.forEach((invoice) => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach((item) => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.productName,
              quantity: 0,
              revenue: 0,
            }
          }
          productSales[item.productId].quantity += Number(item.quantity) || 0
          productSales[item.productId].revenue += (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
        })
      }
    })

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [filteredInvoices])

  const recentInvoices = useMemo(() => {
    const uniqueById = new Map<string, Invoice>()
    filteredInvoices.forEach((invoice) => {
      if (invoice?.id && !uniqueById.has(invoice.id)) {
        uniqueById.set(invoice.id, invoice)
      }
    })

    return Array.from(uniqueById.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [filteredInvoices])

  // State for Profit Calculator
  const [calcUnitPrice, setCalcUnitPrice] = useState<number | string>("")
  const [calcCostPrice, setCalcCostPrice] = useState<number | string>("")
  const [calcQuantity, setCalcQuantity] = useState<number | string>("")

  // Calculations for Profit Calculator
  const calculatedSales = useMemo(() => {
    const unitPrice = Number.parseFloat(calcUnitPrice as string) || 0
    const quantity = Number.parseFloat(calcQuantity as string) || 0
    return unitPrice * quantity
  }, [calcUnitPrice, calcQuantity])

  const calculatedCost = useMemo(() => {
    const costPrice = Number.parseFloat(calcCostPrice as string) || 0
    const quantity = Number.parseFloat(calcQuantity as string) || 0
    return costPrice * quantity
  }, [calcCostPrice, calcQuantity])

  const calculatedProfit = useMemo(() => {
    return calculatedSales - calculatedCost
  }, [calculatedSales, calculatedCost])

  const calculatedProfitPercentage = useMemo(() => {
    return calculatedSales > 0 ? (calculatedProfit / calculatedSales) * 100 : 0
  }, [calculatedProfit, calculatedSales])

  // Two-month comparison data
  const targetMonthProfit = useMemo(() => {
    if (showAllTime) return totalProfit
    if (!invoices || !Array.isArray(invoices)) return 0

    return invoices
      .filter((invoice) => {
        const invoiceDate = new Date(invoice.createdAt)
        return (
          invoiceDate.getMonth() + 1 === Number.parseInt(selectedMonth) &&
          invoiceDate.getFullYear() === Number.parseInt(selectedYear)
        )
      })
      .reduce((sum, invoice) => sum + (Number(invoice.totalProfit) || 0), 0)
  }, [invoices, selectedMonth, selectedYear, showAllTime, totalProfit])

  const comparisonMonthProfit = useMemo(() => {
    if (showAllTime) return 0
    if (!invoices || !Array.isArray(invoices)) return 0

    let prevMonth = Number.parseInt(selectedMonth) - 1
    let prevYear = Number.parseInt(selectedYear)
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear -= 1
    }

    return invoices
      .filter((invoice) => {
        const invoiceDate = new Date(invoice.createdAt)
        return invoiceDate.getMonth() + 1 === prevMonth && invoiceDate.getFullYear() === prevYear
      })
      .reduce((sum, invoice) => sum + (Number(invoice.totalProfit) || 0), 0)
  }, [invoices, selectedMonth, selectedYear, showAllTime])

  const profitChangePercentage = useMemo(() => {
    const target = Number(targetMonthProfit) || 0
    const comparison = Number(comparisonMonthProfit) || 0
    if (showAllTime || comparison === 0) {
      return target > 0 ? 100 : 0
    }
    return ((target - comparison) / Math.abs(comparison)) * 100
  }, [targetMonthProfit, comparisonMonthProfit, showAllTime])

  const handleResetToCurrentMonth = () => {
    setSelectedMonth(currentMonth.toString())
    setSelectedYear(currentYear.toString())
    setShowAllTime(false)
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section with Month Filter */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Glow With Vibes</h1>
            <p className="text-purple-100">
              {showAllTime
                ? "Your complete business overview - All time data"
                : `${getMonthName(selectedMonth)} ${selectedYear} Dashboard - Track your monthly performance`}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 rounded-lg p-4">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Month/Year Filter Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">View Period:</span>
          </div>

          <Select
            value={showAllTime ? "all" : selectedMonth}
            onValueChange={(value) => {
              if (value === "all") {
                setShowAllTime(true)
              } else {
                setShowAllTime(false)
                setSelectedMonth(value)
              }
            }}
          >
            <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!showAllTime && (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 bg-white/20 border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToCurrentMonth}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Current Month
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
            <div className="bg-blue-100 p-2 rounded-full">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalProducts}</div>
            <p className="text-sm text-gray-500 mt-1">
              Inventory Value: {formatCurrency(totalStockValue, currentAppCurrency)}
            </p>
            <div className="mt-2">
              <Badge variant={lowStockProducts.length > 0 ? "destructive" : "secondary"}>
                {lowStockProducts.length} Low Stock
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {showAllTime ? "Total Sales" : "Monthly Sales"}
            </CardTitle>
            <div className="bg-green-100 p-2 rounded-full">
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(totalSalesValue, currentAppCurrency)}
            </div>
            <p className="text-sm text-gray-500 mt-1">From {totalInvoices} invoices</p>
            <div className="flex items-center mt-2">
              {!showAllTime && (
                <>
                  {profitChangePercentage >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${profitChangePercentage >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {profitChangePercentage >= 0 ? "+" : ""}
                    {profitChangePercentage.toFixed(1)}% vs last month
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {showAllTime ? "Total Profit" : "Monthly Profit"}
            </CardTitle>
            <div className="bg-purple-100 p-2 rounded-full">
              <DollarSign className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalProfit, currentAppCurrency)}</div>
            <div className="flex items-center mt-1 space-x-2">
              <Percent className="h-4 w-4 text-purple-600" />
              <p className="text-sm text-purple-600 font-medium">{profitMargin.toFixed(1)}% margin</p>
            </div>
            <div className="mt-2">
              <Progress value={Math.min(profitMargin, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {showAllTime ? "Active Users" : `${selectedYear} Yearly Profit`}
            </CardTitle>
            <div className="bg-orange-100 p-2 rounded-full">
              {showAllTime ? (
                <Users className="h-4 w-4 text-orange-600" />
              ) : (
                <BarChart className="h-4 w-4 text-orange-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showAllTime ? (
              <>
                <div className="text-3xl font-bold text-gray-900">{totalUsers}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {users.length} Staff + {guestUsers.length} Guests
                </p>
                <div className="flex items-center mt-2">
                  <div className="flex space-x-1">
                    {users.slice(0, 3).map((user, index) => (
                      <div
                        key={user.id}
                        className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-xs text-white font-medium"
                      >
                        {user.name.charAt(0)}
                      </div>
                    ))}
                    {users.length > 3 && (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-600">
                        +{users.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(yearlyProfit, currentAppCurrency)}
                </div>
                <p className="text-sm text-gray-500 mt-1">Total profit for {selectedYear}</p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <BarChart className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600 font-medium">Full Year Performance</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Profit/Loss Comparison */}
      {!showAllTime && (
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-pink-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5 text-pink-600" />
              Monthly Profit Performance Comparison
            </CardTitle>
            <CardDescription>
              Compare profit for{" "}
              <span className="font-semibold">
                {getMonthName(selectedMonth)} {selectedYear}
              </span>{" "}
              vs. previous month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-blue-700 font-medium">
                  Current Month ({getMonthName(selectedMonth)} {selectedYear})
                </p>
                <div className="text-3xl font-bold text-blue-800 mt-2">
                  {formatCurrency(targetMonthProfit, currentAppCurrency)}
                </div>
                <div className="flex items-center mt-2">
                  <Percent className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-sm text-blue-600">
                    {totalSalesValue > 0 ? ((targetMonthProfit / totalSalesValue) * 100).toFixed(1) : "0"}% margin
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <p className="text-sm text-gray-700 font-medium">
                  Previous Month (
                  {selectedMonth === "1"
                    ? `${getMonthName("12")} ${Number.parseInt(selectedYear) - 1}`
                    : `${getMonthName((Number.parseInt(selectedMonth) - 1).toString())} ${selectedYear}`}
                  )
                </p>
                <div className="text-3xl font-bold text-gray-800 mt-2">
                  {formatCurrency(comparisonMonthProfit, currentAppCurrency)}
                </div>
                <div className="flex items-center mt-2">
                  <Percent className="h-4 w-4 text-gray-600 mr-1" />
                  <span className="text-sm text-gray-600">Previous period</span>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
              <div className="flex items-center justify-center">
                {profitChangePercentage >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-500 mr-3" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-500 mr-3" />
                )}
                <div className="text-center">
                  <span
                    className={`text-2xl font-bold ${profitChangePercentage >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {profitChangePercentage >= 0 ? "+" : ""}
                    {profitChangePercentage.toFixed(2)}%
                  </span>
                  <p className="text-sm text-gray-600 mt-1">Month-over-Month Change</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profit Calculator with Percentage */}
      <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5 text-blue-600" />
            Profit Calculator
          </CardTitle>
          <CardDescription>Calculate potential profit for individual products or sales scenarios.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit-price">Unit Price ({currentAppCurrency})</Label>
              <Input
                id="unit-price"
                type="number"
                placeholder="e.g., 1000"
                value={calcUnitPrice}
                onChange={(e) => setCalcUnitPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost-price">Cost Price ({currentAppCurrency})</Label>
              <Input
                id="cost-price"
                type="number"
                placeholder="e.g., 700"
                value={calcCostPrice}
                onChange={(e) => setCalcCostPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="e.g., 5"
                value={calcQuantity}
                onChange={(e) => setCalcQuantity(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">Total Sales</p>
              <p className="text-xl font-bold text-green-800">{formatCurrency(calculatedSales, currentAppCurrency)}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">Total Cost</p>
              <p className="text-xl font-bold text-red-800">{formatCurrency(calculatedCost, currentAppCurrency)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">Total Profit</p>
              <p className="text-xl font-bold text-purple-800">
                {formatCurrency(calculatedProfit, currentAppCurrency)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-blue-700 flex items-center justify-center">
                <Percent className="h-4 w-4 mr-1" />
                Profit Margin
              </p>
              <p className="text-xl font-bold text-blue-800">{calculatedProfitPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="mr-2 h-5 w-5 text-yellow-500" />
              {showAllTime
                ? "Top Selling Products (All Time)"
                : `Top Products - ${getMonthName(selectedMonth)} ${selectedYear}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSellingProducts.length > 0 ? (
              <div className="space-y-4">
                {topSellingProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.quantity} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(product.revenue, currentAppCurrency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {showAllTime ? "No sales data available" : `No sales in ${getMonthName(selectedMonth)} ${selectedYear}`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              Low Stock Alert
              {lowStockProducts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {lowStockProducts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">{product.stock} left</Badge>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{lowStockProducts.length - 5} more products need restocking
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-500">All products are well stocked!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-blue-500" />
            {showAllTime ? "Recent Invoices (All Time)" : `${getMonthName(selectedMonth)} ${selectedYear} Invoices`}
          </CardTitle>
          <Button
            size="sm"
            onClick={onCreateInvoice}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
          </Button>
        </CardHeader>
        <CardContent>
          {recentInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Profit %</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((invoice, index) => (
                    <TableRow key={`${invoice.id || "no-id"}-${invoice.createdAt || "no-date"}-${index}`} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{invoice.id || "N/A"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.customerName}</p>
                          <p className="text-sm text-gray-500">{invoice.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.totalAmount, currentAppCurrency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {invoice.totalProfit >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span
                            className={
                              invoice.totalProfit >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"
                            }
                          >
                            {formatCurrency(invoice.totalProfit, currentAppCurrency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Percent className="h-3 w-3 text-blue-600 mr-1" />
                          <span className="font-medium text-blue-600">
                            {(Number(invoice.profitPercentage) || 0).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">{invoice.createdAt}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === "completed"
                              ? "default"
                              : invoice.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => onViewInvoice(invoice)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">
                {showAllTime
                  ? "No invoices created yet"
                  : `No invoices in ${getMonthName(selectedMonth)} ${selectedYear}`}
              </p>
              <Button
                onClick={onCreateInvoice}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Invoice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
