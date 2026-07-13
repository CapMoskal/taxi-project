import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { cn } from '@/lib/utils'

const DEMO_STYLE_URL = 'https://demotiles.maplibre.org/style.json'
const DEFAULT_CENTER: [number, number] = [37.6173, 55.7558]
const DEFAULT_ZOOM = 11

interface MapCanvasProps {
  className?: string
  center?: [number, number]
  zoom?: number
  styleUrl?: string
  onMapLoad?: (map: maplibregl.Map) => void
}

function MapCanvas({
  className,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  styleUrl = DEMO_STYLE_URL,
  onMapLoad,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center,
      zoom,
    })
    onMapLoad?.(map)

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className={cn('h-full w-full', className)} data-slot="map-canvas" />
}

export { MapCanvas }
export type { MapCanvasProps }
