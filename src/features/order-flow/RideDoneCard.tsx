import { Button } from '@/components/ui/button'
import { OrderSurface } from '@/shared/ui/OrderSurface'
import { useOrderFlowActorRef } from './context'

function RideDoneCard() {
  const actorRef = useOrderFlowActorRef()

  return (
    <OrderSurface>
      <h2 className="mb-1 text-base font-medium text-foreground">Спасибо, что выбрали нас!</h2>
      <p className="mb-4 text-sm text-muted-foreground">Поездка завершена.</p>
      <Button className="w-full" onClick={() => actorRef.send({ type: 'RESET' })}>
        Заказать снова
      </Button>
    </OrderSurface>
  )
}

export { RideDoneCard }
