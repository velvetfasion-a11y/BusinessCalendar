import { useEffect, useRef, useState, type FormEvent } from 'react'
import { loadLlm, streamChat, type ChatMessage as LlmMsg, type LlmStatus } from '../lib/llm'
import { DEFAULT_LLM_MODEL } from '../lib/models'
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
  const [llm, setLlm] = useState<LlmStatus>({
    ready: false,
    loading: true,
    progress: 'Starting…',
    percent: 0,
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

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || busy || !llm.ready) return
    setInput('')
    store.addMessage({ role: 'user', text })
    setBusy(true)
    stopSpeaking()
    try {
      const history: LlmMsg[] = [
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
      let draft = ''
      const reply = await streamChat(history, 'motivation', (full) => {
        draft = full
      })
      store.addMessage({ role: 'assistant', text: reply || draft || '…' })
    } finally {
      setBusy(false)
    }
  }

  async function onListen(text: string) {
    stopSpeaking()
    await speak(
      text,
      tts.engine === 'kokoro' ? 'kokoro' : 'webspeech',
    )
  }

  return (
    <div className="page chat-page">
      <div className="chat-top">
        <button type="button" className="secret-plan" onClick={onPaywall}>
          <span>♛</span> {store.planName}
        </button>
        <button
          type="button"
          className="pill-chip serif"
          onClick={() => setSettingsOpen(true)}
        >
          ✦ AI Coach
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
        {store.messages.map((m) => (
          <div key={m.id}>
            <article className={`bubble ${m.role}`}>
              {m.text || (busy && m.role === 'assistant' ? '…' : '')}
            </article>
            {m.role === 'assistant' && m.text && (
              <div className="bubble-actions">
                <button type="button" onClick={() => void onListen(m.text)}>
                  🔊 Listen
                </button>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(m.text)}
                >
                  ⧉ Copy
                </button>
              </div>
            )}
          </div>
        ))}
        {busy && (
          <article className="bubble assistant">…</article>
        )}
      </div>

      <form className="composer" onSubmit={(e) => void onSubmit(e)}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything…"
          disabled={busy || !llm.ready}
        />
        <button type="button" className="circle" aria-label="Voice" disabled>
          🎤
        </button>
        <button
          type="submit"
          className="circle send"
          disabled={busy || !llm.ready || !input.trim()}
          aria-label="Send"
        >
          ✈
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
