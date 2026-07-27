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
})

test.describe('mobile layout (default viewport, unaffected)', () => {
  test('desktop navbar is not visible on mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-slot="desktop-navbar"]')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Профиль' })).toBeVisible()
  })
})
