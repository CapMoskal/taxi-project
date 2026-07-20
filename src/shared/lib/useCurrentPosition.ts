import { useEffect, useState } from 'react'
import type { LatLng } from '@/shared/geo/types'

export type PositionStatus = 'pending' | 'success' | 'error'

export interface CurrentPosition {
  status: PositionStatus
  coords: LatLng | null
}

const GEO_OPTIONS: PositionOptions = { timeout: 8000, maximumAge: 60000 }

/**
 * Requests the browser geolocation once on mount. Resolves to a real position
 * (`success`) or `error` (denied / unavailable / timeout / no secure context).
 * Geolocation requires a secure context — works on https and localhost.
 */
export function useCurrentPosition(): CurrentPosition {
  const [state, setState] = useState<CurrentPosition>({ status: 'pending', coords: null })

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'error', coords: null })
      return
    }

    let active = true
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!active) return
        setState({ status: 'success', coords: { lat: position.coords.latitude, lng: position.coords.longitude } })
      },
      () => {
        if (!active) return
        setState({ status: 'error', coords: null })
      },
      GEO_OPTIONS,
    )

    return () => {
      active = false
    }
  }, [])

  return state
}
