import { delay, http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { UserProfile } from './types'

const USER_PROFILE: UserProfile = {
  id: 'user-1',
  name: 'Евгений',
  phone: '+7 999 123-45-67',
  rating: 4.95,
  paymentMethod: { type: 'card', last4: '4242' },
}

export const userHandlers: HttpHandler[] = [
  http.get('/api/user/profile', async () => {
    await delay(400)
    return HttpResponse.json(USER_PROFILE)
  }),
]
