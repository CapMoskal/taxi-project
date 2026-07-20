import type { HttpHandler } from 'msw'
import { rideClassHandlers } from '@/entities/ride-class/mocks'
import { driverHandlers } from '@/entities/driver/mocks'
import { userHandlers } from '@/entities/user/mocks'
import { rideHistoryHandlers } from '@/entities/ride-history/mocks'
import { recentPlaceHandlers } from '@/entities/recent-place/mocks'

export const handlers: HttpHandler[] = [
  ...rideClassHandlers,
  ...driverHandlers,
  ...userHandlers,
  ...rideHistoryHandlers,
  ...recentPlaceHandlers,
]
