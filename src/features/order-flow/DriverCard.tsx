import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InitialsAvatar } from '@/shared/ui/InitialsAvatar'
import { useIsDesktop } from '@/shared/lib/useIsDesktop'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'

// Mounted by OrderScreen in the desktop rail or as a mobile map overlay,
// never both — see PickupSheet.tsx for why useIsDesktop() here (chrome only)
// stays in sync with where OrderScreen chose to mount it.
function DriverCard() {
  const actorRef = useOrderFlowActorRef()
  const driver = useOrderFlowSelector((state) => state.context.driver)
  const isDriverAssigned = useOrderFlowSelector((state) => state.matches('driverAssigned'))
  const isEnRoute = useOrderFlowSelector((state) => state.matches('enRoute'))
  const isArrived = useOrderFlowSelector((state) => state.matches('arrived'))
  const isInRide = useOrderFlowSelector((state) => state.matches('inRide'))
  const isDesktop = useIsDesktop()

  if (!driver || !(isDriverAssigned || isEnRoute || isArrived || isInRide)) return null

  const statusLabel = isDriverAssigned
    ? 'Водитель уже выезжает'
    : isEnRoute
      ? 'Едет к вам'
      : isArrived
        ? 'Ждёт у подъезда'
        : 'В пути к месту назначения'

  return (
    <div
      className={
        isDesktop
          ? 'flex flex-col gap-3 p-4'
          : 'absolute inset-x-0 top-0 z-10 m-4 flex flex-col gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur'
      }
      data-slot="driver-card"
    >
      <div className="flex items-center gap-3">
        <InitialsAvatar name={driver.name} className="h-10 w-10 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{driver.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {driver.carModel} · {driver.plate}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-sm text-foreground">
          <Star className="h-4 w-4 fill-primary text-primary" />
          {driver.rating.toFixed(1)}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{statusLabel}</p>

      {isArrived && (
        <Button size="sm" onClick={() => actorRef.send({ type: 'START_RIDE' })}>
          Начать поездку
        </Button>
      )}
      {(isDriverAssigned || isEnRoute) && (
        <button
          type="button"
          className="self-start text-sm text-muted-foreground hover:text-foreground"
          onClick={() => actorRef.send({ type: 'CANCEL_RIDE' })}
        >
          Отменить
        </button>
      )}
    </div>
  )
}

export { DriverCard }
