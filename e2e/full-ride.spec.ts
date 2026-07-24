import { test, expect } from '@playwright/test'

// Full happy path, start to finish. Real timers here would mean ~2s
// (driverAssigned -> enRoute) + 6s + 6s (two animated ride legs) of actual
// wall-clock waiting — too slow for a suite that runs on every commit. Those
// delays are page-context setTimeout/requestAnimationFrame (useRideAutomation.ts,
// useAnimatedPosition.ts), so page.clock.fastForward() skips them instantly;
// verified empirically that it drives both consistently (performance.now()
// included). MSW's own artificial network delays (ride-classes ~500ms,
// driver-search ~1.5-2.5s) run inside the service worker's own context, which
// page.clock does NOT touch — those stay real, short waits.
test('full ride: pickup through payment/rating and back to a fresh pickup screen', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    // entities/driver/mocks.ts has a deliberate 20% failure rate on
    // /api/driver-search (to exercise the retry UI below) — Chrome logs any
    // non-2xx response as a console error automatically ("Failed to load
    // resource: ..."), even though the app handles it gracefully. The URL
    // isn't in msg.text() (just the generic string) — it's in msg.location().
    // Expected noise, not a real regression signal.
    if (msg.location().url.includes('/api/driver-search')) return
    errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`))

  await page.clock.install()
  await page.goto('/')

  // A -> B
  await page.getByRole('button', { name: /Тверская/ }).click()
  await page.locator('[data-slot="destination-confirm-footer"] button').click()

  // Class selection (MSW-priced)
  await expect(page.getByRole('heading', { name: 'Выберите класс' })).toBeVisible()
  await page.getByRole('button', { name: /Эконом/ }).click()
  await page.getByRole('button', { name: 'Подтвердить класс' }).click()

  // Driver search — real short MSW delay + 20% mocked failure rate, retry until found.
  await expect(async () => {
    const retry = page.getByRole('button', { name: 'Повторить поиск' })
    if (await retry.count()) await retry.click()
    await expect(page.locator('[data-slot="driver-card"]')).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 20000 })

  // driverAssigned -> enRoute (2s timer)
  await page.clock.fastForward(2100)
  await expect(page.locator('[data-slot="driver-card"]')).toContainText('Едет к вам')

  // enRoute leg (6s animated) -> arrived
  await page.clock.fastForward(6200)
  await expect(page.locator('[data-slot="driver-card"]')).toContainText('Ждёт у подъезда')

  // arrived -> inRide (explicit passenger action, not a timer)
  await page.getByRole('button', { name: 'Начать поездку' }).click()
  await expect(page.locator('[data-slot="driver-card"]')).toContainText('В пути к месту назначения')

  // inRide leg (6s animated) -> completed
  await page.clock.fastForward(6200)
  await expect(page.getByRole('heading', { name: 'Поездка завершена' })).toBeVisible()

  // Payment
  await page.getByRole('button', { name: 'Карта' }).click()
  await page.getByRole('button', { name: /Оплатить/ }).click()
  await expect(page.getByText('Оплачено')).toBeVisible()

  // Rating
  await page.getByRole('button', { name: '5 звёзд' }).click()
  await page.getByRole('button', { name: 'Оценить' }).click()
  await expect(page.getByText(/Спасибо за оценку/)).toBeVisible()

  // completed (parallel payment+rating both done) -> done
  await expect(page.getByRole('button', { name: 'Заказать снова' })).toBeVisible()
  await page.getByRole('button', { name: 'Заказать снова' }).click()

  // RESET -> back to a fresh, working pickup screen
  await expect(page.locator('[data-slot="pickup-where-to"]')).toBeVisible()
  await expect(page.locator('[data-slot="pickup-pill"]')).toContainText('Тверская')

  expect(errors).toEqual([])
})
