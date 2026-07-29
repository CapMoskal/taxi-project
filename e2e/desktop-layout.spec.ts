import { test, expect } from '@playwright/test'

test.describe('desktop layout (lg breakpoint)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('navbar is visible on desktop, avatar navigates to profile', async ({ page }) => {
    await page.goto('/')

    const navbar = page.locator('[data-slot="desktop-navbar"]')
    await expect(navbar).toBeVisible()
    await expect(navbar.getByText('Такси')).toBeVisible()

    await navbar.getByRole('button', { name: 'Профиль' }).click()
    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible()
  })

  test('content screens center into a capped column on desktop', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-slot="desktop-navbar"]').getByRole('button', { name: 'Профиль' }).click()

    const content = page.locator('[data-slot="screen-shell-content"]')
    await expect(content).toBeVisible()
    const box = (await content.boundingBox())!
    // lg:max-w-2xl (42rem/672px) — well under the 1280px viewport, and
    // centered (roughly equal margins left/right), not stretched edge-to-edge.
    expect(box.width).toBeLessThan(700)
    const leftMargin = box.x
    const rightMargin = 1280 - (box.x + box.width)
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(5)
  })

  test('floating ProfileButton on the order screen is hidden on desktop', async ({ page }) => {
    await page.goto('/')
    // Exactly one VISIBLE "Профиль" button at a time — the navbar's own.
    // The mobile floating avatar (absolute top-left on the map,
    // ProfileButton.tsx) always carries `lg:hidden`, but since 2c it may
    // also not be mounted at all on desktop — the machine's `always`
    // transitions fast-forward past the pickup phase (which is what gates
    // its mount) almost immediately once geolocation resolves (see
    // machine.ts). Either way — hidden-but-mounted or unmounted — it must
    // never be simultaneously visible with the navbar's.
    await expect(page.locator('button[aria-label="Профиль"]:visible')).toHaveCount(1)
  })

  test('order flow composes addresses + classes + payment + order co-visible in the rail (2d)', async ({ page }) => {
    await page.goto('/')

    // No floating pickup-pill / mobile sheets on desktop — several
    // independent floating OrderCards render in the rail instead (see
    // OrderComposePanel.tsx / taxi.yandex.ru reference), not one single block.
    await expect(page.locator('[data-slot="pickup-pill"]')).toHaveCount(0)
    const rail = page.locator('[data-slot="order-rail"]')
    await expect(rail.locator('[data-slot="order-compose"]')).toBeVisible()

    // Since 2d the rail is a transparent gap-container floating over a
    // full-bleed map (each card inside carries its own elevation, not the
    // rail itself) — the map area starts at/before the rail's left edge and
    // extends past its right edge, and the rail itself is inset from the
    // viewport edges (offset by lg:left-4/top-4, not flush).
    const railBox = (await rail.boundingBox())!
    const mapAreaBox = (await page.locator('[data-slot="order-map-area"]').boundingBox())!
    expect(mapAreaBox.x).toBeLessThanOrEqual(railBox.x)
    expect(mapAreaBox.x + mapAreaBox.width).toBeGreaterThan(railBox.x + railBox.width)
    expect(railBox.x).toBeGreaterThan(0)
    expect(railBox.y).toBeGreaterThan(0)

    // Desktop auto-fast-forwards past the standalone pickup step (machine.ts
    // `always` transitions) — "Откуда" is already an editable row with the
    // resolved address, not a separate confirm step.
    await expect(rail.locator('[data-slot="compose-from"]')).toBeVisible()

    // Since 2d, classes/payment/order show as soon as pickup resolves —
    // Yandex-style "от X ₽" estimates, not gated on destination.
    await expect(rail.locator('[data-slot="compose-order"]')).toBeVisible()
    await expect(rail.locator('[data-slot="compose-payment"]')).toBeVisible()
    await expect(rail.locator('button[aria-pressed="true"]')).toBeVisible()
    await expect(rail.getByText('от', { exact: false }).first()).toBeVisible()

    // Type a destination and pick a search result — this alone should set
    // B and fall through to the compose-anchor state (no confirm button).
    await rail.locator('[data-slot="compose-to"]').fill('Красная площадь')
    const results = rail.locator('[data-slot="compose-to-results"]')
    await results.getByText('Красная площадь', { exact: false }).first().click()

    // Once B is set, prices become exact — no more "от" prefix.
    await expect(rail.getByText('от', { exact: false })).toHaveCount(0)

    // Road-following route still renders on the map behind the rail (2b/2c
    // keep the underlying routing untouched, only relocate the phase chrome)
    // — same regression check as pickup-destination.spec.ts.
    const coordsLength = await page.evaluate(() => {
      const map = (window as unknown as { __map?: import('maplibre-gl').Map }).__map
      const src = map?.getSource('route-line') as unknown as
        | { _data?: { geojson?: { geometry?: { coordinates?: unknown[] } } } }
        | undefined
      return src?._data?.geojson?.geometry?.coordinates?.length ?? null
    })
    expect(coordsLength).not.toBeNull()
    expect(coordsLength!).toBeGreaterThan(2)

    // "Заказать" is actionable — a class is pre-selected as soon as quotes
    // load (Yandex-style default), and clicking it advances the machine.
    await expect(rail.locator('[data-slot="compose-order"]')).toBeEnabled()
    await rail.locator('[data-slot="compose-order"]').click()
    await expect(rail.getByText('Ищем водителя рядом…')).toBeVisible()
  })
})

test.describe('mobile layout (default viewport, unaffected)', () => {
  test('desktop navbar is not visible on mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-slot="desktop-navbar"]')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Профиль' })).toBeVisible()
  })
})
