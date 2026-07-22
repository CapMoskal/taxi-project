import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RecentPlace } from './types'

const MAX_RECENT_PLACES = 5

export const recentPlaceApi = createApi({
  reducerPath: 'recentPlaceApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getRecentPlaces: builder.query<RecentPlace[], void>({
      query: () => '/recent-places',
      // Capped here, not per-consumer — PickupSheet and DestinationSheet both
      // read this list, and an uncapped list is how the pickup sheet's height
      // ended up burying its own center pin (see docs/decisions.md).
      transformResponse: (response: RecentPlace[]) => response.slice(0, MAX_RECENT_PLACES),
    }),
  }),
})

export const { useGetRecentPlacesQuery } = recentPlaceApi
