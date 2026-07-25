import { delay, http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { AddCardRequest, PaymentMethod, PaymentMethodBrand } from './types'

// In-memory, module-scoped — mutated by the addCard handler below so the
// list survives across requests within one page session (resets on reload,
// same as every other MSW entity in this project).
const paymentMethods: PaymentMethod[] = [
  { id: 'pm-1', type: 'card', brand: 'mir', last4: '0542', isDefault: true },
  { id: 'pm-2', type: 'cash', isDefault: false },
]

function detectBrand(cardNumber: string): PaymentMethodBrand {
  const firstDigit = cardNumber.trim().charAt(0)
  if (firstDigit === '4') return 'visa'
  if (firstDigit === '5' || firstDigit === '2') return 'mastercard'
  return 'mir'
}

export const paymentMethodHandlers: HttpHandler[] = [
  http.get('/api/payment-methods', async () => {
    await delay(300)
    return HttpResponse.json(paymentMethods)
  }),

  http.post('/api/payment-methods', async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as AddCardRequest
    const digitsOnly = body.number.replace(/\s+/g, '')
    const newCard: PaymentMethod = {
      id: `pm-${paymentMethods.length + 1}`,
      type: 'card',
      brand: detectBrand(digitsOnly),
      last4: digitsOnly.slice(-4),
      isDefault: false,
    }
    paymentMethods.push(newCard)
    return HttpResponse.json(newCard, { status: 201 })
  }),
]
