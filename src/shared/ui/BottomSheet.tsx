import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  children: ReactNode
  className?: string
}

function BottomSheet({ children, className }: BottomSheetProps) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={cn(
        'absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-border bg-background p-4 shadow-lg',
        // Order-flow phases no longer render this on desktop at all — they go
        // through OrderSurface, which forks to a flat rail block instead (see
        // shared/ui/OrderSurface.tsx). This lg: docking now only fires for
        // BottomSheet's one remaining direct desktop consumer,
        // PaymentMethodsScreen's AddCardSheet — a real modal-like overlay
        // outside the order rail, where capping+docking (vs. edge-to-edge)
        // still makes sense on wide viewports.
        'lg:inset-x-auto lg:left-4 lg:w-full lg:max-w-sm lg:rounded-2xl lg:border',
        className,
      )}
      data-slot="bottom-sheet"
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
      {children}
    </motion.div>
  )
}

export { BottomSheet }
