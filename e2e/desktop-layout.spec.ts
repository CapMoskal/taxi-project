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

  test('order flow composes addresses + classes + payment + order co-visible in the rail (2c)', async ({ page }) => {
    await page.goto('/')

    // No floating pickup-pill / mobile sheets on desktop — the compose panel
    // renders a single co-visible block instead (see OrderComposePanel.tsx).
    await expect(page.locator('[data-slot="pickup-pill"]')).toHaveCount(0)
    const rail = page.locator('[data-slot="order-rail"]')
    await expect(rail.locator('[data-slot="order-compose"]')).toBeVisible()

    // Rail and map area are real flex siblings, not stacked/overlaid — the
    // map area must start where the rail ends, not underneath it.
    const railBox = (await rail.boundingBox())!
    const mapAreaBox = (await page.locator('[data-slot="order-map-area"]').boundingBox())!
    expect(mapAreaBox.x).toBeGreaterThanOrEqual(railBox.x + railBox.width)

    // Desktop auto-fast-forwards past the standalone pickup step (machine.ts
    // `always` transitions) — "Откуда" is already an editable row with the
    // resolved address, not a separate confirm step.
    await expect(rail.locator('[data-slot="compose-from"]')).toBeVisible()

    // Type a destination and pick a search result — this alone should set
    // B and fall through to the compose-anchor state (no confirm button).
    await rail.locator('[data-slot="compose-to"]').fill('Красная площадь')
    const results = rail.locator('[data-slot="compose-to-results"]')
    await results.getByText('Красная площадь', { exact: false }).first().click()

    // Classes, payment, and "Заказать" all co-visible once B is set.
    await expect(rail.locator('[data-slot="compose-order"]')).toBeVisible()
    await expect(rail.locator('[data-slot="compose-payment"]')).toBeVisible()
    await expect(rail.locator('button[aria-pressed="true"]')).toBeVisible()

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
