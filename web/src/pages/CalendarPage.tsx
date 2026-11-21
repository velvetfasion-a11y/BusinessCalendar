import { useMemo, useState } from 'react'
import {
  EVENT_CATEGORIES,
  EVENT_DURATIONS,
  categorySymbol,
  type EventCategory,
  type EventDuration,
} from '../lib/types'
import { dayKey, startOfWeek, useStore } from '../lib/store'

type Zoom = 'month' | 'week' | 'day'

const GOLD = '#C9A84C'
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function isSameDay(a: Date, b: Date) {
  return dayKey(a) === dayKey(b)
}

function EventPill({
  title,
  category,
  isImportant,
  isPinned,
  compact,
}: {
  title: string
  category: string
  isImportant: boolean
  isPinned: boolean
  compact?: boolean
}) {
  return (
    <div
      className={`event-pill ${compact ? 'compact' : ''} ${isImportant ? 'important' : ''}`}
    >
      <span className="pill-sym">{categorySymbol(category)}</span>
      <span className="pill-title">{title}</span>
      {isPinned && <span className="pill-pin">📌</span>}
    </div>
  )
}

export function CalendarPage() {
  const store = useStore()
  const [zoom, setZoom] = useState<Zoom>('month')
  const [displayDate, setDisplayDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [showNew, setShowNew] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)

  // New event form
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [startHour, setStartHour] = useState(9)
  const [startMinute, setStartMinute] = useState(0)
  const [duration, setDuration] = useState<EventDuration>('1h')
  const [category, setCategory] = useState<EventCategory>('work')
  const [isImportant, setIsImportant] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  const periodTitle = useMemo(() => {
    if (zoom === 'month') {
      return displayDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    }
    if (zoom === 'week') {
      const days = weekDays(displayDate)
      const start = days[0]
      const end = days[6]
      const sf = start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      const ef = end.toLocaleDateString('en-US', {
        day: 'numeric',
        year: 'numeric',
      })
      return `${sf} – ${ef}`
    }
    return displayDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }, [displayDate, zoom])

  const monthCells = useMemo(() => {
    const first = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1)
    const startPad = (first.getDay() + 6) % 7
    const daysInMonth = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth() + 1,
      0,
    ).getDate()
    const out: (Date | null)[] = []
    for (let i = 0; i < startPad; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(new Date(displayDate.getFullYear(), displayDate.getMonth(), d))
    }
    while (out.length % 7) out.push(null)
    return out
  }, [displayDate])

  function weekDays(d: Date) {
    const start = startOfWeek(d)
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(start)
      x.setDate(start.getDate() + i)
      return x
    })
  }

  function navigate(by: number) {
    const next = new Date(displayDate)
    if (zoom === 'month') next.setMonth(next.getMonth() + by)
    else if (zoom === 'week') next.setDate(next.getDate() + by * 7)
    else next.setDate(next.getDate() + by)
    next.setHours(0, 0, 0, 0)
    setDisplayDate(next)
  }

  function openNew(forDate?: Date) {
    const d = forDate ?? displayDate
    setEventDate(dayKey(d))
    setTitle('')
    setStartHour(9)
    setStartMinute(0)
    setDuration('1h')
    setCategory('work')
    setIsImportant(false)
    setIsPinned(false)
    setFabOpen(true)
    setShowNew(true)
  }

  function closeNew() {
    setShowNew(false)
    setFabOpen(false)
  }

  function saveEvent() {
    if (!title.trim() || !eventDate) return
    const dur = EVENT_DURATIONS.find((d) => d.id === duration)!
    store.addEvent({
      title: title.trim(),
      dateKey: eventDate,
      startHour,
      startMinute,
      durationMinutes: dur.minutes,
      duration,
      category,
      isImportant,
      isPinned,
    })
    closeNew()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="page calendar-page boss">
      <div className="cal-header">
        <button type="button" className="cal-chevron" onClick={() => navigate(-1)}>
          ‹
        </button>
        <div className="cal-header-center">
          <h1>{periodTitle}</h1>
          <div className="zoom-pills">
            {(['month', 'week', 'day'] as Zoom[]).map((z) => (
              <button
                key={z}
                type="button"
                className={zoom === z ? 'on' : ''}
                onClick={() => setZoom(z)}
              >
                {z[0].toUpperCase() + z.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="cal-chevron" onClick={() => navigate(1)}>
          ›
        </button>
      </div>

      <div className="cal-rule gold" />

      {(zoom === 'month' || zoom === 'week') && (
        <>
          <div className="cal-weekdays boss">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="cal-rule dim" />
        </>
      )}

      {zoom === 'month' && (
        <div className="cal-month">
          {monthCells.map((d, i) => {
            if (!d) return <div key={`e-${i}`} className="month-cell empty" />
            const events = store.eventsOn(d)
            const isToday = isSameDay(d, today)
            return (
              <button
                key={dayKey(d)}
                type="button"
                className={`month-cell ${isToday ? 'today' : ''}`}
                onClick={() => {
                  setDisplayDate(d)
                  setZoom('week')
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  openNew(d)
                }}
              >
                <div className="month-cell-top">
                  <span className={`day-num ${isToday ? 'today' : ''}`}>
                    {d.getDate()}
                  </span>
                  {events.length > 2 && (
                    <span className="more">+{events.length - 2}</span>
                  )}
                </div>
                {events.slice(0, 2).map((ev) => (
                  <EventPill
                    key={ev.id}
                    title={ev.title}
                    category={ev.category}
                    isImportant={ev.isImportant}
                    isPinned={ev.isPinned}
                    compact
                  />
                ))}
              </button>
            )
          })}
        </div>
      )}

      {zoom === 'week' && (
        <div className="cal-week">
          {weekDays(displayDate).map((d) => {
            const events = store.eventsOn(d)
            const isToday = isSameDay(d, today)
            return (
              <button
                key={dayKey(d)}
                type="button"
                className={`week-col ${isToday ? 'today' : ''}`}
                onClick={() => {
                  setDisplayDate(d)
                  setZoom('day')
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  openNew(d)
                }}
              >
                <span className={`day-num ${isToday ? 'today' : ''}`}>
                  {d.getDate()}
                </span>
                <div className="week-rule" />
                <div className="week-events">
                  {events.map((ev) => (
                    <EventPill
                      key={ev.id}
                      title={ev.title}
                      category={ev.category}
                      isImportant={ev.isImportant}
                      isPinned={ev.isPinned}
                      compact
                    />
                  ))}
                  {!events.length && <span className="week-empty">—</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {zoom === 'day' && (
        <div className="cal-day">
          {store.eventsOn(displayDate).filter((e) => e.duration === 'All Day')
            .length > 0 && (
            <div className="all-day-bar">
              <span className="all-day-label">ALL DAY</span>
              {store
                .eventsOn(displayDate)
                .filter((e) => e.duration === 'All Day')
                .map((ev) => (
                  <div key={ev.id} className="all-day-row">
                    <span>{categorySymbol(ev.category)}</span>
                    <span>{ev.title}</span>
                  </div>
                ))}
            </div>
          )}
          <div className="hour-grid">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="hour-row" id={`hour-${hour}`}>
                <span className="hour-label">
                  {String(hour).padStart(2, '0')}:00
                </span>
                <div className="hour-line" />
              </div>
            ))}
            {store
              .eventsOn(displayDate)
              .filter((e) => e.duration !== 'All Day')
              .map((ev) => {
                const top = ev.startHour * 64 + (ev.startMinute / 60) * 64 + 8
                const height = Math.max((ev.durationMinutes / 60) * 64, 28)
                return (
                  <div
                    key={ev.id}
                    className={`day-block ${ev.isImportant ? 'important' : ''}`}
                    style={{ top, height }}
                  >
                    <strong>
                      {categorySymbol(ev.category)} {ev.title}
                    </strong>
                    <span>
                      {String(ev.startHour).padStart(2, '0')}:
                      {String(ev.startMinute).padStart(2, '0')}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      <button
        type="button"
        className={`fab boss ${fabOpen ? 'open' : ''}`}
        style={{ background: GOLD }}
        onClick={() => openNew()}
        aria-label="New event"
      >
        +
      </button>

      {showNew && (
        <div className="modal">
          <div className="modal-card event-sheet">
            <div className="sheet-top">
              <button type="button" className="sheet-cancel" onClick={closeNew}>
                Cancel
              </button>
              <h3>New Event</h3>
              <span />
            </div>

            <label className="sheet-label">EVENT TITLE</label>
            <input
              className="sheet-input"
              placeholder="What's happening..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />

            <label className="sheet-label">DATE</label>
            <input
              className="sheet-input"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />

            <label className="sheet-label">START TIME</label>
            <div className="time-row">
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span>:</span>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(Number(e.target.value))}
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <label className="sheet-label">CATEGORY</label>
            <div className="chip-row">
              {EVENT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${category === c.id ? 'on' : ''}`}
                  onClick={() => setCategory(c.id)}
                >
                  {c.symbol} {c.title}
                </button>
              ))}
            </div>

            <label className="sheet-label">DURATION</label>
            <div className="chip-row">
              {EVENT_DURATIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`chip ${duration === d.id ? 'on' : ''}`}
                  onClick={() => setDuration(d.id)}
                >
                  {d.id}
                </button>
              ))}
            </div>

            <div className="flags-row">
              <label>
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                />
                Important
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
                Pinned
              </label>
            </div>

            <button
              type="button"
              className="primary-btn wide"
              style={{ background: GOLD, color: '#0D0D0D' }}
              onClick={saveEvent}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
