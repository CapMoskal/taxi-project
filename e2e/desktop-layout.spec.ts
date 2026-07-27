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
    await expect(page.getByLabel('Профиль').first()).toBeVisible() // navbar avatar
    // The mobile floating avatar button (absolute top-left on the map) must
    // not also be visible — DesktopNavbar's avatar replaces it on lg:.
    const floatingButtons = page.locator('button[aria-label="Профиль"]')
    await expect(floatingButtons).toHaveCount(2) // navbar + OrderScreen's (hidden via lg:hidden)
    await expect(floatingButtons.nth(1)).toBeHidden()
  })

  test('order flow renders phase UI in the rail, not as a map overlay', async ({ page }) => {
    await page.goto('/')

    // No floating pickup-pill on desktop — PickupSheet renders a plain rail
    // block instead (see PickupSheet.tsx).
    await expect(page.locator('[data-slot="pickup-pill"]')).toHaveCount(0)
    const rail = page.locator('[data-slot="order-rail"]')
    await expect(rail.locator('[data-slot="pickup-rail"]')).toBeVisible()

    // Rail and map area are real flex siblings, not stacked/overlaid — the
    // map area must start where the rail ends, not underneath it.
    const railBox = (await rail.boundingBox())!
    const mapAreaBox = (await page.locator('[data-slot="order-map-area"]').boundingBox())!
    expect(mapAreaBox.x).toBeGreaterThanOrEqual(railBox.x + railBox.width)

    await rail.locator('[data-slot="pickup-where-to"]').click()
    await expect(rail.locator('[data-slot="destination-rail"]')).toBeVisible()

    await rail.getByRole('button', { name: 'Подтвердить точку назначения' }).click()
    await expect(rail.getByRole('heading', { name: 'Выберите класс' })).toBeVisible()

    // Road-following route still renders on the map behind the rail (2b keeps
    // the A/B selection interaction and routing untouched, only relocates
    // the phase chrome) — same regression check as pickup-destination.spec.ts.
    const coordsLength = await page.evaluate(() => {
      const map = (window as unknown as { __map?: import('maplibre-gl').Map }).__map
      const src = map?.getSource('route-line') as unknown as
        | { _data?: { geojson?: { geometry?: { coordinates?: unknown[] } } } }
        | undefined
      return src?._data?.geojson?.geometry?.coordinates?.length ?? null
    })
    expect(coordsLength).not.toBeNull()
    expect(coordsLength!).toBeGreaterThan(2)
  })
})

test.describe('mobile layout (default viewport, unaffected)', () => {
  test('desktop navbar is not visible on mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-slot="desktop-navbar"]')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Профиль' })).toBeVisible()
  })
})
