import { useMemo, useState } from 'react'
import { dayKey, useStore } from '../lib/store'

const GOLD = '#C9A84C'

export function CalendarPage() {
  const store = useStore()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selected, setSelected] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')

  const monthLabel = cursor.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const cells = useMemo(() => {
    const first = new Date(cursor)
    const startPad = (first.getDay() + 6) % 7 // Mon=0
    const daysInMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0,
    ).getDate()
    const out: (Date | null)[] = []
    for (let i = 0; i < startPad; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
    }
    while (out.length % 7) out.push(null)
    return out
  }, [cursor])

  const selectedEvents = store.eventsOn(selected)

  return (
    <div className="page calendar-page">
      <div className="cal-header">
        <button
          type="button"
          onClick={() =>
            setCursor(
              new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
            )
          }
        >
          ‹
        </button>
        <h1>{monthLabel}</h1>
        <button
          type="button"
          onClick={() =>
            setCursor(
              new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
            )
          }
        >
          ›
        </button>
      </div>

      <div className="cal-weekdays">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="cal-cell empty" />
          const key = dayKey(d)
          const isSel = key === dayKey(selected)
          const isToday = key === dayKey(new Date())
          const count = store.eventsOn(d).length
          return (
            <button
              key={key}
              type="button"
              className={`cal-cell ${isSel ? 'sel' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => setSelected(d)}
            >
              <span>{d.getDate()}</span>
              {count > 0 && <i className="dot" />}
            </button>
          )
        })}
      </div>

      <div className="cal-agenda">
        <h2>
          {selected.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </h2>
        {selectedEvents.map((e) => (
          <div key={e.id} className="event-row">
            <span>
              {String(e.startHour).padStart(2, '0')}:
              {String(e.startMinute).padStart(2, '0')} · {e.title}
            </span>
            <button type="button" onClick={() => store.deleteEvent(e.id)}>
              ×
            </button>
          </div>
        ))}
        {!selectedEvents.length && (
          <p className="empty-hint">No events. Tap + to add.</p>
        )}
      </div>

      <button
        type="button"
        className="fab"
        style={{ background: GOLD }}
        onClick={() => setShowNew(true)}
      >
        +
      </button>

      {showNew && (
        <div className="modal">
          <div className="modal-card">
            <h3>New Event</h3>
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button type="button" onClick={() => setShowNew(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ background: GOLD }}
                onClick={() => {
                  if (!title.trim()) return
                  store.addEvent({
                    title: title.trim(),
                    dateKey: dayKey(selected),
                    startHour: 9,
                    startMinute: 0,
                    durationMinutes: 60,
                    category: 'work',
                    isImportant: false,
                  })
                  setTitle('')
                  setShowNew(false)
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
