import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { loadLlm, streamChat, type ChatMessage, type LlmStatus } from './lib/llm'
import {
  COACH_MODES,
  DEFAULT_LLM_MODEL,
  coachModeById,
  type CoachModeId,
} from './lib/models'
import { initTts, speak, stopSpeaking, type TtsStatus } from './lib/tts'

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

/** Achieve AI Coach — normal website, same look as the in-app coach. */
export default function App() {
  const [mode, setMode] = useState<CoachModeId>('motivation')
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
  const [voiceOn, setVoiceOn] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    COACH_MODES.map((m) => greetingMessage(m.id)),
  )
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const booted = useRef(false)

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

  useEffect(() => {
    if (booted.current) return
    booted.current = true
    void boot()
  }, [])

  async function boot() {
    setLlm((s) => ({ ...s, loading: true, error: null }))
    // Voice can init in parallel; never block chat on TTS.
    void initTts(setTts).then((status) => {
      if (!status.ready) setVoiceOn(false)
    })
    await loadLlm(DEFAULT_LLM_MODEL, setLlm)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  async function speakMessage(id: string, text: string) {
    if (!voiceOn) return
    setSpeakingId(id)
    try {
      await speak(text, tts.engine === 'kokoro' ? 'kokoro' : 'webspeech')
    } catch {
      // ignore
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

  const showLoader = llm.loading

  return (
    <div className="shell coach-screen">
      <header className="coach-title">
        <h1>AI Coach</h1>
        <button
          type="button"
          className={`voice-chip ${voiceOn ? 'on' : ''}`}
          onClick={() => {
            if (voiceOn) stopSpeaking()
            setVoiceOn((v) => !v)
          }}
          aria-pressed={voiceOn}
        >
          {voiceOn ? 'Voice on' : 'Voice off'}
        </button>
      </header>

      <div className="segmented" role="tablist" aria-label="Coach mode">
        {COACH_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={mode === m.id ? 'active' : ''}
            onClick={() => {
              stopSpeaking()
              setMode(m.id)
            }}
          >
            {m.title}
          </button>
        ))}
      </div>

      {(showLoader || llm.error || llm.backend === 'offline') && (
        <div className="coach-loading" role="status">
          {showLoader && (
            <>
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.max(llm.percent, 6)}%` }}
                />
              </div>
              <p>{llm.progress}</p>
              <p className="muted">{tts.progress}</p>
            </>
          )}
          {!showLoader && llm.backend === 'webllm' && (
            <p className="ok">WebLLM running locally in your browser</p>
          )}
          {!showLoader && llm.backend === 'offline' && (
            <p className="muted">
              Using Achieve built-in coach
              {llm.error ? ` — ${llm.error}` : ''}. For the full WebLLM model,
              open in Chrome/Edge with WebGPU.
            </p>
          )}
        </div>
      )}

      <div className="messages" ref={listRef}>
        {modeMessages.map((m) => (
          <article
            key={m.id}
            className={`bubble ${m.role} ${speakingId === m.id ? 'speaking' : ''}`}
          >
            <p>{m.content || (busy ? '…' : '')}</p>
          </article>
        ))}
      </div>

      <form className="composer native" onSubmit={(e) => void onSubmit(e)}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask anything..."
          disabled={busy || !llm.ready}
        />
        <button
          type="submit"
          className="send-circle"
          disabled={busy || !llm.ready || !input.trim()}
          aria-label="Send"
        >
          {busy ? '…' : '↑'}
        </button>
      </form>
    </div>
  )
}
