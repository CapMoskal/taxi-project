import { cn } from '@/lib/utils'

interface InitialsAvatarProps {
  name: string
  className?: string
}

function InitialsAvatar({ name, className }: InitialsAvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground',
        className,
      )}
      data-slot="initials-avatar"
    >
      {name.charAt(0)}
    </div>
  )
}

export { InitialsAvatar }
