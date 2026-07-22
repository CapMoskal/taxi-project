import { useEffect } from 'react'
import type { RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { useCurrentPosition } from '@/shared/lib/useCurrentPosition'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { DEMO_PICKUP } from './demoRoute'

interface PickupResolverProps {
  mapRef: RefObject<maplibregl.Map | null>
}

// Headless geolocation seeder — mounted on `selectingPickup` (see OrderScreen),
// the very first screen now that there's no "Начать заказ" gate. Seeds
// userLocation/pickup exactly once per order (guarded by `pickup`), then gets
// out of the way — PickupSheet owns the actual UI (address pill, moveend →
// SET_PICKUP for the draggable A point) and RESET re-runs this on a new order.
function PickupResolver({ mapRef }: PickupResolverProps) {
  const actorRef = useOrderFlowActorRef()
  const pickup = useOrderFlowSelector((state) => state.context.pickup)
  const { status, coords } = useCurrentPosition()

  useEffect(() => {
    if (status === 'pending' || pickup) return
    const resolved = coords ?? DEMO_PICKUP
    actorRef.send({ type: 'SET_USER_LOCATION', coords: resolved })
    actorRef.send({ type: 'SET_PICKUP', coords: resolved })
    mapRef.current?.jumpTo({ center: [resolved.lng, resolved.lat], zoom: 15 })
  }, [status, coords, pickup, actorRef, mapRef])

  return null
}

export { PickupResolver }
