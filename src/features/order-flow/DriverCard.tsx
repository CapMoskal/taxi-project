import { Star } from 'lucide-react'
import { useOrderFlowSelector } from './context'

function DriverCard() {
  const driver = useOrderFlowSelector((state) => state.context.driver)
  const isDriverVisibleState = useOrderFlowSelector((state) =>
    state.matches('driverAssigned') || state.matches('enRoute') || state.matches('arrived') || state.matches('inRide'),
  )

  if (!driver || !isDriverVisibleState) return null

  return (
    <div
      className="absolute inset-x-0 top-0 z-10 m-4 flex items-center gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur"
      data-slot="driver-card"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
        {driver.name.charAt(0)}
      </div>
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
  )
}

export { DriverCard }
