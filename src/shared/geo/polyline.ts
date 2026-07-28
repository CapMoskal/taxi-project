import { haversineDistanceMeters } from './distance'
import type { LatLng } from './types'

function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

// Single source of truth for "where is `progress` along this polyline" —
// both positionAlongPolyline and remainingPolyline are built on this, so a
// marker positioned via one and a line trimmed via the other always meet
// exactly (no seam), see docs/decisions.md.
function locate(polyline: LatLng[], progress: number): { point: LatLng; index: number } {
  const segmentLengths = polyline.slice(1).map((point, i) => haversineDistanceMeters(polyline[i], point))
  const totalLength = segmentLengths.reduce((sum, len) => sum + len, 0)
  if (totalLength === 0) return { point: polyline[0], index: 0 }

  const targetDistance = progress * totalLength
  let accumulated = 0
  for (let i = 0; i < segmentLengths.length; i++) {
    const segmentLength = segmentLengths[i]
    const isLastSegment = i === segmentLengths.length - 1
    if (accumulated + segmentLength >= targetDistance || isLastSegment) {
      const segmentT = segmentLength === 0 ? 0 : (targetDistance - accumulated) / segmentLength
      return { point: interpolate(polyline[i], polyline[i + 1], Math.min(1, segmentT)), index: i }
    }
    accumulated += segmentLength
  }
  return { point: polyline[polyline.length - 1], index: polyline.length - 1 }
}

export function positionAlongPolyline(polyline: LatLng[], progress: number): LatLng {
  return locate(polyline, progress).point
}

// The road ahead of `progress` — starts exactly at the interpolated marker
// position (see `locate` above), so a route line drawn from this array
// always meets the marker with no gap or overlap.
export function remainingPolyline(polyline: LatLng[], progress: number): LatLng[] {
  if (polyline.length < 2) return polyline
  const { point, index } = locate(polyline, progress)
  return [point, ...polyline.slice(index + 1)]
}
