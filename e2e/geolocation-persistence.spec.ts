import { test, expect } from '@playwright/test'

// Rostov-on-Don — far from both the default Moscow fallback (DEMO_PICKUP)
// AND the global geolocation override in playwright.config.ts (which is
// itself Moscow, coincidentally matching the fallback — that's exactly why
// this bug never surfaced in the existing suite; overriding it here is the
// point).
const ROSTOV = { latitude: 47.2357, longitude: 39.7015 }
const MOSCOW = { lat: 55.7558, lng: 37.6173 }

test.use({ geolocation: ROSTOV })

async function getMapCenter(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const map = (window as unknown as { __map?: import('maplibre-gl').Map }).__map
    const c = map?.getCenter()
    return c ? { lat: c.lat, lng: c.lng } : null
  })
}

function isNearMoscow(center: { lat: number; lng: number } | null) {
  if (!center) return false
  return Math.abs(center.lat - MOSCOW.lat) < 0.5 && Math.abs(center.lng - MOSCOW.lng) < 0.5
}

test.describe('real geolocation persistence', () => {
  test('map centers on real geolocation on load, not the Moscow fallback', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`))

    await page.goto('/')

    // A map's own initial "settle" (born at the hardcoded Moscow center)
    // used to win the race against async geolocation and permanently lock
    // pickup there — toPass retries past that brief initial window.
    await expect(async () => {
      const center = await getMapCenter(page)
      expect(isNearMoscow(center)).toBe(false)
    }).toPass()

    expect(errors).toEqual([])
  })

  test('map stays on real geolocation after navigating to Профиль and back', async ({ page }) => {
    await page.goto('/')
    await expect(async () => {
      expect(isNearMoscow(await getMapCenter(page))).toBe(false)
    }).toPass()

    await page.getByRole('button', { name: 'Профиль' }).click()
    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible()
    await page.getByLabel('Назад').click()

    // Deterministic (not a race): OrderScreen/MapCanvas remounts on return,
    // and used to always construct at the hardcoded Moscow center.
    await expect(async () => {
      expect(isNearMoscow(await getMapCenter(page))).toBe(false)
    }).toPass()
  })

  test('dragging the map still moves point A (dragstart gate does not break real drags)', async ({ page }) => {
    await page.goto('/')
    await expect(async () => {
      expect(isNearMoscow(await getMapCenter(page))).toBe(false)
    }).toPass()

    const before = await getMapCenter(page)
    const box = (await page.locator('canvas').first().boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 - 120, { steps: 10 })
    await page.mouse.up()

    await expect(async () => {
      const after = await getMapCenter(page)
      expect(after).not.toEqual(before)
    }).toPass()
  })
})
