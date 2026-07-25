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

// Extracted so both the routeLine-change effect AND the style-switch effect
// (setStyle() wipes custom sources/layers, see below) can re-apply it.
function applyRouteLine(map: maplibregl.Map, routeLine: LatLng[] | null | undefined) {
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
    // Re-resolved here (not cached) — by the time this runs, the theme
    // switch that triggered setStyle() has already flipped the .dark class,
    // so --foreground resolves to the correct light-on-dark/dark-on-light
    // value for whichever style we just switched to.
    paint: { 'line-color': resolveCssColor('var(--foreground)'), 'line-width': 4 },
  })
}

function MapCanvas({
  className,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  styleUrl = MAPTILER_STYLE_URL,
  markers,
  routeLine,
  showCenterPin,
  onMapLoad,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const routeLineRef = useRef(routeLine)
  const previousStyleUrlRef = useRef(styleUrl)
  routeLineRef.current = routeLine

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

    const run = () => applyRouteLine(map, routeLine)
    if (map.isStyleLoaded()) run()
    else map.once('load', run)
  }, [routeLine])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    // Skip on mount — the map was already constructed with this styleUrl.
    if (previousStyleUrlRef.current === styleUrl) return
    previousStyleUrlRef.current = styleUrl

    map.setStyle(styleUrl)
    // setStyle() wipes the route-line source/layer along with everything
    // else from the old style — re-add it once the new style has parsed.
    // DOM markers (maplibregl.Marker) aren't part of the style, so they
    // survive setStyle() untouched and need no re-attachment here.
    //
    // `isStyleLoaded()` is NOT trustworthy synchronously right after our own
    // `setStyle()` call — it can still reflect the outgoing style's "loaded"
    // state for a moment before the swap actually starts, so checking it
    // immediately (like the routeLine effect below does for the *initial*
    // style load) races the real swap: we'd add the layer to the
    // about-to-be-replaced style, which then gets wiped seconds later with
    // no listener left to reapply it (found via manual testing — the layer
    // would appear for one frame, then vanish). Instead: `styledata` fires
    // repeatedly during a style transition, and only some firings have
    // `isStyleLoaded()` true for the *new* style — poll on every firing
    // until it is, then detach.
    const tryApply = () => {
      if (!map.isStyleLoaded()) return
      map.off('styledata', tryApply)
      applyRouteLine(map, routeLineRef.current)
    }
    map.on('styledata', tryApply)
  }, [styleUrl])

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
