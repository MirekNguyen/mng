import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatCurrency, formatPercent } from '#/lib/utils'
import { Card, CardContent } from '#/components/ui/card'
import { AppHeader } from '#/components/app-header'
import { BottomNav } from '#/components/bottom-nav'
import { ChartContainer, ChartTooltipContent } from '#/components/ui/chart'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

type Investment = {
  id: number
  ticker: string | null
  name: string
  type: string
  quantity: number
  currentPrice: number
  totalValue: number
  pl: number
  plPercent: number
}

const getInvestmentsData = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession()
  if (!session) return null
  const res = await api.getInvestments()
  return { investments: res.investments ?? [], userName: session.userName, userImage: session.userImage }
})

export const Route = createFileRoute('/investments')({
  beforeLoad: async () => {
    const data = await getInvestmentsData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: InvestmentsPage,
})

const TYPE_COLORS: Record<string, string> = {
  etf: "#2563eb",
  stock: "#16a34a",
  crypto: "#f59e0b",
  commodity: "#8b5cf6",
}

function InvestmentsPage() {
  const { investments, userName, userImage } = Route.useLoaderData()
  const [filter, setFilter] = useState<string>("all")

  const totalValue = investments.reduce((s, i) => s + (i.totalValue ?? 0), 0)
  const totalPl = investments.reduce((s, i) => s + (i.pl ?? 0), 0)

  const filtered = filter === "all" ? investments : investments.filter((i) => i.type === filter)
  const types = [...new Set(investments.map((i) => i.type))]

  const pieData = investments
    .filter((i) => (i.totalValue ?? 0) > 0)
    .map((i) => ({
      name: i.ticker ?? i.name,
      value: i.totalValue ?? 0,
      color: TYPE_COLORS[i.type] ?? "#9ca3af",
    }))

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Investments" userName={userName} userImage={userImage} />
      <main className="max-w-[600px] mx-auto px-5 pt-6 space-y-6">
        {/* Portfolio Summary */}
        <section className="animate-in stagger-1">
          <Card>
            <CardContent className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-[var(--color-ink-tertiary)]">Portfolio Value</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(totalValue)}</p>
                  <p className={`text-sm font-medium mt-0.5 ${totalPl >= 0 ? "text-[var(--color-income)]" : "text-[var(--color-spend)]"}`}>
                    {totalPl >= 0 ? "+" : ""}{formatCurrency(totalPl)} ({formatPercent(totalPl / (totalValue - totalPl) * 100)})
                  </p>
                </div>
                <div className="h-24 w-24">
                  {pieData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={22} outerRadius={38} dataKey="value" paddingAngle={2}>
                          {pieData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent config={{ value: { label: "Value" } }} formatter={(v) => formatCurrency(v)} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              {/* Allocation Summary */}
              <div className="flex gap-4">
                {types.map((type) => {
                  const typeTotal = investments.filter((i) => i.type === type).reduce((s, i) => s + (i.totalValue ?? 0), 0)
                  const pct = totalValue > 0 ? (typeTotal / totalValue * 100) : 0
                  return (
                    <div key={type} className="text-center">
                      <p className="text-xs text-[var(--color-ink-tertiary)] capitalize">{type}</p>
                      <p className="text-sm font-semibold">{pct.toFixed(0)}%</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Type Filter */}
        <div className="flex gap-2 animate-in stagger-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium press-scale transition-colors ${
              filter === "all" ? "bg-[var(--color-ink)] text-[var(--color-surface)]" : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-border)]"
            }`}
          >
            All
          </button>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium press-scale transition-colors capitalize ${
                filter === type ? "bg-[var(--color-ink)] text-[var(--color-surface)]" : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-border)]"
              }`}
            >
              {type}s
            </button>
          ))}
        </div>

        {/* Holdings */}
        <section className="animate-in stagger-3">
          <div className="divide-y divide-[var(--color-border)] rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
            {filtered.map((inv) => (
              <div key={inv.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: TYPE_COLORS[inv.type] ?? "#9ca3af" }} />
                    <p className="text-sm font-medium">{inv.ticker ?? inv.name}</p>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-ink-tertiary)] capitalize">{inv.type}</span>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(inv.totalValue ?? 0)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--color-ink-tertiary)]">{inv.quantity} {inv.type === "crypto" ? "" : "shares"} @ {formatCurrency(inv.currentPrice ?? 0)}</p>
                  <p className={`text-xs font-medium ${(inv.pl ?? 0) >= 0 ? "text-[var(--color-income)]" : "text-[var(--color-spend)]"}`}>
                    {formatPercent(inv.plPercent ?? 0)}
                  </p>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-ink-tertiary)]">
                No {filter !== "all" ? filter : ""} investments found.
              </div>
            )}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
