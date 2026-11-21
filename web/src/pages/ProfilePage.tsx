import { useState } from 'react'
import { useStore } from '../lib/store'

export function ProfilePage() {
  const store = useStore()
  const [showSignIn, setShowSignIn] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [noteText, setNoteText] = useState('')

  const initial = (store.profileName || 'G').slice(0, 1).toUpperCase()
  const expanded = store.notes.find((n) => n.id === expandedId)

  return (
    <div className="page profile-page boss">
      <div className="profile-card">
        <div className="avatar">{initial}</div>
        <div>
          <h1>{store.profileName}</h1>
          <p className="login-state">{store.loginStateText}</p>
          {store.profileEmail && (
            <p className="login-email">{store.profileEmail}</p>
          )}
        </div>
      </div>

      <section className="block">
        <h2 className="section-kicker">ACCOUNT</h2>
        {!store.signedIn ? (
          <div className="auth-stack">
            <button
              type="button"
              className="auth-btn apple"
              onClick={() => store.signIn('Apple User')}
            >
              Continue with Apple
            </button>
            <button
              type="button"
              className="auth-btn google"
              onClick={() => store.signIn('Google User')}
            >
              <span className="g">G</span> Continue with Google
            </button>
            <button
              type="button"
              className="auth-btn email"
              onClick={() => setShowSignIn(true)}
            >
              ✉ Continue with Email
            </button>
          </div>
        ) : (
          <div className="auth-stack">
            <div className="synced-banner">✓ Synced across your devices</div>
            <button
              type="button"
              className="auth-btn signout"
              onClick={() => store.signOut()}
            >
              Sign Out
            </button>
          </div>
        )}
      </section>

      <section className="block">
        <h2 className="section-kicker">OVERVIEW</h2>
        <div className="stats-row boss">
          <div>
            <span className="stat-icon">▮</span>
            <strong>{store.lifetimeScore}%</strong>
            <span>Lifetime Score</span>
          </div>
          <div>
            <span className="stat-icon">🔥</span>
            <strong>{store.streakCount}</strong>
            <span>Day Streak</span>
          </div>
          <div>
            <span className="stat-icon">📅</span>
            <strong>{store.events.length}</strong>
            <span>Events</span>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="notes-head">
          <h2 className="section-kicker">NOTES</h2>
          <button
            type="button"
            className="gold-plus"
            onClick={() => setShowAddNote(true)}
            aria-label="Add note"
          >
            +
          </button>
        </div>
        {store.notes.length === 0 ? (
          <div className="empty-notes">
            <span className="empty-icon">🗒️</span>
            <p>Tap + to add your first note</p>
          </div>
        ) : (
          <div className="notes-grid">
            {store.notes.map((n) => (
              <button
                key={n.id}
                type="button"
                className="sticky boss"
                onClick={() => setExpandedId(n.id)}
              >
                <p>{n.text}</p>
                <span className="sticky-date">
                  {new Date(n.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="block">
        <h2 className="section-kicker">DATA</h2>
        <button
          type="button"
          className="data-row"
          onClick={() => {
            if (confirm('Delete all data? Removes habits, notes, events and journal from this device.')) {
              store.resetAll()
            }
          }}
        >
          <span>🗑 Reset all data</span>
          <span className="chev">›</span>
        </button>
      </section>

      {showSignIn && (
        <div className="modal">
          <div className="modal-card">
            <h3>Email sign in</h3>
            <input
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <div className="modal-actions">
              <button type="button" onClick={() => setShowSignIn(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ background: '#C9A84C', color: '#0D0D0D' }}
                onClick={() => {
                  store.signIn(name, email)
                  setShowSignIn(false)
                  setName('')
                  setEmail('')
                }}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddNote && (
        <div className="modal">
          <div className="modal-card">
            <h3>New Note</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write something…"
              rows={5}
              autoFocus
            />
            <div className="modal-actions">
              <button type="button" onClick={() => setShowAddNote(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ background: '#C9A84C', color: '#0D0D0D' }}
                onClick={() => {
                  store.addNote(noteText)
                  setNoteText('')
                  setShowAddNote(false)
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div className="modal">
          <div className="modal-card">
            <h3>Note</h3>
            <p className="note-detail">{expanded.text}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost-btn danger"
                onClick={() => {
                  store.deleteNote(expanded.id)
                  setExpandedId(null)
                }}
              >
                Delete
              </button>
              <button type="button" onClick={() => setExpandedId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
