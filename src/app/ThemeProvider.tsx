import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext, type ThemeMode } from './themeContext'

const STORAGE_KEY = 'taxi-theme'

function readStoredMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function applyMode(mode: ThemeMode) {
  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode)

  useEffect(() => {
    applyMode(mode)
    if (mode !== 'system') return

    // Re-apply if the OS theme flips while we're in "system" mode — the
    // class needs updating even though `mode` itself hasn't changed.
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyMode('system')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [mode])

  function setMode(next: ThemeMode) {
    localStorage.setItem(STORAGE_KEY, next)
    setModeState(next)
  }

  return <ThemeContext.Provider value={{ mode, setMode }}>{children}</ThemeContext.Provider>
}

export { ThemeProvider }
