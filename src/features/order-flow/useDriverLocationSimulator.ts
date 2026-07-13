import { useEffect, useRef } from 'react'
import { EMPTY_POLYLINE, useAnimatedPosition } from '@/shared/map/useAnimatedPosition'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { EN_ROUTE_POLYLINE, IN_RIDE_POLYLINE, LEG_DURATION_MS } from './demoRoute'
import type { GeoCoords } from './types'

const SYNC_INTERVAL_MS = 500

export interface DriverLocationSimulator {
  position: GeoCoords | null
  routeBounds: GeoCoords[] | null
}

export function useDriverLocationSimulator(): DriverLocationSimulator {
  const isEnRoute = useOrderFlowSelector((state) => state.matches('enRoute'))
  const isInRide = useOrderFlowSelector((state) => state.matches('inRide'))
  const actorRef = useOrderFlowActorRef()

  const polyline = isEnRoute ? EN_ROUTE_POLYLINE : isInRide ? IN_RIDE_POLYLINE : EMPTY_POLYLINE
  const position = useAnimatedPosition(polyline, { durationMs: LEG_DURATION_MS, playing: isEnRoute || isInRide })

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
