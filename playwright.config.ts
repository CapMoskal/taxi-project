import { defineConfig, devices } from '@playwright/test'

// Targets the dev server, not preview/prod: MSW behaves identically in both,
// but the window.__map test hook (OrderScreen.tsx) only exists in DEV — the
// suite needs it to assert camera/route state. Prod-specific concerns (real
// service worker, Vercel deploy) are checked separately by hand against the
// live URL, not by this suite.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 375, height: 667 },
    geolocation: { latitude: 55.7558, longitude: 37.6173 },
    permissions: ['geolocation'],
    locale: 'ru-RU',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    // Activates shared/mocks/e2e-handlers.ts (OSRM/MapTiler mocked through
    // MSW) — see browser.ts. Real dev/preview never set this.
    env: { VITE_E2E: 'true' },
  },
})
