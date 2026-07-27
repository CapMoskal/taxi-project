import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrderSurface } from '@/shared/ui/OrderSurface'
import { formatCurrencyRUB } from '@/shared/lib/formatCurrency'
import { haversineDistanceMeters } from '@/shared/geo/distance'
import { cn } from '@/lib/utils'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import type { PaymentInfo } from './types'

const PAYMENT_METHODS: { id: PaymentInfo['method']; label: string }[] = [
  { id: 'card', label: 'Карта' },
  { id: 'cash', label: 'Наличные' },
]

function RideCompletionSheet() {
  const actorRef = useOrderFlowActorRef()
  const driver = useOrderFlowSelector((state) => state.context.driver)
  const fare = useOrderFlowSelector((state) => state.context.fare)
  const pickup = useOrderFlowSelector((state) => state.context.pickup)
  const destination = useOrderFlowSelector((state) => state.context.destination)
  const rating = useOrderFlowSelector((state) => state.context.rating)
  const isPaymentPending = useOrderFlowSelector((state) => state.matches({ completed: { payment: 'pending' } }))
  const isRatingPending = useOrderFlowSelector((state) => state.matches({ completed: { rating: 'pending' } }))

  const [method, setMethod] = useState<PaymentInfo['method']>('card')
  const [selectedStars, setSelectedStars] = useState(0)

  const distanceKm = pickup && destination ? haversineDistanceMeters(pickup, destination) / 1000 : 0

  return (
    <OrderSurface>
      <h2 className="mb-3 text-base font-medium text-foreground">Поездка завершена</h2>

      <div className="mb-4 flex flex-col gap-1 rounded-lg border border-border p-3 text-sm">
        {driver && (
          <p className="text-foreground">
            {driver.name} · {driver.carModel} · {driver.plate}
          </p>
        )}
        <p className="text-muted-foreground">{distanceKm.toFixed(1)} км</p>
        {fare && <p className="text-base font-medium text-foreground">{formatCurrencyRUB(fare.amount)}</p>}
      </div>

      <div className="mb-4">
        {isPaymentPending ? (
          <>
            <div className="mb-2 flex gap-2">
              {PAYMENT_METHODS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={method === option.id}
                  onClick={() => setMethod(option.id)}
                  className={cn(
                    'flex-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors',
                    method === option.id ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={() =>
                actorRef.send({
                  type: 'SUBMIT_PAYMENT',
                  payment: { method, amount: fare?.amount ?? 0, paidAt: new Date().toISOString() },
                })
              }
            >
              Оплатить{fare ? ` ${formatCurrencyRUB(fare.amount)}` : ''}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Оплачено</p>
        )}
      </div>

      <div>
        {isRatingPending ? (
          <>
            <div className="mb-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setSelectedStars(star)} aria-label={`${star} звёзд`}>
                  <Star
                    className={cn('h-7 w-7', star <= selectedStars ? 'fill-primary text-primary' : 'text-muted-foreground')}
                  />
                </button>
              ))}
            </div>
            <Button
              className="w-full"
              variant="outline"
              disabled={selectedStars === 0}
              onClick={() => actorRef.send({ type: 'SUBMIT_RATING', rating: { stars: selectedStars } })}
            >
              Оценить
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Спасибо за оценку{rating ? ` — ${rating.stars} из 5` : ''}!</p>
        )}
      </div>
    </OrderSurface>
  )
}

export { RideCompletionSheet }
