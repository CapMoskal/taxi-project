import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

interface OrderCardProps extends ComponentPropsWithoutRef<'div'> {
  'data-slot'?: string
}

// Presentational card chrome shared by every desktop order-rail block
// (address/class/payment sections in OrderComposePanel, OrderSurface's
// desktop branch, DriverCard's desktop branch) — the rail itself (see
// OrderScreen.tsx) is a transparent gap-container, so each surface carries
// its own elevation. Mirrors the real taxi.yandex.ru desktop panel: several
// independent floating cards stacked with gaps, not one big wrapper.
// `data-slot` defaults to "order-card" but callers that need their own
// e2e-addressable slot (DriverCard, etc.) can override it.
function OrderCard({ className, 'data-slot': dataSlot = 'order-card', ...rest }: OrderCardProps) {
  return <div className={cn('rounded-2xl border border-border bg-card p-4 shadow-lg', className)} data-slot={dataSlot} {...rest} />
}

export { OrderCard }
