import { useMemo, useState } from 'react'
import { dayKey, useStore } from '../lib/store'
import { HABIT_SYMBOLS, type Habit } from '../lib/types'
import { EditHabitSheet } from './EditHabitSheet'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8.2" r="3.1" />
      <path d="M5.2 19.2c1.5-3.2 3.9-4.7 6.8-4.7s5.3 1.5 6.8 4.7" strokeLinecap="round" />
    </svg>
  )
}

function addDays(from: Date, n: number) {
  const d = new Date(from)
  d.setDate(from.getDate() + n)
  d.setHours(0, 0, 0, 0)
  return d
}

function sameDay(a: Date, b: Date) {
  return dayKey(a) === dayKey(b)
}

/** ISO-8601 week number (Mon-based), matching European Achieve week labels. */
function isoWeekNumber(d: Date) {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  )
}

export function HabitsPage({ onProfile }: { onProfile: () => void }) {
  const store = useStore()
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const [focus, setFocus] = useState(today)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [creating, setCreating] = useState(false)

  const viewingToday = sameDay(focus, today)
  const todayProgress = store.progressFor(today)
  const pct = Math.round(todayProgress * 100)
  const circumference = 2 * Math.PI * 72

  const focusHabits = store.habitsFor(focus)
  const focusDone = focusHabits.filter((h) => store.isDone(h, focus)).length
  const upcoming = Array.from({ length: 6 }, (_, i) => addDays(focus, i + 1))

  const weekNumber = useMemo(() => isoWeekNumber(focus), [focus])

  function shiftWeek(dir: -1 | 1) {
    setFocus((f) => addDays(f, dir * 7))
  }

  return (
    <div className="page habits-page">
      <div className="top-row">
        <span style={{ width: 36 }} />
        <h1 className="brand-title">Achieve</h1>
        <button type="button" className="profile-btn" onClick={onProfile} aria-label="Account">
          <ProfileIcon />
        </button>
      </div>

      <div className="progress-wrap">
        <div className="progress-ring">
          <svg viewBox="0 0 160 160">
            <circle className="track" cx="80" cy="80" r="72" />
            {pct > 0 && (
              <circle
                className="fill"
                cx="80"
                cy="80"
                r="72"
                style={{
                  strokeDasharray: `${(pct / 100) * circumference} ${circumference}`,
                }}
              />
            )}
          </svg>
          <div className="progress-center">
            <strong>{pct}</strong>
            <span>TODAY</span>
          </div>
        </div>
      </div>

      <div className="stats-row with-nav">
        <button type="button" className="week-chevron" onClick={() => shiftWeek(-1)} aria-label="Previous week">
          ‹
        </button>
        <div className="stat-block">
          <label>WEEK</label>
          <strong>{weekNumber}</strong>
        </div>
        <div className="stat-divider" />
        <div className="stat-block">
          <label>HABITS</label>
          <strong>{store.habits.length}</strong>
        </div>
        <button type="button" className="week-chevron" onClick={() => shiftWeek(1)} aria-label="Next week">
          ›
        </button>
      </div>

      {!viewingToday ? (
        <button type="button" className="return-today" onClick={() => setFocus(today)}>
          — return to today —
        </button>
      ) : (
        <div className="gold-rule" />
      )}

      {!store.habits.length && (
        <p className="empty-habits-hint">
          Tap <strong>+</strong> to add your first habit
        </p>
      )}

      <DayCard
        date={focus}
        isToday={viewingToday}
        habits={focusHabits}
        doneCount={focusDone}
        onToggle={(id) => store.toggleHabit(id, focus)}
        onEdit={(h) => setEditHabit(h)}
        note={store.dayNote(dayKey(focus))}
        onNote={(text) => store.setDayNote(dayKey(focus), text)}
        isDone={(h) => store.isDone(h, focus)}
      />

      <div className="day-grid">
        {upcoming.map((d) => {
          const habits = store.habitsFor(d)
          const done = habits.filter((h) => store.isDone(h, d)).length
          return (
            <DayCard
              key={dayKey(d)}
              date={d}
              habits={habits}
              doneCount={done}
              onToggle={(id) => store.toggleHabit(id, d)}
              onEdit={(h) => setEditHabit(h)}
              note={store.dayNote(dayKey(d))}
              onNote={(text) => store.setDayNote(dayKey(d), text)}
              isDone={(h) => store.isDone(h, d)}
              compact
              onOpen={() => setFocus(d)}
            />
          )
        })}
      </div>

      <button
        type="button"
        className="fab"
        aria-label="Add habit"
        onClick={() => setCreating(true)}
      >
        +
      </button>

      {(editHabit || creating) && (
        <EditHabitSheet
          habit={editHabit}
          onClose={() => {
            setEditHabit(null)
            setCreating(false)
          }}
          onSave={(patch) => {
            if (editHabit) store.updateHabit(editHabit.id, patch)
            else
              store.addHabit({
                title: patch.title || 'New habit',
                symbol: patch.symbol || HABIT_SYMBOLS[0],
                days: patch.days || [0, 1, 2, 3, 4, 5, 6],
                alarm: patch.alarm ?? null,
              })
            setEditHabit(null)
            setCreating(false)
          }}
          onDelete={
            editHabit
              ? () => {
                  store.deleteHabit(editHabit.id)
                  setEditHabit(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

function DayCard({
  date,
  isToday,
  habits,
  doneCount,
  onToggle,
  onEdit,
  note,
  onNote,
  isDone,
  compact,
  onOpen,
}: {
  date: Date
  isToday?: boolean
  habits: Habit[]
  doneCount: number
  onToggle: (id: string) => void
  onEdit: (h: Habit) => void
  note: string
  onNote: (t: string) => void
  isDone: (h: Habit) => boolean
  compact?: boolean
  onOpen?: () => void
}) {
  const dayAbbr = DAY_SHORT[date.getDay()]
  const dateLabel = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <section
      className={`day-card ${isToday ? 'today' : ''} ${compact ? 'compact' : ''}`}
      onClick={onOpen}
      style={onOpen ? { cursor: 'pointer' } : undefined}
    >
      <div className="day-head">
        <span className="day-badge">{dayAbbr}</span>
        {isToday ? (
          <>
            <span className="title">Today</span>
            <span className="date">{dateLabel}</span>
          </>
        ) : compact ? (
          <>
            <span className="title">{dayAbbr.toUpperCase()}</span>
            <span className="date">{dateLabel}</span>
          </>
        ) : (
          <span className="title">
            {dayAbbr} {dateLabel}
          </span>
        )}
        <span className="frac">
          {doneCount}/{habits.length}
        </span>
      </div>

      {habits.map((h) => {
        const done = isDone(h)
        return (
          <button
            key={h.id}
            type="button"
            className={`habit-pill ${done ? 'done' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(h.id)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEdit(h)
            }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              onEdit(h)
            }}
          >
            <span className="sym">{h.symbol}</span>
            <span className="label">{h.title}</span>
            <span className={`check ${done ? 'on' : ''}`}>{done ? '✓' : ''}</span>
          </button>
        )
      })}

      <textarea
        className="notes-field"
        rows={1}
        placeholder="Notes"
        value={note}
        onChange={(e) => onNote(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    </section>
  )
}
