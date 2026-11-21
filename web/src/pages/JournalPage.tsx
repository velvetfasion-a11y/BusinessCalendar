import { useRef, useState } from 'react'
import { useStore } from '../lib/store'

export function JournalPage() {
  const store = useStore()
  const [noteText, setNoteText] = useState('')
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)
  const [pendingComment, setPendingComment] = useState('')
  const [zoomId, setZoomId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const zoomed = store.photos.find((p) => p.id === zoomId)

  function onPickFile(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setPendingUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

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
            <div key={n.id} className="note-card plain">
              <p>{n.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="photo-head">
          <h2>📷 Add Photos</h2>
          <button
            type="button"
            className="send-circle sm"
            style={{ background: store.accentHex }}
            onClick={() => fileRef.current?.click()}
            aria-label="Add photo"
          >
            +
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {pendingUrl && (
          <div className="pending-photo">
            <img src={pendingUrl} alt="Pending" />
            <input
              value={pendingComment}
              onChange={(e) => setPendingComment(e.target.value)}
              placeholder="Add comment"
            />
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setPendingUrl(null)
                  setPendingComment('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ background: store.accentHex }}
                onClick={() => {
                  store.addPhoto(pendingUrl, pendingComment)
                  setPendingUrl(null)
                  setPendingComment('')
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="block">
        <h2>Gallery</h2>
        {store.photos.length === 0 ? (
          <p className="empty-hint">
            No photos yet. Tap + to capture your first one.
          </p>
        ) : (
          <div className="photo-grid">
            {store.photos.map((p) => (
              <button
                key={p.id}
                type="button"
                className="photo-card"
                onClick={() => setZoomId(p.id)}
              >
                <img src={p.dataUrl} alt="" />
                {p.comment && <span>{p.comment}</span>}
              </button>
            ))}
          </div>
        )}
      </section>

      {zoomed && (
        <div className="modal photo-zoom" onClick={() => setZoomId(null)}>
          <img src={zoomed.dataUrl} alt="" />
          <button
            type="button"
            className="zoom-close"
            onClick={() => setZoomId(null)}
          >
            ×
          </button>
          <button
            type="button"
            className="ghost-btn danger zoom-delete"
            onClick={(e) => {
              e.stopPropagation()
              store.deletePhoto(zoomed.id)
              setZoomId(null)
            }}
          >
            Delete
          </button>
        </div>
      )}

      {error && (
        <div className="modal">
          <div className="modal-card">
            <h3>Camera</h3>
            <p>{error}</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setError(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
