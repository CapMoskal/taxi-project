import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/shared/ui/BottomSheet'
import { useOrderFlowActorRef } from './context'

function RideDoneCard() {
  const actorRef = useOrderFlowActorRef()

  return (
    <BottomSheet>
      <h2 className="mb-1 text-base font-medium text-foreground">Спасибо, что выбрали нас!</h2>
      <p className="mb-4 text-sm text-muted-foreground">Поездка завершена.</p>
      <Button className="w-full" onClick={() => actorRef.send({ type: 'RESET' })}>
        Заказать снова
      </Button>
    </BottomSheet>
  )
}

export { RideDoneCard }
