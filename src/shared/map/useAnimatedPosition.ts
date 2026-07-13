import { useEffect, useState } from 'react'
import type { LatLng } from './types'

export const EMPTY_POLYLINE: LatLng[] = []

export interface UseAnimatedPositionOptions {
  durationMs: number
  playing: boolean
}

const EARTH_RADIUS_M = 6371000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function haversineDistance(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

function positionAlongPolyline(polyline: LatLng[], progress: number): LatLng {
  const segmentLengths = polyline.slice(1).map((point, i) => haversineDistance(polyline[i], point))
  const totalLength = segmentLengths.reduce((sum, len) => sum + len, 0)
  if (totalLength === 0) return polyline[0]

  const targetDistance = progress * totalLength
  let accumulated = 0
  for (let i = 0; i < segmentLengths.length; i++) {
    const segmentLength = segmentLengths[i]
    const isLastSegment = i === segmentLengths.length - 1
    if (accumulated + segmentLength >= targetDistance || isLastSegment) {
      const segmentT = segmentLength === 0 ? 0 : (targetDistance - accumulated) / segmentLength
      return interpolate(polyline[i], polyline[i + 1], Math.min(1, segmentT))
    }
    accumulated += segmentLength
  }
  return polyline[polyline.length - 1]
}

/**
 * Interpolates a position along `polyline` over `durationMs` while `playing` is true.
 * `polyline` must be a stable reference (module-level constant) — a fresh array
 * literal on every render restarts the animation each render.
 */
export function useAnimatedPosition(polyline: LatLng[], { durationMs, playing }: UseAnimatedPositionOptions): LatLng | null {
  const [position, setPosition] = useState<LatLng | null>(null)

  useEffect(() => {
    if (!playing || polyline.length < 2) {
      setPosition(null)
      return
    }

    const startTime = performance.now()
    let rafId: number

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs)
      setPosition(positionAlongPolyline(polyline, t))
      if (t < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [polyline, durationMs, playing])

  return position
}
