import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatCurrency, formatCurrencyCompact, formatDate } from '#/lib/utils'
import { Card, CardContent } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { BottomNav } from '#/components/bottom-nav'
import { AppHeader } from '#/components/app-header'

type Account = {
  id: number
  revolutAccountId: string
  name: string
  type: string
  balance: number
  currency: string
}

type Transaction = {
  id: number
  revolutTransactionId: string
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

type DashboardData = {
  accounts: Account[]
  transactions: Transaction[]
  investments: Investment[]
  userName: string
  userImage: string | undefined
}

const getDashboardData = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession()
  if (!session) return null

  const [accountsRes, transactionsRes, investmentsRes] = await Promise.all([
    api.getAccounts(),
    api.getTransactions({ limit: 10 }),
    api.getInvestments(),
  ])

  return {
    accounts: accountsRes.accounts ?? [],
    transactions: transactionsRes.transactions ?? [],
    investments: investmentsRes.investments ?? [],
    userName: session.userName,
    userImage: session.userImage,
  } as DashboardData
})

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const data = await getDashboardData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: DashboardPage,
})

function DashboardPage() {
  const { accounts, transactions, investments, userName, userImage } = Route.useLoaderData()
  const [showAllAccounts, setShowAllAccounts] = useState(false)

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const totalInvested = investments.reduce((sum, i) => sum + (i.totalValue ?? 0), 0)
  const totalPl = investments.reduce((sum, i) => sum + (i.pl ?? 0), 0)
  const monthlySpend = transactions
    .filter((t) => t.direction === "debit")
    .reduce((sum, t) => sum + t.amount, 0)

  const displayAccounts = showAllAccounts ? accounts : accounts.slice(0, 3)
  const hasMoreAccounts = accounts.length > 3

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Finances" userName={userName} userImage={userImage} />

      <main className="max-w-[600px] mx-auto px-5 pt-6 space-y-6">
        {/* Total Balance */}
        <section className="animate-in stagger-1">
          <p className="text-xs text-[var(--color-ink-tertiary)] font-medium uppercase tracking-wider">Total Balance</p>
          <p className="text-3xl font-bold tracking-tight mt-1">{formatCurrency(totalBalance)}</p>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--color-income)]" />
              <span className="text-[var(--color-ink-secondary)]">Income</span>
              <span className="font-medium text-[var(--color-income)]">
                {formatCurrencyCompact(transactions.filter((t) => t.direction === "credit").reduce((s, t) => s + t.amount, 0))}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--color-spend)]" />
              <span className="text-[var(--color-ink-secondary)]">Spent</span>
              <span className="font-medium text-[var(--color-spend)]">
                {formatCurrencyCompact(monthlySpend)}
              </span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="flex gap-3 animate-in stagger-2">
          <Link to="/transactions" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] py-2.5 text-sm font-medium press-scale hover:bg-[var(--color-surface-sunken)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            Transactions
          </Link>
          <Link to="/investments" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] py-2.5 text-sm font-medium press-scale hover:bg-[var(--color-surface-sunken)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
            Investments
          </Link>
          <Link to="/expenses" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] py-2.5 text-sm font-medium press-scale hover:bg-[var(--color-surface-sunken)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
            Expenses
          </Link>
        </div>

        {/* Accounts */}
        <section className="animate-in stagger-3">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold">Accounts</h2>
            <button
              onClick={() => setShowAllAccounts(!showAllAccounts)}
              className="text-xs text-[var(--color-accent)] font-medium"
            >
              {hasMoreAccounts ? (showAllAccounts ? "Show less" : `+${accounts.length - 3} more`) : ""}
            </button>
          </div>
          <div className="space-y-2">
            {displayAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-4 py-3 press-scale">
                <div className="flex items-center gap-3">
                  <div className={`size-9 rounded-lg flex items-center justify-center ${
                    account.type === "current" ? "bg-[var(--color-accent-subtle)]" :
                    account.type === "savings" ? "bg-[var(--color-success-subtle)]" :
                    account.type === "investment" ? "bg-[var(--color-accent-muted)]" :
                    "bg-[var(--color-warning-subtle)]"
                  }`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={account.type === "current" ? "var(--color-accent)" : account.type === "savings" ? "var(--color-success)" : account.type === "investment" ? "var(--color-invested)" : "var(--color-warning)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {account.type === "crypto" ? (
                        <><line x1="12" y1="1" x2="12" y2="23" /><polyline points="17 5 12 10 7 5" /><polyline points="7 19 12 14 17 19" /></>
                      ) : (
                        <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{account.name}</p>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">{account.type.charAt(0).toUpperCase() + account.type.slice(1)}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(account.balance, account.currency)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Investment Summary */}
        {investments.length > 0 && (
          <section className="animate-in stagger-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold">Investments</h2>
              <Link to="/investments" className="text-xs text-[var(--color-accent)] font-medium">See all</Link>
            </div>
            <Card>
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[var(--color-ink-tertiary)]">Portfolio Value</p>
                  <p className="text-xs text-[var(--color-ink-tertiary)]">Total P&amp;L</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold">{formatCurrency(totalInvested)}</p>
                  <p className={`text-sm font-medium ${totalPl >= 0 ? "text-[var(--color-income)]" : "text-[var(--color-spend)]"}`}>
                    {totalPl >= 0 ? "+" : ""}{formatCurrency(totalPl)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Recent Transactions */}
        <section className="animate-in stagger-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold">Recent Transactions</h2>
            <Link to="/transactions" className="text-xs text-[var(--color-accent)] font-medium">See all</Link>
          </div>
          <div className="divide-y divide-[var(--color-border)] rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  tx.direction === "credit" ? "bg-[var(--color-success-subtle)]" : "bg-[var(--color-danger-subtle)]"
                }`}>
                  {tx.direction === "credit" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-income)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-spend)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 5 5 12" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.merchantName ?? tx.description}</p>
                  <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
                    {tx.category ?? tx.type} · {formatDate(tx.transactionDate)}
                    {tx.isPending && <span className="ml-1.5 text-[var(--color-warning)]">Pending</span>}
                  </p>
                </div>
                <p className={`text-sm font-semibold flex-shrink-0 ${
                  tx.direction === "credit" ? "text-[var(--color-income)]" : ""
                }`}>
                  {tx.direction === "credit" ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
                </p>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-ink-tertiary)]">
                No transactions yet. Load demo data to get started.
              </div>
            )}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
