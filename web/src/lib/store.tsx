import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppData,
  ChatMessage,
  Habit,
  ThemeId,
} from './types'

const STORAGE_KEY = 'achieve.luxury.v3'
const LEGACY_KEYS = [
  'achieve.luxury.v1',
  'achieve.luxury.v2',
  'achieve.web.v1',
  'achieve.web.v2',
]

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
    habits: [],
    dayNotes: [],
    reminders: [],
    messages: [],
    theme: 'gold-dark',
    profileName: 'Guest',
    messagesLeft: 200,
    messagesCap: 200,
    remindersOn: true,
    voiceId: 'Puck',
    voiceSpeed: 50,
    planName: 'Secret plan',
  }
}

function load(): AppData {
  try {
    for (const key of LEGACY_KEYS) localStorage.removeItem(key)
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>
      return { ...defaults(), ...parsed }
    }
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
  seedWelcome: (text: string) => void
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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((next: AppData | ((prev: AppData) => AppData)) => {
    setData((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      if (resolved === prev) return prev
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved))
        } catch {
          // ignore quota errors
        }
      }, 180)
      return resolved
    })
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

  const isDone = useCallback(
    (habit: Habit, d: Date) => habit.completedDayKeys.includes(dayKey(d)),
    [],
  )

  const toggleHabit = useCallback(
    (id: string, d: Date) => {
      const key = dayKey(d)
      persist((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => {
          if (h.id !== id) return h
          const has = h.completedDayKeys.includes(key)
          return {
            ...h,
            completedDayKeys: has
              ? h.completedDayKeys.filter((k) => k !== key)
              : [...h.completedDayKeys, key],
          }
        }),
      }))
    },
    [persist],
  )

  const addHabit = useCallback(
    (h: Omit<Habit, 'id' | 'completedDayKeys'>) =>
      persist((prev) => ({
        ...prev,
        habits: [...prev.habits, { ...h, id: uid(), completedDayKeys: [] }],
      })),
    [persist],
  )

  const updateHabit = useCallback(
    (id: string, patch: Partial<Habit>) =>
      persist((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      })),
    [persist],
  )

  const deleteHabit = useCallback(
    (id: string) =>
      persist((prev) => ({
        ...prev,
        habits: prev.habits.filter((h) => h.id !== id),
      })),
    [persist],
  )

  const setDayNote = useCallback(
    (dateKey: string, text: string) => {
      persist((prev) => {
        const others = prev.dayNotes.filter((n) => n.dateKey !== dateKey)
        return {
          ...prev,
          dayNotes: text.trim()
            ? [...others, { dateKey, text }]
            : others,
        }
      })
    },
    [persist],
  )

  const dayNote = useCallback(
    (key: string) => data.dayNotes.find((n) => n.dateKey === key)?.text ?? '',
    [data.dayNotes],
  )

  const addReminder = useCallback(
    (text: string) => {
      const t = text.trim()
      if (!t) return
      persist((prev) => ({
        ...prev,
        reminders: [
          { id: uid(), text: t, createdAt: new Date().toISOString() },
          ...prev.reminders,
        ],
      }))
    },
    [persist],
  )

  const updateReminder = useCallback(
    (id: string, text: string) =>
      persist((prev) => ({
        ...prev,
        reminders: prev.reminders.map((r) =>
          r.id === id ? { ...r, text: text.trim() || r.text } : r,
        ),
      })),
    [persist],
  )

  const deleteReminder = useCallback(
    (id: string) =>
      persist((prev) => ({
        ...prev,
        reminders: prev.reminders.filter((r) => r.id !== id),
      })),
    [persist],
  )

  const addMessage = useCallback(
    (m: Omit<ChatMessage, 'id'>) =>
      persist((prev) => ({
        ...prev,
        messages: [...prev.messages, { ...m, id: uid() }],
        messagesLeft: Math.max(
          0,
          prev.messagesLeft - (m.role === 'user' ? 1 : 0),
        ),
      })),
    [persist],
  )

  const clearChat = useCallback(
    () => persist((prev) => ({ ...prev, messages: [] })),
    [persist],
  )

  const seedWelcome = useCallback(
    (text: string) =>
      persist((prev) => {
        if (
          prev.messages.length === 1 &&
          prev.messages[0].role === 'assistant' &&
          prev.messages[0].text === text
        ) {
          return prev
        }
        if (
          prev.messages.length === 1 &&
          prev.messages[0].role === 'assistant'
        ) {
          // Keep stable id — avoids list remount flicker.
          return {
            ...prev,
            messages: [{ ...prev.messages[0], text }],
          }
        }
        if (prev.messages.length === 0) {
          return {
            ...prev,
            messages: [{ id: uid(), role: 'assistant', text }],
          }
        }
        return prev
      }),
    [persist],
  )

  const setTheme = useCallback(
    (t: ThemeId) => persist((prev) => ({ ...prev, theme: t })),
    [persist],
  )
  const setRemindersOn = useCallback(
    (on: boolean) => persist((prev) => ({ ...prev, remindersOn: on })),
    [persist],
  )
  const setVoice = useCallback(
    (id: string) => persist((prev) => ({ ...prev, voiceId: id })),
    [persist],
  )
  const setVoiceSpeed = useCallback(
    (n: number) => persist((prev) => ({ ...prev, voiceSpeed: n })),
    [persist],
  )
  const resetAll = useCallback(() => persist(defaults()), [persist])

  const weekCompletedCount = useMemo(
    () =>
      weekDays.reduce((sum, d) => {
        const list = habitsFor(d)
        const key = dayKey(d)
        return (
          sum +
          list.filter((h) => h.completedDayKeys.includes(key)).length
        )
      }, 0),
    [weekDays, habitsFor],
  )

  const streakCount = useMemo(() => {
    let streak = 0
    const cur = new Date()
    cur.setHours(0, 0, 0, 0)
    while (true) {
      if (habitsFor(cur).length === 0) break
      if (progressFor(cur) >= 1) streak += 1
      else break
      cur.setDate(cur.getDate() - 1)
      if (streak > 365) break
    }
    return streak
  }, [habitsFor, progressFor])

  const store = useMemo<Store>(
    () => ({
      ...data,
      weekDays,
      habitsFor,
      progressFor,
      isDone,
      toggleHabit,
      addHabit,
      updateHabit,
      deleteHabit,
      setDayNote,
      dayNote,
      addReminder,
      updateReminder,
      deleteReminder,
      addMessage,
      clearChat,
      seedWelcome,
      setTheme,
      setRemindersOn,
      setVoice,
      setVoiceSpeed,
      resetAll,
      weekCompletedCount,
      streakCount,
    }),
    [
      data,
      weekDays,
      habitsFor,
      progressFor,
      isDone,
      toggleHabit,
      addHabit,
      updateHabit,
      deleteHabit,
      setDayNote,
      dayNote,
      addReminder,
      updateReminder,
      deleteReminder,
      addMessage,
      clearChat,
      seedWelcome,
      setTheme,
      setRemindersOn,
      setVoice,
      setVoiceSpeed,
      resetAll,
      weekCompletedCount,
      streakCount,
    ],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}

export { uid }
