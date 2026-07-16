import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'

function formatStateValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

interface OrderFlowDebugPanelProps {
  className?: string
}

function OrderFlowDebugPanel({ className }: OrderFlowDebugPanelProps) {
  const snapshot = useOrderFlowSelector((state) => state)
  const actorRef = useOrderFlowActorRef()

  if (!import.meta.env.DEV) return null
  if (
    snapshot.matches('selectingDestination') ||
    snapshot.matches('selectingClass') ||
    snapshot.matches('searchingDriver') ||
    snapshot.matches('driverAssigned') ||
    snapshot.matches('enRoute') ||
    snapshot.matches('arrived') ||
    snapshot.matches('inRide') ||
    snapshot.matches('completed') ||
    snapshot.matches('done')
  )
    return null

  return (
    <div
      className={cn(
        'relative z-10 flex flex-col gap-2 border-t border-border bg-background/95 p-3 text-sm backdrop-blur',
        className,
      )}
      data-slot="order-flow-debug-panel"
    >
      <p className="font-mono text-xs text-muted-foreground">state: {formatStateValue(snapshot.value)}</p>
      <div className="flex flex-wrap gap-2">
        {snapshot.matches('idle') && (
          <Button size="sm" onClick={() => actorRef.send({ type: 'START_ORDER' })}>
            Начать заказ
          </Button>
        )}
      </div>
    </div>
  )
}

export { OrderFlowDebugPanel }
