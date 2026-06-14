import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatDuration } from '#/lib/format'
import { AppHeader } from '#/components/app-header'
import { BottomNav } from '#/components/bottom-nav'

const getZonesData = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession()
  if (!session) return null
  return api.getZones(session.athleteStravaId, 3).then((zones) => ({ ...zones, athleteName: session.athleteName, athleteImage: session.athleteImage, athleteStravaId: session.athleteStravaId, maxHr: session.maxHr }))
})

export const Route = createFileRoute('/zones')({
  beforeLoad: async () => {
    const data = await getZonesData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: ZonesPage,
})

type PaceZone = {
  name: string
  timeInZone: number
  distanceInZone: number
  percentage: number
  minPace: number
  maxPace: number
}

type HrZone = {
  name: string
  minHr: number
  maxHr: number
  timeInZone: number
  percentage: number
}

function ZonesPage() {
  const data = Route.useLoaderData()

  const formatPaceValue = (secPerKm: number): string => {
    if (secPerKm >= 9999) return '-'
    const min = Math.floor(secPerKm / 60)
    const sec = Math.round(secPerKm % 60)
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Zones" athleteName={data.athleteName as string} athleteImage={data.athleteImage as string | undefined} athleteStravaId={data.athleteStravaId} maxHr={data.maxHr} />
      <main className="mx-auto max-w-5xl px-layout-x py-section space-y-[var(--section-spacing)]">
        <h2 className="text-[length:var(--section-title-font-size)] font-semibold">Zone Analysis</h2>
        <p className="text-zinc-400 text-sm">Based on running activities from the last 3 months</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Avg Pace" value={`${formatPaceValue(data.averagePace)} /km`} />
          <StatCard label="Avg HR" value={data.averageHr > 0 ? `${data.averageHr} bpm` : '-'} />
          <StatCard label="Total Run Time" value={formatDuration(data.totalRunningTime)} />
          <StatCard label="Total Run Distance" value={`${(data.totalRunningDistance / 1000).toFixed(1)} km`} />
        </div>

        {data.paceZones.length > 0 && (
          <section>
            <h3 className="text-[length:var(--section-title-font-size)] font-semibold mb-section">Pace Zones</h3>
            <div className="space-y-3">
              {data.paceZones.map((zone: PaceZone) => (
                <div key={zone.name} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{zone.name}</span>
                    <span className="text-sm text-zinc-400">
                      {formatPaceValue(zone.minPace)} - {formatPaceValue(zone.maxPace)} /km
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 mb-2">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all"
                      style={{ width: `${zone.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{formatDuration(zone.timeInZone)}</span>
                    <span>{zone.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.heartRateZones.length > 0 && (
          <section>
            <h3 className="text-[length:var(--section-title-font-size)] font-semibold mb-section">Heart Rate Zones</h3>
            <div className="space-y-3">
              {data.heartRateZones.map((zone: HrZone) => (
                <div key={zone.name} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{zone.name}</span>
                    <span className="text-sm text-zinc-400">{zone.minHr} - {zone.maxHr} bpm</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 mb-2">
                    <div
                      className="bg-red-500 h-3 rounded-full transition-all"
                      style={{ width: `${zone.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{formatDuration(zone.timeInZone)}</span>
                    <span>{zone.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <p className="text-xs text-[var(--color-ink-tertiary)] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[length:var(--section-title-font-size)] font-semibold">{value}</p>
    </div>
  )
}
