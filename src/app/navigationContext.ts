import { createContext, useContext } from 'react'

export type Screen =
  | 'order'
  | 'profile'
  | 'history'
  | 'payment-methods'
  | 'addresses'
  | 'settings'
  | 'info'
  | 'support'
  | 'passengers'
  | 'drivers'
  | 'business'

export interface NavigationContextValue {
  screen: Screen
  navigate: (screen: Screen) => void
}

export const NavigationContext = createContext<NavigationContextValue | null>(null)

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}
