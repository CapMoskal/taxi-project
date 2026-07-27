import { useState } from 'react'
import { CreditCard, Plus, Wallet } from 'lucide-react'
import { useAddCardMutation, useGetPaymentMethodsQuery } from '@/entities/payment-method/api'
import type { PaymentMethod, PaymentMethodBrand } from '@/entities/payment-method/types'
import { ScreenShell } from '@/shared/ui/ScreenShell'
import { ListRow } from '@/shared/ui/ListRow'
import { BottomSheet } from '@/shared/ui/BottomSheet'
import { useNavigation } from '@/app/navigationContext'

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

function AddCardSheet({ onClose }: { onClose: () => void }) {
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [addCard, { isLoading }] = useAddCardMutation()

  const canSubmit = number.replace(/\s+/g, '').length >= 12 && expiry.length >= 4 && cvc.length >= 3

  async function handleSubmit() {
    if (!canSubmit) return
    await addCard({ number, expiry, cvc }).unwrap()
    onClose()
  }

  return (
    <BottomSheet>
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-medium text-foreground">Добавить карту</h2>

        <div className="flex flex-col gap-3">
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            inputMode="numeric"
            placeholder="Номер карты"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-3">
            <input
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="ММ/ГГ"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              inputMode="numeric"
              placeholder="CVC"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className="rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {isLoading ? 'Добавляем…' : 'Добавить карту'}
        </button>
      </div>
    </BottomSheet>
  )
}

function PaymentMethodsScreen() {
  const { navigate } = useNavigation()
  const { data: methods, isLoading, isError } = useGetPaymentMethodsQuery()
  const [isAddingCard, setIsAddingCard] = useState(false)

  return (
    <ScreenShell title="Способы оплаты" onBack={() => navigate('profile')}>
      {isLoading && <p className="text-sm text-muted-foreground">Загружаем…</p>}
      {isError && <p className="text-sm text-destructive">Не удалось загрузить способы оплаты.</p>}

      {methods && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {methods.map((method) => (
              <ListRow
                key={method.id}
                icon={
                  method.type === 'card' ? (
                    <CreditCard className="h-4 w-4 text-foreground" />
                  ) : (
                    <Wallet className="h-4 w-4 text-foreground" />
                  )
                }
                label={paymentMethodLabel(method)}
                value={method.isDefault ? 'Основной' : undefined}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsAddingCard(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            Добавить карту
          </button>
        </div>
      )}

      {isAddingCard && <AddCardSheet onClose={() => setIsAddingCard(false)} />}
    </ScreenShell>
  )
}

export { PaymentMethodsScreen }
