import { User } from 'lucide-react'
import { useGetUserProfileQuery } from '@/entities/user/api'
import { InitialsAvatar } from '@/shared/ui/InitialsAvatar'
import { useNavigation } from '@/app/navigationContext'

// Desktop hides this in favor of the avatar in DesktopNavbar (see
// app/App.tsx) — lg:hidden rather than not rendering it at all, so mobile
// behavior/tests are untouched if the viewport straddles the breakpoint.
function ProfileButton() {
  const { navigate } = useNavigation()
  const { data: profile } = useGetUserProfileQuery()

  return (
    <button
      type="button"
      onClick={() => navigate('profile')}
      aria-label="Профиль"
      className="absolute left-4 top-4 z-10 rounded-full shadow-lg outline-none ring-ring focus-visible:ring-2 lg:hidden"
    >
      {profile ? (
        <InitialsAvatar name={profile.name} className="h-11 w-11 text-base" />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-muted-foreground">
          <User className="h-5 w-5" />
        </span>
      )}
    </button>
  )
}

export { ProfileButton }
