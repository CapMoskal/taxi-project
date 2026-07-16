import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { UserProfile } from './types'

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfile, void>({
      query: () => '/user/profile',
    }),
  }),
})

export const { useGetUserProfileQuery } = userApi
