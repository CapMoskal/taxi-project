import type { ReactNode } from 'react'
import { ScreenHeader } from './ScreenHeader'

interface ScreenShellProps {
  title: string
  onBack: () => void
  children: ReactNode
}

// `relative` on the scroll container (not the centered inner column) so that
// any `absolute`-positioned overlay a screen renders as a child (e.g.
// PaymentMethodsScreen's AddCardSheet) anchors to the full panel width, not
// the centered lg:max-w-2xl column — matches how BottomSheet already behaves
// on mobile (edge-to-edge), not capped/centered like reading content.
function ScreenShell({ title, onBack, children }: ScreenShellProps) {
  return (
    <div className="flex h-full w-full flex-col bg-background">
      <ScreenHeader title={title} onBack={onBack} />
      <div className="relative flex-1 overflow-y-auto">
        <div className="mx-auto w-full p-4 lg:max-w-2xl" data-slot="screen-shell-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export { ScreenShell }
