import { useMemo, useState } from 'react'
import { useStore, dayKey } from '../lib/store'

export function HabitsPage() {
  const store = useStore()
  const [selected, setSelected] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [reorder, setReorder] = useState(false)

  const progress = store.progressFor(selected)
  const todayKey = dayKey(new Date())
  const selectedKey = dayKey(selected)

  const dayTitle = useMemo(() => {
    if (selectedKey === todayKey) return 'Today'
    return selected.toLocaleDateString('en-US', { weekday: 'long' })
  }, [selected, selectedKey, todayKey])

  return (
    <div className="page habits-page">
      <h1 className="page-title">Achieve</h1>

      <div className="radial" style={{ ['--accent' as string]: store.accentHex }}>
        <svg viewBox="0 0 120 120" className="radial-svg">
          <circle cx="60" cy="60" r="46" className="radial-track" />
          <circle
            cx="60"
            cy="60"
            r="46"
            className="radial-fill"
            style={{
              strokeDasharray: `${progress * 289} 289`,
            }}
          />
        </svg>
        <span className="radial-label">{Math.round(progress * 100)}%</span>
      </div>

      <p className="goals-line" style={{ color: store.accentHex }}>
        Goals for {dayTitle}: {Math.round(progress * 100)}%
      </p>

      <div className="week-strip">
        {store.weekDays.map((day) => {
          const key = dayKey(day)
          const p = store.progressFor(day)
          const isToday = key === todayKey
          const isSel = key === selectedKey
          return (
            <button
              key={key}
              type="button"
              className="week-day"
              onClick={() => setSelected(day)}
            >
              <span className="week-bar">
                <span
                  className="week-bar-fill"
                  style={{
                    height: `${Math.max(p * 100, 0)}%`,
                    background: store.accentHex,
                  }}
                />
              </span>
              <span
                className={`week-name ${isSel ? 'sel' : ''} ${isToday ? 'today' : ''}`}
                style={isToday ? { color: store.accentHex } : undefined}
              >
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </button>
          )
        })}
      </div>

      <div className="dream-head three">
        <h2>Dream ✨</h2>
        <button
          type="button"
          className="day-jump"
          style={{ color: store.accentHex }}
          onClick={() => {
            const t = new Date()
            t.setHours(0, 0, 0, 0)
            setSelected(t)
          }}
        >
          🗓️ {dayTitle}
        </button>
        <button
          type="button"
          className="reorder-btn"
          onClick={() => setReorder((v) => !v)}
        >
          {reorder ? 'Done' : 'Reorder'}
        </button>
      </div>

      <div className="habit-list">
        {store.habits.map((habit, index) => {
          const done = store.isHabitDone(habit, selected)
          return (
            <div key={habit.id} className="habit-row">
              {reorder && (
                <div className="reorder-controls">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => store.moveHabit(index, index - 1)}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === store.habits.length - 1}
                    onClick={() => store.moveHabit(index, index + 1)}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </div>
              )}
              <button
                type="button"
                className="habit-title"
                onClick={() => {
                  setEditingId(habit.id)
                  setEditTitle(habit.title)
                }}
              >
                {habit.title}
              </button>
              <button
                type="button"
                className={`habit-toggle ${done ? 'done' : ''}`}
                style={done ? { color: store.accentHex } : undefined}
                onClick={() => store.toggleHabit(habit.id, selected)}
              >
                {done ? '✓ Done' : '○ Tap'}
              </button>
            </div>
          )
        })}

        <button
          type="button"
          className="add-habit"
          style={{ color: store.accentHex, borderColor: store.accentHex }}
          onClick={() => setShowAdd(true)}
        >
          Add Habit
        </button>
      </div>

      {showAdd && (
        <div className="modal">
          <div className="modal-card">
            <h3>Add Habit</h3>
            <p className="empty-hint">Create your next Dream habit.</p>
            <input
              placeholder="Habit name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false)
                  setNewTitle('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ background: store.accentHex }}
                onClick={() => {
                  store.addHabit(newTitle)
                  setNewTitle('')
                  setShowAdd(false)
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div className="modal">
          <div className="modal-card">
            <h3>Edit</h3>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button type="button" onClick={() => setEditingId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ background: store.accentHex }}
                onClick={() => {
                  store.updateHabitTitle(editingId, editTitle)
                  setEditingId(null)
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
