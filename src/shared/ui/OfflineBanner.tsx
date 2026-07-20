import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/shared/lib/useOnlineStatus'

function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-foreground/90 px-4 py-1.5 text-xs text-background backdrop-blur"
      data-slot="offline-banner"
      role="status"
    >
      <WifiOff className="h-3.5 w-3.5" />
      Нет соединения — карта может не обновляться
    </div>
  )
}

export { OfflineBanner }
