import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { loadLlm, streamChat, type ChatMessage as LlmMsg, type LlmStatus } from '../lib/llm'
import { DEFAULT_LLM_MODEL } from '../lib/models'
import { offlineCoachReply, welcomeMessage, type CoachContext } from '../lib/offlineCoach'
import { initTts, speak, stopSpeaking, type TtsStatus } from '../lib/tts'
import { useStore } from '../lib/store'
import { AiChatSettings } from './AiChatSettings'

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19c1.4-3 3.7-4.5 6.5-4.5S17.1 16 18.5 19" strokeLinecap="round" />
    </svg>
  )
}

function CrownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 18h18l-1.2-9.5L15 12l-3-8-3 8-4.8-3.5L3 18zm2.2 2h13.6v1.5H5.2V20z" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.4 6.2L20 12l-6.6 3.8L12 22l-1.4-6.2L4 12l6.6-3.8L12 2z" />
    </svg>
  )
}

function SpeakerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10v4h3l5 4V6L7 10H4z" strokeLinejoin="round" />
      <path d="M16 9a4 4 0 010 6" strokeLinecap="round" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="8" y="8" width="11" height="13" rx="2" />
      <path d="M5 16V5a2 2 0 012-2h9" strokeLinecap="round" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0012 0M12 17v3" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.2 11.2L20.5 3.4c.7-.3 1.4.4 1.1 1.1L13.8 21c-.3.7-1.3.6-1.5-.2L10.5 13 3.4 11.6c-.8-.2-.7-1.3.0-1.4z" />
    </svg>
  )
}

export function ChatPage({
  onProfile,
  onPaywall,
}: {
  onProfile: () => void
  onPaywall: () => void
}) {
  const store = useStore()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showQuota, setShowQuota] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [listeningId, setListeningId] = useState<string | null>(null)
  const [llm, setLlm] = useState<LlmStatus>({
    ready: true,
    loading: false,
    progress: 'Achieve coach ready',
    percent: 100,
    error: null,
    modelId: null,
    backend: 'offline',
  })
  const [tts, setTts] = useState<TtsStatus>({
    engine: 'none',
    ready: false,
    loading: true,
    progress: 'Starting voice…',
    error: null,
  })
  const listRef = useRef<HTMLDivElement>(null)
  const booted = useRef(false)

  const todayPercent = store.progressFor(
    (() => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    })(),
  )
  const ctx = useMemo<CoachContext>(
    () => ({
      habitCount: store.habits.length,
      todayPercent: Math.round(todayPercent * 100),
      habitTitles: store.habits.map((h) => h.title),
      streak: store.streakCount,
      profileName: store.profileName,
    }),
    [
      store.habits,
      store.profileName,
      store.streakCount,
      todayPercent,
    ],
  )

  const messageCount = store.messages.length
  const firstMessage = store.messages[0]

  // Seed / refresh the Achieve welcome when chat is empty or only holds the greeting.
  useEffect(() => {
    const welcome = welcomeMessage(ctx)
    if (messageCount === 0) {
      store.seedWelcome(welcome)
      return
    }
    const onlyGreeting = messageCount === 1 && firstMessage?.role === 'assistant'
    if (onlyGreeting && firstMessage.text !== welcome) {
      store.seedWelcome(welcome)
    }
    // Intentionally omit `store` — only react to message/context changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, messageCount, firstMessage?.id, firstMessage?.text, firstMessage?.role])

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [store.messages, busy])

  useEffect(() => {
    if (booted.current) return
    booted.current = true
    void initTts(setTts)
    void loadLlm(DEFAULT_LLM_MODEL, setLlm)
  }, [])

  useEffect(() => () => stopSpeaking(), [])

  async function onSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault()
    const form = e?.currentTarget
    const raw = form
      ? new FormData(form).get('coach-input')
      : null
    const fromDom = typeof raw === 'string' ? raw : ''
    const text = (fromDom || input).trim()
    if (!text || busy) return
    setInput('')
    store.addMessage({ role: 'user', text })
    setBusy(true)
    stopSpeaking()
    try {
      // Achieve voice first (matches App Store / live coach). Optional WebLLM
      // only when ready — then we still guard against chatbot-style drift.
      let reply = offlineCoachReply(text, 'motivation', ctx)
      if (llm.backend === 'webllm' && llm.ready) {
        const history: LlmMsg[] = [
          {
            id: 'ctx',
            role: 'assistant',
            mode: 'motivation',
            content: `User context: ${ctx.habitCount} habits (${ctx.habitTitles.slice(0, 5).join(', ') || 'none'}); today ${ctx.todayPercent}% aligned; streak ${ctx.streak}.`,
          },
          ...store.messages.map((m) => ({
            id: m.id,
            role: m.role,
            mode: 'motivation' as const,
            content: m.text,
          })),
          {
            id: crypto.randomUUID(),
            role: 'user',
            mode: 'motivation',
            content: text,
          },
        ]
        const llmReply = await streamChat(history, 'motivation', () => {}, ctx)
        const ok =
          llmReply.trim().length > 0 &&
          llmReply.length <= 520 &&
          !/^[-*•\d]/.test(llmReply.trim()) &&
          !/as an ai|language model|i'm here to help|certainly!|of course!/i.test(
            llmReply,
          )
        if (ok) reply = llmReply.trim()
      } else {
        await new Promise((r) => setTimeout(r, 480))
      }
      store.addMessage({ role: 'assistant', text: reply })
    } finally {
      setBusy(false)
    }
  }

  async function onListen(id: string, text: string) {
    stopSpeaking()
    setListeningId(id)
    try {
      await speak(text, tts.engine === 'kokoro' ? 'kokoro' : 'webspeech')
    } finally {
      setListeningId(null)
    }
  }

  const displayMessages =
    store.messages.length === 0
      ? [{ id: 'welcome-live', role: 'assistant' as const, text: welcomeMessage(ctx) }]
      : store.messages

  return (
    <div className="page chat-page">
      <div className="chat-top">
        <button type="button" className="secret-plan" onClick={onPaywall}>
          <CrownIcon /> {store.planName}
        </button>
        <button
          type="button"
          className="pill-chip serif"
          onClick={() => setSettingsOpen(true)}
        >
          <SparkleIcon /> AI Coach
        </button>
        <button type="button" className="profile-btn" onClick={onProfile} aria-label="Account">
          <ProfileIcon />
        </button>
      </div>

      {showQuota && (
        <div className="quota-pill">
          <span>
            {store.messagesLeft}/{store.messagesCap} left this month
          </span>
          <button type="button" onClick={() => setShowQuota(false)}>
            OK
          </button>
        </div>
      )}

      <div className="chat-thread" ref={listRef}>
        {displayMessages.map((m) => (
          <div key={m.id} className={`msg-block ${m.role}`}>
            <article className={`bubble ${m.role}`}>{m.text}</article>
            {m.role === 'assistant' && m.text && (
              <div className="bubble-actions">
                <button type="button" onClick={() => void onListen(m.id, m.text)}>
                  <SpeakerIcon /> {listeningId === m.id ? '…' : 'Listen'}
                </button>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(m.text)}
                >
                  <CopyIcon /> Copy
                </button>
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="msg-block assistant">
            <article className="bubble assistant thinking">…</article>
          </div>
        )}
      </div>

      <form className="composer" onSubmit={(e) => void onSubmit(e)}>
        <input
          name="coach-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          disabled={busy}
          aria-label="Message"
          autoComplete="off"
        />
        <button type="button" className="circle" aria-label="Voice input" disabled>
          <MicIcon />
        </button>
        <button
          type="submit"
          className="circle send"
          disabled={busy}
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </form>

      {settingsOpen && (
        <AiChatSettings
          onClose={() => setSettingsOpen(false)}
          onPaywall={() => {
            setSettingsOpen(false)
            onPaywall()
          }}
        />
      )}
    </div>
  )
}
