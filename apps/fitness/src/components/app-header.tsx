import { useRouter } from '@tanstack/react-router'

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
      <div className="max-w-[600px] mx-auto px-5 h-11 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              type="button"
              onClick={() => router.history.back()}
              className="flex items-center justify-center size-8 -ml-2 rounded-lg text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] transition-colors"
              aria-label="Go back"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <span className="text-base font-semibold">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileMenu name={athleteName} image={athleteImage} />
        </div>
      </div>
    </header>
  )
}
