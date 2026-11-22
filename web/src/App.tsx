import { useEffect, useState, type ReactNode } from 'react'
import type { Tab } from './lib/types'
import { useStore } from './lib/store'
import { HabitsPage } from './pages/HabitsPage'
import { ChatPage } from './pages/ChatPage'
import { NotesPage } from './pages/NotesPage'
import { AccountSheet } from './pages/AccountSheet'
import { Paywall } from './pages/Paywall'

function IconHabits() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="4" y="5" width="9" height="9" rx="1.5" opacity="0.95" />
      <rect x="9" y="9" width="9" height="9" rx="1.5" opacity="0.7" />
      <rect x="11.5" y="11.5" width="8.5" height="8.5" rx="1.5" opacity="0.45" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path
        d="M5 16.5V8.2A3.2 3.2 0 0 1 8.2 5h7.6A3.2 3.2 0 0 1 19 8.2v5.1A3.2 3.2 0 0 1 15.8 16.5H10l-5 3v-3Z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconNote() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M8 4h7l3 3v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M14 4v4h4M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  )
}

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'habits', label: 'Habits', icon: <IconHabits /> },
  { id: 'chat', label: 'Chat', icon: <IconChat /> },
  { id: 'note', label: 'Note', icon: <IconNote /> },
]

function tabFromHash(): Tab {
  const h = location.hash.replace(/^#/, '')
  if (h === 'chat' || h === 'note' || h === 'habits') return h
  return 'habits'
}

export default function App() {
  const store = useStore()
  const [tab, setTab] = useState<Tab>(() => tabFromHash())
  const [accountOpen, setAccountOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [createHabit, setCreateHabit] = useState(false)
  const [visited, setVisited] = useState<Record<Tab, boolean>>(() => ({
    habits: true,
    chat: tab === 'chat',
    note: tab === 'note',
  }))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', store.theme)
  }, [store.theme])

  useEffect(() => {
    const onHash = () => {
      const next = tabFromHash()
      setTab(next)
      setVisited((v) => (v[next] ? v : { ...v, [next]: true }))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function go(id: Tab) {
    setTab(id)
    setVisited((v) => (v[id] ? v : { ...v, [id]: true }))
    if (location.hash.replace(/^#/, '') !== id) location.hash = id
  }

  return (
    <div className="app-shell">
      <main className="page-host">
        {/* Mount once per tab after first visit — no remount flash, no idle Chat work. */}
        {visited.habits && (
          <div className={`page-panel ${tab === 'habits' ? 'active' : ''}`}>
            <HabitsPage
              onProfile={() => setAccountOpen(true)}
              createOpen={createHabit}
              onCreateOpenChange={setCreateHabit}
            />
          </div>
        )}
        {visited.chat && (
          <div className={`page-panel ${tab === 'chat' ? 'active' : ''}`}>
            <ChatPage
              active={tab === 'chat'}
              onProfile={() => setAccountOpen(true)}
              onPaywall={() => setPaywallOpen(true)}
            />
          </div>
        )}
        {visited.note && (
          <div className={`page-panel ${tab === 'note' ? 'active' : ''}`}>
            <NotesPage onProfile={() => setAccountOpen(true)} />
          </div>
        )}
      </main>

      {tab === 'habits' && (
        <button
          type="button"
          className="fab"
          aria-label="Add habit"
          onClick={() => {
            setVisited((v) => ({ ...v, habits: true }))
            setCreateHabit(true)
          }}
        >
          +
        </button>
      )}

      <nav className="nav-bubble" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`nav-item ${tab === t.id ? 'selected' : ''}`}
            onClick={() => go(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
            <i className="dot" />
          </button>
        ))}
      </nav>

      {accountOpen && (
        <AccountSheet
          onClose={() => setAccountOpen(false)}
          onPaywall={() => {
            setAccountOpen(false)
            setPaywallOpen(true)
          }}
        />
      )}
      {paywallOpen && <Paywall onClose={() => setPaywallOpen(false)} />}
    </div>
  )
}
