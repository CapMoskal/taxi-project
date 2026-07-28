import { test, expect } from '@playwright/test'

test.describe('passengers info page — desktop (navbar tab)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('navbar tab opens the page, back returns to the order screen', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`))

    await page.goto('/')
    await page.locator('[data-slot="desktop-navbar"]').getByRole('button', { name: 'Пассажирам' }).click()

    await expect(page.getByRole('heading', { name: 'Пассажирам' })).toBeVisible()
    await expect(page.getByText('Безопасность в поездке')).toBeVisible()

    await page.getByLabel('Назад').click()
    await expect(page.locator('[data-slot="order-rail"]')).toBeVisible()

    expect(errors).toEqual([])
  })
})

test.describe('passengers info page — mobile (Профиль entry)', () => {
  test('quick link in Профиль opens the page, back returns to Профиль', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Профиль' }).click()
    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible()

    await page.getByRole('button', { name: 'Пассажирам' }).click()
    await expect(page.getByRole('heading', { name: 'Пассажирам' })).toBeVisible()
    await expect(page.getByText('Безопасность в поездке')).toBeVisible()

    await page.getByLabel('Назад').click()
    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible()
  })
})
