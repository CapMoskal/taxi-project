import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RideClassId } from '@/entities/ride-class/types'
import type { DriverInfo } from './types'

export interface DriverSearchArgs {
  classId: RideClassId
}

export const driverApi = createApi({
  reducerPath: 'driverApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    searchDriver: builder.query<DriverInfo, DriverSearchArgs>({
      query: ({ classId }) => `/driver-search?classId=${classId}`,
    }),
  }),
})

export const { useSearchDriverQuery } = driverApi
