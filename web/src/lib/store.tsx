import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  AppData,
  CalendarEvent,
  CoachMode,
  Habit,
  Note,
} from './types'

const STORAGE_KEY = 'achieve.web.v1'
const DEFAULT_ACCENT = '#3F2A6B'

function uid() {
  return crypto.randomUUID()
}

function dayKey(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfWeek(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday start
  x.setDate(x.getDate() + diff)
  return x
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch {
    // ignore
  }
  return {
    habits: [{ id: uid(), title: 'Drink water', completedDayKeys: [] }],
    notes: [],
    events: [],
    accentHex: DEFAULT_ACCENT,
    profileName: 'Guest',
    signedIn: false,
  }
}

type Store = AppData & {
  weekDays: Date[]
  progressFor: (d: Date) => number
  isHabitDone: (habit: Habit, d: Date) => boolean
  toggleHabit: (id: string, d: Date) => void
  addHabit: (title: string) => void
  updateHabitTitle: (id: string, title: string) => void
  moveHabit: (from: number, to: number) => void
  addNote: (text: string) => void
  deleteNote: (id: string) => void
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void
  deleteEvent: (id: string) => void
  eventsOn: (d: Date) => CalendarEvent[]
  setAccent: (hex: string) => void
  signIn: (name: string) => void
  signOut: () => void
  resetAll: () => void
  lifetimeScore: number
  streakCount: number
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => load())

  const persist = useCallback((next: AppData) => {
    setData(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [])

  const progressFor = useCallback(
    (d: Date) => {
      if (!data.habits.length) return 0
      const key = dayKey(d)
      const done = data.habits.filter((h) =>
        h.completedDayKeys.includes(key),
      ).length
      return done / data.habits.length
    },
    [data.habits],
  )

  const store: Store = {
    ...data,
    weekDays,
    progressFor,
    isHabitDone: (habit, d) => habit.completedDayKeys.includes(dayKey(d)),
    toggleHabit: (id, d) => {
      const key = dayKey(d)
      persist({
        ...data,
        habits: data.habits.map((h) => {
          if (h.id !== id) return h
          const has = h.completedDayKeys.includes(key)
          return {
            ...h,
            completedDayKeys: has
              ? h.completedDayKeys.filter((k) => k !== key)
              : [...h.completedDayKeys, key],
          }
        }),
      })
    },
    addHabit: (title) => {
      const t = title.trim()
      if (!t) return
      persist({
        ...data,
        habits: [...data.habits, { id: uid(), title: t, completedDayKeys: [] }],
      })
    },
    updateHabitTitle: (id, title) => {
      const t = title.trim()
      if (!t) return
      persist({
        ...data,
        habits: data.habits.map((h) => (h.id === id ? { ...h, title: t } : h)),
      })
    },
    moveHabit: (from, to) => {
      const habits = [...data.habits]
      const [item] = habits.splice(from, 1)
      habits.splice(to, 0, item)
      persist({ ...data, habits })
    },
    addNote: (text) => {
      const t = text.trim()
      if (!t) return
      persist({
        ...data,
        notes: [
          { id: uid(), text: t, createdAt: new Date().toISOString() },
          ...data.notes,
        ],
      })
    },
    deleteNote: (id) =>
      persist({ ...data, notes: data.notes.filter((n) => n.id !== id) }),
    addEvent: (e) =>
      persist({
        ...data,
        events: [...data.events, { ...e, id: uid() }],
      }),
    deleteEvent: (id) =>
      persist({ ...data, events: data.events.filter((e) => e.id !== id) }),
    eventsOn: (d) => data.events.filter((e) => e.dateKey === dayKey(d)),
    setAccent: (hex) => persist({ ...data, accentHex: hex }),
    signIn: (name) =>
      persist({ ...data, signedIn: true, profileName: name.trim() || 'You' }),
    signOut: () =>
      persist({ ...data, signedIn: false, profileName: 'Guest' }),
    resetAll: () =>
      persist({
        habits: [{ id: uid(), title: 'Drink water', completedDayKeys: [] }],
        notes: [],
        events: [],
        accentHex: DEFAULT_ACCENT,
        profileName: 'Guest',
        signedIn: false,
      }),
    lifetimeScore: (() => {
      const keys = new Set(data.habits.flatMap((h) => h.completedDayKeys))
      if (!keys.size) return Math.round(progressFor(new Date()) * 100)
      let sum = 0
      keys.forEach((k) => {
        const done = data.habits.filter((h) =>
          h.completedDayKeys.includes(k),
        ).length
        sum += data.habits.length ? done / data.habits.length : 0
      })
      return Math.round((sum / keys.size) * 100)
    })(),
    streakCount: (() => {
      let streak = 0
      const cur = new Date()
      cur.setHours(0, 0, 0, 0)
      while (true) {
        if (progressFor(cur) >= 0.8) streak += 1
        else break
        cur.setDate(cur.getDate() - 1)
      }
      return streak
    })(),
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}

export { dayKey, uid }
export type { CoachMode, Note }
