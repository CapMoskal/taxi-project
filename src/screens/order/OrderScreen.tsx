import { useRef } from 'react'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { AnimatePresence } from 'motion/react'
import type maplibregl from 'maplibre-gl'
import { MapCanvas } from '@/shared/map/MapCanvas'
import type { MapMarker } from '@/shared/map/MapCanvas'
import { MAPTILER_STYLE_URL, MAPTILER_STYLE_URL_DARK } from '@/shared/map/config'
import { roadOrStraight, useGetRouteQuery } from '@/shared/map/routingApi'
import { useMapCameraFollow } from '@/shared/map/useMapCameraFollow'
import type { CameraPadding } from '@/shared/map/useMapCameraFollow'
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
// behind either overlay.
const BOTTOM_SHEET_PADDING: CameraPadding = { top: 80, bottom: 260, left: 40, right: 40 }
const DRIVER_CARD_PADDING: CameraPadding = { top: 160, bottom: 80, left: 40, right: 40 }

function OrderScreen() {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const snapshot = useOrderFlowSelector((state) => state)
  const { position: driverPosition } = useRideAutomation()
  const { resolvedTheme } = useTheme()
  const mapStyleUrl = resolvedTheme === 'dark' ? MAPTILER_STYLE_URL_DARK : MAPTILER_STYLE_URL

  const isPickupPhase = snapshot.matches('selectingPickup')
  const isDestinationPhase = snapshot.matches('selectingDestination')
  const isBottomSheetOverview = snapshot.matches('selectingClass') || snapshot.matches('searchingDriver')
  const isDriverCardOverview = snapshot.matches('driverAssigned') || snapshot.matches('arrived')
  const isEnRoute = snapshot.matches('enRoute')
  const isInRide = snapshot.matches('inRide')

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
  let cameraPadding: CameraPadding = BOTTOM_SHEET_PADDING
  if (isEnRoute && driverPosition && pickup) {
    cameraBounds = [driverPosition, pickup]
    cameraPadding = DRIVER_CARD_PADDING
  } else if (isInRide && driverPosition && destination) {
    cameraBounds = [driverPosition, destination]
    cameraPadding = DRIVER_CARD_PADDING
  } else if (isDriverCardOverview && pickup && destination) {
    cameraBounds = [pickup, destination]
    cameraPadding = DRIVER_CARD_PADDING
  } else if (isBottomSheetOverview && pickup && destination) {
    cameraBounds = [pickup, destination]
    cameraPadding = BOTTOM_SHEET_PADDING
  }
  useMapCameraFollow(mapRef, { bounds: cameraBounds, enabled: cameraBounds !== null, padding: cameraPadding })

  return (
    <div className="relative h-dvh w-full overflow-hidden">
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

      {isPickupPhase && (
        <>
          <PickupResolver mapRef={mapRef} />
          <PickupSheet mapRef={mapRef} />
          <ProfileButton />
        </>
      )}
      {isDestinationPhase && <DestinationSheet mapRef={mapRef} />}

      <AnimatePresence>
        {snapshot.matches('selectingClass') && <ClassPickerSheet key="class-picker" />}
        {snapshot.matches('searchingDriver') && <DriverSearchPanel key="driver-search" />}
        {snapshot.matches('completed') && <RideCompletionSheet key="ride-completion" />}
        {snapshot.matches('done') && <RideDoneCard key="ride-done" />}
      </AnimatePresence>

      <DriverCard />
    </div>
  )
}

export { OrderScreen }
