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
        // Interim desktop treatment (2b docks this properly into the order
        // panel) — full-width sheets look broken on wide viewports, so cap
        // and dock to the bottom-left corner instead of edge-to-edge.
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
