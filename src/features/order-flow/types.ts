import type { LatLng } from '@/shared/geo/types'
import type { RideClassId } from '@/entities/ride-class/types'
import type { DriverInfo } from '@/entities/driver/types'

export type { LatLng as GeoCoords } from '@/shared/geo/types'
export type { RideClassId } from '@/entities/ride-class/types'
export type { DriverInfo } from '@/entities/driver/types'

type GeoCoords = LatLng

export interface FareInfo {
  amount: number
  currency: string
}

export interface PaymentInfo {
  method: 'card' | 'cash'
  amount: number
  paidAt: string
}

export interface RatingInfo {
  stars: number
  comment?: string
}

export type OrderFlowLayout = 'mobile' | 'desktop'

export interface OrderFlowContext {
  userLocation: GeoCoords | null
  pickup: GeoCoords | null
  destination: GeoCoords | null
  selectedClassId: RideClassId | null
  driver: DriverInfo | null
  driverLocation: GeoCoords | null
  fare: FareInfo | null
  payment: PaymentInfo | null
  rating: RatingInfo | null
  layout: OrderFlowLayout
}

export type OrderFlowEvent =
  | { type: 'SET_LAYOUT'; layout: OrderFlowLayout }
  | { type: 'SET_USER_LOCATION'; coords: GeoCoords }
  | { type: 'SET_PICKUP'; coords: GeoCoords }
  | { type: 'CONFIRM_PICKUP' }
  | { type: 'SET_DESTINATION'; coords: GeoCoords }
  | { type: 'CLEAR_DESTINATION' }
  | { type: 'CONFIRM_DESTINATION' }
  | { type: 'BACK_TO_DESTINATION' }
  | { type: 'SELECT_CLASS'; classId: RideClassId }
  | { type: 'CONFIRM_CLASS'; fare: FareInfo }
  | { type: 'DRIVER_FOUND'; driver: DriverInfo }
  | { type: 'SEARCH_FAILED' }
  | { type: 'DRIVER_EN_ROUTE' }
  | { type: 'DRIVER_LOCATION_UPDATE'; coords: GeoCoords }
  | { type: 'DRIVER_ARRIVED' }
  | { type: 'START_RIDE' }
  | { type: 'RIDE_COMPLETED' }
  | { type: 'SUBMIT_PAYMENT'; payment: PaymentInfo }
  | { type: 'SUBMIT_RATING'; rating: RatingInfo }
  | { type: 'CANCEL_RIDE' }
  | { type: 'RESET' }
