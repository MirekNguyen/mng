const icons: Record<string, (size: number) => JSX.Element> = {
  Run: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="4" r="2" fill="currentColor" stroke="none" />
      <path d="M7 21l3-7 3 2v5M13 16l2-4 4-1M11 8l4 2-2 4M7 12l4-4" />
    </svg>
  ),
  Ride: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6.5" cy="17" r="3" />
      <circle cx="17.5" cy="17" r="3" />
      <path d="M6.5 17l4-7h4l3 7M14.5 10l-2-4" />
    </svg>
  ),
  Swim: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
      <path d="M8 12l4-2 4 2" />
      <path d="M2 17c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
    </svg>
  ),
  Walk: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2" fill="currentColor" stroke="none" />
      <path d="M8 21l2.5-7L13 16v5M13 16l1.5-5 3-1M10 9l3 1-1.5 5M8 12l2-3" />
    </svg>
  ),
  Hike: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2" fill="currentColor" stroke="none" />
      <path d="M8 21l2.5-7L13 16v5M13 16l1.5-5 3-1M10 9l3 1-1.5 5M8 12l2-3M18 3v18" />
    </svg>
  ),
  WeightTraining: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7v10M18 7v10M6 12h12" />
      <path d="M3 9v6M9 9v6M15 9v6M21 9v6" strokeWidth="2" />
    </svg>
  ),
  Yoga: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
      <path d="M12 8v6M12 14l-5 5M12 14l5 5M7 11h10" />
    </svg>
  ),
  Workout: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7v10M18 7v10M6 12h12" />
      <path d="M3 9v6M9 9v6M15 9v6M21 9v6" strokeWidth="2" />
    </svg>
  ),
}

const fallbackIcon = (size: number) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
  </svg>
)

export const SportIcon = ({ type, size = 22, className }: { type: string; size?: number; className?: string }) => {
  const render = icons[type] ?? fallbackIcon
  return <span className={className}>{render(size)}</span>
}
