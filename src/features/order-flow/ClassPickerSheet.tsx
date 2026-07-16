import { skipToken } from '@reduxjs/toolkit/query/react'
import { useGetRideClassQuotesQuery } from '@/entities/ride-class/api'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/shared/ui/BottomSheet'
import { cn } from '@/lib/utils'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'

const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

function ClassPickerSheet() {
  const actorRef = useOrderFlowActorRef()
  const pickup = useOrderFlowSelector((state) => state.context.pickup)
  const destination = useOrderFlowSelector((state) => state.context.destination)
  const selectedClassId = useOrderFlowSelector((state) => state.context.selectedClassId)

  const { data: quotes, isLoading, isError } = useGetRideClassQuotesQuery(
    pickup && destination ? { pickup, destination } : skipToken,
  )

  const selectedQuote = quotes?.find((quote) => quote.classId === selectedClassId)

  return (
    <BottomSheet>
      <h2 className="mb-3 text-base font-medium text-foreground">Выберите класс</h2>

      {isLoading && <p className="text-sm text-muted-foreground">Считаем цену…</p>}
      {isError && <p className="text-sm text-destructive">Не удалось загрузить классы. Попробуйте ещё раз.</p>}

      <div className="flex flex-col gap-2">
        {quotes?.map((quote) => (
          <button
            key={quote.classId}
            type="button"
            aria-pressed={selectedClassId === quote.classId}
            onClick={() => actorRef.send({ type: 'SELECT_CLASS', classId: quote.classId })}
            className={cn(
              'flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left transition-colors',
              selectedClassId === quote.classId ? 'border-primary bg-primary/10' : 'hover:bg-muted',
            )}
          >
            <span className="text-sm font-medium text-foreground">{quote.label}</span>
            <span className="text-sm text-muted-foreground">{priceFormatter.format(quote.price)}</span>
          </button>
        ))}
      </div>

      <Button
        className="mt-4 w-full"
        disabled={!selectedQuote}
        onClick={() =>
          selectedQuote &&
          actorRef.send({
            type: 'CONFIRM_CLASS',
            fare: { amount: selectedQuote.price, currency: selectedQuote.currency },
          })
        }
      >
        Подтвердить класс
      </Button>
      <button
        type="button"
        className="mt-2 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        onClick={() => actorRef.send({ type: 'BACK_TO_DESTINATION' })}
      >
        Назад
      </button>
    </BottomSheet>
  )
}

export { ClassPickerSheet }
