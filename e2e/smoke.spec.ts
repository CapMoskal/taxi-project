import { test, expect } from '@playwright/test'

test('loads straight into the pickup screen with mocked data, no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`))

  await page.goto('/')

  // No "Начать заказ" gate — selectingPickup is the first screen.
  await expect(page.getByRole('button', { name: 'Начать заказ' })).toHaveCount(0)

  await expect(page.locator('[data-slot="pickup-where-to"]')).toBeVisible()
  await expect(page.locator('[data-slot="pickup-pill"]')).toContainText('ул. Тверская, 12')
  await expect(page.getByRole('button', { name: /Тверская/ })).toBeVisible()

  expect(errors).toEqual([])
})
