import { useEffect, useState } from 'react'

// Kept in sync with Tailwind's `lg` breakpoint (1024px, see index.css) — this
// is the one place JS needs to know it, for behavior CSS alone can't express
// (mounting components in a different spot, disabling drag physics).
export const DESKTOP_BREAKPOINT_PX = 1024

function getQuery(): MediaQueryList {
  return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`)
}

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => getQuery().matches)

  useEffect(() => {
    const query = getQuery()
    const handleChange = () => setIsDesktop(query.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return isDesktop
}
