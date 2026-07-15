import { configureStore } from '@reduxjs/toolkit'
import { rideClassApi } from '@/entities/ride-class/api'

export const store = configureStore({
  reducer: {
    [rideClassApi.reducerPath]: rideClassApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(rideClassApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
