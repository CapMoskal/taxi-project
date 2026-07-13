import type { GeoCoords } from './types'

export const DEMO_DRIVER_START: GeoCoords = { lat: 55.7658, lng: 37.6218 }
export const DEMO_PICKUP: GeoCoords = { lat: 55.7539, lng: 37.6208 }
export const DEMO_DESTINATION: GeoCoords = { lat: 55.7033, lng: 37.5306 }

export const EN_ROUTE_POLYLINE: GeoCoords[] = [DEMO_DRIVER_START, DEMO_PICKUP]
export const IN_RIDE_POLYLINE: GeoCoords[] = [DEMO_PICKUP, DEMO_DESTINATION]

export const LEG_DURATION_MS = 6000
