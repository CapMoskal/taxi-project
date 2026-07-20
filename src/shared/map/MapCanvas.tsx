import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAPTILER_STYLE_URL } from './config'
import type { LatLng } from '@/shared/geo/types'

const DEFAULT_CENTER: [number, number] = [37.6173, 55.7558]
const DEFAULT_ZOOM = 11
const ROUTE_LINE_SOURCE_ID = 'route-line'

export interface MapMarker {
  id: string
  position: LatLng
  color?: string
  variant?: 'pin' | 'dot'
}

function createDotElement(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'location-dot'
  return el
}

interface MapCanvasProps {
  className?: string
  center?: [number, number]
  zoom?: number
  styleUrl?: string
  markers?: MapMarker[]
  routeLine?: LatLng[] | null
  routeBounds?: LatLng[] | null
  showCenterPin?: boolean
  onMapLoad?: (map: maplibregl.Map) => void
}

/**
 * MapLibre's `paint` properties are validated/rendered by its own WebGL color
 * parser, which doesn't understand CSS custom properties or oklch() — unlike
 * maplibregl.Marker's `color`, which is set as a real SVG attribute and
 * resolved by the browser's own CSS engine. Resolve the variable via a
 * throwaway element, then quantize through a 1x1 canvas — modern browsers'
 * `getComputedStyle` now preserve oklch() as-is instead of downgrading to
 * rgb(), but canvas 2D `fillStyle` always normalizes to sRGB pixel bytes.
 */
function resolveCssColor(cssValue: string): string {
  const probe = document.createElement('div')
  probe.style.color = cssValue
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  document.body.removeChild(probe)

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return computed
  ctx.fillStyle = computed
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`
}

function toGeoJsonLine(points: LatLng[]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: points.map((point) => [point.lng, point.lat]),
    },
  }
}

function MapCanvas({
  className,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  styleUrl = MAPTILER_STYLE_URL,
  markers,
  routeLine,
  routeBounds,
  showCenterPin,
  onMapLoad,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center,
      zoom,
    })
    const markers = markersRef.current
    mapRef.current = map
    onMapLoad?.(map)

    return () => {
      for (const marker of markers.values()) marker.remove()
      markers.clear()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const nextIds = new Set((markers ?? []).map((marker) => marker.id))
    for (const [id, marker] of markersRef.current) {
      if (!nextIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    }
    for (const markerDef of markers ?? []) {
      const existing = markersRef.current.get(markerDef.id)
      if (existing) {
        existing.setLngLat(markerDef.position)
      } else {
        const options: maplibregl.MarkerOptions =
          markerDef.variant === 'dot' ? { element: createDotElement() } : { color: markerDef.color }
        const marker = new maplibregl.Marker(options).setLngLat(markerDef.position).addTo(map)
        markersRef.current.set(markerDef.id, marker)
      }
    }
  }, [markers])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const applyRouteLine = () => {
      const feature = toGeoJsonLine(routeLine && routeLine.length >= 2 ? routeLine : [])
      const source = map.getSource(ROUTE_LINE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined
      if (source) {
        source.setData(feature)
        return
      }
      map.addSource(ROUTE_LINE_SOURCE_ID, { type: 'geojson', data: feature })
      map.addLayer({
        id: ROUTE_LINE_SOURCE_ID,
        type: 'line',
        source: ROUTE_LINE_SOURCE_ID,
        paint: { 'line-color': resolveCssColor('var(--foreground)'), 'line-width': 3, 'line-dasharray': [2, 2] },
      })
    }

    if (map.isStyleLoaded()) applyRouteLine()
    else map.once('load', applyRouteLine)
  }, [routeLine])

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

  return (
    <div className={cn('relative h-full w-full', className)} data-slot="map-canvas">
      <div ref={containerRef} className="h-full w-full" />
      {showCenterPin && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <MapPin className="h-8 w-8 fill-primary text-primary" />
        </div>
      )}
    </div>
  )
}

export { MapCanvas }
export type { MapCanvasProps }
