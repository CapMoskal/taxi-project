import type { GeoCoords } from './types'

export const DEMO_PICKUP: GeoCoords = { lat: 55.7539, lng: 37.6208 }

export const LEG_DURATION_MS = 6000

const DRIVER_START_OFFSET = { lat: 0.012, lng: 0.008 }

export function getDriverStartPoint(pickup: GeoCoords): GeoCoords {
  return { lat: pickup.lat + DRIVER_START_OFFSET.lat, lng: pickup.lng + DRIVER_START_OFFSET.lng }
}
