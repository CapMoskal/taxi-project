import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { animate, motion, useMotionValue } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrderFlowActorRef, useOrderFlowSelector } from './context'
import { useDestinationSync } from './useDestinationSync'
import { PlaceRow } from './PlaceRow'

type SheetSnap = 'peek' | 'expanded' | 'retreated'

// Fractions of the sheet's own (measured) height — 0 = fully expanded (top),
// closer to 1 = mostly hidden below the fold.
const PEEK_RATIO = 0.62
const RETREATED_RATIO = 0.88
const FLICK_VELOCITY = 500

interface DestinationSheetProps {
  mapRef: RefObject<maplibregl.Map | null>
}

// Mobile-only map overlay — desktop's equivalent step lives in
// OrderComposePanel (compose panel, co-visible with class/payment/order),
// which shares this component's address-sync data logic via
// useDestinationSync but has no sliding-sheet physics to speak of (it's a
// static rail block, nothing to retreat from). See docs/decisions.md.
function DestinationSheet({ mapRef }: DestinationSheetProps) {
  const actorRef = useOrderFlowActorRef()
  const pickup = useOrderFlowSelector((state) => state.context.pickup)
  const destination = useOrderFlowSelector((state) => state.context.destination)

  const [snap, setSnap] = useState<SheetSnap>('peek')
  const snapRef = useRef<SheetSnap>('peek')
  const prevSnapRef = useRef<SheetSnap>('peek')
  useEffect(() => {
    snapRef.current = snap
  }, [snap])

  const {
    query,
    setQuery,
    isInputFocusedRef,
    rows,
    isSearching,
    showSearch,
    handlePickRow: syncPickRow,
    pickupAddress,
  } = useDestinationSync(mapRef, pickup, {
    onUserMoveStart: () => {
      if (snapRef.current === 'retreated') return
      prevSnapRef.current = snapRef.current
      setSnap('retreated')
    },
    onUserSettle: () => {
      setSnap(prevSnapRef.current)
    },
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const [sheetHeight, setSheetHeight] = useState(0)
  useEffect(() => {
    const measure = () => setSheetHeight(containerRef.current?.offsetHeight ?? 0)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const peekY = sheetHeight * PEEK_RATIO
  const retreatedY = sheetHeight * RETREATED_RATIO
  const snapY = (target: SheetSnap) => (target === 'expanded' ? 0 : target === 'retreated' ? retreatedY : peekY)

  const y = useMotionValue(0)
  useEffect(() => {
    const controls = animate(y, snapY(snap), { type: 'spring', damping: 30, stiffness: 300 })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, sheetHeight])

  const handleDragEnd = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.velocity.y < -FLICK_VELOCITY) return setSnap('expanded')
    if (info.velocity.y > FLICK_VELOCITY) return setSnap('peek')
    setSnap(y.get() < peekY / 2 ? 'expanded' : 'peek')
  }

  const handlePickRow = (row: Parameters<typeof syncPickRow>[0]) => {
    syncPickRow(row)
    setSnap('peek')
  }

  const handleConfirm = () => {
    const map = mapRef.current
    if (!map) return
    const center = map.getCenter()
    actorRef.send({ type: 'SET_DESTINATION', coords: { lat: center.lat, lng: center.lng } })
    actorRef.send({ type: 'CONFIRM_DESTINATION' })
  }

  // On mobile `destination` isn't committed to context until CONFIRM_DESTINATION
  // (unlike desktop's compose panel, which commits on every pick/drag-settle —
  // see OrderComposePanel.tsx) — so this is usually just a text/search reset.
  // Still sends CLEAR_DESTINATION for a uniform clear-button event across both
  // viewports; harmless here since destination is already null at this point.
  const handleClearDestination = () => {
    setQuery('')
    actorRef.send({ type: 'CLEAR_DESTINATION' })
  }

  return (
    <>
      <motion.div
        ref={containerRef}
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: retreatedY }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        className="absolute inset-x-0 bottom-0 z-20 flex h-[70vh] flex-col rounded-t-2xl border-t border-border bg-background shadow-lg"
        data-slot="destination-sheet"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted" />

        <div className="shrink-0 px-4 pt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Точка подачи · {pickupAddress || '…'}
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                isInputFocusedRef.current = true
                setSnap('expanded')
              }}
              onBlur={() => {
                isInputFocusedRef.current = false
              }}
              placeholder="Куда едем?"
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              data-slot="destination-input"
            />
            {(query.length > 0 || destination) && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClearDestination}
                aria-label="Очистить"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                data-slot="destination-clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {isSearching && showSearch && <p className="mt-2 text-xs text-muted-foreground">Ищем…</p>}
          {showSearch && !isSearching && rows.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Ничего не найдено</p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 pb-20">
          {!showSearch && rows.length > 0 && (
            <p className="mb-1 px-1 text-xs text-muted-foreground">Недавние адреса</p>
          )}
          <div className="flex flex-col">
            {rows.map((row) => (
              <PlaceRow
                key={row.id}
                name={row.name}
                subtitle={row.subtitle}
                icon={row.icon}
                onClick={() => handlePickRow(row)}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Own layer, independent of the sheet's peek/expanded/retreated translateY —
          `peek` only reveals the sheet's top ~38%, which would otherwise carry the
          confirm button (the sheet's last child) off-screen below the fold. */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 border-t border-border bg-background p-4"
        data-slot="destination-confirm-footer"
      >
        <Button className="w-full" onClick={handleConfirm}>
          Подтвердить точку назначения
        </Button>
      </div>
    </>
  )
}

export { DestinationSheet }
