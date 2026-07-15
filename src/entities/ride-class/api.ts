import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { LatLng } from '@/shared/geo/types'
import type { RideClassQuote } from './types'

export interface RideClassQuotesArgs {
  pickup: LatLng
  destination: LatLng
}

export const rideClassApi = createApi({
  reducerPath: 'rideClassApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getRideClassQuotes: builder.query<RideClassQuote[], RideClassQuotesArgs>({
      query: ({ pickup, destination }) =>
        `/ride-classes?pickupLat=${pickup.lat}&pickupLng=${pickup.lng}&destLat=${destination.lat}&destLng=${destination.lng}`,
    }),
  }),
})

export const { useGetRideClassQuotesQuery } = rideClassApi
