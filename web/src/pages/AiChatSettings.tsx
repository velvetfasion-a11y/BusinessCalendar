import { useState } from 'react'
import { VOICES } from '../lib/types'
import { useStore } from '../lib/store'
import { previewVoice, stopSpeaking } from '../lib/tts'
import { ShellPortal } from '../lib/portal'

export function AiChatSettings({
  onClose,
  onPaywall,
}: {
  onClose: () => void
  onPaywall: () => void
}) {
  const store = useStore()
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onPickVoice(v: string) {
    store.setVoice(v)
    setError(null)
    stopSpeaking()
    setPreviewing(v)
    try {
      await previewVoice(v, store.voiceSpeed)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not play voice preview on this device.',
      )
    } finally {
      setPreviewing(null)
    }
  }

  return (
    <ShellPortal>
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="sheet-head" style={{ justifyContent: 'center' }}>
          <h2>AI Chat</h2>
        </div>

        <button type="button" className="upgrade-outline" onClick={onPaywall}>
          Upgrade to Pro
        </button>

        <div className="field-label">VOICE</div>
        <div className="speed-card">
          <div className="row">
            <span>Speed</span>
            <span>{store.voiceSpeed}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={store.voiceSpeed}
            onChange={(e) => store.setVoiceSpeed(Number(e.target.value))}
          />
        </div>

        <div className="voice-grid">
          {VOICES.map((v) => (
            <button
              key={v}
              type="button"
              className={store.voiceId === v ? 'on' : ''}
              disabled={previewing !== null}
              onClick={() => void onPickVoice(v)}
            >
              {previewing === v ? '…' : v}
            </button>
          ))}
        </div>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 12,
            margin: '12px 0 8px',
          }}
        >
          Tap a voice to preview. Tap Listen on any coach reply to hear it.
        </p>
        {error && (
          <p
            style={{
              textAlign: 'center',
              color: '#c9a07a',
              fontSize: 12,
              margin: '0 0 10px',
            }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          className="danger-btn"
          onClick={() => {
            stopSpeaking()
            store.clearChat()
          }}
        >
          Clear chat
        </button>
        <button
          type="button"
          className="danger-btn"
          onClick={() => {
            if (confirm('Delete all data on this device?')) store.resetAll()
          }}
        >
          Delete all data
        </button>
      </div>
    </div>
    </ShellPortal>
  )
}
