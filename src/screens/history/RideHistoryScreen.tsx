import { ArrowRight, Star } from 'lucide-react'
import { useGetRideHistoryQuery } from '@/entities/ride-history/api'
import type { RideHistoryEntry } from '@/entities/ride-history/types'
import { formatCurrencyRUB } from '@/shared/lib/formatCurrency'
import { ScreenShell } from '@/shared/ui/ScreenShell'
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
    <ScreenShell title="История поездок" onBack={() => navigate('profile')}>
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
    </ScreenShell>
  )
}

export { RideHistoryScreen }
