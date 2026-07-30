import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { useReverseGeocodeQuery, useSearchPlacesQuery } from '@/shared/map/geocodingApi'
import type { Place } from '@/shared/map/geocodingApi'
import { useGetRouteQuery } from '@/shared/map/routingApi'
import { useGetRecentPlacesQuery } from '@/entities/recent-place/api'
import type { RecentPlace } from '@/entities/recent-place/types'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import type { LatLng } from '@/shared/geo/types'

export interface DestinationRow {
  id: string
  name: string
  subtitle: string
  coords: LatLng
  icon: 'recent' | 'place'
}

interface UseDestinationSyncOptions {
  // Fired when a user-driven map move (drag/zoom, not our own jumpTo) begins
  // — mobile's DestinationSheet uses this to trigger its retreat animation;
  // desktop's OrderComposePanel has no retreat state, so it just omits it.
  onUserMoveStart?: () => void
  // Fired once a user-driven move settles, with the new center — mobile
  // restores its sheet snap; desktop sends SET_DESTINATION immediately
  // (the compose panel has no separate confirm-destination step).
  onUserSettle?: (coords: LatLng) => void
  // Fired right after a search/recent row is picked and the map jumpTo is
  // issued — desktop sends SET_DESTINATION here for the same reason as
  // onUserSettle; mobile omits it and waits for its own confirm button.
  onPick?: (coords: LatLng) => void
}

// Address-sync data logic shared by DestinationSheet (mobile) and
// OrderComposePanel (desktop): search, map-drag reverse-geocode, OSRM
// prefetch for the currently-centered point. The sliding-sheet visual
// physics (snap/drag/retreat) are mobile-only and stay in DestinationSheet —
// this hook owns only data, not chrome.
export function useDestinationSync(
  mapRef: RefObject<maplibregl.Map | null>,
  pickup: LatLng | null,
  options: UseDestinationSyncOptions = {},
) {
  // Latest-ref pattern: keeps the map-listener effect subscribed once per
  // mapRef instead of re-subscribing every render (these callbacks are
  // inline arrow functions at the call sites), while still calling the
  // current closure rather than a stale one.
  const onUserMoveStartRef = useRef(options.onUserMoveStart)
  onUserMoveStartRef.current = options.onUserMoveStart
  const onUserSettleRef = useRef(options.onUserSettle)
  onUserSettleRef.current = options.onUserSettle
  const onPickRef = useRef(options.onPick)
  onPickRef.current = options.onPick

  const [query, setQuery] = useState('')
  const isInputFocusedRef = useRef(false)
  const debouncedQuery = useDebouncedValue(query, 300)
  const [draggedCenter, setDraggedCenter] = useState<LatLng | null>(null)
  // Whatever handleConfirm/onPick would read right now (map.getCenter()) —
  // kept in sync on every settle, not just drag-retreat cycles, so the road
  // route to it can be prefetched below and be warm in cache by the time the
  // user actually confirms (OrderScreen's own useGetRouteQuery re-subscribes
  // to the same {from,to} args and hits the cache instead of refetching).
  const [candidateDestination, setCandidateDestination] = useState<LatLng | null>(null)
  // Tracks "was the current map move user-driven (drag/zoom), not our own
  // jumpTo" — independent of any sheet-snap visual state, so the same
  // signal gates address-sync on both breakpoints.
  const isUserDrivenMoveRef = useRef(false)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const handleUserMoveStart = (e: { originalEvent?: unknown }) => {
      if (!e.originalEvent) return
      isUserDrivenMoveRef.current = true
      onUserMoveStartRef.current?.()
    }
    // No `originalEvent` gate here: after a fast drag, MapLibre's inertia
    // deceleration fires the settling `moveend` programmatically (no
    // originalEvent) — gating on it would strand mobile's retreat state
    // forever on any flick-style swipe. `isUserDrivenMoveRef` alone is
    // enough to ignore moveend from our own programmatic jumpTo.
    const handleMoveEnd = () => {
      const center = map.getCenter()
      const coords = { lat: center.lat, lng: center.lng }
      setCandidateDestination(coords)
      if (!isUserDrivenMoveRef.current) return
      isUserDrivenMoveRef.current = false
      setDraggedCenter(coords)
      onUserSettleRef.current?.(coords)
    }
    // Seed the initial candidate immediately — the map may already be
    // sitting on a valid destination before any drag/jumpTo ever fires.
    const initialCenter = map.getCenter()
    setCandidateDestination({ lat: initialCenter.lat, lng: initialCenter.lng })
    map.on('dragstart', handleUserMoveStart)
    map.on('zoomstart', handleUserMoveStart)
    map.on('moveend', handleMoveEnd)

    // iOS Safari-only bug (Eugene, real iPhone — reproduced neither in
    // Chromium/mouse, Chromium/synthetic-touch, nor Chrome DevTools mobile
    // emulation, which all fire MapLibre's `dragstart` correctly on the
    // very first pan): on real iOS the map visibly pans under the finger,
    // but `dragstart` above never fires (or never carries `originalEvent`)
    // for that first drag — confirmed by Eugene directly ("карта
    // двигается, панель нет"). A prior fix attempt (a no-op `jumpTo` on
    // mount, meant to "warm up" MapLibre's gesture classifier) did NOT fix
    // it on-device — so rather than keep guessing why MapLibre's own
    // dragstart is unreliable there, this bypasses it: listen to raw
    // Pointer Events directly on the map canvas, which unlike `dragstart`
    // are a browser-native signal independent of MapLibre's internal
    // gesture recognizer, and are well-supported on iOS Safari.
    const canvas = map.getCanvas()
    let pointerDown = false
    let startX = 0
    let startY = 0
    // A few px of slop so a plain tap (no movement) doesn't retreat the
    // sheet — only an actual drag should.
    const DRAG_THRESHOLD_PX = 6
    const handlePointerDown = (e: PointerEvent) => {
      pointerDown = true
      startX = e.clientX
      startY = e.clientY
    }
    const handlePointerMove = (e: PointerEvent) => {
      if (!pointerDown || isUserDrivenMoveRef.current) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      // Same flag `handleUserMoveStart` sets — `handleMoveEnd` above relies
      // on it to treat the eventual `moveend` as user-driven and restore
      // the sheet, regardless of whether MapLibre's own `dragstart` ever
      // fires for this gesture. moveend is the camera's own "view finished
      // changing" signal (fires whenever the camera position actually
      // moves, which we know it does here — the map visibly pans), so it's
      // trustworthy even when dragstart classification is flaky.
      isUserDrivenMoveRef.current = true
      onUserMoveStartRef.current?.()
    }
    const handlePointerUp = () => {
      pointerDown = false
    }
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerUp)

    return () => {
      map.off('dragstart', handleUserMoveStart)
      map.off('zoomstart', handleUserMoveStart)
      map.off('moveend', handleMoveEnd)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [mapRef])

  useGetRouteQuery(pickup && candidateDestination ? { from: pickup, to: candidateDestination } : skipToken)

  const { data: pickupAddress } = useReverseGeocodeQuery(pickup ?? skipToken)

  // Reflect the map-dragged point as the destination address, but never
  // fight an in-progress search — only when the input isn't focused.
  const { data: draggedAddress } = useReverseGeocodeQuery(draggedCenter ?? skipToken)
  useEffect(() => {
    if (draggedAddress && !isInputFocusedRef.current) setQuery(draggedAddress)
  }, [draggedAddress])

  const { data: searchResults, isFetching: isSearching } = useSearchPlacesQuery(
    debouncedQuery.trim().length >= 2 ? { query: debouncedQuery.trim(), proximity: pickup ?? undefined } : skipToken,
  )
  const { data: recentPlaces } = useGetRecentPlacesQuery()

  const showSearch = debouncedQuery.trim().length >= 2
  const rows: DestinationRow[] = showSearch
    ? (searchResults ?? []).map((place: Place) => ({
        id: place.id,
        name: place.name,
        subtitle: place.address,
        coords: place.coords,
        icon: 'place' as const,
      }))
    : (recentPlaces ?? []).map((place: RecentPlace) => ({
        id: place.id,
        name: place.name,
        subtitle: place.subtitle,
        coords: place.coords,
        icon: 'recent' as const,
      }))

  const handlePickRow = (row: DestinationRow) => {
    setQuery(row.name)
    mapRef.current?.jumpTo({ center: [row.coords.lng, row.coords.lat], zoom: 15 })
    onPickRef.current?.(row.coords)
  }

  return {
    query,
    setQuery,
    isInputFocusedRef,
    rows,
    isSearching,
    showSearch,
    handlePickRow,
    candidateDestination,
    pickupAddress,
  }
}
