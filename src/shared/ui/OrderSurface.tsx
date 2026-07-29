import type { ReactNode } from 'react'
import { useIsDesktop } from '@/shared/lib/useIsDesktop'
import { BottomSheet } from './BottomSheet'
import { OrderCard } from './OrderCard'

interface OrderSurfaceProps {
  children: ReactNode
  className?: string
}

// Sheet↔card: the same phase content renders as a sliding BottomSheet
// overlay on mobile (unchanged), or its own floating OrderCard docked in the
// (transparent, gap-only) order rail on desktop (see OrderScreen.tsx) — no
// motion, no drag handle, no absolute positioning, since it's a normal
// document-flow child of the rail there.
function OrderSurface({ children, className }: OrderSurfaceProps) {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return <OrderCard className={className}>{children}</OrderCard>
  }

  return <BottomSheet className={className}>{children}</BottomSheet>
}

export { OrderSurface }
