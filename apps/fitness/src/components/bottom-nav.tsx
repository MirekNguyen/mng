import { Link, useLocation } from '@tanstack/react-router'

import { HomeAngle, GraphUp, ChartSquare, ChatRound } from '@solar-icons/react'

const tabs = [
  {
    to: '/dashboard' as const,
    label: 'Home',
    icon: (active: boolean) => (
      <HomeAngle size={22} weight={active ? 'Bold' : 'Linear'} />
    ),
  },
  {
    to: '/fitness' as const,
    label: 'Fitness',
    icon: (active: boolean) => (
      <GraphUp size={22} weight={active ? 'Bold' : 'Linear'} />
    ),
  },
  {
    to: '/volume' as const,
    label: 'Volume',
    icon: (active: boolean) => (
      <ChartSquare size={22} weight={active ? 'Bold' : 'Linear'} />
    ),
  },

  {
    to: '/chat' as const,
    label: 'Coach',
    icon: (active: boolean) => (
      <ChatRound size={22} weight={active ? 'Bold' : 'Linear'} />
    ),
  },
]

export const BottomNav = () => {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 backdrop-blur-sm border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[var(--content-max-width)] mx-auto flex items-center justify-around h-12">
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
