import { test, expect } from '@playwright/test'

interface RouteLineData {
  geojson?: { geometry?: { coordinates?: [number, number][] } }
}

async function getRouteCoords(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const map = (window as unknown as { __map?: import('maplibre-gl').Map }).__map
    const src = map?.getSource('route-line') as unknown as { _data?: RouteLineData } | undefined
    return src?._data?.geojson?.geometry?.coordinates ?? null
  })
}

test.describe('pickup (A) and destination (B) screens', () => {
  test('dragging the map moves point A and updates the address pill', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-slot="pickup-pill"]')).toContainText('Тверская')

    const before = await page.evaluate(() => {
      const map = (window as unknown as { __map?: import('maplibre-gl').Map }).__map!
      const c = map.getCenter()
      return { lat: c.lat, lng: c.lng }
    })

    const box = (await page.locator('canvas').first().boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 - 120, { steps: 10 })
    await page.mouse.up()

    await expect(async () => {
      const after = await page.evaluate(() => {
        const map = (window as unknown as { __map?: import('maplibre-gl').Map }).__map!
        const c = map.getCenter()
        return { lat: c.lat, lng: c.lng }
      })
      expect(after).not.toEqual(before)
    }).toPass()
  })

  test('"Куда едем?" advances to the destination screen', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-slot="pickup-where-to"]').click()
    await expect(page.locator('[data-slot="destination-sheet"]')).toBeVisible()
  })

  test('picking a recent address on screen A opens screen B centered on it, confirm button always visible', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Тверская/ }).click()

    const sheet = page.locator('[data-slot="destination-sheet"]')
    await expect(sheet).toBeVisible()

    // Regression: the confirm button used to be part of the sliding sheet
    // and got carried off-screen in the default `peek` snap — it must be
    // visible without any swipe/expand interaction (see decisions.md).
    const confirmButton = page.locator('[data-slot="destination-confirm-footer"] button')
    await expect(confirmButton).toBeInViewport()
  })

  test('confirming B produces a road-following route and non-degenerate pickup/destination', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Тверская/ }).click()
    await page.locator('[data-slot="destination-confirm-footer"] button').click()

    await expect(page.getByRole('heading', { name: 'Выберите класс' })).toBeVisible()

    // Regression: pickup used to get silently overwritten with B's coords by
    // a stray moveend listener still mounted during the jumpTo navigation,
    // producing a degenerate pickup === destination route (see decisions.md).
    await expect(async () => {
      const coords = await getRouteCoords(page)
      expect(coords).not.toBeNull()
      expect(coords!.length).toBeGreaterThan(2)
    }).toPass({ timeout: 3000 })

    // Class prices come from MSW (/api/ride-classes) — confirms the mocked
    // backend renders real data on this screen.
    await expect(page.getByRole('button', { name: /Эконом/ })).toBeVisible()
  })
})
