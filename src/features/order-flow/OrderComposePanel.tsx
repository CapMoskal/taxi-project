import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrderCard } from '@/shared/ui/OrderCard'
import { useGetRideClassQuotesQuery } from '@/entities/ride-class/api'
import { useSearchPlacesQuery } from '@/shared/map/geocodingApi'
import type { Place } from '@/shared/map/geocodingApi'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { formatCurrencyRUB } from '@/shared/lib/formatCurrency'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { useDestinationSync } from './useDestinationSync'
import { ClassGrid } from './ClassGrid'
import { PaymentRow } from './PaymentRow'
import { PlaceRow } from './PlaceRow'

interface OrderComposePanelProps {
  mapRef: RefObject<maplibregl.Map | null>
}

// Desktop-only "everything at once" compose panel (Yandex-style) — replaces
// the mobile step-by-step PickupSheet/DestinationSheet/ClassPickerSheet with
// a single co-visible block: editable A/B addresses, class grid, payment,
// and "Заказать", all shown together once a route exists. The machine drives
// which of selectingPickup/selectingDestination/selectingClass is "current"
// (see machine.ts's desktop `always` transitions), but this component
// renders across all three so nothing visually jumps between them.
function OrderComposePanel({ mapRef }: OrderComposePanelProps) {
  const actorRef = useOrderFlowActorRef()
  const pickup = useOrderFlowSelector((state) => state.context.pickup)
  const destination = useOrderFlowSelector((state) => state.context.destination)
  const selectedClassId = useOrderFlowSelector((state) => state.context.selectedClassId)

  const [isEditingPickup, setIsEditingPickup] = useState(false)
  const [pickupQuery, setPickupQuery] = useState('')
  const debouncedPickupQuery = useDebouncedValue(pickupQuery, 300)
  const { data: pickupResults, isFetching: isSearchingPickup } = useSearchPlacesQuery(
    debouncedPickupQuery.trim().length >= 2
      ? { query: debouncedPickupQuery.trim(), proximity: pickup ?? undefined }
      : skipToken,
  )

  // Focused (not just scrolled to) when "Заказать" is clicked before a
  // destination is set — see the button's onClick below.
  const destinationInputRef = useRef<HTMLInputElement>(null)

  const [isDestinationFocused, setIsDestinationFocused] = useState(false)
  const {
    query: destinationQuery,
    setQuery: setDestinationQuery,
    isInputFocusedRef,
    rows: destinationRows,
    isSearching: isSearchingDestination,
    showSearch: showDestinationSearch,
    handlePickRow: pickDestinationRow,
    pickupAddress,
  } = useDestinationSync(mapRef, pickup, {
    // Hybrid: dragging the map still moves B (unchanged from 2b) — settling
    // after a user-driven drag commits it immediately, same as picking a
    // search row, since the compose panel has no separate confirm step.
    onUserSettle: (coords) => actorRef.send({ type: 'SET_DESTINATION', coords }),
    onPick: (coords) => actorRef.send({ type: 'SET_DESTINATION', coords }),
  })

  // Quotes load as soon as pickup resolves (Yandex-style "от X ₽" estimate,
  // see entities/ride-class) and refetch with exact prices once destination
  // is set — ClassGrid's `estimate` prop below reflects which state we're in.
  const {
    data: quotes,
    isLoading: isLoadingQuotes,
    isError: isQuotesError,
  } = useGetRideClassQuotesQuery(pickup ? { pickup, destination: destination ?? undefined } : skipToken)

  // Yandex-style default: pre-select the first class as soon as quotes load
  // so "Заказать" is actionable without an extra tap.
  useEffect(() => {
    if (quotes && quotes.length > 0 && !selectedClassId) {
      actorRef.send({ type: 'SELECT_CLASS', classId: quotes[0].classId })
    }
  }, [quotes, selectedClassId, actorRef])

  const selectedQuote = quotes?.find((quote) => quote.classId === selectedClassId)

  const handlePickPickupResult = (place: Place) => {
    actorRef.send({ type: 'SET_PICKUP', coords: place.coords })
    setIsEditingPickup(false)
    setPickupQuery('')
  }

  // The dropdown's `onMouseDown` preventDefault (below) keeps the input
  // focused through the click so the row's onClick actually fires — but
  // that also means blur never closes the dropdown afterwards, so a pick
  // must close it explicitly here.
  const handlePickDestinationRow: typeof pickDestinationRow = (row) => {
    pickDestinationRow(row)
    setIsDestinationFocused(false)
  }

  return (
    <>
      <OrderCard className="flex flex-col gap-1" data-slot="order-compose">
        {isEditingPickup ? (
          <div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={pickupQuery}
                onChange={(e) => setPickupQuery(e.target.value)}
                onBlur={() => {
                  if (!pickupQuery) setIsEditingPickup(false)
                }}
                placeholder="Откуда едем?"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                data-slot="compose-from-input"
              />
            </div>
            {isSearchingPickup && <p className="mt-2 px-2 text-xs text-muted-foreground">Ищем…</p>}
            {pickupResults && pickupResults.length > 0 && (
              <div className="mt-1 flex flex-col" onMouseDown={(e) => e.preventDefault()}>
                {pickupResults.map((place) => (
                  <PlaceRow
                    key={place.id}
                    name={place.name}
                    subtitle={place.address}
                    icon="place"
                    onClick={() => handlePickPickupResult(place)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingPickup(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left"
            data-slot="compose-from"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {pickup ? pickupAddress || '…' : 'Определяем местоположение…'}
            </span>
          </button>
        )}

        <div className="h-px bg-border" />

        <div className="relative">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={destinationInputRef}
              value={destinationQuery}
              onChange={(e) => setDestinationQuery(e.target.value)}
              onFocus={() => {
                isInputFocusedRef.current = true
                setIsDestinationFocused(true)
              }}
              onBlur={() => {
                isInputFocusedRef.current = false
                setIsDestinationFocused(false)
              }}
              placeholder="Куда едем?"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              data-slot="compose-to"
            />
          </div>
          {isDestinationFocused && (
            <>
              {isSearchingDestination && showDestinationSearch && (
                <p className="mt-2 px-2 text-xs text-muted-foreground">Ищем…</p>
              )}
              {showDestinationSearch && !isSearchingDestination && destinationRows.length === 0 && (
                <p className="mt-2 px-2 text-xs text-muted-foreground">Ничего не найдено</p>
              )}
              {destinationRows.length > 0 && (
                <div
                  className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-background shadow-lg"
                  onMouseDown={(e) => e.preventDefault()}
                  data-slot="compose-to-results"
                >
                  {destinationRows.map((row) => (
                    <PlaceRow
                      key={row.id}
                      name={row.name}
                      subtitle={row.subtitle}
                      icon={row.icon}
                      onClick={() => handlePickDestinationRow(row)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </OrderCard>

      {/* Classes/payment/order — visible as soon as pickup resolves, not
          gated on destination (Yandex shows "от X ₽" estimates immediately,
          see ClassGrid's `estimate` prop and entities/ride-class). Each is
          its own floating OrderCard (see OrderScreen.tsx's transparent
          rail), not grouped under the address card. */}
      {pickup && (
        <>
          <OrderCard className="flex flex-col gap-2">
            {isLoadingQuotes && <p className="text-sm text-muted-foreground">Считаем цену…</p>}
            {isQuotesError && <p className="text-sm text-destructive">Не удалось загрузить классы. Попробуйте ещё раз.</p>}
            <ClassGrid
              quotes={quotes}
              selectedClassId={selectedClassId}
              onSelect={(classId) => actorRef.send({ type: 'SELECT_CLASS', classId })}
              estimate={!destination}
            />
          </OrderCard>

          <OrderCard>
            <PaymentRow />
          </OrderCard>

          <Button
            className="w-full"
            disabled={Boolean(destination) && !selectedQuote}
            onClick={() => {
              // No destination yet — "Заказать" acts as a nudge toward the
              // one missing step (Yandex's button is always active-looking,
              // never a disabled dead end) instead of sending CONFIRM_CLASS.
              if (!destination) {
                destinationInputRef.current?.focus()
                return
              }
              if (selectedQuote) {
                actorRef.send({
                  type: 'CONFIRM_CLASS',
                  fare: { amount: selectedQuote.price, currency: selectedQuote.currency },
                })
              }
            }}
            data-slot="compose-order"
          >
            {destination && selectedQuote ? `Заказать · ${formatCurrencyRUB(selectedQuote.price)}` : 'Заказать'}
          </Button>
        </>
      )}
    </>
  )
}

export { OrderComposePanel }
