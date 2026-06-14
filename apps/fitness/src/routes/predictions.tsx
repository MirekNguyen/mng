import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { formatDuration } from '#/lib/format'
import { AppHeader } from '#/components/app-header'
import { BottomNav } from '#/components/bottom-nav'

const getPredictionsData = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession()
  if (!session) return null
  return api.getPredictions(session.athleteStravaId).then((p) => ({ ...p, athleteName: session.athleteName, athleteImage: session.athleteImage, athleteStravaId: session.athleteStravaId, maxHr: session.maxHr }))
})

export const Route = createFileRoute('/predictions')({
  beforeLoad: async () => {
    const data = await getPredictionsData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: PredictionsPage,
})

type RacePrediction = {
  distance: string
  predictedTime: number
  predictedPace: number
  confidence: 'high' | 'medium' | 'low'
  basedOn: string
}

type Insight = {
  type: 'warning' | 'info' | 'success'
  title: string
  message: string
}

function PredictionsPage() {
  const data = Route.useLoaderData()

  const riskColors = {
    low: 'text-green-400 bg-green-400/10 border-green-400/20',
    moderate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    very_high: 'text-red-400 bg-red-400/10 border-red-400/20',
  }

  const insightColors = {
    warning: 'border-orange-400/20 bg-orange-400/5',
    info: 'border-blue-400/20 bg-blue-400/5',
    success: 'border-green-400/20 bg-green-400/5',
  }

  const formatPace = (secPerKm: number): string => {
    const min = Math.floor(secPerKm / 60)
    const sec = Math.round(secPerKm % 60)
    return `${min}:${sec.toString().padStart(2, '0')} /km`
  }

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Predictions" athleteName={data.athleteName as string} athleteImage={data.athleteImage as string | undefined} athleteStravaId={data.athleteStravaId} maxHr={data.maxHr} />
      <main className="mx-auto max-w-5xl px-layout-x py-section space-y-[var(--section-spacing)]">
        <h2 className="text-[length:var(--section-title-font-size)] font-semibold">Performance Predictions</h2>

        {/* Injury Risk */}
        <section>
          <h3 className="text-[length:var(--section-title-font-size)] font-semibold mb-section">Injury Risk (ACWR)</h3>
          <div className={`rounded-lg border p-5 ${riskColors[data.injuryRisk.riskLevel as keyof typeof riskColors]}`}>
            <div className="flex items-center justify-between mb-[0.75rem]">
              <div>
                <p className="text-[length:var(--section-title-font-size)] font-semibold">{data.injuryRisk.acwr}</p>
                <p className="text-sm opacity-80">Acute:Chronic Workload Ratio</p>
              </div>
              <div className="text-right">
                <p className="font-medium capitalize">{data.injuryRisk.riskLevel.replace('_', ' ')} Risk</p>
                {data.injuryRisk.weeklyLoadChange !== 0 && (
                  <p className="text-sm opacity-80">
                    {data.injuryRisk.weeklyLoadChange > 0 ? '+' : ''}{data.injuryRisk.weeklyLoadChange}% vs last week
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm opacity-80">{data.injuryRisk.recommendation}</p>
            <div className="mt-3 w-full bg-zinc-800/50 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-current transition-all"
                style={{ width: `${Math.min(data.injuryRisk.acwr / 2 * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs opacity-60 mt-1">
              <span>0</span>
              <span>0.8</span>
              <span>1.3</span>
              <span>1.5</span>
              <span>2.0</span>
            </div>
          </div>
        </section>

        {/* Race Predictions */}
        {data.racePredictions.length > 0 && (
          <section>
            <h3 className="text-[length:var(--section-title-font-size)] font-semibold mb-section">Race Time Estimates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.racePredictions.map((pred: RacePrediction) => (
                <div key={pred.distance} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-lg">{pred.distance}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      pred.confidence === 'high' ? 'bg-green-400/10 text-green-400' :
                      pred.confidence === 'medium' ? 'bg-yellow-400/10 text-yellow-400' :
                      'bg-zinc-400/10 text-zinc-400'
                    }`}>
                      {pred.confidence} confidence
                    </span>
                  </div>
                  <p className="text-[length:var(--section-title-font-size)] font-semibold">{formatDuration(pred.predictedTime)}</p>
                  <p className="text-sm text-zinc-400 mt-1">{formatPace(pred.predictedPace)}</p>
                  <p className="text-xs text-zinc-500 mt-2">Based on: {pred.basedOn}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Training Insights */}
        {data.insights.length > 0 && (
          <section>
            <h3 className="text-[length:var(--section-title-font-size)] font-semibold mb-section">Training Insights</h3>
            <div className="space-y-3">
              {data.insights.map((insight: Insight, i: number) => (
                <div key={i} className={`rounded-lg border p-4 ${insightColors[insight.type]}`}>
                  <p className="text-sm font-medium mb-1 text-[var(--color-ink)]">{insight.title}</p>
                  <p className="text-sm text-zinc-300">{insight.message}</p>
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
