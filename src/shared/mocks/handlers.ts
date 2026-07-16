import type { HttpHandler } from 'msw'
import { rideClassHandlers } from '@/entities/ride-class/mocks'
import { driverHandlers } from '@/entities/driver/mocks'
import { userHandlers } from '@/entities/user/mocks'

export const handlers: HttpHandler[] = [...rideClassHandlers, ...driverHandlers, ...userHandlers]
