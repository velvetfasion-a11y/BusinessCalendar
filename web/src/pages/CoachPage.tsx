import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { loadLlm, streamChat, type ChatMessage, type LlmStatus } from '../lib/llm'
import {
  COACH_MODES,
  DEFAULT_LLM_MODEL,
  coachModeById,
  type CoachModeId,
} from '../lib/models'
import { initTts, speak, stopSpeaking, type TtsStatus } from '../lib/tts'
import { useStore } from '../lib/store'

function uid() {
  return crypto.randomUUID()
}

function greeting(mode: CoachModeId): ChatMessage {
  return {
    id: uid(),
    role: 'assistant',
    mode,
    content: coachModeById(mode).greeting,
  }
}

export function CoachPage() {
  const store = useStore()
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
    COACH_MODES.map((m) => greeting(m.id)),
  )
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
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
    void initTts(setTts).then((s) => {
      if (!s.ready) setVoiceOn(false)
    })
    void loadLlm(DEFAULT_LLM_MODEL, setLlm)
  }, [])

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || busy || !llm.ready) return
    const userMsg: ChatMessage = { id: uid(), role: 'user', mode, content: text }
    const assistantId = uid()
    const next = [...messages, userMsg]
    setMessages([...next, { id: assistantId, role: 'assistant', mode, content: '' }])
    setInput('')
    setBusy(true)
    stopSpeaking()
    try {
      const reply = await streamChat(next, mode, (full) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m)),
        )
      })
      if (voiceOn && reply.trim()) {
        await speak(reply, tts.engine === 'kokoro' ? 'kokoro' : 'webspeech')
      }
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

  return (
    <div className="page coach-page">
      <h1 className="page-title">AI Coach</h1>

      <div className="segmented ios">
        {COACH_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
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

      <div className="messages" ref={listRef}>
        {modeMessages.map((m) => (
          <article
            key={m.id}
            className={`bubble ${m.role}`}
            style={
              m.role === 'user'
                ? { background: store.accentHex, color: '#fff' }
                : undefined
            }
          >
            <p>{m.content || (busy ? '…' : '')}</p>
          </article>
        ))}
      </div>

      <form className="composer native" onSubmit={(e) => void onSubmit(e)}>
        <button
          type="button"
          className={`voice-dot ${voiceOn ? 'on' : ''}`}
          title={voiceOn ? 'Voice on' : 'Voice off'}
          onClick={() => {
            if (voiceOn) stopSpeaking()
            setVoiceOn((v) => !v)
          }}
        >
          {voiceOn ? '🔊' : '🔇'}
        </button>
        <textarea
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
          style={{ background: store.accentHex }}
          disabled={busy || !llm.ready || !input.trim()}
        >
          {busy ? '…' : '↑'}
        </button>
      </form>
    </div>
  )
}
