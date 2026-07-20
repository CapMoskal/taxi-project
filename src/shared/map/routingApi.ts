import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { LatLng } from '@/shared/geo/types'

export interface RouteArgs {
  from: LatLng
  to: LatLng
}

// OSRM public demo server — a real external service (like MapTiler tiles),
// not our mocked backend. MSW is on `onUnhandledRequest: 'bypass'`, so this
// different-origin call passes straight through in dev; in prod there's no MSW.
// RTK Query (not a raw fetch) buys us cache-by-args + request dedup between the
// map route line and the driver animation, and keeps fetch out of components.
interface OsrmRouteResponse {
  code: string
  routes?: { geometry: { coordinates: [number, number][] } }[]
}

export const routingApi = createApi({
  reducerPath: 'routingApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://router.project-osrm.org' }),
  endpoints: (builder) => ({
    getRoute: builder.query<LatLng[], RouteArgs>({
      query: ({ from, to }) =>
        `/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`,
      transformResponse: (response: OsrmRouteResponse): LatLng[] => {
        if (response.code !== 'Ok' || !response.routes?.length) return []
        return response.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
      },
    }),
  }),
})

export const { useGetRouteQuery } = routingApi

/**
 * Road geometry when it's available, straight A→B fallback otherwise (route
 * still pending, OSRM unreachable, or rate-limited) — the demo must never break.
 */
export function roadOrStraight(data: LatLng[] | undefined, from: LatLng, to: LatLng): LatLng[] {
  return data && data.length >= 2 ? data : [from, to]
}
