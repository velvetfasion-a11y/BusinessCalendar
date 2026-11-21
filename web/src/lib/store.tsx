import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppData,
  ChatMessage,
  Habit,
  ThemeId,
} from './types'

const STORAGE_KEY = 'achieve.luxury.v1'

function uid() {
  return crypto.randomUUID()
}

export function dayKey(d: Date) {
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
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

function defaults(): AppData {
  return {
    habits: [
      {
        id: uid(),
        title: 'Everything happens in my Favour',
        symbol: '✨',
        days: [0, 1, 2, 3, 4, 5, 6],
        alarm: null,
        completedDayKeys: [],
      },
    ],
    dayNotes: [],
    reminders: [
      {
        id: uid(),
        text: 'BIGGEST CLOTHING BRAND IN THE WORLD',
        createdAt: new Date('2025-08-02T16:28:00').toISOString(),
      },
      {
        id: uid(),
        text: 'Things people will always need:',
        createdAt: new Date('2025-08-02T15:10:00').toISOString(),
      },
      {
        id: uid(),
        text: 'EXCLUSIVE SINGER',
        createdAt: new Date('2025-08-01T12:00:00').toISOString(),
      },
    ],
    messages: [
      {
        id: uid(),
        role: 'assistant',
        text: "Welcome back. ✨\nYou're tending 6 habits and you're 100% aligned today.\nWhat's on your mind?",
      },
    ],
    theme: 'gold-dark',
    profileName: 'Velvet Fasion',
    messagesLeft: 174,
    messagesCap: 200,
    remindersOn: true,
    voiceId: 'Puck',
    voiceSpeed: 13,
    planName: 'Secret plan',
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaults(), ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return defaults()
}

type Store = AppData & {
  weekDays: Date[]
  habitsFor: (d: Date) => Habit[]
  progressFor: (d: Date) => number
  isDone: (habit: Habit, d: Date) => boolean
  toggleHabit: (id: string, d: Date) => void
  addHabit: (h: Omit<Habit, 'id' | 'completedDayKeys'>) => void
  updateHabit: (id: string, patch: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  setDayNote: (dateKey: string, text: string) => void
  dayNote: (dateKey: string) => string
  addReminder: (text: string) => void
  updateReminder: (id: string, text: string) => void
  deleteReminder: (id: string) => void
  addMessage: (m: Omit<ChatMessage, 'id'>) => void
  clearChat: () => void
  setTheme: (t: ThemeId) => void
  setRemindersOn: (on: boolean) => void
  setVoice: (id: string) => void
  setVoiceSpeed: (n: number) => void
  resetAll: () => void
  weekCompletedCount: number
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

  const habitsFor = useCallback(
    (d: Date) => {
      const wd = d.getDay()
      return data.habits.filter((h) => h.days.includes(wd))
    },
    [data.habits],
  )

  const progressFor = useCallback(
    (d: Date) => {
      const list = habitsFor(d)
      if (!list.length) return 0
      const key = dayKey(d)
      const done = list.filter((h) => h.completedDayKeys.includes(key)).length
      return done / list.length
    },
    [habitsFor],
  )

  const store: Store = {
    ...data,
    weekDays,
    habitsFor,
    progressFor,
    isDone: (habit, d) => habit.completedDayKeys.includes(dayKey(d)),
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
    addHabit: (h) =>
      persist({
        ...data,
        habits: [
          ...data.habits,
          { ...h, id: uid(), completedDayKeys: [] },
        ],
      }),
    updateHabit: (id, patch) =>
      persist({
        ...data,
        habits: data.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      }),
    deleteHabit: (id) =>
      persist({ ...data, habits: data.habits.filter((h) => h.id !== id) }),
    setDayNote: (dateKey, text) => {
      const others = data.dayNotes.filter((n) => n.dateKey !== dateKey)
      persist({
        ...data,
        dayNotes: text.trim()
          ? [...others, { dateKey, text }]
          : others,
      })
    },
    dayNote: (key) => data.dayNotes.find((n) => n.dateKey === key)?.text ?? '',
    addReminder: (text) => {
      const t = text.trim()
      if (!t) return
      persist({
        ...data,
        reminders: [
          { id: uid(), text: t, createdAt: new Date().toISOString() },
          ...data.reminders,
        ],
      })
    },
    updateReminder: (id, text) =>
      persist({
        ...data,
        reminders: data.reminders.map((r) =>
          r.id === id ? { ...r, text: text.trim() || r.text } : r,
        ),
      }),
    deleteReminder: (id) =>
      persist({
        ...data,
        reminders: data.reminders.filter((r) => r.id !== id),
      }),
    addMessage: (m) =>
      persist({
        ...data,
        messages: [...data.messages, { ...m, id: uid() }],
        messagesLeft: Math.max(0, data.messagesLeft - (m.role === 'user' ? 1 : 0)),
      }),
    clearChat: () =>
      persist({
        ...data,
        messages: [
          {
            id: uid(),
            role: 'assistant',
            text: "Welcome back. ✨\nWhat's on your mind?",
          },
        ],
      }),
    setTheme: (t) => persist({ ...data, theme: t }),
    setRemindersOn: (on) => persist({ ...data, remindersOn: on }),
    setVoice: (id) => persist({ ...data, voiceId: id }),
    setVoiceSpeed: (n) => persist({ ...data, voiceSpeed: n }),
    resetAll: () => persist(defaults()),
    weekCompletedCount: weekDays.reduce((sum, d) => {
      const list = habitsFor(d)
      const key = dayKey(d)
      return (
        sum +
        list.filter((h) => h.completedDayKeys.includes(key)).length
      )
    }, 0),
    streakCount: (() => {
      let streak = 0
      const cur = new Date()
      cur.setHours(0, 0, 0, 0)
      while (true) {
        if (progressFor(cur) >= 1 && habitsFor(cur).length > 0) streak += 1
        else if (habitsFor(cur).length === 0) {
          cur.setDate(cur.getDate() - 1)
          continue
        } else break
        cur.setDate(cur.getDate() - 1)
        if (streak > 365) break
      }
      return streak || 1
    })(),
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}

export { uid }
