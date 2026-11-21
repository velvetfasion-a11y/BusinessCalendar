import { useEffect, useState, type ReactNode } from 'react'
import type { Section } from './lib/types'
import { HabitsPage } from './pages/HabitsPage'
import { CoachPage } from './pages/CoachPage'
import { JournalPage } from './pages/JournalPage'
import { CalendarPage } from './pages/CalendarPage'
import { ProfilePage } from './pages/ProfilePage'

function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden fill="currentColor">
      <path d="M13 2 4.5 13.2c-.3.4 0 1 .5 1H11l-1 7.8c-.1.6.7 1 1.1.5L20.5 10.8c.3-.4 0-1-.5-1H13l1-7.3c.1-.6-.7-1-1-.5Z" />
    </svg>
  )
}

function IconSparkles() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden fill="currentColor">
      <path d="M12 2.5 13.4 7l4.6 1.4L13.4 9.8 12 14.3 10.6 9.8 6 8.4 10.6 7 12 2.5Zm6.5 8.2 1 2.8 2.8.9-2.8.9-1 2.8-1-2.8-2.8-.9 2.8-.9 1-2.8ZM5.2 13.5l.8 2.2 2.2.7-2.2.7-.8 2.2-.8-2.2-2.2-.7 2.2-.7.8-2.2Z" />
    </svg>
  )
}

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden fill="currentColor">
      <path d="M6.5 3.5A2.5 2.5 0 0 0 4 6v12.2c0 .9.8 1.5 1.7 1.3 1.7-.4 3.1-.5 4.8.2.3.1.5 0 .5-.3V5.4c0-.2-.1-.4-.3-.5-1.5-.8-3-.7-4.2-.4Zm11 0c-1.2-.3-2.7-.4-4.2.4-.2.1-.3.3-.3.5v13.9c0 .3.2.4.5.3 1.7-.7 3.1-.6 4.8-.2.9.2 1.7-.4 1.7-1.3V6a2.5 2.5 0 0 0-2.5-2.5Z" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden fill="currentColor">
      <path d="M7 3.5a.75.75 0 0 1 .75.75V5h8.5V4.25a.75.75 0 0 1 1.5 0V5H19a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1.25V4.25A.75.75 0 0 1 7 3.5ZM5 9.5v9.5h14V9.5H5Z" />
    </svg>
  )
}

function IconPerson() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden fill="currentColor">
      <path d="M12 3.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c3.9 0 7 2.1 7 4.7 0 .9-.8 1.5-1.7 1.5H6.7c-.9 0-1.7-.6-1.7-1.5C5 15.6 8.1 13.5 12 13.5Z" />
    </svg>
  )
}

const SECTIONS: {
  id: Section
  title: string
  icon: ReactNode
}[] = [
  { id: 'habits', title: 'Habits', icon: <IconBolt /> },
  { id: 'coach', title: 'AI Coach', icon: <IconSparkles /> },
  { id: 'journal', title: 'Journal', icon: <IconBook /> },
  { id: 'calendar', title: 'Schedule', icon: <IconCalendar /> },
  { id: 'profile', title: 'Profile', icon: <IconPerson /> },
]

function sectionFromHash(): Section {
  const h = location.hash.replace(/^#/, '')
  if (SECTIONS.some((s) => s.id === h)) return h as Section
  return 'habits'
}

export default function App() {
  const [section, setSection] = useState<Section>(() => sectionFromHash())

  useEffect(() => {
    const onHash = () => setSection(sectionFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function go(id: Section) {
    setSection(id)
    if (location.hash.replace(/^#/, '') !== id) {
      location.hash = id
    }
  }

  return (
    <div className="app-shell">
      <main className="page-host" key={section}>
        {section === 'habits' && <HabitsPage />}
        {section === 'coach' && <CoachPage />}
        {section === 'journal' && <JournalPage />}
        {section === 'calendar' && <CalendarPage />}
        {section === 'profile' && <ProfilePage />}
      </main>

      <nav className="nav-bubble" aria-label="Main">
        {SECTIONS.map((s) => {
          const selected = section === s.id
          return (
            <button
              key={s.id}
              type="button"
              className={`nav-item ${selected ? 'selected' : ''}`}
              onClick={() => go(s.id)}
            >
              <span className="nav-symbol" aria-hidden>
                {s.icon}
              </span>
              <span className="nav-label">{s.title}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
