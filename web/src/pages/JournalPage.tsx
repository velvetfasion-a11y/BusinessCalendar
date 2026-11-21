import { useState } from 'react'
import { useStore } from '../lib/store'

export function JournalPage() {
  const store = useStore()
  const [noteText, setNoteText] = useState('')

  return (
    <div className="page journal-page">
      <h1 className="page-title">Journal</h1>

      <section className="block">
        <h2>Notes to Self</h2>
        <div className="note-composer">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write a note…"
          />
          <button
            type="button"
            className="send-circle"
            style={{ background: store.accentHex }}
            onClick={() => {
              store.addNote(noteText)
              setNoteText('')
            }}
          >
            +
          </button>
        </div>
        <div className="note-list">
          {store.notes.map((n) => (
            <div key={n.id} className="note-card">
              <p>{n.text}</p>
              <button type="button" onClick={() => store.deleteNote(n.id)}>
                Delete
              </button>
            </div>
          ))}
          {!store.notes.length && (
            <p className="empty-hint">No notes yet.</p>
          )}
        </div>
      </section>

      <section className="block">
        <div className="photo-head">
          <h2>📷 Add Photos</h2>
          <span className="muted">Camera capture works best on mobile devices.</span>
        </div>
        <p className="empty-hint">
          Photo journal is available in the iOS Achieve app. Notes sync locally in this browser.
        </p>
      </section>
    </div>
  )
}
