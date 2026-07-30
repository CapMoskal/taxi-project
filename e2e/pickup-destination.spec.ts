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

  test('tapping the pickup pill lets you type point A manually, dragging still works after', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-slot="pickup-pill"]')).toContainText('Тверская')

    await page.locator('[data-slot="pickup-pill"]').click()
    await page.locator('[data-slot="pickup-address-input"]').fill('Красная')

    const results = page.locator('[data-slot="pickup-address-results"]')
    await results.getByText('Красная площадь', { exact: false }).first().click()

    // Picking a result jumps the map there and returns to the plain pill —
    // stays on screen A (no CONFIRM_PICKUP), unlike picking a recent address.
    await expect(page.locator('[data-slot="pickup-address-input"]')).toHaveCount(0)
    await expect(page.locator('[data-slot="destination-sheet"]')).toHaveCount(0)

    await expect(async () => {
      const center = await page.evaluate(() => {
        const map = (window as unknown as { __map?: import('maplibre-gl').Map }).__map!
        const c = map.getCenter()
        return { lat: c.lat, lng: c.lng }
      })
      expect(center.lng).toBeCloseTo(37.6208, 2)
      expect(center.lat).toBeCloseTo(55.7539, 2)
    }).toPass()

    // Dragging still fine-tunes point A from the new center afterward.
    const before = await page.evaluate(() => {
      const map = (window as unknown as { __map?: import('maplibre-gl').Map }).__map!
      const c = map.getCenter()
      return { lat: c.lat, lng: c.lng }
    })
    const box = (await page.locator('canvas').first().boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 - 90, { steps: 10 })
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

  test('dragging the map on the FIRST drag (before any pick) retreats the sheet, settle restores it', async ({
    page,
  }) => {
    // Regression for an iOS-only bug (not reproducible in Chromium, see
    // decisions.md): entering via "Куда едем?" — no prior jumpTo — used to
    // leave the sheet's retreat-on-drag trigger dormant on iOS Safari until
    // some later programmatic jumpTo "warmed it up". This is the exact path
    // that used to fail on a real device; Chromium never reproduced the
    // underlying MapLibre event gap, so this test guards the fix's shape
    // (a no-op jumpTo on mount), not the original bug itself.
    await page.goto('/')
    await page.locator('[data-slot="pickup-where-to"]').click()

    const sheet = page.locator('[data-slot="destination-sheet"]')
    await expect(sheet).toBeVisible()
    // The sheet mounts at translateY=0 (sheetHeight starts at 0) and only
    // springs to its real "peek" position once sheetHeight is measured via
    // a post-mount effect — grabbing the bounding box too early captures
    // that transient pre-spring position, not the actual rest state.
    await page.waitForTimeout(500)
    const restTop = (await sheet.boundingBox())!.y

    const box = (await page.locator('canvas').first().boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.25)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height * 0.25 - 120, { steps: 10 })

    await expect(async () => {
      const midTop = (await sheet.boundingBox())!.y
      expect(midTop).toBeGreaterThan(restTop + 20)
    }).toPass()

    await page.mouse.up()

    await expect(async () => {
      const endTop = (await sheet.boundingBox())!.y
      expect(Math.abs(endTop - restTop)).toBeLessThan(5)
    }).toPass()
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

  test('the "×" clears the destination search input', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Тверская/ }).click()

    const input = page.locator('[data-slot="destination-input"]')
    // No "×" until there's text to clear — mobile never commits `destination`
    // to context before the confirm button, so this is purely a text reset
    // here (unlike the desktop compose panel — see decisions.md).
    await expect(page.locator('[data-slot="destination-clear"]')).toHaveCount(0)

    await input.fill('Красная площадь')
    await expect(page.locator('[data-slot="destination-clear"]')).toBeVisible()

    await page.locator('[data-slot="destination-clear"]').click()
    await expect(input).toHaveValue('')
    // Sheet stays open, confirm button still reachable — clearing text isn't
    // a dead end.
    await expect(page.locator('[data-slot="destination-confirm-footer"] button')).toBeInViewport()
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
