import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { lazy, Suspense, useState, useEffect, type ReactNode } from 'react'

import { Like, ChatRoundDots } from '@solar-icons/react'

import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatDistance, formatDuration, formatPace, formatDate, formatTime } from '#/lib/format'
import { MediaGallery } from '#/components/media-gallery'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const RouteMapLazy = lazy(() => import('#/components/route-map').then((m) => ({ default: m.RouteMap })))

const getActivityData = createServerFn({ method: 'POST' })
  .inputValidator((data: { activityStravaId: number }) => data)
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) return null

    const [activityResult, streamsResult] = await Promise.all([
      api.getActivity(session.athleteStravaId, data.activityStravaId),
      api.getStreams(data.activityStravaId).catch(() => ({ streams: null })),
    ])

    return {
      activity: activityResult.activity,
      streams: streamsResult.streams,
      athleteStravaId: session.athleteStravaId,
    }
  })

export const Route = createFileRoute('/activities/$activityId')({
  beforeLoad: async ({ params }) => {
    const data = await getActivityData({ data: { activityStravaId: Number(params.activityId) } })
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-5 w-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
    </div>
  ),
  component: ActivityDetailPage,
})

// JSONB columns may be double-encoded (string containing JSON) — parse safely
const parseJsonb = <T,>(value: unknown): T | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T } catch { return null }
  }
  return value as T
}

function ActivityDetailPage() {
  const { activity, streams, athleteStravaId } = Route.useLoaderData()

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-ink-secondary)]">Activity not found.</p>
      </div>
    )
  }

  const photos = parseJsonb<{ primary?: { urls?: Record<string, string> }; count?: number; all?: Array<{ urls?: Record<string, string> }> }>(activity.photos)
  const allPhotos = photos?.all ?? (photos?.primary?.urls ? [{ urls: photos.primary.urls }] : [])
  const kudos = parseJsonb<Array<{ firstname: string; lastname: string; profile: string }>>(activity.kudos)
  const comments = parseJsonb<Array<{ athlete: { firstname: string; lastname: string; profile: string }; text: string; created_at: string }>>(activity.comments)

  const splits = parseJsonb<Array<{
    distance: number; elapsed_time: number; moving_time: number;
    elevation_difference: number; average_speed: number; average_heartrate?: number; split: number
  }>>(activity.splitsMetric)
  const laps = parseJsonb<Array<{
    name: string; distance: number; moving_time: number; elapsed_time: number;
    average_speed: number; average_heartrate?: number; total_elevation_gain: number; lap_index: number
  }>>(activity.laps)
  const segmentEfforts = parseJsonb<Array<{
    name: string; distance: number; elapsed_time: number; moving_time: number;
    pr_rank: number | null; kom_rank: number | null; start_index?: number; end_index?: number;
    segment: { average_grade: number; distance: number }
  }>>(activity.segmentEfforts)

  const router = useRouter()

  return (
    <div className="min-h-screen pb-16">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="max-w-[var(--max-width)] mx-auto px-layout-x h-12 flex items-center justify-between">
          <button onClick={() => router.history.back()} className="text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors">
            ← Back
          </button>
          <span className="text-sm font-medium text-[var(--color-ink-secondary)]">{activity.type}</span>
        </div>
      </nav>

      <main className="max-w-[var(--max-width)] mx-auto">
        {/* Header */}
        <header className="pt-6 pb-4 px-layout-x">
          <p className="text-xs text-[var(--color-ink-tertiary)]">
            {formatDate(activity.startDateLocal)} · {formatTime(activity.startDateLocal)}
          </p>
          <h1 className="text-[length:var(--section-title-font-size)] font-semibold tracking-tight mt-1 leading-tight">{activity.name}</h1>
          {activity.description && (
            <p className="text-[var(--color-ink-secondary)] mt-2 text-[0.9rem] leading-relaxed">{activity.description}</p>
          )}
        </header>

        {/* Metrics */}
        <section className="grid grid-cols-2 gap-y-4 py-[var(--content-card-vertical-padding)] mx-5 border-y border-[var(--color-border)]">
          <StatPair label="Distance" value={formatDistance(activity.distance)} />
          <StatPair label="Avg Pace" value={formatPace(activity.averageSpeed, activity.type)} />
          <StatPair label="Moving Time" value={formatDuration(activity.movingTime)} />
          <StatPair label="Elevation Gain" value={`${Math.round(activity.totalElevationGain)} m`} />
          {activity.calories ? <StatPair label="Calories" value={`${Math.round(activity.calories)} Cal`} /> : null}
          {activity.averageHeartrate ? <StatPair label="Avg Heart Rate" value={`${Math.round(activity.averageHeartrate)} bpm`} /> : null}
        </section>

        {/* Kudos & Comments count - Strava style (under metrics) */}
        <div className="px-layout-x">
          <KudosBar kudos={kudos} kudosCount={activity.kudosCount} commentCount={comments?.length ?? 0} />
        </div>

        {/* Gear & Device */}
        {(activity.gearName || activity.deviceName) && (
          <div className="py-3 mx-5 border-b border-[var(--color-border)] flex items-center gap-5 text-sm text-[var(--color-ink-secondary)]">
            {activity.gearName && <span>👟 {activity.gearName}</span>}
            {activity.deviceName && <span>⌚ {activity.deviceName}</span>}
          </div>
        )}

        {/* Map - full bleed */}
        {(activity.mapPolyline ?? activity.mapSummaryPolyline) && (
          <div className="mt-4 overflow-hidden h-80">
            <Suspense fallback={<div className="w-full h-full bg-[var(--color-surface-sunken)] flex items-center justify-center text-sm text-[var(--color-ink-tertiary)]">Loading map...</div>}>
              <RouteMapLazy encodedPolyline={activity.mapPolyline ?? activity.mapSummaryPolyline} splits={splits} segments={segmentEfforts} />
            </Suspense>
          </div>
        )}

        {/* Photos & Videos */}
        {allPhotos.length > 0 && (
          <div className="px-layout-x">
            <MediaGallery items={allPhotos.map((photo) => {
              const url = photo.urls?.['600'] ?? photo.urls?.['100'] ?? Object.values(photo.urls ?? {})[0]
              const isVideo = url?.includes('.mp4') || url?.includes('video')
              return { url: url ?? '', type: (isVideo ? 'video' : 'image') as 'image' | 'video' }
            }).filter((item) => item.url)} />
          </div>
        )}

        {/* AI Analysis - Strava "Relative Effort" / analysis position */}
        <div className="px-layout-x">
          <AiAnalysisSection athleteStravaId={athleteStravaId} activityStravaId={activity.stravaId} />
        </div>

        <div className="px-layout-x">
        {/* Splits - collapsible */}
        {splits && splits.length > 0 && (
          <CollapsibleSection title="Splits" count={splits.length}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-ink-tertiary)] text-xs">
                  <th className="text-left pb-2 font-normal">Km</th>
                  <th className="text-right pb-2 font-normal">Pace</th>
                  <th className="text-right pb-2 font-normal">HR</th>
                  <th className="text-right pb-2 font-normal">Elev</th>
                </tr>
              </thead>
              <tbody>
                {splits.map((split) => {
                  const pace = split.moving_time / (split.distance / 1000)
                  const paceMin = Math.floor(pace / 60)
                  const paceSec = Math.round(pace % 60)
                  return (
                    <tr key={split.split} className="border-t border-[var(--color-border)]">
                      <td className="py-list-y text-[var(--color-ink-secondary)]">{split.split}</td>
                      <td className="py-list-y text-right font-mono text-sm">{paceMin}:{paceSec.toString().padStart(2, '0')}</td>
                      <td className="py-list-y text-right text-[var(--color-ink-secondary)]">{split.average_heartrate ? Math.round(split.average_heartrate) : '—'}</td>
                      <td className="py-list-y text-right text-[var(--color-ink-secondary)]">{split.elevation_difference > 0 ? '+' : ''}{Math.round(split.elevation_difference)}m</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CollapsibleSection>
        )}

        {/* Laps - collapsible */}
        {laps && laps.length > 1 && (
          <CollapsibleSection title="Laps" count={laps.length}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-ink-tertiary)] text-xs">
                  <th className="text-left pb-2 font-normal">Lap</th>
                  <th className="text-right pb-2 font-normal">Dist</th>
                  <th className="text-right pb-2 font-normal">Pace</th>
                  <th className="text-right pb-2 font-normal">HR</th>
                </tr>
              </thead>
              <tbody>
                {laps.map((lap) => (
                  <tr key={lap.lap_index} className="border-t border-[var(--color-border)]">
                    <td className="py-list-y text-[var(--color-ink-secondary)]">{lap.name || `Lap ${lap.lap_index}`}</td>
                    <td className="py-list-y text-right">{formatDistance(lap.distance)}</td>
                    <td className="py-list-y text-right font-mono">{formatPace(lap.average_speed, activity.type)}</td>
                    <td className="py-list-y text-right text-[var(--color-ink-secondary)]">{lap.average_heartrate ? Math.round(lap.average_heartrate) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CollapsibleSection>
        )}

        {/* Segments */}
        {segmentEfforts && segmentEfforts.length > 0 && (
          <CollapsibleSection title="Segments" count={segmentEfforts.length}>
            <div className="space-y-2">
              {segmentEfforts.map((effort, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{effort.name}</p>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">{formatDistance(effort.segment.distance)} · {effort.segment.average_grade.toFixed(1)}%</p>
                  </div>
                  <span className="text-sm font-mono">{formatDuration(effort.elapsed_time)}</span>
                  {effort.pr_rank === 1 && <span className="text-xs font-medium text-[var(--color-accent)]">PR</span>}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Heart Rate */}
        {activity.averageHeartrate && (
          <MetricSection
            title="Heart Rate"
            color="var(--color-heart)"
            defaultOpen={!!streams?.heartrate}
          >
            {streams?.heartrate && (
              <StreamAreaChart data={streams.heartrate as number[]} color="#ef4444" unit="bpm" />
            )}
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-secondary)]">Avg Heart Rate</span>
                <span className="text-sm font-semibold">{Math.round(activity.averageHeartrate)} bpm</span>
              </div>
              {activity.maxHeartrate && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ink-secondary)]">Max Heart Rate</span>
                  <span className="text-sm font-semibold">{Math.round(activity.maxHeartrate)} bpm</span>
                </div>
              )}
              {activity.sufferScore && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ink-secondary)]">Relative Effort</span>
                  <span className="text-sm font-semibold">{activity.sufferScore}</span>
                </div>
              )}
            </div>
          </MetricSection>
        )}

        {/* Pace */}
        {activity.averageSpeed > 0 && (
          <MetricSection
            title="Pace"
            color="var(--color-accent)"
            defaultOpen={!!streams?.velocitySmooth}
          >
            {streams?.velocitySmooth && (
              <StreamAreaChart data={(streams.velocitySmooth as number[]).map((v: number) => v > 0 ? 1000 / v / 60 : 0)} color="#fc4c02" unit="min/km" inverted />
            )}
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-secondary)]">Avg Pace</span>
                <span className="text-sm font-semibold">{formatPace(activity.averageSpeed, activity.type)}</span>
              </div>
              {activity.maxSpeed > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ink-secondary)]">Max Pace</span>
                  <span className="text-sm font-semibold">{formatPace(activity.maxSpeed, activity.type)}</span>
                </div>
              )}
            </div>
          </MetricSection>
        )}

        {/* Elevation */}
        {activity.totalElevationGain > 0 && (
          <MetricSection
            title="Elevation"
            color="var(--color-elevation)"
            defaultOpen={!!streams?.altitude}
          >
            {streams?.altitude && (
              <StreamAreaChart data={streams.altitude as number[]} color="#059669" unit="m" />
            )}
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-secondary)]">Gain</span>
                <span className="text-sm font-semibold">{Math.round(activity.totalElevationGain)} m</span>
              </div>
              {activity.elevHigh && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ink-secondary)]">Max</span>
                  <span className="text-sm font-semibold">{Math.round(activity.elevHigh)} m</span>
                </div>
              )}
              {activity.elevLow != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ink-secondary)]">Min</span>
                  <span className="text-sm font-semibold">{Math.round(activity.elevLow)} m</span>
                </div>
              )}
            </div>
          </MetricSection>
        )}

        {/* Comments */}
        {comments && comments.length > 0 && (
          <section className="py-[var(--content-card-vertical-padding)] border-t border-[var(--color-border)]">
            <h2 className="text-[length:var(--small-section-title-font-size)] font-semibold mb-[0.75rem]">Comments</h2>
            <div className="space-y-3">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  {c.athlete?.profile && <img src={c.athlete.profile} alt="" className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs font-medium">{c.athlete?.firstname} {c.athlete?.lastname}</p>
                    <p className="text-sm text-[var(--color-ink-secondary)] mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        </div>
      </main>
    </div>
  )
}

// --- Sub-components ---

function KudosBar({ kudos, kudosCount, commentCount }: {
  kudos: Array<{ firstname: string; lastname: string; profile: string }> | null
  kudosCount: number
  commentCount: number
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const totalKudos = kudosCount || kudos?.length || 0

  if (totalKudos === 0 && commentCount === 0) return null

  return (
    <div className="py-3 border-b border-[var(--color-border)] flex items-center gap-4">
      {totalKudos > 0 && (
        <div
          className="relative flex items-center gap-2 cursor-default"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Like className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="text-sm text-[var(--color-ink-secondary)]">{totalKudos}</span>

          {/* Hover tooltip showing who gave kudos */}
          {showTooltip && kudos && kudos.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg px-3 py-2 z-20 min-w-[160px] max-w-[240px]">
              <p className="text-xs font-medium text-[var(--color-ink-tertiary)] mb-1.5">Kudos from</p>
              <div className="space-y-1">
                {kudos.slice(0, 10).map((k, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {k.profile ? (
                      <img src={k.profile} alt="" className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center text-[9px] font-medium">{k.firstname?.[0]}</div>
                    )}
                    <span className="text-xs text-[var(--color-ink)]">{k.firstname} {k.lastname}</span>
                  </div>
                ))}
                {kudos.length > 10 && (
                  <p className="text-xs text-[var(--color-ink-tertiary)]">and {kudos.length - 10} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {commentCount > 0 && (
        <div className="flex items-center gap-2">
          <ChatRoundDots className="w-4 h-4 text-[var(--color-ink-tertiary)]" />
          <span className="text-sm text-[var(--color-ink-secondary)]">{commentCount}</span>
        </div>
      )}
    </div>
  )
}

function CollapsibleSection({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="py-[var(--content-card-vertical-padding)] border-t border-[var(--color-border)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-base font-semibold">{title} <span className="text-sm font-normal text-[var(--color-ink-tertiary)]">({count})</span></h2>
        <svg
          className={`w-4 h-4 text-[var(--color-ink-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </section>
  )
}

function MetricSection({ title, defaultOpen = true, children }: {
  title: string; color?: string; defaultOpen?: boolean; children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="py-[var(--content-card-vertical-padding)] border-t border-[var(--color-border)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-base font-semibold">{title}</h2>
        <svg
          className={`w-4 h-4 text-[var(--color-ink-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </section>
  )
}

function StatPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[var(--color-ink-tertiary)] uppercase tracking-wide">{label}</p>
      <p className="text-[1.4rem] font-bold tracking-tight mt-0.5">{value}</p>
    </div>
  )
}

function StreamAreaChart({ data, color, unit, inverted }: {
  data: number[]; color: string; unit: string; inverted?: boolean
}) {
  if (!data || data.length === 0) return null

  const maxPoints = 150
  const step = Math.max(1, Math.floor(data.length / maxPoints))
  const sampled = data.filter((_, i) => i % step === 0)

  const chartData = sampled.map((v, i) => ({
    i,
    value: inverted ? -v : v,
    raw: v,
  }))

  const avg = sampled.reduce((s, v) => s + v, 0) / sampled.length

  const formatTooltip = (value: number): string => {
    if (unit === 'min/km') {
      const abs = Math.abs(value)
      const min = Math.floor(abs)
      const sec = Math.round((abs - min) * 60)
      return `${min}:${sec.toString().padStart(2, '0')} /km`
    }
    return `${Math.round(Math.abs(value))} ${unit}`
  }

  return (
    <div>
      <div className="flex items-baseline justify-end mb-1">
        <span className="text-xs text-[var(--color-ink-tertiary)]">avg {unit === 'min/km' ? `${Math.floor(avg)}:${Math.round((avg % 1) * 60).toString().padStart(2, '0')}` : Math.round(avg).toString()} {unit}</span>
      </div>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} horizontal vertical={false} />
            <YAxis
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 9, fill: 'var(--color-ink-tertiary)' }}
              tickLine={false}
              axisLine={false}
              width={35}
              reversed={inverted}
              tickFormatter={(v: number) => String(Math.round(Math.abs(v)))}
            />
            <XAxis dataKey="i" hide />
            <Tooltip
              contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: number) => [formatTooltip(value), '']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#gradient-${color.replace('#', '')})`}
              dot={false}
              activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AiAnalysisSection({ athleteStravaId, activityStravaId }: { athleteStravaId: number; activityStravaId: number }) {
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  useEffect(() => {
    setStatus('loading')
    fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/strava/analytics/workout-analysis/${athleteStravaId}/${activityStravaId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        return res.json()
      })
      .then((data) => {
        if (data.error) { setStatus('error') } else { setAnalysis(data); setStatus('done') }
      })
      .catch(() => setStatus('error'))
  }, [athleteStravaId, activityStravaId])

  if (status === 'loading') {
    return (
      <section className="py-[var(--content-card-vertical-padding)] border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <span className="text-sm text-[var(--color-ink-tertiary)]">Analyzing workout...</span>
        </div>
      </section>
    )
  }

  if (status === 'error' || !analysis) return null

  return (
    <section className="py-[var(--content-card-vertical-padding)] border-t border-[var(--color-border)]">
      <h2 className="text-[length:var(--small-section-title-font-size)] font-semibold mb-[0.75rem]">AI Analysis</h2>
      <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">{analysis.summary as string}</p>
      {analysis.recoveryRecommendation && (
        <p className="text-sm text-[var(--color-ink-tertiary)] mt-3 italic">{analysis.recoveryRecommendation as string}</p>
      )}
    </section>
  )
}
