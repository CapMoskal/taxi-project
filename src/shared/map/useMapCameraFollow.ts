import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import type { LatLng } from '@/shared/geo/types'

const CAMERA_THROTTLE_MS = 1000
const RESUME_DELAY_MS = 4000
const FIT_DURATION_MS = 900
const MAX_ZOOM = 16

export interface CameraPadding {
  top: number
  bottom: number
  left: number
  right: number
}

export interface UseMapCameraFollowOptions {
  bounds: LatLng[] | null
  enabled: boolean
  padding?: number | CameraPadding
}

/**
 * Keeps the camera fit to `bounds` — [taxi, next point] while driving, [A, B]
 * while picking a class — throttled so it re-fits ~once/sec as bounds shrink
 * (zooming in as the taxi approaches) rather than fighting the map every frame.
 * A real user gesture (dragstart/zoomstart/rotatestart with e.originalEvent)
 * suspends following; it resumes automatically after RESUME_DELAY_MS of
 * inactivity — no recenter button.
 */
export function useMapCameraFollow(
  mapRef: RefObject<maplibregl.Map | null>,
  { bounds, enabled, padding = 64 }: UseMapCameraFollowOptions,
) {
  const boundsRef = useRef(bounds)
  const enabledRef = useRef(enabled)
  const paddingRef = useRef(padding)
  boundsRef.current = bounds
  enabledRef.current = enabled
  paddingRef.current = padding

  const suppressedRef = useRef(false)
  const lastFitAtRef = useRef(0)
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable fit function — reads current values via refs so effects below
  // don't need to depend on (or duplicate) it.
  const fitRef = useRef<() => void>(() => {})
  fitRef.current = () => {
    const map = mapRef.current
    const currentBounds = boundsRef.current
    if (!map || !enabledRef.current || !currentBounds || currentBounds.length < 2) return
    const lngs = currentBounds.map((point) => point.lng)
    const lats = currentBounds.map((point) => point.lat)
    lastFitAtRef.current = performance.now()
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: paddingRef.current, duration: FIT_DURATION_MS, maxZoom: MAX_ZOOM },
    )
  }

  // User-gesture listeners: suspend following on a real drag/zoom/rotate,
  // resume (and immediately re-fit) after RESUME_DELAY_MS of inactivity.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const onUserMoveStart = (e: { originalEvent?: unknown }) => {
      if (!e.originalEvent || !enabledRef.current) return
      suppressedRef.current = true
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current)
        resumeTimeoutRef.current = null
      }
    }

    // No `originalEvent` gate here: after a drag ends, MapLibre's inertia
    // deceleration fires the settling `moveend` programmatically (no
    // originalEvent) — gating on it would mean the resume timer never
    // schedules. `suppressedRef` alone is enough to ignore our own
    // follow-fits' moveend (suppressedRef is already false by the time
    // that fires).
    const onMoveEnd = () => {
      if (!suppressedRef.current) return
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
      resumeTimeoutRef.current = setTimeout(() => {
        suppressedRef.current = false
        fitRef.current()
      }, RESUME_DELAY_MS)
    }

    map.on('dragstart', onUserMoveStart)
    map.on('zoomstart', onUserMoveStart)
    map.on('rotatestart', onUserMoveStart)
    map.on('moveend', onMoveEnd)

    return () => {
      map.off('dragstart', onUserMoveStart)
      map.off('zoomstart', onUserMoveStart)
      map.off('rotatestart', onUserMoveStart)
      map.off('moveend', onMoveEnd)
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    }
  }, [mapRef])

  // Throttled follow: re-fit as `bounds` changes (every animation frame while
  // driving), but at most once per CAMERA_THROTTLE_MS.
  useEffect(() => {
    if (!enabled || suppressedRef.current || !bounds || bounds.length < 2) return
    if (performance.now() - lastFitAtRef.current < CAMERA_THROTTLE_MS) return
    fitRef.current()
  }, [bounds, enabled])
}
