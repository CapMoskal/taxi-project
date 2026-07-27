import { Briefcase, Home, MapPin } from 'lucide-react'
import { useGetSavedPlacesQuery } from '@/entities/saved-place/api'
import type { SavedPlaceLabel } from '@/entities/saved-place/types'
import { ScreenShell } from '@/shared/ui/ScreenShell'
import { ListRow } from '@/shared/ui/ListRow'
import { useNavigation } from '@/app/navigationContext'

const LABEL_ICON: Record<SavedPlaceLabel, typeof Home> = {
  home: Home,
  work: Briefcase,
  other: MapPin,
}

function AddressesScreen() {
  const { navigate } = useNavigation()
  const { data: places, isLoading, isError } = useGetSavedPlacesQuery()

  return (
    <ScreenShell title="Адреса" onBack={() => navigate('profile')}>
      {isLoading && <p className="text-sm text-muted-foreground">Загружаем адреса…</p>}
      {isError && <p className="text-sm text-destructive">Не удалось загрузить адреса.</p>}

      {places && places.length === 0 && <p className="text-sm text-muted-foreground">Сохранённых адресов пока нет.</p>}

      {places && places.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {places.map((place) => {
            const Icon = LABEL_ICON[place.label]
            return (
              <ListRow
                key={place.id}
                icon={<Icon className="h-4 w-4 text-foreground" />}
                label={place.subtitle}
                value={place.name}
              />
            )
          })}
        </div>
      )}
    </ScreenShell>
  )
}

export { AddressesScreen }
