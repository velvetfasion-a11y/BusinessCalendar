export type Section = 'habits' | 'coach' | 'journal' | 'calendar' | 'profile'

export type CoachMode = 'motivation' | 'routines' | 'energy'

export type Habit = {
  id: string
  title: string
  completedDayKeys: string[]
}

export type Note = {
  id: string
  text: string
  createdAt: string
}

export type JournalPhoto = {
  id: string
  dataUrl: string
  comment: string
  createdAt: string
}

export type EventCategory =
  | 'work'
  | 'plan'
  | 'growth'
  | 'personal'
  | 'health'
  | 'learning'
  | 'rest'

export type EventDuration =
  | '30m'
  | '1h'
  | '1.5h'
  | '2h'
  | '3h'
  | 'All Day'

export type CalendarEvent = {
  id: string
  title: string
  dateKey: string
  startHour: number
  startMinute: number
  durationMinutes: number
  duration: EventDuration
  category: EventCategory
  isImportant: boolean
  isPinned: boolean
}

export type CoachMessage = {
  id: string
  role: 'user' | 'assistant'
  mode: CoachMode
  text: string
}

export type AppData = {
  habits: Habit[]
  notes: Note[]
  photos: JournalPhoto[]
  events: CalendarEvent[]
  accentHex: string
  profileName: string
  profileEmail: string | null
  signedIn: boolean
}

export const EVENT_CATEGORIES: {
  id: EventCategory
  title: string
  symbol: string
}[] = [
  { id: 'work', title: 'WORK', symbol: '♦' },
  { id: 'plan', title: 'PLAN', symbol: '◆' },
  { id: 'growth', title: 'GROWTH', symbol: '✦' },
  { id: 'personal', title: 'PERSONAL', symbol: '⊙' },
  { id: 'health', title: 'HEALTH', symbol: '○' },
  { id: 'learning', title: 'LEARNING', symbol: '◇' },
  { id: 'rest', title: 'REST', symbol: '◌' },
]

export const EVENT_DURATIONS: {
  id: EventDuration
  minutes: number
}[] = [
  { id: '30m', minutes: 30 },
  { id: '1h', minutes: 60 },
  { id: '1.5h', minutes: 90 },
  { id: '2h', minutes: 120 },
  { id: '3h', minutes: 180 },
  { id: 'All Day', minutes: 1440 },
]

export function categorySymbol(cat: string) {
  return EVENT_CATEGORIES.find((c) => c.id === cat)?.symbol ?? '♦'
}
