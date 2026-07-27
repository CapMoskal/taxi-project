import { ScreenShell } from '@/shared/ui/ScreenShell'
import { ListRow } from '@/shared/ui/ListRow'
import { useNavigation } from '@/app/navigationContext'

const APP_VERSION = '1.0.0'

function InfoScreen() {
  const { navigate } = useNavigation()

  return (
    <ScreenShell title="Информация" onBack={() => navigate('profile')}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          <ListRow label="Версия приложения" value={APP_VERSION} />
          <ListRow label="Условия использования" />
          <ListRow label="Политика конфиденциальности" />
        </div>

        <p className="px-1 text-sm text-muted-foreground">
          Такси — сервис заказа поездок по городу: быстрая подача, прозрачная цена
          и водитель на связи от старта до финиша поездки.
        </p>
      </div>
    </ScreenShell>
  )
}

export { InfoScreen }
