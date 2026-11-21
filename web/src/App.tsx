import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { loadLlm, streamChat, type ChatMessage } from './lib/llm'
import {
  COACH_MODES,
  DEFAULT_LLM_MODEL,
  LLM_MODELS,
  coachModeById,
  type CoachModeId,
  type LlmModelId,
} from './lib/models'
import { initTts, speak, stopSpeaking, type TtsStatus } from './lib/tts'
import type { LlmStatus } from './lib/llm'

function uid() {
  return crypto.randomUUID()
}

function greetingMessage(mode: CoachModeId): ChatMessage {
  return {
    id: uid(),
    role: 'assistant',
    mode,
    content: coachModeById(mode).greeting,
  }
}

export default function App() {
  const [phase, setPhase] = useState<'boot' | 'chat'>('boot')
  const [modelId, setModelId] = useState<LlmModelId>(DEFAULT_LLM_MODEL)
  const [mode, setMode] = useState<CoachModeId>('motivation')
  const [llm, setLlm] = useState<LlmStatus>({
    ready: false,
    loading: false,
    progress: 'Waiting…',
    percent: 0,
    error: null,
    modelId: null,
  })
  const [tts, setTts] = useState<TtsStatus>({
    engine: 'none',
    ready: false,
    loading: false,
    progress: 'Waiting…',
    error: null,
  })
  const [voiceOn, setVoiceOn] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    COACH_MODES.map((m) => greetingMessage(m.id)),
  )
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const modeMessages = useMemo(
    () => messages.filter((m) => m.mode === mode),
    [messages, mode],
  )

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [modeMessages, busy])

  useEffect(() => () => stopSpeaking(), [])

  async function start() {
    setBootError(null)
    setLlm((s) => ({ ...s, loading: true, error: null }))
    try {
      await loadLlm(modelId, setLlm)
      const ttsStatus = await initTts(setTts)
      if (!ttsStatus.ready) setVoiceOn(false)
      setPhase('chat')
      requestAnimationFrame(() => inputRef.current?.focus())
    } catch (err) {
      setBootError(err instanceof Error ? err.message : String(err))
    }
  }

  async function speakMessage(id: string, text: string) {
    if (!voiceOn) return
    setSpeakingId(id)
    try {
      await speak(text, tts.engine === 'kokoro' ? 'kokoro' : 'webspeech')
    } catch {
      // ignore playback errors in UI flow
    } finally {
      setSpeakingId((current) => (current === id ? null : current))
    }
  }

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || busy || !llm.ready) return

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      mode,
      content: text,
    }
    const assistantId = uid()
    const nextHistory = [...messages, userMsg]
    setMessages([
      ...nextHistory,
      { id: assistantId, role: 'assistant', mode, content: '' },
    ])
    setInput('')
    setBusy(true)
    stopSpeaking()

    try {
      const reply = await streamChat(nextHistory, mode, (full) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: full } : m,
          ),
        )
      })
      if (voiceOn && reply.trim()) {
        await speakMessage(assistantId, reply)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `Error: ${message}` } : m,
        ),
      )
    } finally {
      setBusy(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void onSubmit()
    }
  }

  if (phase === 'boot') {
    return (
      <div className="shell boot">
        <div className="atmosphere" aria-hidden />
        <main className="hero">
          <p className="eyebrow">Achieve · BusinessCalendar</p>
          <p className="brand">AI Coach</p>
          <h1>Your local coach that talks back</h1>
          <p className="lede">
            Same Motivation, Routines, and Energy coach as Achieve — now powered
            by WebLLM in your browser, with Kokoro reading replies aloud. No
            server.
          </p>

          <label className="field">
            <span>Model</span>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value as LlmModelId)}
              disabled={llm.loading || tts.loading}
            >
              {LLM_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} — {m.hint}
                </option>
              ))}
            </select>
          </label>

          <div className="cta-row">
            <button
              type="button"
              className="primary"
              onClick={() => void start()}
              disabled={llm.loading || tts.loading}
            >
              {llm.loading || tts.loading ? 'Loading…' : 'Start AI Coach'}
            </button>
            <p className="fine">
              Needs WebGPU (Chrome/Edge). Model weights download to your device
              on first run.
            </p>
          </div>

          {(llm.loading || tts.loading || llm.ready) && (
            <div className="progress-block" role="status">
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.max(llm.percent, tts.loading ? 8 : 0)}%`,
                  }}
                />
              </div>
              <p>{llm.progress}</p>
              <p className="muted">{tts.progress}</p>
            </div>
          )}

          {(bootError || llm.error) && (
            <p className="error">{bootError || llm.error}</p>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="shell chat">
      <div className="atmosphere soft" aria-hidden />
      <header className="top">
        <div className="top-brand">
          <span className="brand mark">AI Coach</span>
          <span className="pill">Achieve</span>
        </div>
        <div className="top-actions">
          <button
            type="button"
            className={`toggle ${voiceOn ? 'on' : ''}`}
            onClick={() => {
              if (voiceOn) stopSpeaking()
              setVoiceOn((v) => !v)
            }}
            aria-pressed={voiceOn}
          >
            {voiceOn
              ? tts.engine === 'kokoro'
                ? 'Voice: Kokoro'
                : 'Voice: Web Speech'
              : 'Voice off'}
          </button>
        </div>
      </header>

      <div
        className="modes"
        role="tablist"
        aria-label="Coach mode"
      >
        {COACH_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={`mode ${mode === m.id ? 'active' : ''}`}
            onClick={() => {
              stopSpeaking()
              setMode(m.id)
            }}
          >
            {m.title}
          </button>
        ))}
      </div>

      <div className="messages" ref={listRef}>
        {modeMessages.map((m) => (
          <article
            key={m.id}
            className={`bubble ${m.role} ${speakingId === m.id ? 'speaking' : ''}`}
          >
            <header>
              {m.role === 'user' ? 'You' : 'AI Coach'}
              {m.role === 'assistant' && m.content && (
                <button
                  type="button"
                  className="speak-again"
                  onClick={() => void speakMessage(m.id, m.content)}
                  disabled={!voiceOn}
                >
                  Speak
                </button>
              )}
            </header>
            <p>{m.content || (busy ? '…' : '')}</p>
          </article>
        ))}
      </div>

      <form className="composer" onSubmit={(e) => void onSubmit(e)}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask anything…"
          disabled={busy}
        />
        <button
          type="submit"
          className="primary send"
          disabled={busy || !input.trim()}
        >
          Send
        </button>
      </form>

      {tts.error && <p className="toast">{tts.error}</p>}
    </div>
  )
}
