export interface UserPaymentMethod {
  type: 'card' | 'cash'
  last4?: string
}

export interface UserProfile {
  id: string
  name: string
  phone: string
  rating: number
  paymentMethod: UserPaymentMethod
}
