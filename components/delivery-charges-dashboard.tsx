"use client"

import { useMemo } from "react"
import type { ReactNode } from "react"
import type { Invoice } from "@/types/app"
import { formatCurrency } from "@/lib/utils"
import { CalendarDays, CalendarRange, Truck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface DeliveryChargesDashboardProps {
  invoices: Invoice[]
  currentAppCurrency: string
}

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

export function DeliveryChargesDashboard({ invoices, currentAppCurrency }: DeliveryChargesDashboardProps) {
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
    }
  }, [invoicesWithCharges])

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard title="Today" amount={totals.today} currency={currentAppCurrency} icon={<CalendarDays className="h-5 w-5" />} />
        <SummaryCard title="This Month" amount={totals.thisMonth} currency={currentAppCurrency} icon={<CalendarRange className="h-5 w-5" />} />
        <SummaryCard title="This Year" amount={totals.thisYear} currency={currentAppCurrency} icon={<CalendarRange className="h-5 w-5" />} />
      </div>
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
