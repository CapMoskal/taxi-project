import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { SavedPlace } from './types'

export const savedPlaceApi = createApi({
  reducerPath: 'savedPlaceApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getSavedPlaces: builder.query<SavedPlace[], void>({
      query: () => '/saved-places',
    }),
  }),
})

export const { useGetSavedPlacesQuery } = savedPlaceApi
