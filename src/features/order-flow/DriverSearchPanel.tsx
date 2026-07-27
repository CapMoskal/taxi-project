import { skipToken } from '@reduxjs/toolkit/query/react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useSearchDriverQuery } from '@/entities/driver/api'
import { Button } from '@/components/ui/button'
import { OrderSurface } from '@/shared/ui/OrderSurface'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'

function DriverSearchPanel() {
  const actorRef = useOrderFlowActorRef()
  const selectedClassId = useOrderFlowSelector((state) => state.context.selectedClassId)

  const { data, isFetching, isError, refetch } = useSearchDriverQuery(
    selectedClassId ? { classId: selectedClassId } : skipToken,
  )

  useEffect(() => {
    if (data) actorRef.send({ type: 'DRIVER_FOUND', driver: data })
  }, [data, actorRef])

  return (
    <OrderSurface>
      {isFetching && (
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm text-muted-foreground"
        >
          Ищем водителя рядом…
        </motion.p>
      )}

      {isError && !isFetching && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-destructive">Поблизости нет свободных водителей.</p>
          <Button size="sm" onClick={() => refetch()}>
            Повторить поиск
          </Button>
        </div>
      )}

      <button
        type="button"
        className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        onClick={() => actorRef.send({ type: 'CANCEL_RIDE' })}
      >
        Отменить
      </button>
    </OrderSurface>
  )
}

export { DriverSearchPanel }
