import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { offlineCoachReply, welcomeMessage, type CoachContext } from '../lib/offlineCoach'
import {
  speechRecognitionSupported,
  startListening,
  stopListening,
} from '../lib/stt'
import { speak, stopSpeaking } from '../lib/tts'
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1.6l1.15 5.1 5.1 1.15-5.1 1.15L12 14.1l-1.15-5.1-5.1-1.15 5.1-1.15L12 1.6z" />
      <path d="M18.6 14.2l.55 2.45 2.45.55-2.45.55-.55 2.45-.55-2.45-2.45-.55 2.45-.55.55-2.45z" opacity="0.85" />
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
  active = true,
  onProfile,
  onPaywall,
}: {
  active?: boolean
  onProfile: () => void
  onPaywall: () => void
}) {
  const store = useStore()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showQuota, setShowQuota] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [listeningId, setListeningId] = useState<string | null>(null)
  const [dictating, setDictating] = useState(false)
  const [voiceHint, setVoiceHint] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const seedWelcome = store.seedWelcome
  const messages = store.messages
  const canDictate = speechRecognitionSupported()

  const habitCount = store.habits.length
  const habitTitlesKey = store.habits.map((h) => h.title).join('\0')
  const streakCount = store.streakCount
  const profileName = store.profileName
  const todayPercent = Math.round(
    store.progressFor(
      (() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
      })(),
    ) * 100,
  )

  const ctx = useMemo<CoachContext>(
    () => ({
      habitCount,
      todayPercent,
      habitTitles: habitTitlesKey ? habitTitlesKey.split('\0') : [],
      streak: streakCount,
      profileName,
    }),
    [habitCount, habitTitlesKey, todayPercent, streakCount, profileName],
  )

  // Seed / refresh greeting without remounting the bubble (stable id in store).
  useEffect(() => {
    if (!active) return
    const welcome = welcomeMessage(ctx)
    if (messages.length === 0) {
      seedWelcome(welcome)
      return
    }
    if (
      messages.length === 1 &&
      messages[0].role === 'assistant' &&
      messages[0].text !== welcome
    ) {
      seedWelcome(welcome)
    }
  }, [active, ctx, messages, seedWelcome])

  useEffect(() => {
    if (!active) return
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [active, store.messages.length, busy])

  useEffect(() => {
    if (active) return
    stopSpeaking()
    stopListening()
    setDictating(false)
    setListeningId(null)
  }, [active])

  useEffect(
    () => () => {
      stopSpeaking()
      stopListening()
    },
    [],
  )

  async function onSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault()
    stopListening()
    setDictating(false)
    const form = e?.currentTarget
    const raw = form ? new FormData(form).get('coach-input') : null
    const fromDom = typeof raw === 'string' ? raw : ''
    const text = (fromDom || input).trim()
    if (!text || busy) return
    setInput('')
    store.addMessage({ role: 'user', text })
    setBusy(true)
    stopSpeaking()
    try {
      await new Promise((r) => setTimeout(r, 320))
      const reply = offlineCoachReply(text, 'motivation', ctx)
      store.addMessage({ role: 'assistant', text: reply })
    } finally {
      setBusy(false)
    }
  }

  async function onListen(id: string, text: string) {
    stopListening()
    setDictating(false)
    stopSpeaking()
    setListeningId(id)
    setVoiceHint(null)
    try {
      await speak(text, {
        voiceId: store.voiceId,
        speed: store.voiceSpeed,
      })
    } catch (err) {
      setVoiceHint(
        err instanceof Error
          ? err.message
          : 'Could not play audio on this device.',
      )
    } finally {
      setListeningId(null)
    }
  }

  function toggleDictation() {
    setVoiceHint(null)
    if (dictating) {
      stopListening()
      setDictating(false)
      return
    }
    if (!canDictate) {
      setVoiceHint(
        'Voice typing needs Chrome or Edge (Safari on iPhone doesn’t support it yet). You can still use Listen.',
      )
      return
    }
    stopSpeaking()
    setDictating(true)
    const ok = startListening({
      lang: /[åäöÅÄÖ]/.test(input) ? 'sv-SE' : 'en-US',
      onPartial: (text) => setInput(text),
      onFinal: (text) => setInput(text),
      onError: (message) => {
        setVoiceHint(message)
        setDictating(false)
      },
      onEnd: () => setDictating(false),
    })
    if (!ok) setDictating(false)
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

      {voiceHint && <p className="voice-hint">{voiceHint}</p>}

      <form className="composer" onSubmit={(e) => void onSubmit(e)}>
        <input
          name="coach-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={dictating ? 'Listening…' : 'Ask me anything...'}
          disabled={busy}
          aria-label="Message"
          autoComplete="off"
        />
        <button
          type="button"
          className={`circle mic ${dictating ? 'hot' : ''}`}
          aria-label={dictating ? 'Stop voice input' : 'Voice input'}
          aria-pressed={dictating}
          disabled={busy}
          onClick={toggleDictation}
        >
          <MicIcon />
        </button>
        <button type="submit" className="circle send" disabled={busy} aria-label="Send">
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
