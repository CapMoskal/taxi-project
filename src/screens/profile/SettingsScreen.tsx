import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'
import { ListRow } from '@/shared/ui/ListRow'
import { Switch } from '@/shared/ui/Switch'
import { useTheme } from '@/app/themeContext'
import type { ThemeMode } from '@/app/themeContext'
import { useNavigation } from '@/app/navigationContext'

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Светлая' },
  { mode: 'dark', label: 'Тёмная' },
  { mode: 'system', label: 'Системная' },
]

const NOTIFICATIONS_STORAGE_KEY = 'taxi-notifications-enabled'

function readNotificationsEnabled(): boolean {
  return localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) !== 'false'
}

function SettingsScreen() {
  const { navigate } = useNavigation()
  const { mode, setMode } = useTheme()
  const [notificationsEnabled, setNotificationsEnabled] = useState(readNotificationsEnabled)

  function handleNotificationsChange(next: boolean) {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, String(next))
    setNotificationsEnabled(next)
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <ScreenHeader title="Настройки" onBack={() => navigate('profile')} />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="px-1 text-sm text-muted-foreground">Тема</p>
            <div className="flex gap-1 rounded-xl border border-border p-1">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => setMode(option.mode)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
                    mode === option.mode
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-foreground">Уведомления</span>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationsChange}
                ariaLabel="Уведомления"
              />
            </div>
            <ListRow label="Язык" value="Русский" />
          </div>
        </div>
      </div>
    </div>
  )
}

export { SettingsScreen }
