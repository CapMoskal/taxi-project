import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { AddCardRequest, PaymentMethod } from './types'

export const paymentMethodApi = createApi({
  reducerPath: 'paymentMethodApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['PaymentMethod'],
  endpoints: (builder) => ({
    getPaymentMethods: builder.query<PaymentMethod[], void>({
      query: () => '/payment-methods',
      providesTags: ['PaymentMethod'],
    }),
    addCard: builder.mutation<PaymentMethod, AddCardRequest>({
      query: (body) => ({ url: '/payment-methods', method: 'POST', body }),
      invalidatesTags: ['PaymentMethod'],
    }),
  }),
})

export const { useGetPaymentMethodsQuery, useAddCardMutation } = paymentMethodApi
