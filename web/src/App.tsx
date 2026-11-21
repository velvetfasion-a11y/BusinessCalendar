import { useEffect, useState } from 'react'
import type { Section } from './lib/types'
import { HabitsPage } from './pages/HabitsPage'
import { CoachPage } from './pages/CoachPage'
import { JournalPage } from './pages/JournalPage'
import { CalendarPage } from './pages/CalendarPage'
import { ProfilePage } from './pages/ProfilePage'

const SECTIONS: {
  id: Section
  title: string
  symbol: string
}[] = [
  { id: 'habits', title: 'Habits', symbol: '⚡' },
  { id: 'coach', title: 'AI Coach', symbol: '✨' },
  { id: 'journal', title: 'Journal', symbol: '📖' },
  { id: 'calendar', title: 'Schedule', symbol: '📅' },
  { id: 'profile', title: 'Profile', symbol: '👤' },
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
                {s.symbol}
              </span>
              <span className="nav-label">{s.title}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
