export interface RideHistoryFare {
  amount: number
  currency: string
}

export interface RideHistoryEntry {
  id: string
  date: string
  from: string
  to: string
  className: string
  fare: RideHistoryFare
  driverName: string
  rating: number
}
