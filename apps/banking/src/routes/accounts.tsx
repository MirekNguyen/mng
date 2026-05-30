import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatCurrency } from '#/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { AppHeader } from '#/components/app-header'
import { BottomNav } from '#/components/bottom-nav'

type Account = {
  id: number
  name: string
  type: string
  balance: number
  currency: string
  institution: string | null
  lastSync: string | null
}

const getAccountsData = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession()
  if (!session) return null
  const res = await api.getAccounts()
  return { accounts: res.accounts ?? [], userName: session.userName, userImage: session.userImage }
})

export const Route = createFileRoute('/accounts')({
  beforeLoad: async () => {
    const data = await getAccountsData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: AccountsPage,
})

function AccountsPage() {
  const { accounts, userName, userImage } = Route.useLoaderData()

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  const grouped = accounts.reduce<Record<string, Account[]>>((acc, a) => {
    const key = a.type
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const typeLabels: Record<string, string> = {
    current: "Current Accounts",
    savings: "Savings Accounts",
    investment: "Investment Accounts",
    crypto: "Crypto Wallets",
  }

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Accounts" userName={userName} userImage={userImage} />
      <main className="max-w-[600px] mx-auto px-5 pt-6 space-y-6">
        {/* Total Balance */}
        <section className="animate-in stagger-1">
          <p className="text-xs text-[var(--color-ink-tertiary)] font-medium uppercase tracking-wider">Total Balance</p>
          <p className="text-3xl font-bold tracking-tight mt-1">{formatCurrency(totalBalance)}</p>
        </section>

        {/* Accounts by Type */}
        {Object.entries(grouped).map(([type, accs]) => (
          <section key={type} className="animate-in">
            <h2 className="text-sm font-semibold mb-3">{typeLabels[type] ?? `${type.charAt(0).toUpperCase() + type.slice(1)} Accounts`}</h2>
            <div className="divide-y divide-[var(--color-border)] rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
              {accs.map((account) => (
                <div key={account.id} className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium">{account.name}</p>
                    <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
                      {account.institution ?? account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                      {account.lastSync && ` · Last synced ${new Date(account.lastSync).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(account.balance, account.currency)}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {accounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--color-ink-tertiary)]">No accounts connected yet.</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
