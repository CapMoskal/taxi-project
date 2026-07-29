import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ScreenShell } from '@/shared/ui/ScreenShell'
import { useNavigation } from '@/app/navigationContext'
import { useIsDesktop } from '@/shared/lib/useIsDesktop'

interface Topic {
  icon: LucideIcon
  title: string
  description: string
}

interface TopicPageScreenProps {
  title: string
  intro: string
  topics: Topic[]
  children?: ReactNode
}

// Shared shape for the navbar-tab info pages (Пассажирам, Водителям, Бизнесу
// — one at a time, see docs/roadmap.md): intro paragraph + a grid of
// non-clickable topic cards, optionally an action below (Водителям's CTA).
// Extracted at the second instance (Водителям) per the rule of three —
// Пассажирам alone wasn't enough signal for the right shape, see
// docs/decisions.md 2026-07-28.
function TopicPageScreen({ title, intro, topics, children }: TopicPageScreenProps) {
  const { navigate } = useNavigation()
  const isDesktop = useIsDesktop()

  // Flat navigation (no history stack) — desktop arrives via the navbar tab
  // (peer of the order screen), mobile arrives via Профиль's quick links.
  const handleBack = () => navigate(isDesktop ? 'order' : 'profile')

  return (
    <ScreenShell title={title} onBack={handleBack}>
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">{intro}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {topics.map(({ icon: Icon, title: topicTitle, description }) => (
            <div key={topicTitle} className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Icon className="h-5 w-5 text-foreground" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">{topicTitle}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {children}
      </div>
    </ScreenShell>
  )
}

export { TopicPageScreen }
export type { Topic }
