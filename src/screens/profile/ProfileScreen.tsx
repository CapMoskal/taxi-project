import { ChevronLeft, ChevronRight, Clock, CreditCard, Star, Wallet } from 'lucide-react'
import { useGetUserProfileQuery } from '@/entities/user/api'
import { InitialsAvatar } from '@/shared/ui/InitialsAvatar'
import { useNavigation } from '@/app/navigationContext'

function ProfileScreen() {
  const { navigate } = useNavigation()
  const { data: profile, isLoading, isError } = useGetUserProfileQuery()

  const paymentLabel = profile
    ? profile.paymentMethod.type === 'card'
      ? `•••• ${profile.paymentMethod.last4 ?? ''}`.trim()
      : 'Наличные'
    : ''

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <header className="flex items-center gap-2 border-b border-border p-4">
        <button
          type="button"
          onClick={() => navigate('order')}
          aria-label="Назад"
          className="rounded-full outline-none ring-ring focus-visible:ring-2"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-base font-medium text-foreground">Профиль</h1>
      </header>

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

            <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
              <div className="flex items-center justify-between p-3">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  Ваш рейтинг
                </span>
                <span className="text-sm font-medium text-foreground">{profile.rating.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {profile.paymentMethod.type === 'card' ? (
                    <CreditCard className="h-4 w-4 text-foreground" />
                  ) : (
                    <Wallet className="h-4 w-4 text-foreground" />
                  )}
                  Способ оплаты
                </span>
                <span className="text-sm font-medium text-foreground">{paymentLabel}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('history')}
              className="flex items-center justify-between rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-2 text-sm text-foreground">
                <Clock className="h-4 w-4 text-foreground" />
                История поездок
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export { ProfileScreen }
