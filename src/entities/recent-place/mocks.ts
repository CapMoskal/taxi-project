import { delay, http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { RecentPlace } from './types'

const RECENT_PLACES: RecentPlace[] = [
  { id: 'recent-1', name: 'ул. Тверская, 12', subtitle: 'Тверской район', coords: { lat: 55.7658, lng: 37.6047 } },
  {
    id: 'recent-2',
    name: 'Аэропорт Шереметьево',
    subtitle: 'Терминал B',
    coords: { lat: 55.9726, lng: 37.4146 },
  },
  { id: 'recent-3', name: 'Парк Горького', subtitle: 'Главный вход', coords: { lat: 55.7298, lng: 37.6019 } },
  {
    id: 'recent-4',
    name: 'Москва-Сити',
    subtitle: 'Башня «Федерация»',
    coords: { lat: 55.7496, lng: 37.5385 },
  },
  { id: 'recent-5', name: 'Павелецкий вокзал', subtitle: 'Павелецкая площадь, 1', coords: { lat: 55.7297, lng: 37.6392 } },
]

export const recentPlaceHandlers: HttpHandler[] = [
  http.get('/api/recent-places', async () => {
    await delay(300)
    return HttpResponse.json(RECENT_PLACES)
  }),
]
