import { createFileRoute, redirect, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState, useEffect, useCallback } from 'react'

import { AltArrowRight } from '@solar-icons/react'

import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatDistance, formatDuration, formatDate } from '#/lib/format'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '#/components/ui/chart'
import { Card, CardContent } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { BottomNav } from '#/components/bottom-nav'
import { SportIcon } from '#/components/sport-icon'
import { AppHeader } from '#/components/app-header'

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
  startDate: string
  startDateLocal: string
  averageSpeed: number
  maxSpeed: number
  averageHeartrate: number | null
  maxHeartrate: number | null
  sufferScore: number | null
  kudosCount: number
}

type WeeklyVolume = {
  weekStart: string
  distance: number
  movingTime: number
  elevationGain: number
  activityCount: number
  sports: Record<string, { distance: number; movingTime: number; elevationGain: number; count: number }>
}

const getDashboardData = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await getSession()
  if (!session) return null

  const [activitiesResult, volumeResult, fitnessResult] = await Promise.all([
    api.getActivities(session.athleteStravaId, 10, 0),
    api.getVolume(session.athleteStravaId, 3),
    api.getFitness(session.athleteStravaId, 30),
  ])

  return {
    activities: activitiesResult.activities as Activity[],
    volume: volumeResult,
    athleteName: session.athleteName,
    athleteStravaId: session.athleteStravaId,
    athleteImage: session.athleteImage,
    fitness: fitnessResult,
  }
})

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const data = await getDashboardData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: DashboardPage,
})

function DashboardPage() {
  const router = useRouter()
  const { activities, volume, athleteName, athleteStravaId, athleteImage, fitness } = Route.useLoaderData()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSport, setSelectedSport] = useState<string>('Run')

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await router.invalidate()
    setRefreshing(false)
  }, [router])

  const currentWeek = volume.weekly[volume.weekly.length - 1]
  const currentWeekSport = currentWeek?.sports[selectedSport]

  const today = new Date()
  const dayOfWeek = today.getDay()
  const isEarlyWeek = dayOfWeek >= 1 && dayOfWeek <= 3
  const noActivityThisWeek = !currentWeekSport || currentWeekSport.count === 0
  const showEarlyWeekMessage = noActivityThisWeek && isEarlyWeek

  const isDistanceSport = selectedSport !== 'WeightTraining'
  const last12Weeks = volume.weekly.slice(-12)

  const chartData = last12Weeks.map((w: WeeklyVolume) => ({
    week: new Date(w.weekStart).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    distance: Math.round((w.sports[selectedSport]?.distance ?? 0) / 1000 * 10) / 10,
    time: Math.round((w.sports[selectedSport]?.movingTime ?? 0) / 60),
  }))

  const allSports = new Set<string>()
  for (const week of volume.weekly) {
    for (const sport of Object.keys(week.sports)) {
      allSports.add(sport)
    }
  }
  const sportOptions = ['Run', 'WeightTraining', 'Swim', 'Ride'].filter((s) => allSports.has(s))
  const sportLabels: Record<string, string> = { Run: 'Run', WeightTraining: 'Weights', Swim: 'Swim', Ride: 'Ride' }
  const sportColors: Record<string, string> = { Run: 'var(--color-sport-run)', WeightTraining: 'var(--color-sport-weight)', Swim: 'var(--color-sport-swim)', Ride: 'var(--color-sport-ride)' }

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Fitness" athleteName={athleteName} athleteImage={athleteImage} />

      <main className="max-w-[var(--max-width)] mx-auto px-layout-x pt-section space-y-[var(--section-spacing)]">
        {/* Refresh */}
        <div className="flex justify-end -mt-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors disabled:opacity-50"
            aria-label="Refresh data"
          >
            <svg
              className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.007 4.356v4.992" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Sport pills */}
        <div className="flex gap-2 animate-in stagger-1">
          {sportOptions.map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium press-scale transition-colors ${
                selectedSport === sport
                  ? 'text-white'
                  : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-border)]'
              }`}
              style={selectedSport === sport ? { backgroundColor: sportColors[sport] } : undefined}
            >
              {sportLabels[sport] ?? sport}
            </button>
          ))}
        </div>

        {/* Training Status Insight */}
        {fitness && <div className="animate-in stagger-2"><TrainingInsight fitness={fitness} /></div>}

        {/* This week */}
        <section className="animate-in stagger-3">
          <h2 className="text-[length:var(--section-title-font-size)] font-semibold mb-section">This week</h2>
          {showEarlyWeekMessage ? (
            <p className="text-sm text-[var(--color-ink-tertiary)]">
              It's early in the week — no {sportLabels[selectedSport]?.toLowerCase() ?? selectedSport.toLowerCase()} recorded yet
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {isDistanceSport ? (
                <>
                  <div>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">Distance</p>
                    <p className="text-xl font-semibold tracking-tight">{formatDistance(currentWeekSport?.distance ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">Time</p>
                    <p className="text-xl font-semibold tracking-tight">{formatDuration(currentWeekSport?.movingTime ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">Elev Gain</p>
                    <p className="text-xl font-semibold tracking-tight">{Math.round(currentWeekSport?.elevationGain ?? 0)} m</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">Sessions</p>
                    <p className="text-xl font-semibold tracking-tight">{currentWeekSport?.count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">Time</p>
                    <p className="text-xl font-semibold tracking-tight">{formatDuration(currentWeekSport?.movingTime ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">Avg Session</p>
                    <p className="text-xl font-semibold tracking-tight">{currentWeekSport?.count ? formatDuration(Math.round((currentWeekSport.movingTime ?? 0) / currentWeekSport.count)) : '—'}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* 12-week chart */}
        <section className="animate-in stagger-4">
          <p className="text-xs text-[var(--color-ink-tertiary)] mb-[0.75rem]">Past 12 weeks</p>
          <ChartContainer config={{ [isDistanceSport ? 'distance' : 'time']: { label: isDistanceSport ? 'Distance' : 'Time', color: sportColors[selectedSport] ?? 'var(--color-accent)' } }} className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 9, fill: 'var(--color-ink-tertiary)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-ink-tertiary)' }}
                  tickLine={false}
                  axisLine={false}
                  unit={isDistanceSport ? ' km' : ' min'}
                />
                <Tooltip content={<ChartTooltipContent config={{ [isDistanceSport ? 'distance' : 'time']: { label: isDistanceSport ? 'Distance' : 'Time', color: sportColors[selectedSport] ?? 'var(--color-accent)' } }} formatter={(v) => isDistanceSport ? `${v} km` : `${v} min`} />} />
                <Area type="monotone" dataKey={isDistanceSport ? 'distance' : 'time'} stroke={sportColors[selectedSport] ?? 'var(--color-accent)'} fill={sportColors[selectedSport] ?? 'var(--color-accent)'} fillOpacity={0.1} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </section>

        {/* AI Week Brief */}
        <div className="animate-in stagger-5">
          <WeekBrief athleteStravaId={athleteStravaId} />
        </div>

        {/* Recent activities */}
        <section className="animate-in stagger-6">
          <div className="flex items-baseline justify-between mb-[0.75rem]">
            <h2 className="text-lg font-semibold">Activities</h2>
            <Link to="/activities" className="text-sm text-[var(--color-accent)] hover:underline">See all</Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {activities.map((activity: Activity) => (
              <Link
                key={activity.id}
                to="/activities/$activityId"
                params={{ activityId: String(activity.stravaId) }}
                className="flex items-center gap-4 py-list-y hover:bg-[var(--color-surface-sunken)] -mx-2 px-2 rounded-lg transition-colors"
              >
                <SportIcon type={activity.type} size={22} className="flex-shrink-0 text-[var(--color-ink-secondary)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.name}</p>
                  <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">{formatDate(activity.startDateLocal)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium">{formatDistance(activity.distance)}</p>
                  <p className="text-xs text-[var(--color-ink-tertiary)]">{formatDuration(activity.movingTime)}</p>
                </div>
              </Link>
            ))}
          </div>
          {activities.length === 0 && (
            <p className="text-sm text-[var(--color-ink-tertiary)] py-section text-center">No activities synced yet.</p>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  )
}

type FitnessStatus = {
  currentCtl: number
  currentAtl: number
  currentTsb: number
  formStatus: string
  fitnessLevel: string
  fatigueLevel: string
}

const TrainingInsight = ({ fitness }: { fitness: FitnessStatus }) => {
  const tsb = fitness.currentTsb
  const ctl = fitness.currentCtl

  let dotColor: string
  let message: string
  let bgColor: string

  if (tsb > 15) {
    dotColor = 'var(--color-success)'
    message = `Fresh — great day for intensity`
    bgColor = 'var(--color-success-subtle)'
  } else if (tsb >= 0) {
    dotColor = 'var(--color-success)'
    message = `Good form — train normally`
    bgColor = 'var(--color-success-subtle)'
  } else if (tsb >= -15) {
    dotColor = 'var(--color-warning)'
    message = `Absorbing load — fitness building`
    bgColor = 'var(--color-warning-subtle)'
  } else if (tsb >= -30) {
    dotColor = 'var(--color-accent)'
    message = `Fatigued — consider easy or rest`
    bgColor = 'var(--color-warning-subtle)'
  } else {
    dotColor = 'var(--color-heart)'
    message = `Deep fatigue — prioritize recovery`
    bgColor = 'var(--color-heart-subtle)'
  }

  return (
    <Link to="/fitness" className="flex items-center gap-2.5 rounded-lg px-3.5 py-list-y transition-colors hover:opacity-90" style={{ backgroundColor: bgColor }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
      <p className="text-xs text-[var(--color-ink)] flex-1">{message}</p>
      <AltArrowRight width="14" height="14" stroke="var(--color-ink-tertiary)" />
    </Link>
  )
}

const WeekBrief = ({ athleteStravaId }: { athleteStravaId: number }) => {
  const [brief, setBrief] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const fetchBrief = async () => {
      try {
        const res = await fetch(api.getWeeklyBriefUrl(athleteStravaId), { signal: controller.signal })
        if (!res.ok || !res.body) { setIsLoading(false); return }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let text = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          text += decoder.decode(value, { stream: true })
          setBrief(text)
        }
        setIsLoading(false)
      } catch {
        setIsLoading(false)
      }
    }
    fetchBrief()
    return () => controller.abort()
  }, [athleteStravaId])

  if (!brief && !isLoading) return null

  // Extract first meaningful paragraph (skip headings)
  const shortBrief = brief.split('\n').filter((l) => l.trim() && !l.startsWith('#'))[0] ?? ''

  if (!shortBrief && isLoading) {
    return (
      <Card>
        <CardContent className=" space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  if (!shortBrief) return null

  return (
    <Card>
      <CardContent className="">
        <p className="text-xs leading-relaxed text-[var(--color-ink-secondary)]">{shortBrief}</p>
        <Link to="/fitness" className="text-xxs text-[var(--color-accent)] font-medium mt-2 inline-block">
          Full analysis →
        </Link>
      </CardContent>
    </Card>
  )
}
