import { useEffect, useRef } from 'react'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { AnimatePresence } from 'motion/react'
import type maplibregl from 'maplibre-gl'
import { MapCanvas } from '@/shared/map/MapCanvas'
import type { MapMarker } from '@/shared/map/MapCanvas'
import { MAPTILER_STYLE_URL, MAPTILER_STYLE_URL_DARK } from '@/shared/map/config'
import { roadOrStraight, useGetRouteQuery } from '@/shared/map/routingApi'
import { useMapCameraFollow } from '@/shared/map/useMapCameraFollow'
import type { CameraPadding } from '@/shared/map/useMapCameraFollow'
import { useIsDesktop } from '@/shared/lib/useIsDesktop'
import { useTheme } from '@/app/themeContext'
import { useOrderFlowSelector } from '@/features/order-flow/context'
import { PickupResolver } from '@/features/order-flow/PickupResolver'
import { PickupSheet } from '@/features/order-flow/PickupSheet'
import { DestinationSheet } from '@/features/order-flow/DestinationSheet'
import { ClassPickerSheet } from '@/features/order-flow/ClassPickerSheet'
import { DriverSearchPanel } from '@/features/order-flow/DriverSearchPanel'
import { DriverCard } from '@/features/order-flow/DriverCard'
import { RideCompletionSheet } from '@/features/order-flow/RideCompletionSheet'
import { RideDoneCard } from '@/features/order-flow/RideDoneCard'
import { useRideAutomation } from '@/features/order-flow/useRideAutomation'
import { DEMO_PICKUP } from '@/features/order-flow/demoRoute'
import { ProfileButton } from './ProfileButton'

// Bottom-sheet phases (ClassPickerSheet/DriverSearchPanel) need bottom room;
// DriverCard phases need top room instead — so the framed points don't hide
// behind either overlay. Desktop has no such overlays (phase UI lives in the
// rail, not on top of the map) — a small uniform padding is enough there.
const BOTTOM_SHEET_PADDING: CameraPadding = { top: 80, bottom: 260, left: 40, right: 40 }
const DRIVER_CARD_PADDING: CameraPadding = { top: 160, bottom: 80, left: 40, right: 40 }
const DESKTOP_PADDING: CameraPadding = { top: 40, bottom: 40, left: 40, right: 40 }

function OrderScreen() {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const snapshot = useOrderFlowSelector((state) => state)
  const { position: driverPosition } = useRideAutomation()
  const { resolvedTheme } = useTheme()
  const mapStyleUrl = resolvedTheme === 'dark' ? MAPTILER_STYLE_URL_DARK : MAPTILER_STYLE_URL
  const isDesktop = useIsDesktop()

  const isPickupPhase = snapshot.matches('selectingPickup')
  const isDestinationPhase = snapshot.matches('selectingDestination')
  const isBottomSheetOverview = snapshot.matches('selectingClass') || snapshot.matches('searchingDriver')
  const isDriverCardOverview = snapshot.matches('driverAssigned') || snapshot.matches('arrived')
  const isEnRoute = snapshot.matches('enRoute')
  const isInRide = snapshot.matches('inRide')

  // The rail (aside) and the map area sit side by side via flex, not
  // overlaid — MapLibre's default `trackResize` only listens for `window`
  // resize events, so crossing the breakpoint (rail appearing/disappearing,
  // which changes the map area's width without the window itself resizing)
  // needs an explicit nudge or the canvas keeps rendering at its stale size.
  useEffect(() => {
    mapRef.current?.resize()
  }, [isDesktop])

  const markers: MapMarker[] = []
  // "You are here" (real GPS) — visible from the very first screen, as soon as it resolves.
  if ((isPickupPhase || isDestinationPhase) && snapshot.context.userLocation) {
    markers.push({ id: 'user', position: snapshot.context.userLocation, variant: 'dot' })
  }
  // Pickup A pin — hidden during selectingPickup (the center pin is the A candidate there).
  if (snapshot.context.pickup && !isPickupPhase) {
    markers.push({ id: 'pickup', position: snapshot.context.pickup, color: 'var(--foreground)' })
  }
  if (snapshot.context.destination) {
    markers.push({ id: 'destination', position: snapshot.context.destination, color: 'var(--destructive)' })
  }
  if (driverPosition) {
    markers.push({ id: 'driver', position: driverPosition, color: 'var(--primary)' })
  }

  const { pickup, destination } = snapshot.context
  // Deduped with useRideAutomation's inRide fetch (same args → one OSRM request).
  const { data: routeData } = useGetRouteQuery(pickup && destination ? { from: pickup, to: destination } : skipToken)
  const routeLine = pickup && destination ? roadOrStraight(routeData, pickup, destination) : null

  // Camera framing by phase: [taxi, next point] while driving, [A, B] while
  // picking a class / waiting for the driver — no camera control elsewhere
  // (selection/completion phases have their own jumpTo/sheets).
  let cameraBounds: typeof routeLine = null
  let mobilePadding: CameraPadding = BOTTOM_SHEET_PADDING
  if (isEnRoute && driverPosition && pickup) {
    cameraBounds = [driverPosition, pickup]
    mobilePadding = DRIVER_CARD_PADDING
  } else if (isInRide && driverPosition && destination) {
    cameraBounds = [driverPosition, destination]
    mobilePadding = DRIVER_CARD_PADDING
  } else if (isDriverCardOverview && pickup && destination) {
    cameraBounds = [pickup, destination]
    mobilePadding = DRIVER_CARD_PADDING
  } else if (isBottomSheetOverview && pickup && destination) {
    cameraBounds = [pickup, destination]
    mobilePadding = BOTTOM_SHEET_PADDING
  }
  const cameraPadding = isDesktop ? DESKTOP_PADDING : mobilePadding
  useMapCameraFollow(mapRef, { bounds: cameraBounds, enabled: cameraBounds !== null, padding: cameraPadding })

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Desktop rail — hosts exactly one phase's UI at a time, same guards as
          the mobile overlay below. `isDesktop &&` (not just the `hidden lg:flex`
          on the element) keeps this from *mounting* a second live instance of
          whichever phase component is already mounted in the mobile overlay —
          each has side effects (map listeners, actorRef.send) that must only
          run once. */}
      <aside
        className="hidden lg:flex lg:w-[380px] lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-border"
        data-slot="order-rail"
      >
        {isDesktop && (
          <>
            {isPickupPhase && <PickupSheet mapRef={mapRef} />}
            {isDestinationPhase && <DestinationSheet mapRef={mapRef} />}
            {snapshot.matches('selectingClass') && <ClassPickerSheet />}
            {snapshot.matches('searchingDriver') && <DriverSearchPanel />}
            <DriverCard />
            {snapshot.matches('completed') && <RideCompletionSheet />}
            {snapshot.matches('done') && <RideDoneCard />}
          </>
        )}
      </aside>

      <div className="relative h-full flex-1 overflow-hidden" data-slot="order-map-area">
        <MapCanvas
          className="absolute inset-0"
          center={[DEMO_PICKUP.lng, DEMO_PICKUP.lat]}
          zoom={14}
          styleUrl={mapStyleUrl}
          markers={markers}
          routeLine={routeLine}
          showCenterPin={isPickupPhase || isDestinationPhase}
          onMapLoad={(map) => {
            mapRef.current = map
            // Dev-only test hook — lets Playwright read the real camera state
            // (getCenter/getZoom) instead of inferring it from marker screen
            // positions, which are confounded by the taxi's own movement.
            if (import.meta.env.DEV) (window as unknown as { __map?: maplibregl.Map }).__map = map
          }}
        />

        {/* Headless + mobile-only-by-its-own-CSS, so these run regardless of
            which rail/overlay branch is active. */}
        {isPickupPhase && <PickupResolver mapRef={mapRef} />}
        {isPickupPhase && <ProfileButton />}

        {!isDesktop && (
          <>
            {isPickupPhase && <PickupSheet mapRef={mapRef} />}
            {isDestinationPhase && <DestinationSheet mapRef={mapRef} />}

            <AnimatePresence>
              {snapshot.matches('selectingClass') && <ClassPickerSheet key="class-picker" />}
              {snapshot.matches('searchingDriver') && <DriverSearchPanel key="driver-search" />}
              {snapshot.matches('completed') && <RideCompletionSheet key="ride-completion" />}
              {snapshot.matches('done') && <RideDoneCard key="ride-done" />}
            </AnimatePresence>

            <DriverCard />
          </>
        )}
      </div>
    </div>
  )
}

export { OrderScreen }
