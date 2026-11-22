import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Render overlays into `.app-shell` so overflow scroll does not clip them. */
export function ShellPortal({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<Element | null>(null)
  useEffect(() => {
    setHost(document.querySelector('.app-shell'))
  }, [])
  if (!host) return null
  return createPortal(children, host)
}
