import { useState } from 'react'
import { useStore } from '../lib/store'

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19c1.4-3 3.7-4.5 6.5-4.5S17.1 16 18.5 19" strokeLinecap="round" />
    </svg>
  )
}

function formatWhen(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function NotesPage({ onProfile }: { onProfile: () => void }) {
  const store = useStore()
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = store.reminders.find((r) => r.id === editingId)

  function save() {
    const text = draft.trim()
    if (!text) return
    if (editingId) {
      store.updateReminder(editingId, text)
      setEditingId(null)
    } else {
      store.addReminder(text)
    }
    setDraft('')
  }

  return (
    <div className="page notes-page">
      <div className="top-row" style={{ justifyContent: 'center' }}>
        <button
          type="button"
          className="pill-chip"
          onClick={() => store.setRemindersOn(!store.remindersOn)}
        >
          {store.remindersOn ? '🔔 Reminders on' : '🔕 Reminders off'}
        </button>
        <span style={{ position: 'absolute', right: 16 }}>
          <button type="button" className="profile-btn" onClick={onProfile} aria-label="Account">
            <ProfileIcon />
          </button>
        </span>
      </div>

      <h1 className="brand-title">Positive Reminders</h1>

      {editing && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            color: 'var(--gold)',
            fontSize: 13,
          }}
        >
          <span>✎ Editing</span>
          <span style={{ color: 'var(--muted)', marginLeft: 'auto' }}>
            {formatWhen(editing.createdAt)}
          </span>
          <button
            type="button"
            className="pill-chip"
            onClick={() => {
              setEditingId(null)
              setDraft('')
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <textarea
        className="note-input"
        rows={2}
        placeholder="Write a note…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />

      <button
        type="button"
        className={`save-note ${editing ? 'primary' : ''}`}
        onClick={save}
      >
        {editing ? 'Update Note' : 'Save Note'}
      </button>

      {store.reminders.map((r) => (
        <button
          key={r.id}
          type="button"
          className={`reminder-card ${editingId === r.id ? 'active' : ''}`}
          onClick={() => {
            setEditingId(r.id)
            setDraft(r.text)
          }}
        >
          <h3>{r.text}</h3>
          {r.text.length > 40 && <p>{r.text}</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <time>{formatWhen(r.createdAt)}</time>
            {editingId === r.id && (
              <button
                type="button"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  store.deleteReminder(r.id)
                  setEditingId(null)
                  setDraft('')
                }}
              >
                🗑
              </button>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
