import type { HttpHandler } from 'msw'
import { rideClassHandlers } from '@/entities/ride-class/mocks'

export const handlers: HttpHandler[] = [...rideClassHandlers]
