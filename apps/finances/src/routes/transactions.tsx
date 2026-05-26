import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatCurrency, formatDate } from '#/lib/utils'
import { AppHeader } from '#/components/app-header'
import { BottomNav } from '#/components/bottom-nav'

type Transaction = {
  id: number
  type: string
  direction: string
  amount: number
  currency: string
  description: string
  merchantName: string | null
  category: string | null
  transactionDate: string
  isPending: boolean
}

const getTransactionsData = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession()
  if (!session) return null
  const res = await api.getTransactions({ limit: 100 })
  return { transactions: res.transactions ?? [], userName: session.userName, userImage: session.userImage }
})

export const Route = createFileRoute('/transactions')({
  beforeLoad: async () => {
    const data = await getTransactionsData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: TransactionsPage,
})

function TransactionsPage() {
  const { transactions, userName, userImage } = Route.useLoaderData()

  const groupByDate = (txs: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {}
    for (const tx of txs) {
      const key = tx.transactionDate.split("T")[0]
      if (!groups[key]) groups[key] = []
      groups[key].push(tx)
    }
    return groups
  }

  const grouped = groupByDate(transactions)
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Transactions" userName={userName} userImage={userImage} />
      <main className="max-w-[600px] mx-auto px-5 pt-6 space-y-6">
        <div className="space-y-4">
          {sortedDates.map((dateKey) => {
            const txs = grouped[dateKey]
            const dayTotal = txs.reduce((sum, t) => sum + (t.direction === "debit" ? -t.amount : t.amount), 0)
            return (
              <section key={dateKey} className="animate-in">
                <div className="flex items-baseline justify-between mb-2 px-1">
                  <p className="text-[13px] font-semibold text-[var(--color-ink-secondary)]">
                    {formatDate(dateKey)}
                  </p>
                  <p className={`text-xs font-medium ${dayTotal >= 0 ? "text-[var(--color-income)]" : ""}`}>
                    {dayTotal >= 0 ? "+" : ""}{formatCurrency(dayTotal)}
                  </p>
                </div>
                <div className="divide-y divide-[var(--color-border)] rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                  {txs.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        tx.direction === "credit" ? "bg-[var(--color-success-subtle)]" : "bg-[var(--color-danger-subtle)]"
                      }`}>
                        {tx.type === "card_payment" ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={tx.direction === "credit" ? "var(--color-income)" : "var(--color-spend)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                        ) : tx.type === "topup" ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={tx.direction === "credit" ? "var(--color-income)" : "var(--color-spend)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={tx.direction === "credit" ? "var(--color-income)" : "var(--color-spend)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.merchantName ?? tx.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {tx.category && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-ink-tertiary)]">{tx.category}</span>}
                          {tx.isPending && <span className="text-[11px] text-[var(--color-warning)]">Pending</span>}
                        </div>
                      </div>
                      <p className={`text-sm font-semibold flex-shrink-0 ${
                        tx.direction === "credit" ? "text-[var(--color-income)]" : ""
                      }`}>
                        {tx.direction === "credit" ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
          {transactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--color-ink-tertiary)]">No transactions found.</p>
              <Link to="/dashboard" className="text-sm text-[var(--color-accent)] font-medium mt-2 inline-block">Back to dashboard</Link>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
