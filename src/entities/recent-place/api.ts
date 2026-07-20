import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RecentPlace } from './types'

export const recentPlaceApi = createApi({
  reducerPath: 'recentPlaceApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getRecentPlaces: builder.query<RecentPlace[], void>({
      query: () => '/recent-places',
    }),
  }),
})

export const { useGetRecentPlacesQuery } = recentPlaceApi
