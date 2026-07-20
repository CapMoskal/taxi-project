import { delay, http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { RideHistoryEntry } from './types'

const RIDE_HISTORY: RideHistoryEntry[] = [
  {
    id: 'ride-2026-07-18',
    date: '2026-07-18T19:42:00',
    from: 'ул. Тверская, 12',
    to: 'Аэропорт Шереметьево, терминал B',
    className: 'Бизнес',
    fare: { amount: 1890, currency: 'RUB' },
    driverName: 'Тимур',
    rating: 5,
  },
  {
    id: 'ride-2026-07-15',
    date: '2026-07-15T09:12:00',
    from: 'Ленинградский проспект, 37',
    to: 'Москва-Сити, башня «Федерация»',
    className: 'Комфорт',
    fare: { amount: 640, currency: 'RUB' },
    driverName: 'Марина',
    rating: 5,
  },
  {
    id: 'ride-2026-07-11',
    date: '2026-07-11T21:05:00',
    from: 'Красная площадь, 3',
    to: 'ул. Арбат, 24',
    className: 'Эконом',
    fare: { amount: 320, currency: 'RUB' },
    driverName: 'Алексей',
    rating: 4,
  },
  {
    id: 'ride-2026-07-04',
    date: '2026-07-04T14:30:00',
    from: 'Кутузовский проспект, 2',
    to: 'Парк Горького, главный вход',
    className: 'Комфорт',
    fare: { amount: 510, currency: 'RUB' },
    driverName: 'Игорь',
    rating: 5,
  },
  {
    id: 'ride-2026-06-28',
    date: '2026-06-28T08:20:00',
    from: 'Профсоюзная ул., 104',
    to: 'Павелецкий вокзал',
    className: 'Эконом',
    fare: { amount: 430, currency: 'RUB' },
    driverName: 'Николай',
    rating: 4,
  },
]

export const rideHistoryHandlers: HttpHandler[] = [
  http.get('/api/ride-history', async () => {
    await delay(400)
    return HttpResponse.json(RIDE_HISTORY)
  }),
]
