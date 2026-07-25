import { delay, http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { SavedPlace } from './types'

const SAVED_PLACES: SavedPlace[] = [
  { id: 'saved-home', label: 'home', name: 'ул. Правды, 24', subtitle: 'Дом', coords: { lat: 55.7887, lng: 37.5825 } },
  {
    id: 'saved-work',
    label: 'work',
    name: 'Пресненская наб., 10',
    subtitle: 'Работа',
    coords: { lat: 55.7495, lng: 37.5397 },
  },
]

export const savedPlaceHandlers: HttpHandler[] = [
  http.get('/api/saved-places', async () => {
    await delay(300)
    return HttpResponse.json(SAVED_PLACES)
  }),
]
