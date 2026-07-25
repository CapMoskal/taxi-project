import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  ariaLabel: string
}

function Switch({ checked, onCheckedChange, ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full outline-none ring-ring transition-colors focus-visible:ring-2',
        checked ? 'bg-primary' : 'bg-muted',
      )}
      data-slot="switch"
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

export { Switch }
