import { useState } from 'react'
import { ChevronDown, CreditCard, Wallet } from 'lucide-react'
import { useGetPaymentMethodsQuery } from '@/entities/payment-method/api'
import type { PaymentMethod, PaymentMethodBrand } from '@/entities/payment-method/types'
import { cn } from '@/lib/utils'

const BRAND_LABEL: Record<PaymentMethodBrand, string> = {
  mir: 'Мир',
  visa: 'Visa',
  mastercard: 'Mastercard',
}

function paymentMethodLabel(method: PaymentMethod): string {
  if (method.type === 'cash') return 'Наличные'
  const brand = method.brand ? BRAND_LABEL[method.brand] : 'Карта'
  return `${brand} •••• ${method.last4 ?? ''}`.trim()
}

// Desktop compose-panel row for the ride's payment method — cosmetic choice
// only (kept in local state); the machine still records the real payment on
// `completed` via RideCompletionSheet, this just previews/lets you switch
// which method the order will default to, same as Yandex's panel.
function PaymentRow() {
  const { data: methods } = useGetPaymentMethodsQuery()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const selected = methods?.find((method) => method.id === selectedId) ?? methods?.find((method) => method.isDefault) ?? methods?.[0]

  if (!methods || !selected) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left"
        data-slot="compose-payment"
      >
        {selected.type === 'card' ? (
          <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 text-sm text-foreground">{paymentMethodLabel(selected)}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => {
                setSelectedId(method.id)
                setIsOpen(false)
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                method.id === selected.id && 'text-primary',
              )}
            >
              {method.type === 'card' ? (
                <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              {paymentMethodLabel(method)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { PaymentRow }
