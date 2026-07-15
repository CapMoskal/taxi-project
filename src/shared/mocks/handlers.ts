import type { HttpHandler } from 'msw'
import { rideClassHandlers } from '@/entities/ride-class/mocks'
import { driverHandlers } from '@/entities/driver/mocks'

export const handlers: HttpHandler[] = [...rideClassHandlers, ...driverHandlers]
