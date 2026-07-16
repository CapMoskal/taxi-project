import { useRef } from 'react'
import { AnimatePresence } from 'motion/react'
import type maplibregl from 'maplibre-gl'
import { MapCanvas } from '@/shared/map/MapCanvas'
import type { MapMarker } from '@/shared/map/MapCanvas'
import { OrderFlowProvider, useOrderFlowSelector } from '@/features/order-flow/context'
import { OrderFlowDebugPanel } from '@/features/order-flow/OrderFlowDebugPanel'
import { SelectingDestinationControls } from '@/features/order-flow/SelectingDestinationControls'
import { ClassPickerSheet } from '@/features/order-flow/ClassPickerSheet'
import { DriverSearchPanel } from '@/features/order-flow/DriverSearchPanel'
import { DriverCard } from '@/features/order-flow/DriverCard'
import { RideCompletionSheet } from '@/features/order-flow/RideCompletionSheet'
import { RideDoneCard } from '@/features/order-flow/RideDoneCard'
import { useRideAutomation } from '@/features/order-flow/useRideAutomation'
import { DEMO_PICKUP } from '@/features/order-flow/demoRoute'

function OrderScreen() {
  return (
    <OrderFlowProvider>
      <OrderScreenContent />
    </OrderFlowProvider>
  )
}

function OrderScreenContent() {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const snapshot = useOrderFlowSelector((state) => state)
  const { position: driverPosition, routeBounds: driverRouteBounds } = useRideAutomation()

  const markers: MapMarker[] = []
  if (snapshot.context.pickup) {
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
        showCenterPin={snapshot.matches('selectingDestination')}
        onMapLoad={(map) => {
          mapRef.current = map
        }}
      />

      {snapshot.matches('selectingDestination') && <SelectingDestinationControls mapRef={mapRef} />}

      <AnimatePresence>
        {snapshot.matches('selectingClass') && <ClassPickerSheet key="class-picker" />}
        {snapshot.matches('searchingDriver') && <DriverSearchPanel key="driver-search" />}
        {snapshot.matches('completed') && <RideCompletionSheet key="ride-completion" />}
        {snapshot.matches('done') && <RideDoneCard key="ride-done" />}
      </AnimatePresence>

      <DriverCard />

      <OrderFlowDebugPanel className="absolute inset-x-0 bottom-0" />
    </div>
  )
}

export { OrderScreen }
