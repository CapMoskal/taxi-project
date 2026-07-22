import { Clock, MapPin } from 'lucide-react'

interface PlaceRowProps {
  name: string
  subtitle: string
  icon: 'recent' | 'place'
  onClick: () => void
}

function PlaceRow({ name, subtitle, icon, onClick }: PlaceRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-muted"
    >
      {icon === 'recent' ? (
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  )
}

export { PlaceRow }
