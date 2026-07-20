import { ArrowRight, ChevronLeft, Star } from 'lucide-react'
import { useGetRideHistoryQuery } from '@/entities/ride-history/api'
import type { RideHistoryEntry } from '@/entities/ride-history/types'
import { formatCurrencyRUB } from '@/shared/lib/formatCurrency'
import { useNavigation } from '@/app/navigationContext'

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

function RideHistoryRow({ entry }: { entry: RideHistoryEntry }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3" data-slot="ride-history-row">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{dateFormatter.format(new Date(entry.date))}</span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          {entry.rating}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-foreground">
        <span className="min-w-0 flex-1 truncate">{entry.from}</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-right">{entry.to}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {entry.className} · {entry.driverName}
        </span>
        <span className="font-medium text-foreground">{formatCurrencyRUB(entry.fare.amount)}</span>
      </div>
    </div>
  )
}

function RideHistoryScreen() {
  const { navigate } = useNavigation()
  const { data: rides, isLoading, isError } = useGetRideHistoryQuery()

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <header className="flex items-center gap-2 border-b border-border p-4">
        <button
          type="button"
          onClick={() => navigate('profile')}
          aria-label="Назад"
          className="rounded-full outline-none ring-ring focus-visible:ring-2"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-base font-medium text-foreground">История поездок</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && <p className="text-sm text-muted-foreground">Загружаем поездки…</p>}
        {isError && <p className="text-sm text-destructive">Не удалось загрузить историю.</p>}
        {rides && rides.length === 0 && <p className="text-sm text-muted-foreground">Поездок пока нет.</p>}

        {rides && rides.length > 0 && (
          <div className="flex flex-col gap-3">
            {rides.map((entry) => (
              <RideHistoryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { RideHistoryScreen }
