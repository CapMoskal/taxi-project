import { useEffect } from 'react'
import type { RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { Button } from '@/components/ui/button'
import { useCurrentPosition } from '@/shared/lib/useCurrentPosition'
import { cn } from '@/lib/utils'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { DEMO_PICKUP } from './demoRoute'

interface SelectingPickupControlsProps {
  mapRef: RefObject<maplibregl.Map | null>
  className?: string
}

function SelectingPickupControls({ mapRef, className }: SelectingPickupControlsProps) {
  const actorRef = useOrderFlowActorRef()
  const pickup = useOrderFlowSelector((state) => state.context.pickup)
  const { status, coords } = useCurrentPosition()

  // Once geolocation settles (success or error), seed the user location + pickup
  // and fly the map there. Guarded by `pickup` so it runs exactly once.
  useEffect(() => {
    if (status === 'pending' || pickup) return
    const resolved = coords ?? DEMO_PICKUP
    actorRef.send({ type: 'SET_USER_LOCATION', coords: resolved })
    actorRef.send({ type: 'SET_PICKUP', coords: resolved })
    // Snap (not fly): a cross-country flyTo animation would let a quick confirm
    // read a mid-flight map center and drop the pickup at the wrong spot.
    mapRef.current?.jumpTo({ center: [resolved.lng, resolved.lat], zoom: 15 })
  }, [status, coords, pickup, actorRef, mapRef])

  const isLocating = status === 'pending' || !pickup

  const handleConfirm = () => {
    const map = mapRef.current
    if (!map) return
    const center = map.getCenter()
    actorRef.send({ type: 'SET_PICKUP', coords: { lat: center.lat, lng: center.lng } })
    actorRef.send({ type: 'CONFIRM_PICKUP' })
  }

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 p-4 backdrop-blur',
        className,
      )}
      data-slot="selecting-pickup-controls"
    >
      {isLocating ? (
        <p className="text-sm text-muted-foreground">Определяем местоположение…</p>
      ) : (
        <>
          <p className="mb-1 text-sm text-muted-foreground">Перетащите карту, чтобы уточнить точку подачи</p>
          {status === 'error' && (
            <p className="mb-3 text-xs text-muted-foreground">Не удалось определить местоположение — используем демо-точку</p>
          )}
          <Button className={cn('w-full', status !== 'error' && 'mt-2')} onClick={handleConfirm}>
            Подтвердить точку подачи
          </Button>
        </>
      )}
    </div>
  )
}

export { SelectingPickupControls }
