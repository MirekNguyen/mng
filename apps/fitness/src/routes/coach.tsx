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
  const { weeklyBriefUrl, aiPredictionsUrl, athleteName, athleteImage } = Route.useLoaderData()

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="AI Coach" athleteName={athleteName} athleteImage={athleteImage} />
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        <h2 className="text-2xl font-bold">AI Coach</h2>
        <p className="text-zinc-400">Personalized insights powered by AI analysis of your training data.</p>

        <section>
          <h3 className="text-[length:var(--section-title-font-size)] font-semibold mb-section">Weekly Training Brief</h3>
          <StreamingCard url={weeklyBriefUrl} />
        </section>

        <section>
          <h3 className="text-[length:var(--section-title-font-size)] font-semibold mb-section">Performance Analysis</h3>
          <StreamingCard url={aiPredictionsUrl} />
        </section>
      </main>
      <BottomNav />
    </div>  )
}

function StreamingCard({ url }: { url: string }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const fetchStream = async () => {
    setLoading(true)
    setContent('')

    try {
      const res = await fetch(url)
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

  if (!loaded && !loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <button
          onClick={fetchStream}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors"
        >
          Generate Analysis
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      {loading && (
        <div className="flex items-center gap-2 mb-section">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm text-zinc-400">Analyzing your training data...</span>
        </div>
      )}
      <div className="prose prose-invert prose-sm max-w-none">
        <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed">
          {content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
              return <h3 key={i} className="text-white font-semibold text-base mt-4 mb-2">{line.replace('## ', '')}</h3>
            }
            if (line.startsWith('- ')) {
              return <p key={i} className="ml-4 text-zinc-300">{line}</p>
            }
            return <p key={i} className="text-zinc-300">{line}</p>
          })}
        </div>
      </div>
      {loaded && (
        <button
          onClick={() => { setLoaded(false); setContent(''); }}
          className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Regenerate
        </button>
      )}
    </div>
  )
}
