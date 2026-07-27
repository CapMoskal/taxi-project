import { User } from 'lucide-react'
import { useGetUserProfileQuery } from '@/entities/user/api'
import { InitialsAvatar } from '@/shared/ui/InitialsAvatar'
import { useNavigation } from '@/app/navigationContext'

// Text-only placeholders matching the Yandex reference's menu row (see
// docs/roadmap.md, 2026-07-27 screenshot) — corp-site chrome, not features of
// this app, so intentionally inert (no navigate target).
const MENU_ITEMS = ['Пассажирам', 'Водителям', 'Бизнесу', 'Помощь']

// Desktop-only chrome (hidden below `lg`) — the mobile flow keeps its
// floating ProfileButton on the order screen instead, see OrderScreen.tsx.
function DesktopNavbar() {
  const { navigate } = useNavigation()
  const { data: profile } = useGetUserProfileQuery()

  return (
    <header
      className="hidden shrink-0 items-center gap-8 border-b border-border bg-background px-6 py-3 lg:flex"
      data-slot="desktop-navbar"
    >
      <span className="text-lg font-semibold text-foreground">Такси</span>

      <nav className="flex flex-1 items-center justify-end gap-6">
        {MENU_ITEMS.map((item) => (
          <span key={item} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {item}
          </span>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => navigate('profile')}
        aria-label="Профиль"
        className="rounded-full outline-none ring-ring focus-visible:ring-2"
      >
        {profile ? (
          <InitialsAvatar name={profile.name} className="h-9 w-9 text-sm" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="h-4 w-4" />
          </span>
        )}
      </button>
    </header>
  )
}

export { DesktopNavbar }
