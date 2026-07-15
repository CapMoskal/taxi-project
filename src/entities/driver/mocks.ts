import { delay, http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { DriverInfo } from './types'

const DRIVER_POOL: DriverInfo[] = [
  { id: 'driver-1', name: 'Алексей', carModel: 'Kia Rio', plate: 'А123БВ777', rating: 4.9 },
  { id: 'driver-2', name: 'Марина', carModel: 'Hyundai Solaris', plate: 'В456ГД777', rating: 4.8 },
  { id: 'driver-3', name: 'Тимур', carModel: 'Skoda Rapid', plate: 'Е789ЖЗ777', rating: 4.7 },
]

const SEARCH_FAILURE_RATE = 0.2

export const driverHandlers: HttpHandler[] = [
  http.get('/api/driver-search', async () => {
    await delay(1500 + Math.random() * 1000)

    if (Math.random() < SEARCH_FAILURE_RATE) {
      return HttpResponse.json({ message: 'Поблизости нет свободных водителей' }, { status: 404 })
    }

    const driver = DRIVER_POOL[Math.floor(Math.random() * DRIVER_POOL.length)]
    return HttpResponse.json(driver)
  }),
]
