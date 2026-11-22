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

function titleLine(text: string) {
  const line = text.trim().split(/\n/)[0] || text
  return line.length > 34 ? `${line.slice(0, 34)}…` : line
}

export function NotesPage({ onProfile }: { onProfile: () => void }) {
  const store = useStore()
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = store.reminders.find((r) => r.id === editingId)

  function cancelEdit() {
    setEditingId(null)
    setDraft('')
  }

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

  function removeEditing() {
    if (!editingId) return
    store.deleteReminder(editingId)
    cancelEdit()
  }

  return (
    <div className="page notes-page">
      <div className="top-row" style={{ justifyContent: 'center', position: 'relative' }}>
        <button
          type="button"
          className="pill-chip"
          onClick={() => store.setRemindersOn(!store.remindersOn)}
        >
          {store.remindersOn ? '🔔 Reminders on' : '🔕 Reminders off'}
        </button>
        <button
          type="button"
          className="profile-btn"
          style={{ position: 'absolute', right: 0 }}
          onClick={onProfile}
          aria-label="Account"
        >
          <ProfileIcon />
        </button>
      </div>

      <h1 className="brand-title">Positive Reminders</h1>

      {editing && (
        <div className="editing-bar">
          <span className="editing-meta">
            <span className="pencil">✎</span> Editing
            <span className="dot">·</span>
            <span className="when">{formatWhen(editing.createdAt)}</span>
          </span>
          <button type="button" className="cancel-chip" onClick={cancelEdit}>
            Cancel
          </button>
        </div>
      )}

      <div className={`note-input-wrap ${editing ? 'editing' : ''}`}>
        <textarea
          className="note-input"
          rows={2}
          placeholder="Write a note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        {editing && (
          <button
            type="button"
            className="note-trash"
            onClick={removeEditing}
            aria-label="Delete note"
          >
            🗑
          </button>
        )}
      </div>

      <button
        type="button"
        className={`save-note ${editing || draft.trim() ? 'primary' : ''}`}
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
          <div className="reminder-top">
            <h3>{titleLine(r.text)}</h3>
            {editingId === r.id && <span className="edit-badge">✎</span>}
          </div>
          <p>{r.text}</p>
          <time>{formatWhen(r.createdAt)}</time>
        </button>
      ))}
    </div>
  )
}
