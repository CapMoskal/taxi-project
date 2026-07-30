import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { animate, motion, useMotionValue } from 'motion/react'
import { ChevronRight, Search } from 'lucide-react'
import { useReverseGeocodeQuery, useSearchPlacesQuery } from '@/shared/map/geocodingApi'
import type { Place } from '@/shared/map/geocodingApi'
import { useGetRecentPlacesQuery } from '@/entities/recent-place/api'
import type { RecentPlace } from '@/entities/recent-place/types'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { PlaceRow } from './PlaceRow'

interface PickupSheetProps {
  mapRef: RefObject<maplibregl.Map | null>
}

type PickupSheetSnap = 'idle' | 'retreated'

// Fraction of the sheet's own (measured) height it retreats by while the map
// is being dragged — same ratio DestinationSheet uses for the analogous B
// screen, leaves a visible strip rather than hiding the sheet entirely.
const RETREATED_RATIO = 0.82

// First screen (Yandex-style): the map center pin *is* point A — dragging the
// map moves it. No confirm step for A itself; tapping "Куда едем?" (or a
// recent address) advances straight to selectingDestination (point B).
//
// Mobile-only map overlay — desktop skips this step entirely (the machine's
// `selectingPickup` always-transitions straight to `selectingDestination`
// once pickup is seeded, see machine.ts) and shows A as an editable field
// inside OrderComposePanel instead.
function PickupSheet({ mapRef }: PickupSheetProps) {
  const actorRef = useOrderFlowActorRef()
  const pickup = useOrderFlowSelector((state) => state.context.pickup)
  const { data: pickupAddress } = useReverseGeocodeQuery(pickup ?? skipToken)
  const { data: recentPlaces } = useGetRecentPlacesQuery()

  // Manual pickup-address entry — tapping the pill swaps it for a search
  // input, same pattern as OrderComposePanel's `isEditingPickup` on desktop
  // (see OrderComposePanel.tsx). Point A stays adjustable by dragging
  // afterward — this only jumps the map there first.
  const [isEditingPickup, setIsEditingPickup] = useState(false)
  const [pickupQuery, setPickupQuery] = useState('')
  const debouncedPickupQuery = useDebouncedValue(pickupQuery, 300)
  const { data: pickupResults, isFetching: isSearchingPickup } = useSearchPlacesQuery(
    debouncedPickupQuery.trim().length >= 2
      ? { query: debouncedPickupQuery.trim(), proximity: pickup ?? undefined }
      : skipToken,
  )

  // Point A follows the map center as the user drags — same "center pin is
  // the point" interaction DestinationSheet uses for B. Gated on a real
  // `dragstart` (not just any `moveend`): `moveend` also fires for
  // programmatic camera moves — PickupResolver's initial jumpTo,
  // handlePickRecent's jumpTo below, and even the map's own first "settle"
  // right after construction (at the hardcoded DEMO_PICKUP/Moscow center,
  // see MapCanvas.tsx) — which fires within ~20ms of mount, before real
  // (async) geolocation has a chance to resolve. Without this gate that
  // first settle would win the race and permanently lock pickup to Moscow
  // (found via ad-hoc repro with real geolocation set to Rostov, see
  // docs/decisions.md). `dragstart` only fires on a genuine user pan —
  // confirmed empirically it does NOT fire for jumpTo or for wheel-zoom
  // (zoom's moveend/movestart carry no originalEvent either, so gating on
  // originalEvent instead would have silently dropped zoom-driven updates,
  // which the old code supported).
  // Retreat-while-dragging (parity with DestinationSheet on screen B, see
  // docs/decisions.md — the same UX request applied to the "Куда едем?"
  // sheet down here). Mounts already-retreated and immediately animates to
  // 'idle' right after — doubling as this sheet's own slide-up-from-bottom
  // entrance (this component no longer renders through the shared
  // BottomSheet primitive, which only handled that via AnimatePresence,
  // unused for this always-mounted-while-on-screen-A sheet).
  const [snap, setSnap] = useState<PickupSheetSnap>('retreated')
  useEffect(() => {
    setSnap('idle')
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)
  const [sheetHeight, setSheetHeight] = useState(0)
  useEffect(() => {
    const measure = () => setSheetHeight(containerRef.current?.offsetHeight ?? 0)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const retreatedY = sheetHeight * RETREATED_RATIO

  const y = useMotionValue(0)
  useEffect(() => {
    const controls = animate(y, snap === 'retreated' ? retreatedY : 0, { type: 'spring', damping: 30, stiffness: 300 })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, sheetHeight])

  const userDraggedRef = useRef(false)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const onDragStart = () => {
      userDraggedRef.current = true
      setSnap('retreated')
    }
    const onMoveEnd = () => {
      if (!userDraggedRef.current) return
      userDraggedRef.current = false
      setSnap('idle')
      const center = map.getCenter()
      actorRef.send({ type: 'SET_PICKUP', coords: { lat: center.lat, lng: center.lng } })
    }
    map.on('dragstart', onDragStart)
    map.on('moveend', onMoveEnd)
    return () => {
      map.off('dragstart', onDragStart)
      map.off('moveend', onMoveEnd)
    }
  }, [mapRef, actorRef])

  const handleConfirmPickup = () => {
    actorRef.send({ type: 'CONFIRM_PICKUP' })
  }

  const handlePickRecent = (place: RecentPlace) => {
    mapRef.current?.jumpTo({ center: [place.coords.lng, place.coords.lat], zoom: 15 })
    actorRef.send({ type: 'CONFIRM_PICKUP' })
  }

  // Unlike handlePickRecent, this stays on screen A — the user picked a
  // starting address, not "where to" — SET_PICKUP only, no CONFIRM_PICKUP.
  // jumpTo doesn't raise `dragstart` (see the comment above), so this won't
  // double-fire through the drag listener; dragging afterward still works
  // as fine-tuning from the new center.
  const handlePickPickupResult = (place: Place) => {
    mapRef.current?.jumpTo({ center: [place.coords.lng, place.coords.lat], zoom: 15 })
    actorRef.send({ type: 'SET_PICKUP', coords: place.coords })
    setIsEditingPickup(false)
    setPickupQuery('')
  }

  const listContent = (
    <>
      <button
        type="button"
        onClick={handleConfirmPickup}
        disabled={!pickup}
        className="flex w-full shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-left disabled:opacity-50"
        data-slot="pickup-where-to"
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-sm text-muted-foreground">Куда едем?</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {recentPlaces && recentPlaces.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="mb-1 mt-3 px-1 text-xs text-muted-foreground">Недавние адреса</p>
          <div className="flex flex-col">
            {recentPlaces.map((place) => (
              <PlaceRow
                key={place.id}
                name={place.name}
                subtitle={place.subtitle}
                icon="recent"
                onClick={() => handlePickRecent(place)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* left-20 clears the profile avatar (ProfileButton, `left-4` + 44px) so
          the pill never overlaps it, however long the resolved address is. */}
      <div className="absolute left-20 right-4 top-4 z-10">
        {isEditingPickup ? (
          <div className="rounded-2xl bg-background p-3 shadow-lg">
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={pickupQuery}
                onChange={(e) => setPickupQuery(e.target.value)}
                onBlur={() => {
                  if (!pickupQuery) setIsEditingPickup(false)
                }}
                placeholder="Введите адрес подачи"
                className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                data-slot="pickup-address-input"
              />
            </div>
            {isSearchingPickup && <p className="mt-2 px-1 text-xs text-muted-foreground">Ищем…</p>}
            {pickupResults && pickupResults.length > 0 && (
              <div
                className="mt-1 flex max-h-64 flex-col overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
                data-slot="pickup-address-results"
              >
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
            aria-label="Изменить точку подачи"
            className="w-full rounded-2xl bg-background px-4 py-3 text-center shadow-lg"
            data-slot="pickup-pill"
          >
            <p className="text-xs text-muted-foreground">Точка подачи</p>
            <p className="truncate text-sm font-medium text-foreground">
              {pickup ? pickupAddress || '…' : 'Определяем местоположение…'}
            </p>
          </button>
        )}
      </div>

      {/* max-h caps the sheet well under 50% of the viewport — the center pin
          (point A) sits at the map's true geometric center (same convention as
          DestinationSheet's center pin for B), and an uncapped list (5 mock
          recents) grows tall enough to visually bury that center under the
          sheet, even though map.getCenter() still reports it correctly. */}
      <motion.div
        ref={containerRef}
        // will-change: see DestinationSheet.tsx — without it, on real iOS
        // Safari this transform silently never repaints while a touch is
        // actively panning the map underneath (confirmed via on-device
        // diagnostics, docs/decisions.md).
        style={{ y, willChange: 'transform' }}
        className="absolute inset-x-0 bottom-0 z-20 flex max-h-[45vh] flex-col rounded-t-2xl border-t border-border bg-background p-4 shadow-lg"
        data-slot="bottom-sheet"
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-muted" />
        {listContent}
      </motion.div>
    </>
  )
}

export { PickupSheet }
