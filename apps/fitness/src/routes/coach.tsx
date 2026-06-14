import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { getSession } from '#/lib/session.server'
import { api } from '#/lib/api'
import { AppHeader } from '#/components/app-header'
import { BottomNav } from '#/components/bottom-nav'

const getCoachData = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession()
  if (!session) return null
  return {
    athleteStravaId: session.athleteStravaId,
    athleteName: session.athleteName,
    athleteImage: session.athleteImage,
    maxHr: session.maxHr,
    weeklyBriefUrl: api.getWeeklyBriefUrl(session.athleteStravaId),
    aiPredictionsUrl: api.getAiPredictionsUrl(session.athleteStravaId),
  }
})

export const Route = createFileRoute('/coach')({
  beforeLoad: async () => {
    const data = await getCoachData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: CoachPage,
})

function CoachPage() {
  const { weeklyBriefUrl, aiPredictionsUrl, athleteName, athleteImage, athleteStravaId, maxHr } = Route.useLoaderData()

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="AI Coach" athleteName={athleteName} athleteImage={athleteImage} athleteStravaId={athleteStravaId} maxHr={maxHr} />
      <main className="mx-auto max-w-5xl px-layout-x py-section space-y-[var(--section-spacing)]">
        <h2 className="text-[length:var(--section-title-font-size)] font-semibold">AI Coach</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Personalized insights powered by AI analysis of your training data.</p>

        <section>
          <h3 className="text-[length:var(--section-title-font-size)] font-semibold mb-section">Weekly Training Brief</h3>
          <StreamingCard url={weeklyBriefUrl} forceUrl={`${weeklyBriefUrl}?force=true`} />
        </section>

        <section>
          <h3 className="text-[length:var(--section-title-font-size)] font-semibold mb-section">Performance Analysis</h3>
          <StreamingCard url={aiPredictionsUrl} />
        </section>
      </main>
      <BottomNav />
    </div>
  )
}

function StreamingCard({ url, forceUrl }: { url: string; forceUrl?: string }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const fetchStream = async (fetchUrl: string) => {
    setLoading(true)
    setLoaded(false)
    setContent('')

    try {
      const res = await fetch(fetchUrl)
      if (!res.ok || !res.body) {
        setContent('Failed to load analysis.')
        setLoading(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setContent(text)
      }

      setLoaded(true)
    } catch {
      setContent('Error fetching analysis.')
    }
    setLoading(false)
  }

  if (!loaded && !loading && !content) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-6">
        <button
          onClick={() => fetchStream(url)}
          className="rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
        >
          Generate Analysis
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
      {loading && (
        <div className="flex items-center gap-2 mb-section">
          <div className="w-2 h-2 bg-[var(--color-success)] rounded-full animate-pulse" />
          <span className="text-sm text-[var(--color-ink-secondary)]">Analyzing your training data...</span>
        </div>
      )}
      <div className="prose prose-sm max-w-none">
        <div className="whitespace-pre-wrap text-sm text-[var(--color-ink)] leading-relaxed">
          {content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
              return <h3 key={i} className="text-[var(--color-ink)] font-semibold text-base mt-4 mb-2">{line.replace('## ', '')}</h3>
            }
            if (line.startsWith('- ')) {
              return <p key={i} className="ml-4 text-[var(--color-ink-secondary)]">{line}</p>
            }
            return <p key={i} className="text-sm text-[var(--color-ink-secondary)]">{line}</p>
          })}
        </div>
      </div>
      {loaded && forceUrl && (
        <button
          onClick={() => fetchStream(forceUrl)}
          className="mt-4 text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors"
        >
          Redo analysis
        </button>
      )}
    </div>
  )
}
