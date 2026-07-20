import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RideHistoryEntry } from './types'

export const rideHistoryApi = createApi({
  reducerPath: 'rideHistoryApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getRideHistory: builder.query<RideHistoryEntry[], void>({
      query: () => '/ride-history',
    }),
  }),
})

export const { useGetRideHistoryQuery } = rideHistoryApi
