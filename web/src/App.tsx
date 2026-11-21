import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { loadLlm, streamChat, type ChatMessage } from './lib/llm'
import { DEFAULT_LLM_MODEL, LLM_MODELS, type LlmModelId } from './lib/models'
import { initTts, speak, stopSpeaking, type TtsStatus } from './lib/tts'
import type { LlmStatus } from './lib/llm'

function uid() {
  return crypto.randomUUID()
}

export default function App() {
  const [phase, setPhase] = useState<'boot' | 'chat'>('boot')
  const [modelId, setModelId] = useState<LlmModelId>(DEFAULT_LLM_MODEL)
  const [llm, setLlm] = useState<LlmStatus>({
    ready: false,
    loading: false,
    progress: 'Väntar…',
    percent: 0,
    error: null,
    modelId: null,
  })
  const [tts, setTts] = useState<TtsStatus>({
    engine: 'none',
    ready: false,
    loading: false,
    progress: 'Väntar…',
    error: null,
  })
  const [voiceOn, setVoiceOn] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, busy])

  useEffect(() => () => stopSpeaking(), [])

  async function start() {
    setBootError(null)
    setLlm((s) => ({ ...s, loading: true, error: null }))
    try {
      await loadLlm(modelId, setLlm)
      const ttsStatus = await initTts(setTts)
      if (!ttsStatus.ready) {
        setVoiceOn(false)
      }
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

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text }
    const assistantId = uid()
    const nextHistory = [...messages, userMsg]
    setMessages([
      ...nextHistory,
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setInput('')
    setBusy(true)
    stopSpeaking()

    try {
      const reply = await streamChat(nextHistory, (full) => {
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
          m.id === assistantId
            ? { ...m, content: `Fel: ${message}` }
            : m,
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
          <p className="brand">Viska</p>
          <h1>Lokal AI som pratar tillbaka</h1>
          <p className="lede">
            WebLLM kör modellen i din webbläsare. Kokoro läser upp svaret —
            helt utan server.
          </p>

          <label className="field">
            <span>Modell</span>
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
              {llm.loading || tts.loading ? 'Laddar…' : 'Starta lokalt'}
            </button>
            <p className="fine">
              Kräver WebGPU (Chrome/Edge). Första gången laddas modellvikter till
              din enhet.
            </p>
          </div>

          {(llm.loading || tts.loading || llm.ready) && (
            <div className="progress-block" role="status">
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.max(llm.percent, tts.loading ? 8 : 0)}%` }}
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
          <span className="brand mark">Viska</span>
          <span className="pill">
            {llm.modelId?.split('-').slice(0, 2).join(' ') ?? 'WebLLM'}
          </span>
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
                ? 'Röst: Kokoro'
                : 'Röst: Web Speech'
              : 'Röst av'}
          </button>
        </div>
      </header>

      <div className="messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="empty">
            <p className="brand whisper">Viska</p>
            <p>Skriv något — svaret genereras lokalt och kan läsas upp.</p>
          </div>
        )}
        {messages.map((m) => (
          <article
            key={m.id}
            className={`bubble ${m.role} ${speakingId === m.id ? 'speaking' : ''}`}
          >
            <header>
              {m.role === 'user' ? 'Du' : 'Viska'}
              {m.role === 'assistant' && m.content && (
                <button
                  type="button"
                  className="speak-again"
                  onClick={() => void speakMessage(m.id, m.content)}
                  disabled={!voiceOn}
                >
                  Läs upp
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
          placeholder="Skriv ett meddelande…"
          disabled={busy}
        />
        <button type="submit" className="primary send" disabled={busy || !input.trim()}>
          Skicka
        </button>
      </form>

      {tts.error && <p className="toast">{tts.error}</p>}
    </div>
  )
}
