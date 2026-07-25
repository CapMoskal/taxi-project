export type PaymentMethodBrand = 'mir' | 'visa' | 'mastercard'

export interface PaymentMethod {
  id: string
  type: 'card' | 'cash'
  brand?: PaymentMethodBrand
  last4?: string
  isDefault: boolean
}

export interface AddCardRequest {
  number: string
  expiry: string
  cvc: string
}
