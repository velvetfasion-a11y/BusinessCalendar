import { useState } from 'react'
import { useStore } from '../lib/store'

const PRESETS = ['#C9A84C', '#3F2A6B', '#2F6F4E', '#8B3A3A', '#2B4C7E', '#B86B2B']

export function ProfilePage() {
  const store = useStore()
  const [name, setName] = useState('')
  const [showSignIn, setShowSignIn] = useState(false)

  const initial = (store.profileName || 'G').slice(0, 1).toUpperCase()

  return (
    <div className="page profile-page">
      <div className="profile-header">
        <div className="avatar">{initial}</div>
        <div>
          <h1>{store.profileName}</h1>
          <p>{store.signedIn ? 'Signed in' : 'Not signed in'}</p>
        </div>
      </div>

      <section className="block">
        <h2>Account</h2>
        {!store.signedIn ? (
          <button
            type="button"
            className="primary-btn wide"
            style={{ background: '#C9A84C', color: '#0D0D0D' }}
            onClick={() => setShowSignIn(true)}
          >
            Sign in with Email
          </button>
        ) : (
          <button type="button" className="ghost-btn" onClick={() => store.signOut()}>
            Sign out
          </button>
        )}
      </section>

      <section className="stats-row">
        <div>
          <strong>{store.lifetimeScore}%</strong>
          <span>Lifetime</span>
        </div>
        <div>
          <strong>{store.streakCount}</strong>
          <span>Streak</span>
        </div>
        <div>
          <strong>{store.habits.length}</strong>
          <span>Habits</span>
        </div>
      </section>

      <section className="block">
        <h2>Accent</h2>
        <div className="swatches">
          {PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              className={`swatch ${store.accentHex === hex ? 'on' : ''}`}
              style={{ background: hex }}
              onClick={() => store.setAccent(hex)}
              aria-label={hex}
            />
          ))}
        </div>
      </section>

      <section className="block">
        <h2>Sticky notes</h2>
        <div className="notes-grid">
          {store.notes.map((n) => (
            <button
              key={n.id}
              type="button"
              className="sticky"
              onClick={() => store.deleteNote(n.id)}
            >
              {n.text}
            </button>
          ))}
          {!store.notes.length && <p className="empty-hint">No notes yet.</p>}
        </div>
      </section>

      <section className="block danger">
        <h2>Danger</h2>
        <button
          type="button"
          className="ghost-btn danger"
          onClick={() => {
            if (confirm('Delete all data on this device?')) store.resetAll()
          }}
        >
          Delete all data
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
            <div className="modal-actions">
              <button type="button" onClick={() => setShowSignIn(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ background: '#C9A84C', color: '#0D0D0D' }}
                onClick={() => {
                  store.signIn(name)
                  setShowSignIn(false)
                  setName('')
                }}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
