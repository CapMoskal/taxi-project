import { MapCanvas } from '@/shared/map/MapCanvas'
import { OrderFlowProvider } from '@/features/order-flow/context'
import { OrderFlowDebugPanel } from '@/features/order-flow/OrderFlowDebugPanel'
import { useDriverLocationSimulator } from '@/features/order-flow/useDriverLocationSimulator'
import { DEMO_PICKUP } from '@/features/order-flow/demoRoute'

function OrderScreen() {
  return (
    <OrderFlowProvider>
      <OrderScreenContent />
    </OrderFlowProvider>
  )
}

function OrderScreenContent() {
  const { position, routeBounds } = useDriverLocationSimulator()

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <MapCanvas
        className="absolute inset-0"
        center={[DEMO_PICKUP.lng, DEMO_PICKUP.lat]}
        zoom={12}
        markerPosition={position}
        routeBounds={routeBounds}
      />
      <OrderFlowDebugPanel className="absolute inset-x-0 bottom-0" />
    </div>
  )
}

export { OrderScreen }
