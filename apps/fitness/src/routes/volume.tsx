import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatDistance, formatDuration } from '#/lib/format'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '#/components/ui/chart'
import { BottomNav } from '#/components/bottom-nav'
import { AppHeader } from '#/components/app-header'

const getVolumeData = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await getSession()
  if (!session) return null

  const now = new Date()
  const monthsSinceJan = now.getMonth() + 1
  const volume = await api.getVolume(session.athleteStravaId, monthsSinceJan)
  return { ...volume, athleteName: session.athleteName, athleteImage: session.athleteImage }
})

export const Route = createFileRoute('/volume')({
  beforeLoad: async () => {
    const data = await getVolumeData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: VolumePage,
})

type WeeklyVolume = {
  weekStart: string
  distance: number
  movingTime: number
  elevationGain: number
  activityCount: number
  sports: Record<string, { distance: number; movingTime: number; elevationGain: number; count: number }>
}

type MonthlyVolume = {
  month: string
  distance: number
  movingTime: number
  elevationGain: number
  activityCount: number
  sports: Record<string, { distance: number; movingTime: number; elevationGain: number; count: number }>
}

const volumeChartConfig: ChartConfig = {
  distance: { label: 'Distance', color: 'var(--color-accent)' },
}

const SPORT_LABELS: Record<string, string> = { Run: 'Run', WeightTraining: 'Weights', Swim: 'Swim', Ride: 'Ride', Walk: 'Walk', Hike: 'Hike' }
const SPORT_COLORS: Record<string, string> = { Run: 'var(--color-sport-run)', Ride: 'var(--color-sport-ride)', Swim: 'var(--color-sport-swim)', WeightTraining: 'var(--color-sport-weight)', Walk: 'var(--color-sport-walk)', Hike: 'var(--color-sport-hike)' }

const formatMonthLabel = (month: string): string => {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1)
  return date.toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

function VolumePage() {
  const data = Route.useLoaderData()
  const [selectedSport, setSelectedSport] = useState<string>('Run')

  // Gather all sports
  const allSports = new Set<string>()
  for (const week of data.weekly as WeeklyVolume[]) {
    for (const sport of Object.keys(week.sports)) {
      allSports.add(sport)
    }
  }
  const sportOptions = ['Run', 'Ride', 'Swim', 'WeightTraining', 'Walk', 'Hike'].filter((s) => allSports.has(s))

  // Calculate per-sport stats
  const weeks = data.weekly as WeeklyVolume[]
  const months = data.monthly as MonthlyVolume[]
  const totalWeeks = weeks.length || 1

  // YTD stats for selected sport (current year only)
  const currentYear = new Date().getFullYear().toString()
  const ytdMonths = months.filter((m) => m.month.startsWith(currentYear))
  const ytdDistance = ytdMonths.reduce((sum, m) => sum + (m.sports[selectedSport]?.distance ?? 0), 0)
  const ytdTime = ytdMonths.reduce((sum, m) => sum + (m.sports[selectedSport]?.movingTime ?? 0), 0)
  const ytdActivities = ytdMonths.reduce((sum, m) => sum + (m.sports[selectedSport]?.count ?? 0), 0)
  const ytdElevation = ytdMonths.reduce((sum, m) => sum + (m.sports[selectedSport]?.elevationGain ?? 0), 0)

  // Averages
  const avgPerWeekCount = ytdActivities / totalWeeks
  const avgPerWeekTime = ytdTime / totalWeeks
  const avgPerWeekDistance = ytdDistance / totalWeeks

  // Chart data
  const chartData = weeks.slice(-26).map((w) => ({
    week: new Date(w.weekStart).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    distance: Math.round((w.sports[selectedSport]?.distance ?? 0) / 1000 * 10) / 10,
  }))

  // Monthly filtered
  const filteredMonthly = months.slice(-6).reverse().map((m) => ({
    month: m.month,
    distance: m.sports[selectedSport]?.distance ?? 0,
    movingTime: m.sports[selectedSport]?.movingTime ?? 0,
    count: m.sports[selectedSport]?.count ?? 0,
    elevationGain: m.sports[selectedSport]?.elevationGain ?? 0,
  }))

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Volume" athleteName={data.athleteName as string} athleteImage={data.athleteImage as string | undefined} />

      <main className="max-w-[var(--max-width)] mx-auto px-layout-x pt-section space-y-6">
        {/* Sport tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {sportOptions.map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedSport === sport
                  ? 'text-white'
                  : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-border)]'
              }`}
              style={selectedSport === sport ? { backgroundColor: SPORT_COLORS[sport] } : undefined}
            >
              {SPORT_LABELS[sport] ?? sport}
            </button>
          ))}
        </div>

        {/* Activity averages */}
        <section>
          <SectionHeader label="Activity" />
          <div className="divide-y divide-[var(--color-border)]">
            <StatRow label={`Avg ${SPORT_LABELS[selectedSport] ?? selectedSport}s/Week`} value={avgPerWeekCount.toFixed(1)} />
            <StatRow label="Avg Time/Week" value={formatDuration(Math.round(avgPerWeekTime))} />
            <StatRow label="Avg Distance/Week" value={formatDistance(avgPerWeekDistance)} />
          </div>
        </section>

        {/* Year-to-date */}
        <section>
          <SectionHeader label="Year-to-Date" />
          <div className="divide-y divide-[var(--color-border)]">
            <StatRow label={`${SPORT_LABELS[selectedSport] ?? selectedSport}s`} value={String(ytdActivities)} />
            <StatRow label="Time" value={formatDuration(ytdTime)} />
            <StatRow label="Distance" value={formatDistance(ytdDistance)} />
            <StatRow label="Elev Gain" value={`${Math.round(ytdElevation).toLocaleString()} m`} />
          </div>
        </section>

        {/* Weekly bar chart */}
        <section>
          <p className="text-xs text-[var(--color-ink-tertiary)] mb-[0.75rem] uppercase tracking-wide">Weekly distance</p>
          <ChartContainer config={volumeChartConfig} className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 9, fill: 'var(--color-ink-tertiary)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={5}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-ink-tertiary)' }}
                  tickLine={false}
                  axisLine={false}
                  unit=" km"
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-border)', opacity: 0.3 }}
                  content={<ChartTooltipContent config={volumeChartConfig} formatter={(v) => `${v} km`} />}
                />
                <Bar dataKey="distance" fill={SPORT_COLORS[selectedSport] ?? 'var(--color-accent)'} radius={[3, 3, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </section>

        {/* Monthly breakdown */}
        <section>
          <SectionHeader label="Monthly" />
          <div className="divide-y divide-[var(--color-border)]">
            {filteredMonthly.map((month) => (
              <div key={month.month} className="py-list-y flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{formatMonthLabel(month.month)}</p>
                  <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">{month.count} activities · ↑ {Math.round(month.elevationGain)}m</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatDistance(month.distance)}</p>
                  <p className="text-xs text-[var(--color-ink-tertiary)]">{formatDuration(month.movingTime)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="bg-[var(--color-surface-sunken)] -mx-5 px-layout-x py-2 mb-0">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-tertiary)]">{label}</p>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-list-y">
      <span className="text-sm text-[var(--color-ink)]">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}
