import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { LatLng } from '@/shared/geo/types'
import { MAPTILER_KEY } from './config'

export interface Place {
  id: string
  name: string
  address: string
  coords: LatLng
}

interface MapTilerFeature {
  id: string
  text: string
  place_name: string
  center: [number, number]
}

interface MapTilerGeocodingResponse {
  features: MapTilerFeature[]
}

function toPlace(feature: MapTilerFeature): Place {
  const [lng, lat] = feature.center
  return { id: feature.id, name: feature.text, address: feature.place_name, coords: { lat, lng } }
}

export interface SearchPlacesArgs {
  query: string
  proximity?: LatLng
}

// Real external MapTiler Geocoding API (same key as the map tiles) — not our
// mocked backend, so this lives outside entities/ and MSW, like routingApi.
export const geocodingApi = createApi({
  reducerPath: 'geocodingApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.maptiler.com/geocoding' }),
  endpoints: (builder) => ({
    searchPlaces: builder.query<Place[], SearchPlacesArgs>({
      query: ({ query, proximity }) => {
        const params = new URLSearchParams({ key: MAPTILER_KEY, language: 'ru', country: 'ru', autocomplete: 'true' })
        if (proximity) params.set('proximity', `${proximity.lng},${proximity.lat}`)
        return `/${encodeURIComponent(query)}.json?${params.toString()}`
      },
      transformResponse: (response: MapTilerGeocodingResponse): Place[] => response.features.map(toPlace),
    }),
    reverseGeocode: builder.query<string, LatLng>({
      query: ({ lat, lng }) => `/${lng},${lat}.json?key=${MAPTILER_KEY}&language=ru`,
      transformResponse: (response: MapTilerGeocodingResponse): string => response.features[0]?.place_name ?? '',
    }),
  }),
})

export const { useSearchPlacesQuery, useReverseGeocodeQuery } = geocodingApi
