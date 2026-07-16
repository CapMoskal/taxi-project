import { User } from 'lucide-react'
import { useGetUserProfileQuery } from '@/entities/user/api'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/shared/ui/BottomSheet'
import { InitialsAvatar } from '@/shared/ui/InitialsAvatar'
import { useOrderFlowActorRef } from '@/features/order-flow/context'
import { useNavigation } from '@/app/navigationContext'

function IdleOverlay() {
  const actorRef = useOrderFlowActorRef()
  const { navigate } = useNavigation()
  const { data: profile } = useGetUserProfileQuery()

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('profile')}
        aria-label="Профиль"
        className="absolute left-4 top-4 z-10 rounded-full shadow-lg outline-none ring-ring focus-visible:ring-2"
      >
        {profile ? (
          <InitialsAvatar name={profile.name} className="h-11 w-11 text-base" />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-muted-foreground">
            <User className="h-5 w-5" />
          </span>
        )}
      </button>

      <BottomSheet>
        <h2 className="mb-3 text-base font-medium text-foreground">Куда едем?</h2>
        <Button className="w-full" onClick={() => actorRef.send({ type: 'START_ORDER' })}>
          Начать заказ
        </Button>
      </BottomSheet>
    </>
  )
}

export { IdleOverlay }
