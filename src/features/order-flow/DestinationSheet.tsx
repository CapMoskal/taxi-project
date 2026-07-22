import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { animate, motion, useMotionValue } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { useReverseGeocodeQuery, useSearchPlacesQuery } from '@/shared/map/geocodingApi'
import type { Place } from '@/shared/map/geocodingApi'
import { useGetRouteQuery } from '@/shared/map/routingApi'
import { useGetRecentPlacesQuery } from '@/entities/recent-place/api'
import type { RecentPlace } from '@/entities/recent-place/types'
import type { LatLng } from '@/shared/geo/types'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { PlaceRow } from './PlaceRow'

type SheetSnap = 'peek' | 'expanded' | 'retreated'

// Fractions of the sheet's own (measured) height — 0 = fully expanded (top),
// closer to 1 = mostly hidden below the fold.
const PEEK_RATIO = 0.62
const RETREATED_RATIO = 0.88
const FLICK_VELOCITY = 500

interface DestinationSheetProps {
  mapRef: RefObject<maplibregl.Map | null>
}

function DestinationSheet({ mapRef }: DestinationSheetProps) {
  const actorRef = useOrderFlowActorRef()
  const pickup = useOrderFlowSelector((state) => state.context.pickup)

  const [query, setQuery] = useState('')
  const isInputFocusedRef = useRef(false)
  const debouncedQuery = useDebouncedValue(query, 300)
  const [draggedCenter, setDraggedCenter] = useState<LatLng | null>(null)
  // Whatever `handleConfirm` would read right now (map.getCenter()) — kept in
  // sync on every settle, not just drag-retreat cycles, so the road route to
  // it can be prefetched below and be warm in cache by the time the user
  // actually taps confirm (OrderScreen's own useGetRouteQuery re-subscribes
  // to the same {from,to} args and hits the cache instead of refetching).
  const [candidateDestination, setCandidateDestination] = useState<LatLng | null>(null)

  const [snap, setSnap] = useState<SheetSnap>('peek')
  const snapRef = useRef<SheetSnap>('peek')
  const prevSnapRef = useRef<SheetSnap>('peek')
  useEffect(() => {
    snapRef.current = snap
  }, [snap])

  const containerRef = useRef<HTMLDivElement>(null)
  const [sheetHeight, setSheetHeight] = useState(0)
  useEffect(() => {
    const measure = () => setSheetHeight(containerRef.current?.offsetHeight ?? 0)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const peekY = sheetHeight * PEEK_RATIO
  const retreatedY = sheetHeight * RETREATED_RATIO
  const snapY = (target: SheetSnap) => (target === 'expanded' ? 0 : target === 'retreated' ? retreatedY : peekY)

  const y = useMotionValue(0)
  useEffect(() => {
    const controls = animate(y, snapY(snap), { type: 'spring', damping: 30, stiffness: 300 })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, sheetHeight])

  const handleDragEnd = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.velocity.y < -FLICK_VELOCITY) return setSnap('expanded')
    if (info.velocity.y > FLICK_VELOCITY) return setSnap('peek')
    setSnap(y.get() < peekY / 2 ? 'expanded' : 'peek')
  }

  // Sheet retreats while the user drags/zooms the map, and comes back once they settle.
  // Programmatic camera moves (jumpTo on picking a result) don't have an originalEvent.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const onUserMoveStart = (e: { originalEvent?: unknown }) => {
      if (!e.originalEvent || snapRef.current === 'retreated') return
      prevSnapRef.current = snapRef.current
      setSnap('retreated')
    }
    // No `originalEvent` gate here: after a fast drag, MapLibre's inertia
    // deceleration fires the settling `moveend` programmatically (no
    // originalEvent) — gating on it would strand the sheet in `retreated`
    // forever on any flick-style swipe. `snapRef` alone is enough to ignore
    // moveend from our own programmatic jumpTo (snap never became 'retreated'
    // for those).
    const onMoveEnd = () => {
      // Unconditional: this is whatever handleConfirm would read right now
      // (map.getCenter()), kept fresh on every settle — including
      // programmatic jumpTo from picking a search result — so the route
      // prefetch below stays warm regardless of how the user got here.
      const center = map.getCenter()
      setCandidateDestination({ lat: center.lat, lng: center.lng })
      if (snapRef.current !== 'retreated') return
      setSnap(prevSnapRef.current)
      setDraggedCenter({ lat: center.lat, lng: center.lng })
    }
    // Seed the initial candidate immediately — the map may already be sitting
    // on a valid destination (wherever selectingPickup left it) before any
    // drag/jumpTo ever fires a moveend.
    const initialCenter = map.getCenter()
    setCandidateDestination({ lat: initialCenter.lat, lng: initialCenter.lng })
    map.on('dragstart', onUserMoveStart)
    map.on('zoomstart', onUserMoveStart)
    map.on('moveend', onMoveEnd)
    return () => {
      map.off('dragstart', onUserMoveStart)
      map.off('zoomstart', onUserMoveStart)
      map.off('moveend', onMoveEnd)
    }
  }, [mapRef])

  // Warm the OSRM cache for the road route to whatever's currently centered
  // — OrderScreen's own useGetRouteQuery re-subscribes to the same {from,to}
  // args right after CONFIRM_DESTINATION and hits this cache entry instead
  // of starting the fetch from scratch, so selectingClass doesn't flash a
  // straight-line fallback while a fresh OSRM request is in flight.
  useGetRouteQuery(pickup && candidateDestination ? { from: pickup, to: candidateDestination } : skipToken)

  const { data: pickupAddress } = useReverseGeocodeQuery(pickup ?? skipToken)

  // Reflect the map-dragged point as the destination address, but never fight
  // an in-progress search — only when the input isn't focused.
  const { data: draggedAddress } = useReverseGeocodeQuery(draggedCenter ?? skipToken)
  useEffect(() => {
    if (draggedAddress && !isInputFocusedRef.current) setQuery(draggedAddress)
  }, [draggedAddress])

  const { data: searchResults, isFetching: isSearching } = useSearchPlacesQuery(
    debouncedQuery.trim().length >= 2 ? { query: debouncedQuery.trim(), proximity: pickup ?? undefined } : skipToken,
  )
  const { data: recentPlaces } = useGetRecentPlacesQuery()

  const showSearch = debouncedQuery.trim().length >= 2
  const rows: { id: string; name: string; subtitle: string; coords: LatLng; icon: 'recent' | 'place' }[] = showSearch
    ? (searchResults ?? []).map((place: Place) => ({
        id: place.id,
        name: place.name,
        subtitle: place.address,
        coords: place.coords,
        icon: 'place',
      }))
    : (recentPlaces ?? []).map((place: RecentPlace) => ({
        id: place.id,
        name: place.name,
        subtitle: place.subtitle,
        coords: place.coords,
        icon: 'recent',
      }))

  const handlePickRow = (row: (typeof rows)[number]) => {
    setQuery(row.name)
    mapRef.current?.jumpTo({ center: [row.coords.lng, row.coords.lat], zoom: 15 })
    setSnap('peek')
  }

  const handleConfirm = () => {
    const map = mapRef.current
    if (!map) return
    const center = map.getCenter()
    actorRef.send({ type: 'SET_DESTINATION', coords: { lat: center.lat, lng: center.lng } })
    actorRef.send({ type: 'CONFIRM_DESTINATION' })
  }

  return (
    <>
      <motion.div
        ref={containerRef}
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: retreatedY }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        className="absolute inset-x-0 bottom-0 z-20 flex h-[70vh] flex-col rounded-t-2xl border-t border-border bg-background shadow-lg"
        data-slot="destination-sheet"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted" />

        <div className="shrink-0 px-4 pt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Точка подачи · {pickupAddress || '…'}
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                isInputFocusedRef.current = true
                setSnap('expanded')
              }}
              onBlur={() => {
                isInputFocusedRef.current = false
              }}
              placeholder="Куда едем?"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              data-slot="destination-input"
            />
          </div>
          {isSearching && showSearch && <p className="mt-2 text-xs text-muted-foreground">Ищем…</p>}
          {showSearch && !isSearching && rows.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Ничего не найдено</p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 pb-20">
          {!showSearch && rows.length > 0 && (
            <p className="mb-1 px-1 text-xs text-muted-foreground">Недавние адреса</p>
          )}
          <div className="flex flex-col">
            {rows.map((row) => (
              <PlaceRow
                key={row.id}
                name={row.name}
                subtitle={row.subtitle}
                icon={row.icon}
                onClick={() => handlePickRow(row)}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Own layer, independent of the sheet's peek/expanded/retreated translateY —
          `peek` only reveals the sheet's top ~38%, which would otherwise carry the
          confirm button (the sheet's last child) off-screen below the fold. */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 border-t border-border bg-background p-4"
        data-slot="destination-confirm-footer"
      >
        <Button className="w-full" onClick={handleConfirm}>
          Подтвердить точку назначения
        </Button>
      </div>
    </>
  )
}

export { DestinationSheet }
