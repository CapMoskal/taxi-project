import { formatCurrencyRUB } from '@/shared/lib/formatCurrency'
import { cn } from '@/lib/utils'
import type { RideClassId, RideClassQuote } from '@/entities/ride-class/types'

interface ClassGridProps {
  quotes: RideClassQuote[] | undefined
  selectedClassId: RideClassId | null
  onSelect: (classId: RideClassId) => void
}

// Presentational class-card list — shared by the mobile ClassPickerSheet
// (inside OrderSurface) and the desktop OrderComposePanel (co-visible with
// addresses/payment/order), so both render the same source of truth for
// ride-class quotes.
function ClassGrid({ quotes, selectedClassId, onSelect }: ClassGridProps) {
  return (
    <div className="flex flex-col gap-2">
      {quotes?.map((quote) => (
        <button
          key={quote.classId}
          type="button"
          aria-pressed={selectedClassId === quote.classId}
          onClick={() => onSelect(quote.classId)}
          className={cn(
            'flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left transition-colors',
            selectedClassId === quote.classId ? 'border-primary bg-primary/10' : 'hover:bg-muted',
          )}
        >
          <span className="text-sm font-medium text-foreground">{quote.label}</span>
          <span className="text-sm text-muted-foreground">{formatCurrencyRUB(quote.price)}</span>
        </button>
      ))}
    </div>
  )
}

export { ClassGrid }
