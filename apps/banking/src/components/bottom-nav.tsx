import { Link, useLocation } from '@tanstack/react-router'

const tabs = [
  {
    to: '/dashboard' as const,
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <path d="M4 10.4V19a1 1 0 0 0 1 1h4v-6h6v6h4a1 1 0 0 0 1-1v-8.6l-8-6.4-8 6.4z" fill="currentColor" />
        ) : (
          <path d="M4 10.4V19a1 1 0 0 0 1 1h4v-6h6v6h4a1 1 0 0 0 1-1v-8.6l-8-6.4-8 6.4z" stroke="currentColor" strokeWidth="1.5" />
        )}
      </svg>
    ),
  },
  {
    to: '/transactions' as const,
    label: 'Transactions',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <>
            <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
            <polyline points="19 8 12 1 5 8" fill="currentColor" />
            <polyline points="5 16 12 23 19 16" fill="currentColor" />
          </>
        ) : (
          <>
            <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="19 8 12 1 5 8" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="5 16 12 23 19 16" stroke="currentColor" strokeWidth="1.5" />
          </>
        )}
      </svg>
    ),
  },
  {
    to: '/investments' as const,
    label: 'Investments',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <>
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" fill="currentColor" />
            <polyline points="16 7 22 7 22 13" fill="currentColor" />
          </>
        ) : (
          <>
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="16 7 22 7 22 13" stroke="currentColor" strokeWidth="1.5" />
          </>
        )}
      </svg>
    ),
  },
  {
    to: '/accounts' as const,
    label: 'Accounts',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <>
            <rect x="2" y="5" width="20" height="14" rx="2" fill="currentColor" />
            <line x1="2" y1="10" x2="22" y2="10" stroke="var(--color-surface)" strokeWidth="1.5" />
          </>
        ) : (
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        )}
      </svg>
    ),
  },
]

export const BottomNav = () => {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 backdrop-blur-sm border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[600px] mx-auto flex items-center justify-around h-12">
        {tabs.map((tab) => {
          const isActive = pathname === tab.to || pathname.startsWith(tab.to + '/')
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 press-scale transition-colors ${
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-tertiary)]'
              }`}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}>
                {tab.icon(isActive)}
              </span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
