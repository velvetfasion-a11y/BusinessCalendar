import { useMemo, useState } from 'react'
import { HABIT_SYMBOLS, type Habit } from '../lib/types'
import { ShellPortal } from '../lib/portal'

const DAYS = [
  { i: 1, label: 'M' },
  { i: 2, label: 'T' },
  { i: 3, label: 'W' },
  { i: 4, label: 'T' },
  { i: 5, label: 'F' },
  { i: 6, label: 'S' },
  { i: 0, label: 'S' },
]

export function EditHabitSheet({
  habit,
  onClose,
  onSave,
  onDelete,
}: {
  habit: Habit | null
  onClose: () => void
  onSave: (patch: Partial<Habit>) => void
  onDelete?: () => void
}) {
  const [title, setTitle] = useState(habit?.title ?? '')
  const [symbol, setSymbol] = useState(habit?.symbol ?? '✨')
  const [days, setDays] = useState<number[]>(
    habit?.days ?? [0, 1, 2, 3, 4, 5, 6],
  )
  const [alarm, setAlarm] = useState(habit?.alarm ?? '')
  const [showSymbols, setShowSymbols] = useState(false)
  const [showAlarm, setShowAlarm] = useState(false)

  const everyday = days.length === 7
  const onlyOne = days.length === 1

  const presetLabel = useMemo(() => {
    if (everyday) return 'Everyday'
    if (onlyOne) {
      const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return `Only ${names[days[0]]}`
    }
    return null
  }, [days, everyday, onlyOne])

  function toggleDay(i: number) {
    setDays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort(),
    )
  }

  return (
    <ShellPortal>
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="sheet-head">
          <h2>{habit ? 'Edit habit' : 'New habit'}</h2>
          {onDelete ? (
            <button type="button" className="link danger" onClick={onDelete}>
              Delete
            </button>
          ) : (
            <button type="button" className="link" onClick={onClose}>
              Close
            </button>
          )}
        </div>

        <input
          className="sheet-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Habit name"
          autoFocus
        />

        <div className="field-label">SYMBOL</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="icon-circle"
            style={{ width: 48, height: 48, fontSize: 22 }}
            onClick={() => setShowSymbols((v) => !v)}
          >
            {symbol}
          </button>
          <button
            type="button"
            className="icon-circle"
            onClick={() => setShowSymbols((v) => !v)}
          >
            +
          </button>
        </div>
        {showSymbols && (
          <div className="symbol-grid" style={{ marginTop: 12 }}>
            {HABIT_SYMBOLS.map((s) => (
              <button
                key={s}
                type="button"
                className={symbol === s ? 'on' : ''}
                onClick={() => {
                  setSymbol(s)
                  setShowSymbols(false)
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="field-label">DAYS</div>
        <div className="day-chips">
          {DAYS.map((d) => (
            <button
              key={d.i}
              type="button"
              className={days.includes(d.i) ? 'on' : ''}
              onClick={() => toggleDay(d.i)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="preset-row">
          <button
            type="button"
            className={everyday ? 'on' : ''}
            onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}
          >
            Everyday
          </button>
          {onlyOne && presetLabel && (
            <button type="button" className="on">
              {presetLabel}
            </button>
          )}
        </div>

        <div className="field-label">ALARM</div>
        <button type="button" className="ghost-row" onClick={() => setShowAlarm(true)}>
          <div>
            <strong>Habit alarm</strong>
            <div className="sub">{alarm || 'Tap to set time'}</div>
          </div>
          <span>›</span>
        </button>

        <button
          type="button"
          className="primary-cta"
          onClick={() =>
            onSave({
              title: title.trim() || 'New habit',
              symbol,
              days: days.length ? days : [0, 1, 2, 3, 4, 5, 6],
              alarm: alarm || null,
            })
          }
        >
          Save changes
        </button>
      </div>

      {showAlarm && (
        <div
          className="sheet-backdrop"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowAlarm(false)}
        >
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            <div className="sheet-head">
              <h2>Alarm</h2>
              <button type="button" className="link" onClick={() => setShowAlarm(false)}>
                Done
              </button>
            </div>
            <p style={{ color: 'var(--muted)', marginTop: 0 }}>{title || 'Habit'}</p>
            <input
              className="sheet-input"
              type="time"
              value={alarm || '09:00'}
              onChange={(e) => setAlarm(e.target.value)}
            />
            <button
              type="button"
              className="danger-btn"
              onClick={() => {
                setAlarm('')
                setShowAlarm(false)
              }}
            >
              remove
            </button>
          </div>
        </div>
      )}
    </div>
    </ShellPortal>
  )
}
