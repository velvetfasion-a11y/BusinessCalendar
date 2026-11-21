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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 8h10M7 12h10M7 16h7" strokeLinecap="round" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M5 16.5V8.2A3.2 3.2 0 0 1 8.2 5h7.6A3.2 3.2 0 0 1 19 8.2v5.1A3.2 3.2 0 0 1 15.8 16.5H10l-5 3v-3Z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconNote() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', store.theme)
  }, [store.theme])

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function go(id: Tab) {
    setTab(id)
    if (location.hash.replace(/^#/, '') !== id) location.hash = id
  }

  return (
    <div className="app-shell">
      <main className="page-host" key={tab}>
        {tab === 'habits' && (
          <HabitsPage onProfile={() => setAccountOpen(true)} />
        )}
        {tab === 'chat' && (
          <ChatPage
            onProfile={() => setAccountOpen(true)}
            onPaywall={() => setPaywallOpen(true)}
          />
        )}
        {tab === 'note' && (
          <NotesPage onProfile={() => setAccountOpen(true)} />
        )}
      </main>

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
