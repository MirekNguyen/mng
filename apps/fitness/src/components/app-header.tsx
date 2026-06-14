import { useRouter } from '@tanstack/react-router'

import { HugeiconsIcon } from '@hugeicons/react'
import { ChevronLeftIcon } from '@hugeicons/core-free-icons'

import { ThemeToggle } from '#/components/theme-toggle'
import { ProfileMenu } from '#/components/profile-menu'

type AppHeaderProps = {
  title: string
  athleteName: string
  athleteImage: string | undefined
  showBack?: boolean
}

export const AppHeader = ({ title, athleteName, athleteImage, showBack }: AppHeaderProps) => {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-10 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="max-w-[var(--max-width)] mx-auto px-layout-x h-11 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              type="button"
              onClick={() => router.history.back()}
              className="flex items-center justify-center size-8 -ml-2 rounded-lg text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] transition-colors"
              aria-label="Go back"
            >
              <HugeiconsIcon icon={ChevronLeftIcon} size={20} strokeWidth={2} />
            </button>
          )}
          <span className="text-lg font-semibold">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileMenu name={athleteName} image={athleteImage} />
        </div>
      </div>
    </header>
  )
}
