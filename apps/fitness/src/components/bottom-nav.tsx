import { Link, useLocation } from '@tanstack/react-router'

import { HugeiconsIcon } from '@hugeicons/react'
import { HomeIcon, ActivityIcon, BarChartIcon, BubbleChatIcon } from '@hugeicons/core-free-icons'

const tabs = [
  {
    to: '/dashboard' as const,
    label: 'Home',
    icon: (active: boolean) => (
      <HugeiconsIcon icon={HomeIcon} size={22} strokeWidth={active ? 2.2 : 1.5} />
    ),
  },
  {
    to: '/fitness' as const,
    label: 'Fitness',
    icon: (active: boolean) => (
      <HugeiconsIcon icon={ActivityIcon} size={22} strokeWidth={active ? 2.2 : 1.5} />
    ),
  },
  {
    to: '/volume' as const,
    label: 'Volume',
    icon: (active: boolean) => (
      <HugeiconsIcon icon={BarChartIcon} size={22} strokeWidth={active ? 2.2 : 1.5} />
    ),
  },
  {
    to: '/chat' as const,
    label: 'Coach',
    icon: (active: boolean) => (
      <HugeiconsIcon icon={BubbleChatIcon} size={22} strokeWidth={active ? 2.2 : 1.5} />
    ),
  },
]

export const BottomNav = () => {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 backdrop-blur-sm border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[var(--max-width)] mx-auto flex items-center justify-around h-12">
        {tabs.map((tab) => {
          const isActive = pathname === tab.to || pathname.startsWith(tab.to + '/')
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center gap-0.5 p-[var(--small-segment-padding)] press-scale transition-colors ${
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-tertiary)]'
              }`}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}>
                {tab.icon(isActive)}
              </span>
              <span className="text-xxxs font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
