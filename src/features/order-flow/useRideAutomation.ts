import { useEffect, useMemo, useRef } from 'react'
import { EMPTY_POLYLINE, useAnimatedPosition } from '@/shared/map/useAnimatedPosition'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { getDriverStartPoint, LEG_DURATION_MS } from './demoRoute'
import type { GeoCoords } from './types'

const SYNC_INTERVAL_MS = 500
const DRIVER_ASSIGNED_DELAY_MS = 2000

export interface RideAutomation {
  position: GeoCoords | null
  routeBounds: GeoCoords[] | null
}

export function useRideAutomation(): RideAutomation {
  const isDriverAssigned = useOrderFlowSelector((state) => state.matches('driverAssigned'))
  const isEnRoute = useOrderFlowSelector((state) => state.matches('enRoute'))
  const isInRide = useOrderFlowSelector((state) => state.matches('inRide'))
  const pickup = useOrderFlowSelector((state) => state.context.pickup)
  const destination = useOrderFlowSelector((state) => state.context.destination)
  const actorRef = useOrderFlowActorRef()

  useEffect(() => {
    if (!isDriverAssigned) return
    const timeoutId = setTimeout(() => actorRef.send({ type: 'DRIVER_EN_ROUTE' }), DRIVER_ASSIGNED_DELAY_MS)
    return () => clearTimeout(timeoutId)
  }, [isDriverAssigned, actorRef])

  const enRoutePolyline = useMemo(
    () => (pickup ? [getDriverStartPoint(pickup), pickup] : EMPTY_POLYLINE),
    [pickup],
  )
  const inRidePolyline = useMemo(
    () => (pickup && destination ? [pickup, destination] : EMPTY_POLYLINE),
    [pickup, destination],
  )

  const polyline = isEnRoute ? enRoutePolyline : isInRide ? inRidePolyline : EMPTY_POLYLINE

  const handleLegComplete = () => {
    if (isEnRoute) actorRef.send({ type: 'DRIVER_ARRIVED' })
    else if (isInRide) actorRef.send({ type: 'RIDE_COMPLETED' })
  }

  const position = useAnimatedPosition(polyline, {
    durationMs: LEG_DURATION_MS,
    playing: isEnRoute || isInRide,
    onComplete: handleLegComplete,
  })

  const lastSyncRef = useRef(0)

  useEffect(() => {
    if (!position) return
    const now = performance.now()
    if (now - lastSyncRef.current < SYNC_INTERVAL_MS) return
    lastSyncRef.current = now
    actorRef.send({ type: 'DRIVER_LOCATION_UPDATE', coords: position })
  }, [position, actorRef])

  return { position, routeBounds: polyline.length >= 2 ? polyline : null }
}
