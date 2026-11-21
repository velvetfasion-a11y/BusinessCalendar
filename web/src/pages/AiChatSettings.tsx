import { VOICES } from '../lib/types'
import { useStore } from '../lib/store'

export function AiChatSettings({
  onClose,
  onPaywall,
}: {
  onClose: () => void
  onPaywall: () => void
}) {
  const store = useStore()

  return (
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
              onClick={() => store.setVoice(v)}
            >
              {v}
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

        <button type="button" className="danger-btn" onClick={() => store.clearChat()}>
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
  )
}
