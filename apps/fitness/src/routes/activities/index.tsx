import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatDistance, formatDuration, formatPace, formatDate } from '#/lib/format'
import { BottomNav } from '#/components/bottom-nav'
import { AppHeader } from '#/components/app-header'
import { SportIcon } from '#/components/sport-icon'

type Activity = {
  id: number
  stravaId: number
  name: string
  type: string
  sportType: string
  distance: number
  movingTime: number
  elapsedTime: number
  totalElevationGain: number
  startDateLocal: string
  averageSpeed: number
}

const getActivities = createServerFn({ method: 'GET' })
  .inputValidator((data: { limit: number; offset: number }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) return null

    const result = await api.getActivities(session.athleteStravaId, data.limit, data.offset)
    return { activities: result.activities as Activity[], athleteName: session.athleteName, athleteImage: session.athleteImage }
  })

export const Route = createFileRoute('/activities/')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    sport: (search.sport as string) || '',
  }),
  beforeLoad: async ({ search }) => {
    const offset = (search.page - 1) * 50
    const data = await getActivities({ data: { limit: 50, offset } })
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: ActivitiesPage,
})

function ActivitiesPage() {
  const { activities, athleteName, athleteImage } = Route.useLoaderData()
  const { sport } = Route.useSearch()

  const sports = [...new Set(activities.map((a: Activity) => a.type))]
  const filtered = sport ? activities.filter((a: Activity) => a.type === sport) : activities

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Activities" athleteName={athleteName} athleteImage={athleteImage} showBack />

      <main className="max-w-[600px] mx-auto px-5 pt-6">

        {/* Sport filter pills */}
        <div className="flex gap-2 mb-5 overflow-x-auto flex-nowrap">
          <Link
            to="/activities"
            search={{ page: 1, sport: '' }}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
              !sport
                ? 'bg-[var(--color-ink)] text-[var(--color-surface)]'
                : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-border)]'
            }`}
          >
            All
          </Link>
          {sports.map((s: string) => {
            const colors: Record<string, string> = { Run: 'var(--color-sport-run)', Ride: 'var(--color-sport-ride)', Swim: 'var(--color-sport-swim)', WeightTraining: 'var(--color-sport-weight)', Walk: 'var(--color-sport-walk)', Hike: 'var(--color-sport-hike)' }
            const labels: Record<string, string> = { WeightTraining: 'Weights' }
            return (
            <Link
              key={s}
              to="/activities"
              search={{ page: 1, sport: s }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium press-scale transition-colors whitespace-nowrap ${
                sport === s
                  ? 'text-white'
                  : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-border)]'
              }`}
              style={sport === s ? { backgroundColor: colors[s] ?? 'var(--color-ink)' } : undefined}
            >
              {labels[s] ?? s}
            </Link>
            )
          })}
        </div>

        {/* Activity list */}
        <div className="divide-y divide-[var(--color-border)]">
          {filtered.map((activity: Activity, i: number) => (
            <Link
              key={activity.id}
              to="/activities/$activityId"
              params={{ activityId: String(activity.stravaId) }}
              className={`flex items-center gap-4 py-3.5 hover:bg-[var(--color-surface-sunken)] -mx-2 px-2 rounded-lg transition-colors animate-in stagger-${Math.min(i + 1, 8)}`}
            >
              <SportIcon type={activity.type} size={22} className="flex-shrink-0 text-[var(--color-ink-secondary)]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.name}</p>
                <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">{formatDate(activity.startDateLocal)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium">{formatDistance(activity.distance)}</p>
                <p className="text-xs text-[var(--color-ink-tertiary)]">{formatPace(activity.averageSpeed, activity.type)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-[var(--color-ink-secondary)]">{formatDuration(activity.movingTime)}</p>
                {activity.totalElevationGain > 0 && (
                  <p className="text-xs text-[var(--color-ink-tertiary)]">↑ {Math.round(activity.totalElevationGain)}m</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-[var(--color-ink-tertiary)] py-12 text-center">No activities found.</p>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
