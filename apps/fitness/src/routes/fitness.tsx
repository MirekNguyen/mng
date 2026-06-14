import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatDuration } from '#/lib/format'
import { useState, useEffect } from 'react'
import { ResponsiveContainer, Line, XAxis, YAxis, Tooltip, Area, AreaChart, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '#/components/ui/chart'
import { BottomNav } from '#/components/bottom-nav'
import { AppHeader } from '#/components/app-header'

type DayData = { date: string; ctl: number; atl: number; tsb: number; tss: number }
type RacePrediction = { distance: string; predictedTime: number; predictedPace: number; confidence: string; basedOn: string }
type TrainingInsight = { type: string; title: string; message: string }
type InjuryRisk = { acwr: number; riskLevel: string; weeklyLoadChange: number; recommendation: string }

const getFitnessData = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await getSession()
  if (!session) return null

  const [fitness, predictions] = await Promise.all([
    api.getFitness(session.athleteStravaId, 90),
    api.getPredictions(session.athleteStravaId),
  ])

  return { ...fitness, ...predictions, athleteStravaId: session.athleteStravaId, athleteName: session.athleteName, athleteImage: session.athleteImage }
})

export const Route = createFileRoute('/fitness')({
  beforeLoad: async () => {
    const data = await getFitnessData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: FitnessPage,
})

const fitnessChartConfig: ChartConfig = {
  ctl: { label: 'Fitness (CTL)', color: 'var(--color-elevation)' },
  atl: { label: 'Fatigue (ATL)', color: 'var(--color-accent)' },
  tsb: { label: 'Form (TSB)', color: 'var(--color-success)' },
}

function FitnessPage() {
  const data = Route.useLoaderData()

  const days = (data.daily as DayData[]).slice(-60).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
  }))

  const racePredictions = data.racePredictions as RacePrediction[] | undefined
  const injuryRisk = data.injuryRisk as InjuryRisk | undefined
  const insights = data.insights as TrainingInsight[] | undefined

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Fitness" athleteName={data.athleteName as string} athleteImage={data.athleteImage as string | undefined} />

      <main className="max-w-[var(--max-width)] mx-auto px-layout-x pt-section space-y-[var(--section-spacing)]">
        <h1 className="text-[length:var(--section-title-font-size)] font-semibold">Training Load</h1>

        {/* CTL / ATL / TSB */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)]">Fitness (CTL)</p>
            <p className="text-[length:var(--font-size-xxl)] font-semibold tracking-tight text-[var(--color-elevation)]">{data.currentCtl}</p>
            <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">{data.fitnessLevel}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)]">Fatigue (ATL)</p>
            <p className="text-[length:var(--font-size-xxl)] font-semibold tracking-tight text-[var(--color-accent)]">{data.currentAtl}</p>
            <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">{data.fatigueLevel}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)]">Form (TSB)</p>
            <p className={`text-[length:var(--font-size-xxl)] font-semibold tracking-tight ${data.currentTsb >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-heart)]'}`}>{data.currentTsb}</p>
            <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">{data.formStatus}</p>
          </div>
        </div>

        {/* Fitness Chart */}
        <section>
          <p className="text-xs text-[var(--color-ink-tertiary)] mb-[0.75rem]">60-day fitness trend</p>
          <ChartContainer config={fitnessChartConfig} className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--color-ink-tertiary)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={14}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-ink-tertiary)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltipContent config={fitnessChartConfig} formatter={(v) => Math.round(v).toString()} />} />
                <Area type="monotone" dataKey="ctl" stroke="var(--color-elevation)" fill="var(--color-elevation)" fillOpacity={0.08} strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="atl" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.04} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tsb" stroke="var(--color-success)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </section>

        {/* Weekly Analysis (streaming AI) */}
        <WeeklyAnalysis athleteStravaId={data.athleteStravaId} />

        {/* Injury Risk */}
        {injuryRisk && (
          <section className="py-[var(--content-card-vertical-padding)] border-t border-[var(--color-border)]">
            <h2 className="text-[length:var(--small-section-title-font-size)] font-semibold mb-[0.75rem]">Injury Risk</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[length:var(--font-size-xl)] font-semibold tracking-tight">{injuryRisk.acwr.toFixed(2)}</span>
                  <span className="text-xs text-[var(--color-ink-tertiary)]">ACWR</span>
                </div>
                <p className="text-sm text-[var(--color-ink-secondary)] mt-1">{injuryRisk.recommendation}</p>
              </div>
              <RiskBadge level={injuryRisk.riskLevel} />
            </div>
          </section>
        )}

        {/* Race Predictions */}
        {racePredictions && racePredictions.length > 0 && (
          <section className="py-[var(--content-card-vertical-padding)] border-t border-[var(--color-border)]">
            <h2 className="text-[length:var(--small-section-title-font-size)] font-semibold mb-[0.75rem]">Race Predictions</h2>
            <div className="space-y-2">
              {racePredictions.map((pred) => (
                <div key={pred.distance} className="flex items-center justify-between py-list-y border-b border-[var(--color-accent-muted)] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{pred.distance}</p>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">Based on {pred.basedOn}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[length:var(--font-size-md)] font-mono font-semibold text-[var(--color-ink)]">{formatDuration(pred.predictedTime)}</p>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">{formatPaceFromSec(pred.predictedPace)}/km</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Training Insights */}
        {insights && insights.length > 0 && (
          <section className="py-[var(--content-card-vertical-padding)] border-t border-[var(--color-border)]">
            <h2 className="text-[length:var(--small-section-title-font-size)] font-semibold mb-[0.75rem]">Insights</h2>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: insight.type === 'warning' ? 'var(--color-warning-subtle)' : insight.type === 'success' ? 'var(--color-success-subtle)' : 'var(--color-elevation-subtle)' }}>
                  <span className="text-sm mt-0.5">{insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : 'ℹ️'}</span>
                  <div>
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">{insight.message}</p>
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

const formatPaceFromSec = (secPerKm: number): string => {
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

const RiskBadge = ({ level }: { level: string }) => {
  const colors: Record<string, string> = {
    low: 'bg-[var(--color-success-subtle)] text-[var(--color-success)]',
    moderate: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]',
    high: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]',
    very_high: 'bg-[var(--color-heart-subtle)] text-[var(--color-heart)]',
  }
  const labels: Record<string, string> = {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    very_high: 'Very High',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[level] ?? 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]'}`}>
      {labels[level] ?? level}
    </span>
  )
}

const WeeklyAnalysis = ({ athleteStravaId }: { athleteStravaId: number }) => {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchStream = (force = false) => {
    const baseUrl = api.getWeeklyBriefUrl(athleteStravaId)
    const url = force ? `${baseUrl}?force=true` : baseUrl
    const controller = new AbortController()

    setIsLoading(true)
    setContent('')

    const run = async () => {
      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok || !res.body) { setIsLoading(false); return }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let text = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          text += decoder.decode(value, { stream: true })
          setContent(text)
        }
        setIsLoading(false)
      } catch {
        setIsLoading(false)
      }
    }

    run()
    return controller
  }

  useEffect(() => {
    const controller = fetchStream(false)
    return () => controller.abort()
  }, [athleteStravaId])

  if (!content && !isLoading) return null

  return (
    <section className="py-[var(--content-card-vertical-padding)] border-t border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-[0.75rem]">
        <h2 className="text-[length:var(--small-section-title-font-size)] font-semibold">This Week</h2>
        {!isLoading && content && (
          <button
            onClick={() => fetchStream(true)}
            className="text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors"
          >
            Redo analysis
          </button>
        )}
      </div>
      {isLoading && !content && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-ink-tertiary)]">
          <span className="inline-block w-3 h-3 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          Analyzing your week...
        </div>
      )}
      {content && (
        <div className="prose-sm text-sm text-[var(--color-ink-secondary)] space-y-2 [&_h2]:text-[length:var(--small-section-title-font-size)] [&_h2]:font-semibold [&_h2]:text-[var(--color-ink)] [&_h2]:mt-4 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_li]:text-sm [&_p]:leading-relaxed">
          <FormattedMarkdown text={content} />
        </div>
      )}
    </section>
  )
}

const FormattedMarkdown = ({ text }: { text: string }) => {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i}>{line.slice(3)}</h2>)
    } else if (line.startsWith('- ')) {
      // Collect consecutive list items
      const items: string[] = [line.slice(2)]
      while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
        i++
        items.push(lines[i].slice(2))
      }
      elements.push(
        <ul key={i}>
          {items.map((item, j) => <li key={j}>{formatBold(item)}</li>)}
        </ul>
      )
    } else if (line.trim()) {
      elements.push(<p key={i}>{formatBold(line)}</p>)
    }
  }

  return <>{elements}</>
}

const formatBold = (text: string): React.ReactNode => {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-medium text-[var(--color-ink)]">{part}</strong> : part
  )
}
