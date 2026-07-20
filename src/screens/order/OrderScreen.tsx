import { useRef } from 'react'
import { AnimatePresence } from 'motion/react'
import type maplibregl from 'maplibre-gl'
import { MapCanvas } from '@/shared/map/MapCanvas'
import type { MapMarker } from '@/shared/map/MapCanvas'
import { useOrderFlowSelector } from '@/features/order-flow/context'
import { SelectingPickupControls } from '@/features/order-flow/SelectingPickupControls'
import { SelectingDestinationControls } from '@/features/order-flow/SelectingDestinationControls'
import { ClassPickerSheet } from '@/features/order-flow/ClassPickerSheet'
import { DriverSearchPanel } from '@/features/order-flow/DriverSearchPanel'
import { DriverCard } from '@/features/order-flow/DriverCard'
import { RideCompletionSheet } from '@/features/order-flow/RideCompletionSheet'
import { RideDoneCard } from '@/features/order-flow/RideDoneCard'
import { useRideAutomation } from '@/features/order-flow/useRideAutomation'
import { DEMO_PICKUP } from '@/features/order-flow/demoRoute'
import { IdleOverlay } from './IdleOverlay'

function OrderScreen() {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const snapshot = useOrderFlowSelector((state) => state)
  const { position: driverPosition, routeBounds: driverRouteBounds } = useRideAutomation()

  const isPickupPhase = snapshot.matches('selectingPickup')
  const isDestinationPhase = snapshot.matches('selectingDestination')

  const markers: MapMarker[] = []
  // "You are here" (real GPS) — shown while choosing pickup/destination.
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

  const routeLine =
    snapshot.context.pickup && snapshot.context.destination
      ? [snapshot.context.pickup, snapshot.context.destination]
      : null

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <MapCanvas
        className="absolute inset-0"
        center={[DEMO_PICKUP.lng, DEMO_PICKUP.lat]}
        zoom={14}
        markers={markers}
        routeLine={routeLine}
        routeBounds={driverRouteBounds}
        showCenterPin={isPickupPhase || isDestinationPhase}
        onMapLoad={(map) => {
          mapRef.current = map
        }}
      />

      {isPickupPhase && <SelectingPickupControls mapRef={mapRef} />}
      {isDestinationPhase && <SelectingDestinationControls mapRef={mapRef} />}

      <AnimatePresence>
        {snapshot.matches('idle') && <IdleOverlay key="idle-overlay" />}
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
