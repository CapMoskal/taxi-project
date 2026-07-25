import { ChevronLeft } from 'lucide-react'

interface ScreenHeaderProps {
  title: string
  onBack: () => void
}

function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <header className="flex items-center gap-2 border-b border-border p-4" data-slot="screen-header">
      <button
        type="button"
        onClick={onBack}
        aria-label="Назад"
        className="rounded-full outline-none ring-ring focus-visible:ring-2"
      >
        <ChevronLeft className="h-6 w-6 text-foreground" />
      </button>
      <h1 className="text-base font-medium text-foreground">{title}</h1>
    </header>
  )
}

export { ScreenHeader }
