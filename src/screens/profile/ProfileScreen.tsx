import { Clock, CreditCard, Headphones, Info, MapPin, Settings, Star, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useGetUserProfileQuery } from '@/entities/user/api'
import { useGetPaymentMethodsQuery } from '@/entities/payment-method/api'
import { InitialsAvatar } from '@/shared/ui/InitialsAvatar'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'
import { ListRow } from '@/shared/ui/ListRow'
import { useNavigation, type Screen } from '@/app/navigationContext'

const QUICK_LINKS: { icon: LucideIcon; label: string; screen: Screen }[] = [
  { icon: Clock, label: 'Заказы', screen: 'history' },
  { icon: Headphones, label: 'Поддержка', screen: 'support' },
  { icon: MapPin, label: 'Адреса', screen: 'addresses' },
  { icon: Settings, label: 'Настройки', screen: 'settings' },
]

function ProfileScreen() {
  const { navigate } = useNavigation()
  const { data: profile, isLoading, isError } = useGetUserProfileQuery()
  const { data: paymentMethods } = useGetPaymentMethodsQuery()

  const defaultPaymentMethod = paymentMethods?.find((method) => method.isDefault)
  const paymentLabel = defaultPaymentMethod
    ? defaultPaymentMethod.type === 'card'
      ? `•••• ${defaultPaymentMethod.last4 ?? ''}`.trim()
      : 'Наличные'
    : ''

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <ScreenHeader title="Профиль" onBack={() => navigate('order')} />

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && <p className="text-sm text-muted-foreground">Загружаем профиль…</p>}
        {isError && <p className="text-sm text-destructive">Не удалось загрузить профиль.</p>}

        {profile && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <InitialsAvatar name={profile.name} className="h-16 w-16 text-2xl" />
              <div className="min-w-0">
                <p className="truncate text-lg font-medium text-foreground">{profile.name}</p>
                <p className="truncate text-sm text-muted-foreground">{profile.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {QUICK_LINKS.map(({ icon: Icon, label, screen }) => (
                <button
                  key={screen}
                  type="button"
                  onClick={() => navigate(screen)}
                  className="flex flex-col items-center gap-2 rounded-xl p-2 text-center outline-none ring-ring transition-colors hover:bg-muted focus-visible:ring-2"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-5 w-5 text-foreground" />
                  </span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
              <ListRow
                icon={<Star className="h-4 w-4 fill-primary text-primary" />}
                label="Ваш рейтинг"
                value={profile.rating.toFixed(2)}
              />
              <ListRow
                icon={
                  defaultPaymentMethod?.type === 'card' ? (
                    <CreditCard className="h-4 w-4 text-foreground" />
                  ) : (
                    <Wallet className="h-4 w-4 text-foreground" />
                  )
                }
                label="Способ оплаты"
                value={paymentLabel}
                onClick={() => navigate('payment-methods')}
              />
            </div>

            <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
              <ListRow
                icon={<Clock className="h-4 w-4 text-foreground" />}
                label="История поездок"
                onClick={() => navigate('history')}
              />
              <ListRow
                icon={<Info className="h-4 w-4 text-foreground" />}
                label="Информация"
                onClick={() => navigate('info')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { ProfileScreen }
