import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatCurrency } from '#/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { AppHeader } from '#/components/app-header'
import { BottomNav } from '#/components/bottom-nav'
import { ChartContainer, ChartTooltipContent } from '#/components/ui/chart'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

type Category = {
  name: string
  icon: string
  color: string
  budget: number
  spent: number
  count: number
}

const getExpensesData = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession()
  if (!session) return null
  const res = await api.getSpending()
  return { categories: res.categories ?? [], userName: session.userName, userImage: session.userImage }
})

export const Route = createFileRoute('/expenses')({
  beforeLoad: async () => {
    const data = await getExpensesData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: ExpensesPage,
})

function ExpensesPage() {
  const { categories, userName, userImage } = Route.useLoaderData()

  const totalSpent = categories.reduce((s, c) => s + c.spent, 0)
  const totalBudget = categories.reduce((s, c) => s + c.budget, 0)

  const chartData = categories
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .map((c) => ({
      name: c.name,
      spent: c.spent,
      budget: c.budget,
      color: c.color,
    }))

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Expenses" userName={userName} userImage={userImage} />
      <main className="max-w-[600px] mx-auto px-5 pt-6 space-y-6">
        {/* Monthly Summary */}
        <section className="animate-in stagger-1">
          <p className="text-xs text-[var(--color-ink-tertiary)] font-medium uppercase tracking-wider mb-1">This Month</p>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalSpent)}</p>
            {totalBudget > 0 && (
              <p className="text-sm text-[var(--color-ink-tertiary)]">
                of {formatCurrency(totalBudget)} budget
              </p>
            )}
          </div>
          {totalBudget > 0 && (
            <div className="mt-3 h-1.5 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
              />
            </div>
          )}
        </section>

        {/* Spending by Category - Chart */}
        {chartData.length > 0 && (
          <section className="animate-in stagger-2">
            <p className="text-sm font-semibold mb-3">Spending by Category</p>
            <Card>
              <CardContent className="px-4 py-3">
                <div className="space-y-3">
                  {chartData.map((item) => {
                    const pct = totalSpent > 0 ? (item.spent / totalSpent * 100) : 0
                    return (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">{formatCurrency(item.spent)}</span>
                            <span className="text-xs text-[var(--color-ink-tertiary)] ml-1.5">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color, width: `${Math.min(pct * 2, 100)}%` }}
                          />
                        </div>
                        {item.budget > 0 && (
                          <div className="flex justify-between mt-0.5">
                            <span className="text-[11px] text-[var(--color-ink-tertiary)]">{item.count} transactions</span>
                            <span className={`text-[11px] ${item.spent > item.budget ? "text-[var(--color-spend)]" : "text-[var(--color-ink-tertiary)]"}`}>
                              Budget: {formatCurrency(item.budget)}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Bar Chart */}
        {chartData.length > 0 && (
          <section className="animate-in stagger-3">
            <p className="text-sm font-semibold mb-3">Comparison</p>
            <Card>
              <CardContent className="px-2 py-3">
                <ChartContainer config={{ spent: { label: "Spent" }, budget: { label: "Budget" } }} className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barGap={2}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-ink-tertiary)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--color-ink-tertiary)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} />
                      <Tooltip content={<ChartTooltipContent config={{ spent: { label: "Spent" } }} formatter={(v) => formatCurrency(v)} />} />
                      <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </section>
        )}

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--color-ink-tertiary)]">No spending data yet.</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
