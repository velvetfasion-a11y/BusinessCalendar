import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { dayKey, useStore } from '../lib/store'
import { HABIT_SYMBOLS, type Habit } from '../lib/types'
import { ShellPortal } from '../lib/portal'
import { EditHabitSheet } from './EditHabitSheet'

const LONG_PRESS_MS = 480

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

export function HabitsPage({
  active = true,
  onProfile,
  createOpen,
  onCreateOpenChange,
  onOverlayChange,
}: {
  active?: boolean
  onProfile: () => void
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  onOverlayChange?: (open: boolean) => void
}) {
  const store = useStore()
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const [focus, setFocus] = useState(today)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [menuHabit, setMenuHabit] = useState<Habit | null>(null)
  const [compactHero, setCompactHero] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const creating = createOpen

  useEffect(() => {
    const open = active && (Boolean(editHabit) || creating || Boolean(menuHabit))
    onOverlayChange?.(open)
    return () => onOverlayChange?.(false)
  }, [active, editHabit, creating, menuHabit, onOverlayChange])

  // Parent closed create / left tab — drop local sheets too.
  useEffect(() => {
    if (!active) {
      setEditHabit(null)
      setMenuHabit(null)
    }
  }, [active])

  useEffect(() => {
    if (!createOpen) return
    setMenuHabit(null)
  }, [createOpen])

  const viewingToday = sameDay(focus, today)
  const todayProgress = store.progressFor(today)
  const pct = Math.round(todayProgress * 100)
  const circumference = 2 * Math.PI * 72

  const focusHabits = store.habitsFor(focus)
  const focusDone = focusHabits.filter((h) => store.isDone(h, focus)).length
  const upcoming = Array.from({ length: 6 }, (_, i) => addDays(focus, i + 1))

  const weekNumber = useMemo(() => isoWeekNumber(focus), [focus])

  useEffect(() => {
    const scroller = pageRef.current?.closest('.page-host')
    if (!(scroller instanceof HTMLElement)) return
    const onScroll = () => setCompactHero(scroller.scrollTop > 56)
    onScroll()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [])

  function shiftWeek(dir: -1 | 1) {
    setFocus((f) => addDays(f, dir * 7))
  }

  return (
    <div className={`page habits-page ${compactHero ? 'compact-hero' : ''}`} ref={pageRef}>
      <div className="top-row habits-top">
        <span style={{ width: 36 }} />
        {!compactHero && <h1 className="brand-title">Achieve</h1>}
        {compactHero && <span className="habits-top-spacer" />}
        <button type="button" className="profile-btn" onClick={onProfile} aria-label="Account">
          <ProfileIcon />
        </button>
      </div>

      {!compactHero && (
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
      )}

      <div className="stats-row with-nav">
        <div className="week-nav">
          <button type="button" className="week-chevron" onClick={() => shiftWeek(-1)} aria-label="Previous week">
            ‹
          </button>
          <div className="stat-block">
            <label>WEEK</label>
            <strong>{weekNumber}</strong>
          </div>
          <button type="button" className="week-chevron" onClick={() => shiftWeek(1)} aria-label="Next week">
            ›
          </button>
        </div>
        <div className="stat-divider" />
        <button
          type="button"
          className="stat-block habits-stat"
          onClick={() => onCreateOpenChange(true)}
          aria-label="Add habit"
        >
          <label>HABITS</label>
          <strong>{store.habits.length}</strong>
        </button>
      </div>

      {!viewingToday ? (
        <button type="button" className="return-today" onClick={() => setFocus(today)}>
          — return to today —
        </button>
      ) : (
        <div className="gold-rule" />
      )}

      <DayCard
        date={focus}
        isToday={viewingToday}
        habits={focusHabits}
        doneCount={focusDone}
        onToggle={(id) => store.toggleHabit(id, focus)}
        onHabitMenu={(h) => setMenuHabit(h)}
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
              onHabitMenu={(h) => setMenuHabit(h)}
              note={store.dayNote(dayKey(d))}
              onNote={(text) => store.setDayNote(dayKey(d), text)}
              isDone={(h) => store.isDone(h, d)}
              compact
              onOpen={() => setFocus(d)}
            />
          )
        })}
      </div>

      {active && menuHabit && (
        <HabitActionSheet
          habit={menuHabit}
          onClose={() => setMenuHabit(null)}
          onEdit={() => {
            const h = menuHabit
            setMenuHabit(null)
            setEditHabit(h)
          }}
          onDelete={() => {
            store.deleteHabit(menuHabit.id)
            setMenuHabit(null)
            onOverlayChange?.(false)
          }}
        />
      )}

      {active && (editHabit || creating) && (
        <EditHabitSheet
          habit={editHabit}
          onClose={() => {
            setEditHabit(null)
            onCreateOpenChange(false)
            onOverlayChange?.(false)
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
            onCreateOpenChange(false)
            onOverlayChange?.(false)
          }}
          onDelete={
            editHabit
              ? () => {
                  store.deleteHabit(editHabit.id)
                  setEditHabit(null)
                  onOverlayChange?.(false)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

function HabitActionSheet({
  habit,
  onClose,
  onEdit,
  onDelete,
}: {
  habit: Habit
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <ShellPortal>
      <div className="sheet-backdrop" onClick={onClose}>
        <div className="sheet habit-action-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="grabber" />
          <div className="sheet-head">
            <h2>
              <span className="habit-action-sym">{habit.symbol}</span> {habit.title}
            </h2>
            <button type="button" className="link" onClick={onClose}>
              Close
            </button>
          </div>
          <button type="button" className="ghost-row habit-action-btn" onClick={onEdit}>
            <div>
              <strong>Edit</strong>
              <div className="sub">Name, days, alarm</div>
            </div>
            <span>›</span>
          </button>
          <button type="button" className="danger-btn" onClick={onDelete}>
            Delete habit
          </button>
        </div>
      </div>
    </ShellPortal>
  )
}

function DayCard({
  date,
  isToday,
  habits,
  doneCount,
  onToggle,
  onHabitMenu,
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
  onHabitMenu: (h: Habit) => void
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
        <span className="day-badge">{dayAbbr.slice(0, 3)}</span>
        {isToday ? (
          <>
            <span className="title">Today</span>
            <span className="date">{dateLabel}</span>
          </>
        ) : compact ? (
          <span className="title">{dateLabel}</span>
        ) : (
          <span className="title">
            {dayAbbr} {dateLabel}
          </span>
        )}
        <span className="frac">
          {doneCount}/{habits.length}
        </span>
      </div>

      {habits.map((h) => (
        <HabitPill
          key={h.id}
          habit={h}
          done={isDone(h)}
          onToggle={() => onToggle(h.id)}
          onLongPress={() => onHabitMenu(h)}
        />
      ))}

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

function HabitPill({
  habit,
  done,
  onToggle,
  onLongPress,
}: {
  habit: Habit
  done: boolean
  onToggle: () => void
  onLongPress: () => void
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longFiredRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const originRef = useRef<{ x: number; y: number } | null>(null)

  function startPress(e: ReactPointerEvent<HTMLButtonElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    clearTimer()
    longFiredRef.current = false
    pointerIdRef.current = e.pointerId
    originRef.current = { x: e.clientX, y: e.clientY }
    timerRef.current = setTimeout(() => {
      longFiredRef.current = true
      try {
        navigator.vibrate?.(12)
      } catch {
        // ignore
      }
      onLongPress()
    }, LONG_PRESS_MS)
  }

  function endPress(e: ReactPointerEvent<HTMLButtonElement>) {
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return
    clearTimer()
    pointerIdRef.current = null
    originRef.current = null
  }

  return (
    <button
      type="button"
      className={`habit-pill ${done ? 'done' : ''}`}
      onPointerDown={(e) => {
        e.stopPropagation()
        startPress(e)
      }}
      onPointerMove={(e) => {
        if (pointerIdRef.current !== e.pointerId || !originRef.current || !timerRef.current) return
        const dx = e.clientX - originRef.current.x
        const dy = e.clientY - originRef.current.y
        if (dx * dx + dy * dy > 100) endPress(e)
      }}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onPointerLeave={endPress}
      onClick={(e) => {
        e.stopPropagation()
        if (longFiredRef.current) {
          longFiredRef.current = false
          return
        }
        onToggle()
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        clearTimer()
        longFiredRef.current = true
        onLongPress()
      }}
    >
      <span className="sym">{habit.symbol}</span>
      <span className="label">{habit.title}</span>
      <span className={`check ${done ? 'on' : ''}`}>{done ? '✓' : ''}</span>
    </button>
  )
}
