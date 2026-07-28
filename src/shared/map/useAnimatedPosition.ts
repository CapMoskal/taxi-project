import { useEffect, useRef, useState } from 'react'
import { positionAlongPolyline } from '@/shared/geo/polyline'
import type { LatLng } from '@/shared/geo/types'

export const EMPTY_POLYLINE: LatLng[] = []

export interface UseAnimatedPositionOptions {
  durationMs: number
  playing: boolean
  onComplete?: () => void
}

export interface AnimatedPosition {
  position: LatLng | null
  progress: number
}

/**
 * Interpolates a position along `polyline` over `durationMs` while `playing` is true.
 * `polyline` must be a stable reference (module-level constant) — a fresh array
 * literal on every render restarts the animation each render.
 */
export function useAnimatedPosition(
  polyline: LatLng[],
  { durationMs, playing, onComplete }: UseAnimatedPositionOptions,
): AnimatedPosition {
  const [position, setPosition] = useState<LatLng | null>(null)
  const [progress, setProgress] = useState(0)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    if (!playing || polyline.length < 2) {
      setPosition(null)
      setProgress(0)
      return
    }

    const startTime = performance.now()
    let rafId: number

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs)
      setPosition(positionAlongPolyline(polyline, t))
      setProgress(t)
      if (t < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        onCompleteRef.current?.()
      }
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [polyline, durationMs, playing])

  return { position, progress }
}
