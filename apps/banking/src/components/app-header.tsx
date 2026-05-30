type AppHeaderProps = {
  title: string
  userName: string
  userImage?: string
}

export const AppHeader = ({ title, userName, userImage }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="max-w-[600px] mx-auto px-5 h-11 flex items-center justify-between">
        <span className="text-base font-semibold">{title}</span>
        <div className="flex items-center gap-2">
          {userImage ? (
            <img src={userImage} alt="" className="size-7 rounded-full" />
          ) : (
            <div className="size-7 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center text-xs font-medium text-[var(--color-accent)]">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
