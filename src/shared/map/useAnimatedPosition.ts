import { useEffect, useRef, useState } from 'react'
import { haversineDistanceMeters } from '@/shared/geo/distance'
import type { LatLng } from '@/shared/geo/types'

export const EMPTY_POLYLINE: LatLng[] = []

export interface UseAnimatedPositionOptions {
  durationMs: number
  playing: boolean
  onComplete?: () => void
}

function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

function positionAlongPolyline(polyline: LatLng[], progress: number): LatLng {
  const segmentLengths = polyline.slice(1).map((point, i) => haversineDistanceMeters(polyline[i], point))
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
export function useAnimatedPosition(
  polyline: LatLng[],
  { durationMs, playing, onComplete }: UseAnimatedPositionOptions,
): LatLng | null {
  const [position, setPosition] = useState<LatLng | null>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  })

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
      } else {
        onCompleteRef.current?.()
      }
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [polyline, durationMs, playing])

  return position
}
