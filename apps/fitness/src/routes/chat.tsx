import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { ChatRoundDots, AddCircle, Plain } from '@solar-icons/react'

import { getSession } from '#/lib/session.server'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { BottomNav } from '#/components/bottom-nav'
import { AppHeader } from '#/components/app-header'

const getSessionData = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession()
  if (!session) return null
  return { athleteStravaId: session.athleteStravaId, athleteName: session.athleteName, athleteImage: session.athleteImage }
})

export const Route = createFileRoute('/chat')({
  beforeLoad: async () => {
    const data = await getSessionData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  loader: ({ context }) => context,
  component: ChatPage,
})

const SUGGESTIONS = [
  "How's my training this week?",
  "Am I ready for a 10K race?",
  "What should I do tomorrow?",
  "Analyze my pace trend",
  "Improve my half marathon?",
  "Am I overtraining?",
]

function ChatPage() {
  const { athleteStravaId, athleteName, athleteImage } = Route.useLoaderData()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/strava/chat/${athleteStravaId}`,
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text && !imageFile) return

    const files: Array<{ type: 'file'; mediaType: string; url: string }> | undefined =
      imageFile && imagePreview
        ? [{ type: 'file' as const, mediaType: imageFile.type, url: imagePreview }]
        : undefined

    sendMessage({ text: text || '', files })
    setInput('')
    removeImage()
  }

  const handleSuggestion = (suggestion: string) => {
    sendMessage({ text: suggestion })
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      {/* Header */}
      <AppHeader title="Coach" athleteName={athleteName} athleteImage={athleteImage} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-[600px] mx-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-16 pb-8 text-center animate-in-scale">
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
                <ChatRoundDots width="20" height="20" stroke="var(--color-accent)" />
              </div>
              <h1 className="text-lg font-semibold mb-1.5">Ask your coach</h1>
              <p className="text-[13px] text-[var(--color-ink-secondary)] max-w-[280px] mb-8">
                I know your pace, HR, volume, PRs, and fitness trends. Ask me anything.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-[360px]">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="px-3 py-1.5 text-[13px] rounded-full border border-[var(--color-border)] text-[var(--color-ink-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end animate-in-right' : 'justify-start animate-in-left'}`}>
                <div className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-[var(--color-accent)] text-white rounded-[18px] rounded-br-[4px] px-3.5 py-2'
                    : 'text-[var(--color-ink)]'
                }`}>
                  {message.parts.map((part, i) => {
                    if (part.type === 'text') {
                      return message.role === 'user'
                        ? <p key={i} className="text-[14px] leading-snug">{part.text}</p>
                        : <MarkdownContent key={i} text={part.text} />
                    }
                    if (part.type === 'file') {
                      return <img key={i} src={part.url} alt="" className="rounded-xl max-h-40 mb-1.5" />
                    }
                    return null
                  })}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 py-1">
                  <span className="w-1.5 h-1.5 bg-[var(--color-ink-faint)] rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-[var(--color-ink-faint)] rounded-full animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-[var(--color-ink-faint)] rounded-full animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        <div className="max-w-[600px] mx-auto px-3 py-2">
          {imagePreview && (
            <div className="relative inline-block mb-2 ml-1">
              <img src={imagePreview} alt="" className="h-14 rounded-lg object-cover" />
              <button
                onClick={removeImage}
                className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[var(--color-ink)] text-white rounded-full text-[10px] flex items-center justify-center leading-none"
              >
                ×
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors mb-0.5"
            >
              <AddCircle width="20" height="20" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message..."
              disabled={isLoading}
              className="flex-1 min-h-[36px] px-3.5 py-2 rounded-[18px] bg-[var(--color-surface-sunken)] text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !imageFile)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-white disabled:opacity-25 transition-opacity mb-0.5"
            >
              <Plain width="14" height="14" />
            </button>
          </form>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

const MarkdownContent = ({ text }: { text: string }) => {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-[13px] font-semibold mt-2.5 mb-0.5 text-[var(--color-ink)]">{line.slice(3)}</h3>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [line.slice(2)]
      while (i + 1 < lines.length && (lines[i + 1].startsWith('- ') || lines[i + 1].startsWith('* '))) {
        i++
        items.push(lines[i].slice(2))
      }
      elements.push(
        <ul key={i} className="list-disc pl-3.5 space-y-0.5 text-[13px] text-[var(--color-ink)]">
          {items.map((item, j) => <li key={j} className="leading-relaxed">{renderInline(item)}</li>)}
        </ul>
      )
    } else if (line.trim()) {
      elements.push(<p key={i} className="text-[13px] leading-relaxed text-[var(--color-ink)]">{renderInline(line)}</p>)
    }
  }

  return <div className="space-y-1">{elements}</div>
}

const renderInline = (text: string): React.ReactNode => {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}
