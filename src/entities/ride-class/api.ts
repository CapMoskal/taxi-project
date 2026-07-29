import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { LatLng } from '@/shared/geo/types'
import type { RideClassQuote } from './types'

export interface RideClassQuotesArgs {
  pickup: LatLng
  destination?: LatLng
}

export const rideClassApi = createApi({
  reducerPath: 'rideClassApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    // `destination` omitted (desktop shows classes as soon as pickup is
    // known, Yandex-style "от X ₽" — see OrderComposePanel.tsx) → mock
    // returns each class's base fare with no distance component.
    getRideClassQuotes: builder.query<RideClassQuote[], RideClassQuotesArgs>({
      query: ({ pickup, destination }) => {
        const params = new URLSearchParams({ pickupLat: String(pickup.lat), pickupLng: String(pickup.lng) })
        if (destination) {
          params.set('destLat', String(destination.lat))
          params.set('destLng', String(destination.lng))
        }
        return `/ride-classes?${params.toString()}`
      },
    }),
  }),
})

export const { useGetRideClassQuotesQuery } = rideClassApi
