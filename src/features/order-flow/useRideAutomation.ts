import { useEffect, useMemo, useRef } from 'react'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { EMPTY_POLYLINE, useAnimatedPosition } from '@/shared/map/useAnimatedPosition'
import { roadOrStraight, useGetRouteQuery } from '@/shared/map/routingApi'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { getDriverStartPoint, LEG_DURATION_MS } from './demoRoute'
import type { GeoCoords } from './types'

const SYNC_INTERVAL_MS = 500
const DRIVER_ASSIGNED_DELAY_MS = 2000

export interface RideAutomation {
  position: GeoCoords | null
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

  const driverStart = useMemo(() => (pickup ? getDriverStartPoint(pickup) : null), [pickup])

  // Fetch both legs' road geometry as soon as A+B are known (selectingClass) —
  // well before either leg animates — so the cached route is ready and the
  // animation never swaps polyline mid-leg (which would restart it). Falls back
  // to a straight line while pending or if OSRM is unreachable.
  const { data: enRouteRoute } = useGetRouteQuery(
    driverStart && pickup && destination ? { from: driverStart, to: pickup } : skipToken,
  )
  const { data: inRideRoute } = useGetRouteQuery(
    pickup && destination ? { from: pickup, to: destination } : skipToken,
  )

  const enRoutePolyline = useMemo(
    () => (driverStart && pickup ? roadOrStraight(enRouteRoute, driverStart, pickup) : EMPTY_POLYLINE),
    [enRouteRoute, driverStart, pickup],
  )
  const inRidePolyline = useMemo(
    () => (pickup && destination ? roadOrStraight(inRideRoute, pickup, destination) : EMPTY_POLYLINE),
    [inRideRoute, pickup, destination],
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

  return { position }
}
