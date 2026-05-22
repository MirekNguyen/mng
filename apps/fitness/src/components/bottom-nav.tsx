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
    to: '/fitness' as const,
    label: 'Fitness',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <>
            <path d="M3.5 12h3l2-7 4 14 3-10 2 3h3" stroke="currentColor" strokeWidth="2.5" />
          </>
        ) : (
          <path d="M3.5 12h3l2-7 4 14 3-10 2 3h3" stroke="currentColor" strokeWidth="1.5" />
        )}
      </svg>
    ),
  },
  {
    to: '/volume' as const,
    label: 'Volume',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <>
            <rect x="4" y="13" width="3.5" height="7" rx="1" fill="currentColor" />
            <rect x="10.25" y="8" width="3.5" height="12" rx="1" fill="currentColor" />
            <rect x="16.5" y="4" width="3.5" height="16" rx="1" fill="currentColor" />
          </>
        ) : (
          <>
            <rect x="4" y="13" width="3.5" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="10.25" y="8" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="16.5" y="4" width="3.5" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </>
        )}
      </svg>
    ),
  },

  {
    to: '/chat' as const,
    label: 'Coach',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <path d="M12 3C7 3 3 6.5 3 11c0 2.5 1.2 4.7 3.2 6.2L5 21l4-2.3c.9.2 1.9.3 3 .3 5 0 9-3.5 9-8s-4-8-9-8z" fill="currentColor" />
        ) : (
          <path d="M12 3C7 3 3 6.5 3 11c0 2.5 1.2 4.7 3.2 6.2L5 21l4-2.3c.9.2 1.9.3 3 .3 5 0 9-3.5 9-8s-4-8-9-8z" stroke="currentColor" strokeWidth="1.5" />
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
