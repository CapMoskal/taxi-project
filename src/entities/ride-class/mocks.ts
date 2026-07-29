import { delay, http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import { haversineDistanceMeters } from '@/shared/geo/distance'
import type { RideClass, RideClassQuote } from './types'

const RIDE_CLASSES: RideClass[] = [
  { id: 'economy', label: 'Эконом', description: 'Доступно и быстро', baseFare: 99, perKm: 15 },
  { id: 'comfort', label: 'Комфорт', description: 'Просторный салон', baseFare: 149, perKm: 22 },
  { id: 'business', label: 'Бизнес', description: 'Премиальные авто', baseFare: 299, perKm: 35 },
]

export const rideClassHandlers: HttpHandler[] = [
  http.get('/api/ride-classes', async ({ request }) => {
    await delay(500)

    const url = new URL(request.url)
    const pickup = {
      lat: Number(url.searchParams.get('pickupLat')),
      lng: Number(url.searchParams.get('pickupLng')),
    }
    const destLat = url.searchParams.get('destLat')
    const destLng = url.searchParams.get('destLng')
    // No destination yet (desktop shows classes as soon as pickup resolves,
    // "от X ₽" — see entities/ride-class/api.ts) → base fare only, no
    // distance component (not haversine against a missing/zero destination).
    const distanceKm =
      destLat !== null && destLng !== null
        ? haversineDistanceMeters(pickup, { lat: Number(destLat), lng: Number(destLng) }) / 1000
        : 0

    const quotes: RideClassQuote[] = RIDE_CLASSES.map((rideClass) => ({
      classId: rideClass.id,
      label: rideClass.label,
      price: Math.round(rideClass.baseFare + rideClass.perKm * distanceKm),
      currency: 'RUB',
    }))

    return HttpResponse.json(quotes)
  }),
]
