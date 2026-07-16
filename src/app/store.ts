import { configureStore } from '@reduxjs/toolkit'
import { rideClassApi } from '@/entities/ride-class/api'
import { driverApi } from '@/entities/driver/api'
import { userApi } from '@/entities/user/api'

export const store = configureStore({
  reducer: {
    [rideClassApi.reducerPath]: rideClassApi.reducer,
    [driverApi.reducerPath]: driverApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(rideClassApi.middleware, driverApi.middleware, userApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
