import { useState } from 'react'
import { THEMES } from '../lib/types'
import { useStore } from '../lib/store'

export function AccountSheet({
  onClose,
  onPaywall,
}: {
  onClose: () => void
  onPaywall: () => void
}) {
  const store = useStore()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        style={{ maxHeight: '96%', borderRadius: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="top-row">
          <button
            type="button"
            className="icon-circle"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            ⚙
          </button>
          <span />
          <button type="button" className="icon-circle" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="account-page">
          <h1>Your account</h1>

          <div className="profile-hero">
            <div className="avatar-lg">
              👤
              <span className="plus">+</span>
            </div>
            <h2>{store.profileName}</h2>
          </div>

          <div className="account-stats">
            <div>
              <strong>{store.streakCount}</strong>
              <span>DAY STREAK</span>
            </div>
            <div>
              <strong>{store.habits.length}</strong>
              <span>TOTAL HABITS</span>
            </div>
          </div>

          <div className="section-kicker">SUBSCRIPTION</div>
          <button
            type="button"
            className="secret-plan"
            style={{ marginBottom: 16 }}
            onClick={onPaywall}
          >
            {store.planName} · {store.messagesLeft}/{store.messagesCap} messages left this month
          </button>

          <div className="section-kicker">THEME</div>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`theme-card ${store.theme === t.id ? 'on' : ''}`}
                onClick={() => store.setTheme(t.id)}
              >
                {store.theme === t.id && <span className="check-mark">✓</span>}
                <div
                  className="theme-swatch"
                  style={{ background: t.swatch[0] }}
                >
                  <i style={{ background: t.swatch[1] }} />
                </div>
                <strong>{t.label}</strong>
                <small>{t.included ? 'Included' : 'Pro'}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      {settingsOpen && (
        <div
          className="sheet-backdrop"
          onClick={() => setSettingsOpen(false)}
        >
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h2 style={{ fontStyle: 'normal', fontFamily: 'var(--sans)', fontSize: 20 }}>
                Settings
              </h2>
              <button
                type="button"
                className="link"
                style={{ fontStyle: 'normal', fontFamily: 'var(--sans)', color: 'var(--gold)' }}
                onClick={() => setSettingsOpen(false)}
              >
                Done
              </button>
            </div>

            <div className="section-kicker">NOTIFICATIONS</div>
            <div className="settings-list">
              <div className="settings-row">
                <span>All notifications</span>
                <button
                  type="button"
                  className={`toggle ${store.remindersOn ? 'on' : ''}`}
                  onClick={() => store.setRemindersOn(!store.remindersOn)}
                >
                  <i />
                </button>
              </div>
              <div className="settings-row">
                <span>Positive reminders</span>
                <span style={{ color: 'var(--gold)' }}>30 min ▴▾</span>
              </div>
              <div className="settings-row">
                <span>Quiet hours</span>
                <button type="button" className="toggle">
                  <i />
                </button>
              </div>
            </div>

            <div className="section-kicker">ACCOUNT</div>
            <button type="button" className="ghost-row">
              <div>
                <strong>Account settings</strong>
                <div className="sub">velvetfasion@gmail.com</div>
              </div>
              <span>›</span>
            </button>
            <button type="button" className="ghost-row">
              <div>
                <strong>Change password</strong>
                <div className="sub">Manage your sign-in provider</div>
              </div>
              <span>›</span>
            </button>

            <button type="button" className="primary-cta" style={{ marginTop: 18 }}>
              Sign out
            </button>
            <p style={{ textAlign: 'center', marginTop: 12 }}>
              <a href="#" style={{ color: 'var(--gold)' }}>
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
