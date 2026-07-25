import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ListRowProps {
  icon?: ReactNode
  label: string
  value?: string
  onClick?: () => void
  className?: string
}

function ListRow({ icon, label, value, onClick, className }: ListRowProps) {
  const content = (
    <>
      <span className="flex items-center gap-2 text-sm text-foreground">
        {icon}
        {label}
      </span>
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {value}
        {onClick && <ChevronRight className="h-4 w-4" />}
      </span>
    </>
  )

  if (!onClick) {
    return (
      <div className={cn('flex items-center justify-between p-3', className)} data-slot="list-row">
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted',
        className,
      )}
      data-slot="list-row"
    >
      {content}
    </button>
  )
}

export { ListRow }
