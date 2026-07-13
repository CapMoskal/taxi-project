import { MapCanvas } from '@/shared/map/MapCanvas'
import { OrderFlowProvider } from '@/features/order-flow/context'
import { OrderFlowDebugPanel } from '@/features/order-flow/OrderFlowDebugPanel'

function OrderScreen() {
  return (
    <OrderFlowProvider>
      <div className="relative h-dvh w-full overflow-hidden">
        <MapCanvas className="absolute inset-0" />
        <OrderFlowDebugPanel className="absolute inset-x-0 bottom-0" />
      </div>
    </OrderFlowProvider>
  )
}

export { OrderScreen }
