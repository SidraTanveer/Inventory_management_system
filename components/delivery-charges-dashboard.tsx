"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { Invoice } from "@/types/app"
import { formatCurrency } from "@/lib/utils"
import { CalendarDays, CalendarRange, Truck, Users, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DeliveryChargesDashboardProps {
  invoices: Invoice[]
  currentAppCurrency: string
}

type Period = "daily" | "monthly" | "yearly"

const getDateKey = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const getCurrentDateKey = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const getCurrentMonthKey = () => getCurrentDateKey().slice(0, 7)

export function DeliveryChargesDashboard({ invoices, currentAppCurrency }: DeliveryChargesDashboardProps) {
  const [period, setPeriod] = useState<Period>("daily")
  const [selectedDay, setSelectedDay] = useState(getCurrentDateKey)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey)
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()))

  const invoicesWithCharges = useMemo(
    () =>
      invoices
        .map((invoice) => ({ invoice, dateKey: getDateKey(invoice.createdAt) }))
        .filter(({ invoice, dateKey }) => {
          const charges = Number(invoice.deliveryCharges)
          return dateKey !== null && Number.isFinite(charges) && charges > 0
        }),
    [invoices],
  )

  const years = useMemo(() => {
    const availableYears = new Set<string>()
    for (const { dateKey } of invoicesWithCharges) {
      if (dateKey) availableYears.add(dateKey.slice(0, 4))
    }
    availableYears.add(String(new Date().getFullYear()))
    return Array.from(availableYears).sort((a, b) => b.localeCompare(a))
  }, [invoicesWithCharges])

  const currentPeriodInvoices = useMemo(() => {
    return invoicesWithCharges.filter(({ dateKey }) => {
      if (period === "daily") return dateKey === selectedDay
      if (period === "monthly") return dateKey?.slice(0, 7) === selectedMonth
      return dateKey?.slice(0, 4) === selectedYear
    })
  }, [invoicesWithCharges, period, selectedDay, selectedMonth, selectedYear])

  const totals = useMemo(() => {
    const sumCharges = (matches: (dateKey: string) => boolean) =>
      invoicesWithCharges.reduce(
        (total, { invoice, dateKey }) =>
          dateKey && matches(dateKey) ? total + Number(invoice.deliveryCharges) : total,
        0,
      )
    const today = getCurrentDateKey()
    const thisMonth = today.slice(0, 7)
    const thisYear = today.slice(0, 4)

    return {
      today: sumCharges((dateKey) => dateKey === today),
      thisMonth: sumCharges((dateKey) => dateKey.slice(0, 7) === thisMonth),
      thisYear: sumCharges((dateKey) => dateKey.slice(0, 4) === thisYear),
      allTime: sumCharges(() => true),
    }
  }, [invoicesWithCharges])

  const customerTotals = useMemo(() => {
    const customers = new Map<
      string,
      { customerName: string; customerPhone: string; charges: number; invoiceCount: number }
    >()

    for (const { invoice } of currentPeriodInvoices) {
      const customerName = invoice.customerName.trim() || "Unknown customer"
      const customerPhone = invoice.customerPhone?.trim() || ""
      const key = customerPhone.toLocaleLowerCase() || customerName.toLocaleLowerCase()
      const current = customers.get(key) ?? { customerName, customerPhone, charges: 0, invoiceCount: 0 }
      current.charges += Number(invoice.deliveryCharges)
      current.invoiceCount += 1
      customers.set(key, current)
    }

    return Array.from(customers.values()).sort((a, b) => b.charges - a.charges)
  }, [currentPeriodInvoices])

  const selectedPeriodTotal = currentPeriodInvoices.reduce(
    (total, { invoice }) => total + Number(invoice.deliveryCharges),
    0,
  )
  const periodDescription =
    period === "daily"
      ? selectedDay
      : period === "monthly"
        ? selectedMonth
        : selectedYear

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Truck className="h-6 w-6 text-purple-600" />
          Delivery Charges
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Customer delivery charges tracked separately from revenue and profit.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Today" amount={totals.today} currency={currentAppCurrency} icon={<CalendarDays className="h-5 w-5" />} />
        <SummaryCard title="This Month" amount={totals.thisMonth} currency={currentAppCurrency} icon={<CalendarRange className="h-5 w-5" />} />
        <SummaryCard title="This Year" amount={totals.thisYear} currency={currentAppCurrency} icon={<Users className="h-5 w-5" />} />
        <SummaryCard title="All Time" amount={totals.allTime} currency={currentAppCurrency} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Customer Charges</CardTitle>
            <CardDescription>
              {periodDescription} · {currentPeriodInvoices.length} invoice
              {currentPeriodInvoices.length === 1 ? "" : "s"} ·{" "}
              {formatCurrency(selectedPeriodTotal, currentAppCurrency)}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Delivery charge time period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            {period === "daily" && (
              <Input
                type="date"
                aria-label="Select delivery charge day"
                value={selectedDay}
                onChange={(event) => setSelectedDay(event.target.value)}
                className="w-full sm:w-auto"
              />
            )}
            {period === "monthly" && (
              <Input
                type="month"
                aria-label="Select delivery charge month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full sm:w-auto"
              />
            )}
            {period === "yearly" && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-36" aria-label="Select delivery charge year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {customerTotals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead className="text-right">Delivery Charges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerTotals.map((customer) => (
                  <TableRow key={customer.customerPhone || customer.customerName}>
                    <TableCell className="font-medium">{customer.customerName}</TableCell>
                    <TableCell>{customer.customerPhone || "—"}</TableCell>
                    <TableCell>{customer.invoiceCount}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(customer.charges, currentAppCurrency)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={3}>Selected period total</TableCell>
                  <TableCell className="text-right">{formatCurrency(selectedPeriodTotal, currentAppCurrency)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
              No delivery charges recorded for this period.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  title,
  amount,
  currency,
  icon,
}: {
  title: string
  amount: number
  currency: string
  icon: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-gray-500">{title} delivery charges</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(amount, currency)}</p>
        </div>
        <span className="text-purple-600">{icon}</span>
      </CardContent>
    </Card>
  )
}
