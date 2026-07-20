import { useEffect } from 'react'
import type { RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { cn } from '@/lib/utils'
import { useCurrentPosition } from '@/shared/lib/useCurrentPosition'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { DEMO_PICKUP } from './demoRoute'

interface PickupResolverProps {
  mapRef: RefObject<maplibregl.Map | null>
  className?: string
}

// Mounted on `idle` AND `selectingPickup` (see OrderScreen) — the geolocation
// request must fire as soon as the app opens, not just after "Начать заказ".
// Mounting across both states (and unmounting for the rest of the ride) also
// makes useCurrentPosition() refetch naturally on every new order after RESET.
function PickupResolver({ mapRef, className }: PickupResolverProps) {
  const actorRef = useOrderFlowActorRef()
  const isPickupPhase = useOrderFlowSelector((state) => state.matches('selectingPickup'))
  const pickup = useOrderFlowSelector((state) => state.context.pickup)
  const { status, coords } = useCurrentPosition()

  // Once geolocation settles (success or error), seed the user location + pickup
  // and jump the map there. Guarded by `pickup` so it runs exactly once per order.
  useEffect(() => {
    if (status === 'pending' || pickup) return
    const resolved = coords ?? DEMO_PICKUP
    actorRef.send({ type: 'SET_USER_LOCATION', coords: resolved })
    actorRef.send({ type: 'SET_PICKUP', coords: resolved })
    mapRef.current?.jumpTo({ center: [resolved.lng, resolved.lat], zoom: 15 })
  }, [status, coords, pickup, actorRef, mapRef])

  // Full Yandex-style model: no manual confirmation step — as soon as pickup
  // is known and we've reached selectingPickup, advance immediately.
  useEffect(() => {
    if (isPickupPhase && pickup) {
      actorRef.send({ type: 'CONFIRM_PICKUP' })
    }
  }, [isPickupPhase, pickup, actorRef])

  if (!isPickupPhase) return null

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 p-4 backdrop-blur',
        className,
      )}
      data-slot="pickup-resolver"
    >
      <p className="text-sm text-muted-foreground">Определяем местоположение…</p>
    </div>
  )
}

export { PickupResolver }
