import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavigationContext, type Screen } from './navigationContext'

function NavigationProvider({ children }: { children: ReactNode }) {
  const [screen, navigate] = useState<Screen>('order')
  return <NavigationContext.Provider value={{ screen, navigate }}>{children}</NavigationContext.Provider>
}

export { NavigationProvider }
