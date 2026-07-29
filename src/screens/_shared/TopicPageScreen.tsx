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
        <p className="text-base text-muted-foreground">{intro}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {topics.map(({ icon: Icon, title: topicTitle, description }) => (
            // bg-card + shadow (not a border) is what makes the resting card
            // work in BOTH themes: light theme has --card == --background
            // (white on white), so the shadow alone separates it; dark theme
            // has --card lighter than --background, so the tonal difference
            // does it there. But box-shadow alone is a poor HOVER signal on
            // dark backgrounds — a shadow is dark-on-dark, nearly invisible
            // (confirmed visually: Eugene reported the dark-theme hover was
            // imperceptible). hover:bg-muted fixes this in both themes at
            // once — --muted is the project's dedicated soft-highlight token
            // (see .claude/rules/design-tokens.md) and is lighter than --card
            // in dark theme (0.269 vs 0.205), giving a real visible lift
            // there, while still reading as a subtle warm tint in light theme.
            // Deliberately not a <button>/no cursor-pointer — Eugene wants a
            // hover effect without implying the card leads anywhere (it
            // doesn't, one-level nav, see docs/decisions.md 2026-07-29).
            <div
              key={topicTitle}
              className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm transition-all duration-200 hover:bg-muted hover:shadow-md sm:p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
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
