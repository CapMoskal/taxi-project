import { test, expect } from '@playwright/test'

test.describe('business info page — desktop (navbar tab)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('navbar tab opens the page, CTA submits, back returns to the order screen', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`))

    await page.goto('/')
    await page.locator('[data-slot="desktop-navbar"]').getByRole('button', { name: 'Бизнесу' }).click()

    await expect(page.getByRole('heading', { name: 'Бизнесу' })).toBeVisible()
    await expect(page.getByText('Экономия')).toBeVisible()

    const cta = page.getByRole('button', { name: 'Подключить компанию' })
    await expect(cta).toBeVisible()
    await cta.click()
    await expect(page.getByRole('button', { name: 'Заявка отправлена' })).toBeDisabled()

    await page.getByLabel('Назад').click()
    await expect(page.locator('[data-slot="order-rail"]')).toBeVisible()

    expect(errors).toEqual([])
  })
})

test.describe('business info page — mobile (Профиль entry)', () => {
  test('quick link in Профиль opens the page, back returns to Профиль', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Профиль' }).click()
    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible()

    await page.getByRole('button', { name: 'Бизнесу' }).click()
    await expect(page.getByRole('heading', { name: 'Бизнесу' })).toBeVisible()
    await expect(page.getByText('Экономия')).toBeVisible()

    await page.getByLabel('Назад').click()
    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible()
  })
})
