import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19c1.4-3 3.7-4.5 6.5-4.5S17.1 16 18.5 19" strokeLinecap="round" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9a6 6 0 0112 0c0 7 2 7 2 9H4c0-2 2-2 2-9" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 004 0" strokeLinecap="round" />
    </svg>
  )
}

function PencilIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20l4.2-1.1L19 8.1 15.9 5 5.1 15.8 4 20z" strokeLinejoin="round" />
      <path d="M13.8 6.2l4 4" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 7h14" strokeLinecap="round" />
      <path d="M10 7V5h4v2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7l1 13h6l1-13" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
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

const HOLD_MS = 420

export function NotesPage({ onProfile }: { onProfile: () => void }) {
  const store = useStore()
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [armedId, setArmedId] = useState<string | null>(null)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdFired = useRef(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const editing = store.reminders.find((r) => r.id === editingId)

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const root = listRef.current
      if (!root) return
      if (e.target instanceof Node && root.contains(e.target)) return
      setArmedId(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    if (editingId) inputRef.current?.focus()
  }, [editingId])

  function clearHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

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
    setArmedId(null)
  }

  function startEdit(id: string, text: string) {
    setEditingId(id)
    setDraft(text)
    setArmedId(null)
  }

  function removeNote(id: string) {
    store.deleteReminder(id)
    if (editingId === id) cancelEdit()
    setArmedId(null)
  }

  function removeEditing() {
    if (!editingId) return
    removeNote(editingId)
  }

  function onCardPointerDown(id: string) {
    holdFired.current = false
    clearHold()
    holdTimer.current = setTimeout(() => {
      holdFired.current = true
      setArmedId(id)
    }, HOLD_MS)
  }

  function onCardPointerUp(id: string, text: string) {
    clearHold()
    if (holdFired.current) return
    if (armedId === id) return
    if (armedId && armedId !== id) {
      setArmedId(null)
      return
    }
    startEdit(id, text)
  }

  function onCardPointerCancel() {
    clearHold()
  }

  return (
    <div className="page notes-page">
      <div className="top-row notes-top">
        <button
          type="button"
          className="pill-chip reminders-pill"
          onClick={() => store.setRemindersOn(!store.remindersOn)}
        >
          <BellIcon /> {store.remindersOn ? 'Reminders on' : 'Reminders off'}
        </button>
        <button
          type="button"
          className="profile-btn"
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
            <span className="pencil" aria-hidden>
              <PencilIcon size={12} />
            </span>
            <span className="editing-label">Editing</span>
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
          ref={inputRef}
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
            <TrashIcon />
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

      <div className="reminder-list" ref={listRef}>
        {store.reminders.map((r) => {
          const armed = armedId === r.id
          const active = editingId === r.id
          return (
            <div
              key={r.id}
              className={`reminder-row ${armed ? 'armed' : ''} ${active ? 'active' : ''}`}
            >
              <div className={`reminder-actions ${armed ? 'show' : ''}`} aria-hidden={!armed}>
                <button
                  type="button"
                  className="reminder-action edit"
                  aria-label="Edit note"
                  tabIndex={armed ? 0 : -1}
                  onClick={() => startEdit(r.id, r.text)}
                >
                  <PencilIcon size={15} />
                </button>
                <button
                  type="button"
                  className="reminder-action trash"
                  aria-label="Delete note"
                  tabIndex={armed ? 0 : -1}
                  onClick={() => removeNote(r.id)}
                >
                  <TrashIcon />
                </button>
              </div>

              <button
                type="button"
                className="reminder-card"
                onPointerDown={() => onCardPointerDown(r.id)}
                onPointerUp={() => onCardPointerUp(r.id, r.text)}
                onPointerLeave={onCardPointerCancel}
                onPointerCancel={onCardPointerCancel}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setArmedId(r.id)
                }}
              >
                <div className="reminder-body">
                  <h3>{titleLine(r.text)}</h3>
                  <p>{r.text}</p>
                  <time>{formatWhen(r.createdAt)}</time>
                </div>
                {active && (
                  <span className="edit-badge" aria-hidden>
                    <PencilIcon size={12} />
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
