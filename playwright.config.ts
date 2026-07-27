import { defineConfig } from '@playwright/test'

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
  // NOT `devices['Desktop Chrome']` — that preset carries its own
  // `viewport: {1280,720}`, which silently overrides the mobile-first
  // `viewport` set in the global `use` block above (project-level `use` wins
  // per-key over global). Found 2026-07-27 while adding the first
  // lg:-breakpoint-sensitive e2e assertions: every test without an explicit
  // `test.use({ viewport })` had actually been running at 1280×720 all
  // along, not the intended 375×667 — invisible before responsive layout
  // existed to differ between the two. `browserName` defaults to 'chromium'
  // without any device preset, so dropping it doesn't change which engine runs.
  projects: [{ name: 'chromium', use: {} }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    // Activates shared/mocks/e2e-handlers.ts (OSRM/MapTiler mocked through
    // MSW) — see browser.ts. Real dev/preview never set this.
    env: { VITE_E2E: 'true' },
  },
})
