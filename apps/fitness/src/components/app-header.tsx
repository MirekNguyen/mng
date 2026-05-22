import { ThemeToggle } from '#/components/theme-toggle'
import { ProfileMenu } from '#/components/profile-menu'

type AppHeaderProps = {
  title: string
  athleteName: string
  athleteImage: string | undefined
}

export const AppHeader = ({ title, athleteName, athleteImage }: AppHeaderProps) => (
  <header className="sticky top-0 z-10 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
    <div className="max-w-[600px] mx-auto px-5 h-11 flex items-center justify-between">
      <span className="text-base font-semibold">{title}</span>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <ProfileMenu name={athleteName} image={athleteImage} />
      </div>
    </div>
  </header>
)
