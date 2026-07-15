import { useEffect } from 'react'
import type { RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { DEMO_PICKUP } from './demoRoute'

interface SelectingDestinationControlsProps {
  mapRef: RefObject<maplibregl.Map | null>
  className?: string
}

function SelectingDestinationControls({ mapRef, className }: SelectingDestinationControlsProps) {
  const actorRef = useOrderFlowActorRef()
  const pickup = useOrderFlowSelector((state) => state.context.pickup)

  useEffect(() => {
    if (!pickup) {
      actorRef.send({ type: 'SET_PICKUP', coords: DEMO_PICKUP })
    }
  }, [pickup, actorRef])

  const handleConfirm = () => {
    const map = mapRef.current
    if (!map) return
    const center = map.getCenter()
    actorRef.send({ type: 'SET_DESTINATION', coords: { lat: center.lat, lng: center.lng } })
    actorRef.send({ type: 'CONFIRM_DESTINATION' })
  }

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 p-4 backdrop-blur',
        className,
      )}
      data-slot="selecting-destination-controls"
    >
      <p className="mb-3 text-sm text-muted-foreground">Перетащите карту, чтобы выбрать точку назначения</p>
      <Button className="w-full" onClick={handleConfirm}>
        Подтвердить точку назначения
      </Button>
    </div>
  )
}

export { SelectingDestinationControls }
