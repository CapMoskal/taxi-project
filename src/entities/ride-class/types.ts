export type RideClassId = 'economy' | 'comfort' | 'business'

export interface RideClass {
  id: RideClassId
  label: string
  description: string
  baseFare: number
  perKm: number
}

export interface RideClassQuote {
  classId: RideClassId
  label: string
  price: number
  currency: string
}
