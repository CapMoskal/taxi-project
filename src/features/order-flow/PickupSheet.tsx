import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { ChevronRight, Search } from 'lucide-react'
import { BottomSheet } from '@/shared/ui/BottomSheet'
import { useIsDesktop } from '@/shared/lib/useIsDesktop'
import { useReverseGeocodeQuery } from '@/shared/map/geocodingApi'
import { useGetRecentPlacesQuery } from '@/entities/recent-place/api'
import type { RecentPlace } from '@/entities/recent-place/types'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { PlaceRow } from './PlaceRow'

interface PickupSheetProps {
  mapRef: RefObject<maplibregl.Map | null>
}

// First screen (Yandex-style): the map center pin *is* point A — dragging the
// map moves it. No confirm step for A itself; tapping "Куда едем?" (or a
// recent address) advances straight to selectingDestination (point B).
//
// Mounted by OrderScreen in one of two spots depending on the breakpoint —
// inside the desktop rail, or as a mobile overlay over the map — never both
// at once. `useIsDesktop()` here only controls which markup/chrome this
// component itself renders, not whether it's mounted (OrderScreen decides
// that), so the two always agree.
function PickupSheet({ mapRef }: PickupSheetProps) {
  const actorRef = useOrderFlowActorRef()
  const pickup = useOrderFlowSelector((state) => state.context.pickup)
  const { data: pickupAddress } = useReverseGeocodeQuery(pickup ?? skipToken)
  const { data: recentPlaces } = useGetRecentPlacesQuery()
  const isDesktop = useIsDesktop()

  // Point A follows the map center as the user drags — same "center pin is
  // the point" interaction DestinationSheet uses for B. PickupResolver's
  // initial jumpTo is harmless here (lands on the same coords it just set as
  // pickup, so re-sending them is a no-op) — but handlePickRecent's jumpTo
  // (navigating to a recent address's location, which becomes B, not A) is
  // not: without the guard it would overwrite pickup with that same point,
  // making pickup === destination. `isLeavingRef` suppresses SET_PICKUP for
  // that one jumpTo since we're unmounting this screen anyway.
  const isLeavingRef = useRef(false)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const onMoveEnd = () => {
      if (isLeavingRef.current) return
      const center = map.getCenter()
      actorRef.send({ type: 'SET_PICKUP', coords: { lat: center.lat, lng: center.lng } })
    }
    map.on('moveend', onMoveEnd)
    return () => {
      map.off('moveend', onMoveEnd)
    }
  }, [mapRef, actorRef])

  const handleConfirmPickup = () => {
    actorRef.send({ type: 'CONFIRM_PICKUP' })
  }

  const handlePickRecent = (place: RecentPlace) => {
    isLeavingRef.current = true
    mapRef.current?.jumpTo({ center: [place.coords.lng, place.coords.lat], zoom: 15 })
    actorRef.send({ type: 'CONFIRM_PICKUP' })
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

  if (isDesktop) {
    // No floating pill on desktop — the resolved address is just the first
    // row of the rail block instead (rail already gives this its own space,
    // unlike the mobile map overlay where the pill and sheet compete for room).
    return (
      <div className="flex h-full flex-col gap-3 p-4" data-slot="pickup-rail">
        <div>
          <p className="text-xs text-muted-foreground">Точка подачи</p>
          <p className="truncate text-sm font-medium text-foreground">
            {pickup ? pickupAddress || '…' : 'Определяем местоположение…'}
          </p>
        </div>
        {listContent}
      </div>
    )
  }

  return (
    <>
      {/* left-20 clears the profile avatar (ProfileButton, `left-4` + 44px) so
          the pill never overlaps it, however long the resolved address is. */}
      <div
        className="absolute left-20 right-4 top-4 z-10 rounded-2xl bg-background px-4 py-3 text-center shadow-lg"
        data-slot="pickup-pill"
      >
        <p className="text-xs text-muted-foreground">Точка подачи</p>
        <p className="truncate text-sm font-medium text-foreground">
          {pickup ? pickupAddress || '…' : 'Определяем местоположение…'}
        </p>
      </div>

      {/* max-h caps the sheet well under 50% of the viewport — the center pin
          (point A) sits at the map's true geometric center (same convention as
          DestinationSheet's center pin for B), and an uncapped list (5 mock
          recents) grows tall enough to visually bury that center under the
          sheet, even though map.getCenter() still reports it correctly. */}
      <BottomSheet className="flex max-h-[45vh] flex-col">{listContent}</BottomSheet>
    </>
  )
}

export { PickupSheet }
