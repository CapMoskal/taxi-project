import type { LatLng } from '@/shared/geo/types'

export interface RecentPlace {
  id: string
  name: string
  subtitle: string
  coords: LatLng
}
