import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { cn } from '@/lib/utils'
import { MAPTILER_STYLE_URL } from './config'
import type { LatLng } from './types'

const DEFAULT_CENTER: [number, number] = [37.6173, 55.7558]
const DEFAULT_ZOOM = 11

interface MapCanvasProps {
  className?: string
  center?: [number, number]
  zoom?: number
  styleUrl?: string
  markerPosition?: LatLng | null
  routeBounds?: LatLng[] | null
  onMapLoad?: (map: maplibregl.Map) => void
}

function MapCanvas({
  className,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  styleUrl = MAPTILER_STYLE_URL,
  markerPosition,
  routeBounds,
  onMapLoad,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center,
      zoom,
    })
    mapRef.current = map
    onMapLoad?.(map)

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!markerPosition) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: 'var(--primary)' }).setLngLat(markerPosition).addTo(map)
    } else {
      markerRef.current.setLngLat(markerPosition)
    }
  }, [markerPosition])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !routeBounds || routeBounds.length < 2) return

    const lngs = routeBounds.map((point) => point.lng)
    const lats = routeBounds.map((point) => point.lat)
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 64, duration: 800 },
    )
  }, [routeBounds])

  return <div ref={containerRef} className={cn('h-full w-full', className)} data-slot="map-canvas" />
}

export { MapCanvas }
export type { MapCanvasProps }
