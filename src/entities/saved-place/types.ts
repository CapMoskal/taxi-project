import type { LatLng } from '@/shared/geo/types'

export type SavedPlaceLabel = 'home' | 'work' | 'other'

export interface SavedPlace {
  id: string
  label: SavedPlaceLabel
  name: string
  subtitle: string
  coords: LatLng
}
