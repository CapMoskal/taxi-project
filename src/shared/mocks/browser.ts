import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { e2eHandlers } from './e2e-handlers'

// VITE_E2E is set only by playwright.config.ts's webServer — real dev/prod
// never sets it, so this stays inert everywhere except under the e2e suite.
export const worker = setupWorker(...handlers, ...(import.meta.env.VITE_E2E ? e2eHandlers : []))
