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

export type CalendarEvent = {
  id: string
  title: string
  dateKey: string
  startHour: number
  startMinute: number
  durationMinutes: number
  category: string
  isImportant: boolean
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
  events: CalendarEvent[]
  accentHex: string
  profileName: string
  signedIn: boolean
}
