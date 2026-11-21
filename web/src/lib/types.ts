export type Tab = 'habits' | 'chat' | 'note'

export type ThemeId = 'light' | 'dark' | 'gold-dark' | 'rose-gold' | 'rose-dark'

export type Habit = {
  id: string
  title: string
  symbol: string
  days: number[] // 0=Sun .. 6=Sat
  alarm: string | null // "09:00"
  completedDayKeys: string[]
}

export type DayNote = {
  dateKey: string
  text: string
}

export type ReminderNote = {
  id: string
  text: string
  createdAt: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export type AppData = {
  habits: Habit[]
  dayNotes: DayNote[]
  reminders: ReminderNote[]
  messages: ChatMessage[]
  theme: ThemeId
  profileName: string
  messagesLeft: number
  messagesCap: number
  remindersOn: boolean
  voiceId: string
  voiceSpeed: number
  planName: string
}

export const THEMES: {
  id: ThemeId
  label: string
  included: boolean
  swatch: [string, string]
}[] = [
  { id: 'light', label: 'Light', included: true, swatch: ['#F7F3EA', '#C9A84C'] },
  { id: 'dark', label: 'Dark', included: true, swatch: ['#0D0D0D', '#C9A84C'] },
  { id: 'gold-dark', label: 'Gold Dark', included: true, swatch: ['#000000', '#C9A84C'] },
  { id: 'rose-gold', label: 'Rose Gold', included: false, swatch: ['#F4EDE6', '#C48B7A'] },
  { id: 'rose-dark', label: 'Rose Dark', included: false, swatch: ['#0A0809', '#C48B7A'] },
]

export const HABIT_SYMBOLS = [
  '✨', '💎', '🔥', '💧', '📚', '💪', '🧘', '🎯', '☀️', '🌙',
  '💻', '🎨', '🎵', '🏃', '🧠', '❤️', '🌱', '⚡', '☕', '🛏️',
]

export const VOICES = ['Puck', 'Algieba', 'Orus', 'Leda', 'Aoede', 'Kore']
