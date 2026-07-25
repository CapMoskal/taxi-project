import { test, expect } from '@playwright/test'

test.describe('profile hub and subpages', () => {
  test('navigates through all quick-link subpages and back, no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return
      // entities/driver/mocks.ts has a deliberate 20% failure rate on
      // /api/driver-search, unrelated to the profile flow under test here.
      if (msg.location().url.includes('/api/driver-search')) return
      errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`))

    await page.goto('/')
    await page.getByRole('button', { name: 'Профиль' }).click()
    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible()

    for (const label of ['Заказы', 'Поддержка', 'Адреса', 'Настройки']) {
      await page.getByText(label, { exact: true }).click()
      await expect(page.getByLabel('Назад')).toBeVisible()
      await page.getByLabel('Назад').click()
      await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible()
    }

    await page.getByText('Способ оплаты').click()
    await expect(page.getByRole('heading', { name: 'Способы оплаты' })).toBeVisible()
    await expect(page.getByText('Мир •••• 0542')).toBeVisible()
    await page.getByLabel('Назад').click()

    await page.getByText('Информация', { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Информация' })).toBeVisible()
    await page.getByLabel('Назад').click()

    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('adding a card in payment methods appends it to the list', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Профиль' }).click()
    await page.getByText('Способ оплаты').click()
    await expect(page.getByRole('heading', { name: 'Способы оплаты' })).toBeVisible()

    await page.getByRole('button', { name: 'Добавить карту' }).first().click()
    await page.getByPlaceholder('Номер карты').fill('4111 1111 1111 2222')
    await page.getByPlaceholder('ММ/ГГ').fill('12/29')
    await page.getByPlaceholder('CVC').fill('123')
    await page.getByRole('button', { name: 'Добавить карту' }).nth(1).click()

    await expect(page.getByText('Visa •••• 2222')).toBeVisible()
  })

  test('theme switch in settings toggles the dark class on <html>', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Профиль' }).click()
    await page.getByText('Настройки', { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Настройки' })).toBeVisible()

    await page.getByRole('button', { name: 'Тёмная' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.getByRole('button', { name: 'Светлая' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})
