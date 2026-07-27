import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useIsDesktop } from '@/shared/lib/useIsDesktop'
import { BottomSheet } from './BottomSheet'

interface OrderSurfaceProps {
  children: ReactNode
  className?: string
}

// Sheet↔panel: the same phase content renders as a sliding BottomSheet
// overlay on mobile (unchanged), or a flat block docked in the order rail
// on desktop (see OrderScreen.tsx) — no motion, no drag handle, no absolute
// positioning, since it's a normal document-flow child of the rail there.
function OrderSurface({ children, className }: OrderSurfaceProps) {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <div className={cn('p-4', className)} data-slot="order-surface">
        {children}
      </div>
    )
  }

  return <BottomSheet className={className}>{children}</BottomSheet>
}

export { OrderSurface }
