import { useMemo, useState } from 'react'
import { dayKey, useStore } from '../lib/store'
import { HABIT_SYMBOLS, type Habit } from '../lib/types'
import { EditHabitSheet } from './EditHabitSheet'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19c1.4-3 3.7-4.5 6.5-4.5S17.1 16 18.5 19" strokeLinecap="round" />
    </svg>
  )
}

export function HabitsPage({ onProfile }: { onProfile: () => void }) {
  const store = useStore()
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [creating, setCreating] = useState(false)

  const todayProgress = store.progressFor(today)
  const todayHabits = store.habitsFor(today)
  const todayDone = todayHabits.filter((h) => store.isDone(h, today)).length
  const pct = Math.round(todayProgress * 100)
  const circumference = 2 * Math.PI * 72

  const otherDays = store.weekDays.filter((d) => dayKey(d) !== dayKey(today))

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
            <circle
              className="fill"
              cx="80"
              cy="80"
              r="72"
              style={{
                strokeDasharray: `${(pct / 100) * circumference} ${circumference}`,
              }}
            />
          </svg>
          <div className="progress-center">
            <strong>{pct}</strong>
            <span>TODAY</span>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-block">
          <label>WEEK</label>
          <strong>{store.weekCompletedCount}</strong>
        </div>
        <div className="stat-divider" />
        <div className="stat-block">
          <label>HABITS</label>
          <strong>{store.habits.length}</strong>
        </div>
      </div>
      <div className="gold-rule" />

      <DayCard
        date={today}
        isToday
        habits={todayHabits}
        doneCount={todayDone}
        onToggle={(id) => store.toggleHabit(id, today)}
        onEdit={(h) => setEditHabit(h)}
        note={store.dayNote(dayKey(today))}
        onNote={(text) => store.setDayNote(dayKey(today), text)}
        isDone={(h) => store.isDone(h, today)}
      />

      <div className="day-grid">
        {otherDays.map((d) => {
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
}) {
  const label = isToday
    ? 'Today'
    : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const dateLabel = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <section className={`day-card ${isToday ? 'today' : ''}`}>
      <div className="day-head">
        <span className="day-badge">{DAY_SHORT[date.getDay()].slice(0, 3)}</span>
        <span className="title">{isToday ? 'Today' : label}</span>
        {!compact && <span className="date">{dateLabel}</span>}
        {compact && <span className="date">{dateLabel}</span>}
        <span className="frac">
          {doneCount}/{habits.length || 0}
        </span>
      </div>

      {habits.map((h) => {
        const done = isDone(h)
        return (
          <div key={h.id} style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              className={`habit-pill ${done ? 'done' : ''}`}
              onClick={() => onToggle(h.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                onEdit(h)
              }}
            >
              <span className="sym">{h.symbol}</span>
              <span className="label">{h.title}</span>
              <span className={`check ${done ? 'on' : ''}`}>{done ? '✓' : ''}</span>
            </button>
          </div>
        )
      })}

      {!habits.length && (
        <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 8px' }}>
          No habits this day
        </p>
      )}

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
