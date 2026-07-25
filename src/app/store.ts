import { configureStore } from '@reduxjs/toolkit'
import { rideClassApi } from '@/entities/ride-class/api'
import { driverApi } from '@/entities/driver/api'
import { userApi } from '@/entities/user/api'
import { rideHistoryApi } from '@/entities/ride-history/api'
import { recentPlaceApi } from '@/entities/recent-place/api'
import { paymentMethodApi } from '@/entities/payment-method/api'
import { savedPlaceApi } from '@/entities/saved-place/api'
import { routingApi } from '@/shared/map/routingApi'
import { geocodingApi } from '@/shared/map/geocodingApi'

export const store = configureStore({
  reducer: {
    [rideClassApi.reducerPath]: rideClassApi.reducer,
    [driverApi.reducerPath]: driverApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [rideHistoryApi.reducerPath]: rideHistoryApi.reducer,
    [recentPlaceApi.reducerPath]: recentPlaceApi.reducer,
    [paymentMethodApi.reducerPath]: paymentMethodApi.reducer,
    [savedPlaceApi.reducerPath]: savedPlaceApi.reducer,
    [routingApi.reducerPath]: routingApi.reducer,
    [geocodingApi.reducerPath]: geocodingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      rideClassApi.middleware,
      driverApi.middleware,
      userApi.middleware,
      rideHistoryApi.middleware,
      recentPlaceApi.middleware,
      paymentMethodApi.middleware,
      savedPlaceApi.middleware,
      routingApi.middleware,
      geocodingApi.middleware,
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
