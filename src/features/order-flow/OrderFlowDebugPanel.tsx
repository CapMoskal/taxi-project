import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { DEMO_DESTINATION, DEMO_PICKUP } from './demoRoute'
import type { DriverInfo, FareInfo, PaymentInfo, RatingInfo } from './types'

const DEMO_DRIVER: DriverInfo = {
  id: 'demo-driver-1',
  name: 'Алексей',
  carModel: 'Kia Rio',
  plate: 'А123БВ777',
  rating: 4.9,
}
const DEMO_FARE: FareInfo = { amount: 350, currency: 'RUB' }
const DEMO_PAYMENT: PaymentInfo = { method: 'card', amount: 350, paidAt: new Date().toISOString() }
const DEMO_RATING: RatingInfo = { stars: 5 }

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

  const completedValue =
    typeof snapshot.value === 'object' && snapshot.value !== null && 'completed' in snapshot.value
      ? (snapshot.value as { completed: { payment: string; rating: string } }).completed
      : undefined

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

        {snapshot.matches('selectingDestination') && (
          <>
            <Button size="sm" variant="outline" onClick={() => actorRef.send({ type: 'SET_PICKUP', coords: DEMO_PICKUP })}>
              Задать точку A
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => actorRef.send({ type: 'SET_DESTINATION', coords: DEMO_DESTINATION })}
            >
              Задать точку B
            </Button>
            <Button size="sm" onClick={() => actorRef.send({ type: 'CONFIRM_DESTINATION' })}>
              Подтвердить маршрут
            </Button>
          </>
        )}

        {snapshot.matches('selectingClass') && (
          <>
            <Button size="sm" variant="outline" onClick={() => actorRef.send({ type: 'SELECT_CLASS', classId: 'comfort' })}>
              Выбрать «Комфорт»
            </Button>
            <Button size="sm" onClick={() => actorRef.send({ type: 'CONFIRM_CLASS' })}>
              Подтвердить класс
            </Button>
            <Button size="sm" variant="ghost" onClick={() => actorRef.send({ type: 'BACK_TO_DESTINATION' })}>
              Назад
            </Button>
          </>
        )}

        {snapshot.matches('searchingDriver') && (
          <>
            <Button size="sm" onClick={() => actorRef.send({ type: 'DRIVER_FOUND', driver: DEMO_DRIVER })}>
              Водитель найден
            </Button>
            <Button size="sm" variant="destructive" onClick={() => actorRef.send({ type: 'SEARCH_FAILED' })}>
              Не найден
            </Button>
            <Button size="sm" variant="ghost" onClick={() => actorRef.send({ type: 'CANCEL_RIDE' })}>
              Отменить
            </Button>
          </>
        )}

        {snapshot.matches('driverAssigned') && (
          <>
            <Button size="sm" onClick={() => actorRef.send({ type: 'DRIVER_EN_ROUTE' })}>
              Водитель выехал
            </Button>
            <Button size="sm" variant="ghost" onClick={() => actorRef.send({ type: 'CANCEL_RIDE' })}>
              Отменить
            </Button>
          </>
        )}

        {snapshot.matches('enRoute') && (
          <>
            <Button size="sm" onClick={() => actorRef.send({ type: 'DRIVER_ARRIVED' })}>
              Водитель прибыл
            </Button>
            <Button size="sm" variant="ghost" onClick={() => actorRef.send({ type: 'CANCEL_RIDE' })}>
              Отменить
            </Button>
          </>
        )}

        {snapshot.matches('arrived') && (
          <Button size="sm" onClick={() => actorRef.send({ type: 'START_RIDE' })}>
            Начать поездку
          </Button>
        )}

        {snapshot.matches('inRide') && (
          <Button size="sm" onClick={() => actorRef.send({ type: 'RIDE_COMPLETED', fare: DEMO_FARE })}>
            Завершить поездку
          </Button>
        )}

        {completedValue && (
          <>
            {completedValue.payment === 'pending' && (
              <Button size="sm" onClick={() => actorRef.send({ type: 'SUBMIT_PAYMENT', payment: DEMO_PAYMENT })}>
                Оплатить
              </Button>
            )}
            {completedValue.rating === 'pending' && (
              <Button size="sm" variant="outline" onClick={() => actorRef.send({ type: 'SUBMIT_RATING', rating: DEMO_RATING })}>
                Оценить поездку
              </Button>
            )}
          </>
        )}

        {snapshot.matches('done') && (
          <Button size="sm" onClick={() => actorRef.send({ type: 'RESET' })}>
            Новый заказ
          </Button>
        )}
      </div>
    </div>
  )
}

export { OrderFlowDebugPanel }
